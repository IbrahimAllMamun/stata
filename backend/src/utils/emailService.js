/**
 * emailService.js
 * Handles outbound email (bulk + individual) and inbox reading via IMAP.
 *
 * Two email accounts:
 *   no-reply@stataisrt.org  → bulk campaigns  (EMAIL_FROM / SMTP_USER)
 *   info@stataisrt.org      → individual send + inbox reading (INFO_EMAIL / INFO_EMAIL_PASS)
 */

const nodemailer = require('nodemailer');

// ── SMTP transport (bulk — no-reply@) ─────────────────────────────────────────
function createTransport(user, pass) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 10,
  });
}

// ── Batch helpers ─────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 2000;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ── Send bulk campaign (from no-reply@) ───────────────────────────────────────
async function sendBulkEmail({ recipients, subject, htmlBody, textBody }) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = `"${process.env.EMAIL_FROM_NAME || 'STATA'}" <${process.env.EMAIL_FROM || user}>`;

  const transporter = createTransport(user, pass);
  const batches = chunk(recipients, BATCH_SIZE);
  let totalSent = 0, totalFailed = 0;
  const errors = [];

  for (let bi = 0; bi < batches.length; bi++) {
    await Promise.allSettled(batches[bi].map(async (recipient) => {
      try {
        await transporter.sendMail({
          from,
          to: recipient,
          subject,
          html: htmlBody,
          text: textBody,
          headers: {
            'List-Unsubscribe': `<mailto:${process.env.EMAIL_FROM || user}?subject=Unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'Precedence': 'bulk',
            'X-Auto-Response-Suppress': 'OOF, AutoReply',
          },
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
  if (!infoPass) throw new Error('INFO_EMAIL_PASS not set in .env');
  const from = `"STATA" <${infoEmail}>`;

  const transporter = createTransport(infoEmail, infoPass);

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
function appendToSent({ mailOptions, infoEmail, infoPass }) {
  let Imap;
  try { Imap = require('imap'); } catch (e) { return Promise.resolve(); }

  const imapHost = process.env.IMAP_HOST;
  const imapPort = parseInt(process.env.IMAP_PORT || '993');
  if (!imapHost) return Promise.resolve();

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
        const sentFolder = 'INBOX.Sent';
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
      imap.openBox(folder, true, (err, box) => {
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
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const transporter = createTransport(user, pass);
  await transporter.verify();
  transporter.close();
}

module.exports = { sendBulkEmail, sendIndividualEmail, verifySmtpConnection, fetchInbox };