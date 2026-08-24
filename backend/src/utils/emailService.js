/**
 * emailService.js
 * Handles outbound email (bulk + individual) and inbox reading via IMAP.
 *
 * Sending and receiving are deliberately split across two providers:
 *
 *   SEND    → Resend (SMTP_*). One provider-level credential signs for every
 *             From address on the verified domain.
 *   RECEIVE → the domain's real mailbox host (IMAP_*). Resend is send-only, and
 *             stataisrt.org's MX points at Google, so inbound mail for info@
 *             lives there — that is what the Communications inbox reads.
 *
 * From addresses:
 *   no-reply@ → bulk campaigns and password resets (EMAIL_FROM)
 *   info@     → individual replies and inbox (INFO_EMAIL)
 */

const nodemailer = require('nodemailer');

// ── SMTP transport ────────────────────────────────────────────────────────────
// Credentials are provider-level, not per-mailbox: Resend authenticates every
// sender as the literal user `resend` with an API key, so a From address can no
// longer double as the SMTP username. Callers may still pass explicit
// credentials for a host that does want per-mailbox auth.
function createTransport(user = process.env.SMTP_USER, pass = process.env.SMTP_PASS) {
  const port = parseInt(process.env.SMTP_PORT || '465');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // Implicit TLS on 465, STARTTLS on 587/2587. Deriving this from the port
    // when SMTP_SECURE is unset avoids the silent hang that `587 + secure:true`
    // produces, which is a combination the old .env.example shipped.
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
    // The previous host routinely took 10-19s to complete connect+greeting,
    // which overran nodemailer's 30s greeting default under any added latency.
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 120000,
  });
}

// ── Batch helpers ─────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 2000;
// Resend's batch endpoint accepts up to 100 messages per request.
const RESEND_BATCH_SIZE = 100;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ── Resend HTTP transport ─────────────────────────────────────────────────────
// Preferred over SMTP when RESEND_API_KEY is set: it speaks HTTPS on 443, so it
// is immune to the outbound SMTP port blocking that is common on shared hosts,
// and it avoids the slow connect+greeting that forced the 60s timeouts above.
// SMTP remains the fallback so the provider can still be swapped via .env alone.
let resendClient;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (resendClient === undefined) {
    try {
      const { Resend } = require('resend');
      resendClient = new Resend(process.env.RESEND_API_KEY);
    } catch (err) {
      throw new Error('RESEND_API_KEY is set but the resend package is missing. Run: npm install resend');
    }
  }
  return resendClient;
}

// Resend returns { data, error } rather than throwing.
function resendError(error) {
  if (!error) return null;
  return error.message || error.name || JSON.stringify(error);
}

// ── Send bulk campaign (from no-reply@) ───────────────────────────────────────
async function sendBulkEmail({ recipients, subject, htmlBody, textBody, transactional = false }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = `"${process.env.EMAIL_FROM_NAME || 'STATA'}" <${process.env.EMAIL_FROM || user}>`;

  // Password resets and account setup links are transactional, not campaigns.
  // Marking them `Precedence: bulk` or attaching an unsubscribe header tells
  // Gmail they are promotional, which costs placement on exactly the messages
  // that must arrive. Suppressing auto-responders is still wanted either way.
  const headers = transactional
    ? { 'X-Auto-Response-Suppress': 'OOF, AutoReply' }
    : {
        'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM || user}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Precedence': 'bulk',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
      };

  let totalSent = 0, totalFailed = 0;
  const errors = [];

  const resend = getResend();
  if (resend) {
    // Single-recipient sends — every password reset and account setup link —
    // go through the primary endpoint rather than the batch one, so the
    // transactional headers above are carried verbatim.
    if (recipients.length === 1) {
      try {
        const { data, error } = await resend.emails.send({
          from, to: [recipients[0]], subject, html: htmlBody, text: textBody, headers,
        });
        const msg = resendError(error);
        if (msg) return { sent: 0, failed: 1, errors: [`${recipients[0]}: ${msg}`] };
        return { sent: 1, failed: 0, errors: [], messageId: data?.id };
      } catch (err) {
        return { sent: 0, failed: 1, errors: [`${recipients[0]}: ${err.message}`] };
      }
    }

    // One request per 100 recipients instead of one SMTP transaction each.
    const groups = chunk(recipients, RESEND_BATCH_SIZE);
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      try {
        const { data, error } = await resend.batch.send(
          group.map(recipient => ({
            from, to: [recipient], subject, html: htmlBody, text: textBody, headers,
          }))
        );
        const msg = resendError(error);
        if (msg) {
          totalFailed += group.length;
          errors.push(`${group.length} recipient(s): ${msg}`);
        } else {
          // Shape is { data: [{ id }, ...] }; fall back to the group size if the
          // payload is ever returned flat.
          const ids = data?.data ?? data ?? [];
          const accepted = Array.isArray(ids) ? ids.length : group.length;
          totalSent += accepted;
          if (accepted < group.length) {
            totalFailed += group.length - accepted;
            errors.push(`${group.length - accepted} recipient(s) not accepted by Resend`);
          }
        }
      } catch (err) {
        totalFailed += group.length;
        errors.push(`${group.length} recipient(s): ${err.message}`);
      }
      if (gi < groups.length - 1) await sleep(BATCH_DELAY_MS);
    }
    return { sent: totalSent, failed: totalFailed, errors };
  }

  const transporter = createTransport(user, pass);
  const batches = chunk(recipients, BATCH_SIZE);

  for (let bi = 0; bi < batches.length; bi++) {
    await Promise.allSettled(batches[bi].map(async (recipient) => {
      try {
        await transporter.sendMail({
          from,
          to: recipient,
          subject,
          html: htmlBody,
          text: textBody,
          headers,
        });
        totalSent++;
      } catch (err) {
        totalFailed++;
        errors.push(`${recipient}: ${err.message}`);
      }
    }));
    if (bi < batches.length - 1) await sleep(BATCH_DELAY_MS);
  }
  transporter.close();
  return { sent: totalSent, failed: totalFailed, errors };
}

