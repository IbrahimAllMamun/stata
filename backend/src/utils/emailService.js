/**
 * emailService.js
 *
 * Handles all outbound email sending with anti-spam best practices:
 *  - Sends in small batches to avoid rate-limit triggers
 *  - Adds List-Unsubscribe header (RFC 2369) for inbox providers
 *  - Adds Precedence: bulk header to suppress auto-responders
 *  - Proper plain-text fallback alongside HTML
 *  - Configurable SMTP via environment variables
 */

const nodemailer = require('nodemailer');

// ── Transport ─────────────────────────────────────────────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Pool connections for bulk sending
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,   // ms between rate checks
    rateLimit: 10,     // max messages per rateDelta (10/sec)
  });
}

// ── Batch helpers ─────────────────────────────────────────────────────────────
const BATCH_SIZE = 50;          // recipients per batch
const BATCH_DELAY_MS = 2000;    // pause between batches (2 s)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ── Core sender ───────────────────────────────────────────────────────────────
/**
 * sendBulkEmail
 *
 * @param {object}   opts
 * @param {string[]} opts.recipients      – array of email addresses
 * @param {string}   opts.subject
 * @param {string}   opts.htmlBody        – HTML version
 * @param {string}   opts.textBody        – plain-text version
 * @param {function} [opts.onProgress]    – optional callback(sent, failed, total)
 *
 * @returns {{ sent: number, failed: number, errors: string[] }}
 */
async function sendBulkEmail({ recipients, subject, htmlBody, textBody, onProgress }) {
  const transporter = createTransport();

  const fromName  = process.env.EMAIL_FROM_NAME  || 'STATA';
  const fromEmail = process.env.EMAIL_FROM;       // required env var

  if (!fromEmail) {
    throw new Error('EMAIL_FROM environment variable is not set');
  }

  const batches = chunk(recipients, BATCH_SIZE);
  let totalSent   = 0;
  let totalFailed = 0;
  const errors    = [];

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];

    // Send each email individually (BCC would hide recipients from each other
    // but personalises less and some providers flag large BCCs)
    await Promise.allSettled(
      batch.map(async (recipient) => {
        try {
          await transporter.sendMail({
            from:    `"${fromName}" <${fromEmail}>`,
            to:      recipient,
            subject,
            html:    htmlBody,
            text:    textBody,
            headers: {
              // RFC 2369: lets mail clients show "Unsubscribe" buttons
              'List-Unsubscribe':        `<mailto:${fromEmail}?subject=Unsubscribe>`,
              'List-Unsubscribe-Post':   'List-Unsubscribe=One-Click',
              // Suppresses vacation auto-replies
              'Precedence':              'bulk',
              // Some providers use this to suppress auto-replies
              'X-Auto-Response-Suppress':'OOF, AutoReply',
            },
          });
          totalSent++;
        } catch (err) {
          totalFailed++;
          errors.push(`${recipient}: ${err.message}`);
        }

        if (onProgress) onProgress(totalSent, totalFailed, recipients.length);
      })
    );

    // Pause between batches (except after the last one)
    if (batchIndex < batches.length - 1) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  transporter.close();

  return { sent: totalSent, failed: totalFailed, errors };
}

/**
 * verifySmtpConnection — used at startup or from the test-send endpoint
 */
async function verifySmtpConnection() {
  const transporter = createTransport();
  await transporter.verify();
  transporter.close();
}

module.exports = { sendBulkEmail, verifySmtpConnection };
