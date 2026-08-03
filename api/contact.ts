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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Table-based layout with inline styles only — Gmail, Outlook, and mobile
// mail apps strip <style> blocks and collapse unsupported CSS (flexbox,
// grid, custom properties), so every rule here is inlined and table-driven
// to render consistently across clients. Colors match the site's coffee
// palette (client/src/index.css): #634832 primary, #ece0d1 cream
// background, #967259 accent, #dbc1ac card, #c9b5a0 border, #38220f text.
function renderContactEmailHtml(name: string, email: string, message: string, sentAt: Date): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const formattedDate = sentAt.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:#634832; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#634832; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ece0d1; border-radius:16px; overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
                  <tr>
                    <td width="56" height="56" align="center" valign="middle" style="width:56px; height:56px; border-radius:50%; background-color:#967259; font-size:26px; line-height:56px; text-align:center;">✉️</td>
                  </tr>
                </table>
                <p style="margin:0; text-align:center; font-size:20px; font-weight:bold; color:#38220f;">New Portfolio Message</p>
                <p style="margin:6px 0 20px 0; text-align:center; font-size:13px; color:#634832;">Sent via the contact form</p>
                <hr style="border:none; border-top:1px solid #c9b5a0; margin:0 0 20px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; color:#634832;">
                  <tr>
                    <td style="padding:6px 0; color:#967259;">Name</td>
                    <td style="padding:6px 0; text-align:right; font-weight:bold; color:#38220f;">${safeName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#967259;">Email</td>
                    <td style="padding:6px 0; text-align:right;"><a href="mailto:${safeEmail}" style="color:#634832; font-weight:bold; text-decoration:underline;">${safeEmail}</a></td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; color:#967259;">Received</td>
                    <td style="padding:6px 0; text-align:right; font-weight:bold; color:#38220f;">${formattedDate}</td>
                  </tr>
                </table>
                <hr style="border:none; border-top:1px solid #c9b5a0; margin:20px 0;">
                <p style="margin:0 0 8px 0; font-size:13px; font-weight:bold; color:#967259; text-transform:uppercase; letter-spacing:0.03em;">Message</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#dbc1ac; border-radius:10px;">
                  <tr>
                    <td style="padding:16px; font-size:14px; line-height:1.6; color:#38220f;">${safeMessage}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px 32px; background-color:#dbc1ac;">
                <p style="margin:0; text-align:center; font-size:12px; color:#634832;">Reply directly to this email to respond to ${safeName}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

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
    return res.status(500).json({ error: 'Email service is not configured. Please check GMAIL_USER and GMAIL_APP_PASSWORD environment variables.' });
  }

  // Nodemailer transporter. Gmail SMTP over TLS on port 465 is the
  // recommended path for App Password auth.
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  const sentAt = new Date();
  const subject = `Portfolio contact: ${name}`;
  const html = renderContactEmailHtml(name, email, message, sentAt);
  const text = [
    `New message from your portfolio contact form.`,
    ``,
    `From:    ${name} <${email}>`,
    `Sent at: ${sentAt.toISOString()}`,
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
      html,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    // Log the full error server-side; return a generic message to
    // the visitor. Common causes: bad App Password, Gmail rate limit,
    // network error to smtp.gmail.com.
    console.error('contact: send failed', err);
    const detail = err instanceof Error ? err.message : 'Failed to send email';
    return res.status(502).json({ error: detail });
  }
}