// ── Send individual email (from info@) ────────────────────────────────────────
async function sendIndividualEmail({ to, subject, body, replyToMessageId }) {
  const infoEmail = process.env.INFO_EMAIL;
  const infoPass = process.env.INFO_EMAIL_PASS;
  if (!infoEmail) throw new Error('INFO_EMAIL not set in .env');
  const from = `"STATA" <${infoEmail}>`;

  // Authenticate with the provider credential, not the mailbox password:
  // INFO_EMAIL_PASS is now only the IMAP password for saving to Sent, and is
  // not required to send.
  const resend = getResend();
  if (resend) {
    const payload = {
      from, to: [to], subject,
      text: body,
      html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;max-width:600px">${body.replace(/\n/g, '<br>')}</div>`,
    };
    if (replyToMessageId) {
      payload.headers = { 'In-Reply-To': replyToMessageId, References: replyToMessageId };
    }
    const { data, error } = await resend.emails.send(payload);
    const msg = resendError(error);
    if (msg) throw new Error(`Resend: ${msg}`);

    // Keep the Sent copy working — Resend cannot store one, the mailbox host does.
    try {
      await appendToSent({ mailOptions: { ...payload, to, date: new Date() }, infoEmail, infoPass });
    } catch (err) {
      console.warn('[IMAP] Could not save to Sent folder:', err.message);
    }
    return { messageId: data?.id };
  }

  const transporter = createTransport();

  const mailOptions = {
    from,
    to,
    subject,
    text: body,
    html: `<div style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.6;color:#374151;max-width:600px">${body.replace(/\n/g, '<br>')}</div>`,
    date: new Date(),
  };

  if (replyToMessageId) {
    mailOptions.inReplyTo = replyToMessageId;
    mailOptions.references = replyToMessageId;
  }

  // Send the email and get the raw message back
  const info = await transporter.sendMail(mailOptions);
  transporter.close();

  // Save a copy to INBOX.Sent via IMAP
  try {
    await appendToSent({ mailOptions, infoEmail, infoPass });
  } catch (err) {
    // Non-fatal — email was sent, just couldn't save to Sent folder
    console.warn('[IMAP] Could not save to Sent folder:', err.message);
  }

  return info;
}

// ── Append message to INBOX.Sent ──────────────────────────────────────────────
// ── Mailbox naming ────────────────────────────────────────────────────────────
// Dovecot (cPanel/Webuzo) exposes the Sent folder as "INBOX.Sent", while Gmail
// exposes it as "[Gmail]/Sent Mail". The admin UI requests the Dovecot name, so
// translate for the host actually in use rather than change the API contract.
function resolveFolder(name) {
  const isGmail = /gmail|googlemail|google/i.test(process.env.IMAP_HOST || '');
  if (isGmail && /^(INBOX\.Sent|sent)$/i.test(name)) {
    return process.env.IMAP_SENT_FOLDER || '[Gmail]/Sent Mail';
  }
  return name;
}

