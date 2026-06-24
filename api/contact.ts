import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

/**
 * POST /api/contact
 *
 * Receives a JSON body of `{ name, email, message }`, validates it,
 * then forwards the message to the portfolio owner's Gmail inbox
 * using Nodemailer over Gmail SMTP.
 *
 * Setup requirements (one-time, on Vercel):
 *   1. Gmail account: abellanabenedict@gmail.com
 *   2. Enable 2-Step Verification on the Google account.
 *   3. Generate an App Password:
 *        Google Account → Security → 2-Step Verification → App passwords
 *        Pick "Mail" + "Other (Custom name)" = "Portfolio contact form".
 *        Copy the 16-char password.
 *   4. In the Vercel project settings, add two environment variables:
 *        GMAIL_USER           = abellanabenedict@gmail.com
 *        GMAIL_APP_PASSWORD   = <the 16-char app password>
 *      Both must be set for the production deployment. Local dev can
 *      put them in a `.env.local` file (gitignored).
 *
 * Security notes:
 *   - We reject any request that isn't POST.
 *   - All three fields are required and length-checked so a malicious
 *     client can't fill the inbox with megabyte-sized payloads.
 *   - Reply-To is set to the visitor's email so the owner can reply
 *     directly from their inbox without copy-pasting an address.
 *   - We never echo the visitor's message back in the response
 *     (avoids reflecting unescaped content into the page).
 */

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

const MAX_NAME_LEN = 120;
const MAX_EMAIL_LEN = 254; // RFC 5321
const MAX_MESSAGE_LEN = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function validate(body: unknown): { ok: true; data: ContactPayload } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }
  const b = body as Record<string, unknown>;
  if (!isString(b.name) || !b.name.trim()) {
    return { ok: false, error: 'Name is required' };
  }
  if (!isString(b.email) || !EMAIL_RE.test(b.email)) {
    return { ok: false, error: 'A valid email is required' };
  }
  if (!isString(b.message) || !b.message.trim()) {
    return { ok: false, error: 'Message is required' };
  }
  if (b.name.length > MAX_NAME_LEN) {
    return { ok: false, error: `Name must be ${MAX_NAME_LEN} characters or fewer` };
  }
  if (b.email.length > MAX_EMAIL_LEN) {
    return { ok: false, error: `Email must be ${MAX_EMAIL_LEN} characters or fewer` };
  }
  if (b.message.length > MAX_MESSAGE_LEN) {
    return { ok: false, error: `Message must be ${MAX_MESSAGE_LEN} characters or fewer` };
  }
  return {
    ok: true,
    data: {
      name: b.name.trim(),
      email: b.email.trim(),
      message: b.message.trim(),
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const validation = validate(req.body);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }
  const { name, email, message } = validation.data;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    // Server misconfigured — log on the server side, return a generic
    // error to the visitor so we don't leak env-var names.
    console.error('contact: GMAIL_USER or GMAIL_APP_PASSWORD not set');
    return res.status(500).json({ error: 'Email service is not configured' });
  }

  // Nodemailer transporter. Gmail SMTP over TLS on port 465 is the
  // recommended path for App Password auth.
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const subject = `Portfolio contact: ${name}`;
  const text = [
    `New message from your portfolio contact form.`,
    ``,
    `From:    ${name} <${email}>`,
    `Sent at: ${new Date().toISOString()}`,
    ``,
    `---`,
    ``,
    message,
    ``,
    `---`,
    `Reply directly to this email to respond to ${name}.`,
  ].join('\n');

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact Form" <${user}>`,
      to: user,
      replyTo: `${name} <${email}>`,
      subject,
      text,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Log the full error server-side; return a generic message to
    // the visitor. Common causes: bad App Password, Gmail rate limit,
    // network error to smtp.gmail.com.
    console.error('contact: send failed', err);
    return res.status(502).json({ error: 'Failed to send email' });
  }
}