function appendToSent({ mailOptions, infoEmail, infoPass }) {
  let Imap;
  try { Imap = require('imap'); } catch (e) { return Promise.resolve(); }

  const imapHost = process.env.IMAP_HOST;
  const imapPort = parseInt(process.env.IMAP_PORT || '993');
  // Saving to Sent is optional. Without a mailbox host or password there is
  // nothing to append to, so skip rather than open a doomed connection.
  if (!imapHost || !infoPass) return Promise.resolve();

  // Build a raw RFC2822 message to append
  const { to, subject, text, date } = mailOptions;
  const rawMessage = [
    `From: ${mailOptions.from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${(date || new Date()).toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    text || '',
  ].join('\r\n');

  return new Promise((resolve) => {
    const imap = new Imap({
      user: infoEmail,
      password: infoPass,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 6000,
      authTimeout: 4000,
    });

    imap.once('ready', () => {
      // Ensure INBOX.Sent exists, create if not
      imap.getBoxes((err, boxes) => {
        const sentFolder = resolveFolder('INBOX.Sent');
        const append = () => {
          imap.append(rawMessage, { mailbox: sentFolder, flags: ['\\Seen'] }, (appendErr) => {
            if (appendErr) console.warn('[IMAP] Append error:', appendErr.message);
            imap.end();
          });
        };

        // Check if INBOX.Sent exists
        const inboxBoxes = boxes && boxes['INBOX'] && boxes['INBOX'].children;
        if (inboxBoxes && inboxBoxes['Sent']) {
          append();
        } else {
          // Try to create it
          imap.addBox(sentFolder, (createErr) => {
            if (createErr) console.warn('[IMAP] Could not create Sent folder:', createErr.message);
            append();
          });
        }
      });
    });

    imap.once('error', (err) => { console.warn('[IMAP] appendToSent error:', err.message); resolve(); });
    imap.once('end', () => resolve());
    imap.connect();
  });
}

// ── Fetch inbox via IMAP ──────────────────────────────────────────────────────
async function fetchInbox({ limit = 30, folder = 'INBOX' } = {}) {
  let Imap, simpleParser;
  try {
    Imap = require('imap');
    simpleParser = require('mailparser').simpleParser;
  } catch (e) {
    throw new Error('IMAP packages not installed. Run: npm install imap mailparser in the backend directory');
  }

  const infoEmail = process.env.INFO_EMAIL;
  const infoPass = process.env.INFO_EMAIL_PASS;
  const imapHost = process.env.IMAP_HOST;
  const imapPort = parseInt(process.env.IMAP_PORT || '993');

  if (!infoEmail) throw new Error('INFO_EMAIL not set in .env');
  if (!infoPass) throw new Error('INFO_EMAIL_PASS not set in .env');
  if (!imapHost) throw new Error('IMAP_HOST not set in .env');


  const withTimeout = (promise, ms, msg) => {
    const timer = new Promise((_, reject) => setTimeout(() => reject(new Error(msg)), ms));
    return Promise.race([promise, timer]);
  };

  return withTimeout(new Promise((resolve, reject) => {
    const imap = new Imap({
      user: infoEmail,
      password: infoPass,
      host: imapHost,
      port: imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 8000,
      authTimeout: 5000,
    });

    imap.once('ready', () => {
      imap.openBox(resolveFolder(folder), true, (err, box) => {
        if (err) { console.error('[IMAP] openBox error:', err.message); imap.end(); return reject(err); }

        const total = box.messages.total;
        if (total === 0) { imap.end(); return resolve([]); }

        const start = Math.max(1, total - limit + 1);
        const f = imap.seq.fetch(`${start}:*`, { bodies: '', struct: true });
        const parsePromises = [];

        f.on('message', (msg) => {
          let buffer = '';
          const p = new Promise((res) => {
            msg.on('body', (stream) => {
              stream.on('data', chunk => { buffer += chunk.toString('utf8'); });
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  res({
                    id: parsed.messageId || null,
                    from: parsed.from && parsed.from.text ? parsed.from.text : '',
                    to: parsed.to && parsed.to.text ? parsed.to.text : '',
                    subject: parsed.subject || '(no subject)',
                    date: parsed.date ? parsed.date.toISOString() : null,
                    text: parsed.text || '',
                    html: parsed.html || null,
                    snippet: (parsed.text || '').substring(0, 200).replace(/\n/g, ' '),
                  });
                } catch (e) { res(null); }
              });
            });
          });
          parsePromises.push(p);
        });

        f.once('error', (err) => { reject(err); });
        f.once('end', async () => {
          imap.end();
          try {
            const results = await Promise.all(parsePromises);
            const emails = results.filter(Boolean);
            emails.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            resolve(emails);
          } catch (e) { reject(e); }
        });
      });
    });

    imap.once('error', (err) => { console.error('[IMAP] Error:', err.message); reject(err); });
    imap.connect();
  }), 20000, 'IMAP connection timed out after 20s');
}


async function verifySmtpConnection() {
  const resend = getResend();
  if (resend) {
    // No connection to open — exercise the credential with a cheap authenticated
    // call so an invalid or revoked API key surfaces here rather than mid-send.
    const { error } = await resend.apiKeys.list();
    const msg = resendError(error);
    if (msg) throw new Error(`Resend API key rejected: ${msg}`);
    return { transport: 'resend' };
  }
  const transporter = createTransport();
  await transporter.verify();
  transporter.close();
  return { transport: 'smtp', host: process.env.SMTP_HOST };
}

module.exports = { sendBulkEmail, sendIndividualEmail, verifySmtpConnection, fetchInbox };