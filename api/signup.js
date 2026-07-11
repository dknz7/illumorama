// POST /api/signup — stores a waitlist email in Supabase, then sends
// a confirmation to the signer and a notification to Crouchy via Resend.
// Env vars (set in Vercel): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY

const NOTIFY_TO = 'crouchytattoos@gmail.com';
const FROM = 'illumorama <hello@illumorama.store>';
const IG = 'https://www.instagram.com/illumorama';
const SITE = 'https://illumorama.store';

const confirmationHtml = () => `
<!doctype html>
<html>
<body style="margin:0;padding:0;background:#14100d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#14100d;padding:36px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#211a15;border:1px solid #3a2f28;border-radius:10px;overflow:hidden;">
        <tr><td style="height:3px;background:linear-gradient(90deg,#ff4f00,#2fd0e0);font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:40px 40px 8px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#ffd98a;">illumorama</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;text-align:center;">
          <div style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;color:#46d17a;border:1px solid #46d17a;border-radius:999px;padding:7px 14px;">WAVE #1 &middot; NOW LIVE</div>
        </td></tr>
        <tr><td style="padding:24px 40px 0;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;color:#fff4e6;font-weight:bold;">You&rsquo;re on the list.</div>
        </td></tr>
        <tr><td style="padding:24px 40px 0;">
          <a href="${SITE}" style="text-decoration:none;">
            <img src="${SITE}/assets/wave1-email.jpg" alt="Wave #1 — all six illuminated dioramas, lit up" width="480" style="display:block;width:100%;max-width:480px;height:auto;border:1px solid #3a2f28;border-radius:8px;" />
          </a>
        </td></tr>
        <tr><td style="padding:18px 40px 0;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#a89f97;text-align:center;">
            Wave #1 went live on <span style="color:#fff4e6;font-weight:bold;">July 9th</span> and it&rsquo;s almost sold out &mdash; only a handful of boxes left. We&rsquo;ll be in touch about remaining availability, and you&rsquo;ve got first dibs when <span style="color:#ffd98a;font-weight:bold;">Wave #2</span> drops.
          </p>
        </td></tr>
        <tr><td style="padding:22px 40px 0;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#a89f97;text-align:center;">
            Six custom designs. Real LEDs, wired by hand. Built on the Central Coast NSW.
          </p>
        </td></tr>
        <tr><td style="padding:28px 40px 36px;">
          <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="padding:0 6px;">
                <a href="${SITE}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#fffefb;background:#ff4f00;border-radius:8px;padding:13px 22px;text-decoration:none;">See Wave #1</a>
              </td>
              <td style="padding:0 6px;">
                <a href="${IG}" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#ffd98a;border:1px solid #ffd98a;border-radius:8px;padding:12px 22px;text-decoration:none;">Follow on Instagram</a>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center;border-top:1px solid #3a2f28;">
          <p style="margin:24px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6f665f;">
            Hand-crafted collector art pieces &mdash; not official Pok&eacute;mon products.<br/>
            &copy; 2026 illumorama &middot; Central Coast NSW
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const notifyHtml = (email) => `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;">
  <p><b>New illumorama signup</b> 🔥</p>
  <p>Email: <a href="mailto:${email}">${email}</a></p>
  <p style="color:#888;font-size:13px;">They've been sent the Wave #1 confirmation. Full list lives in Supabase.</p>
</div>`;

async function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  // 1. Store the signup (idempotent — re-signups just update nothing)
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/signups?on_conflict=email`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({ email }),
  });
  if (!dbRes.ok) {
    console.error('Supabase insert failed:', dbRes.status, await dbRes.text());
    return res.status(502).json({ error: 'Could not save your email' });
  }

  // 2. Fire both emails — best-effort, the signup is already saved
  const [confirm, notify] = await Promise.allSettled([
    sendEmail(RESEND_API_KEY, {
      from: FROM,
      to: [email],
      subject: 'You’re on the list — Wave #1 is live',
      html: confirmationHtml(),
    }),
    sendEmail(RESEND_API_KEY, {
      from: FROM,
      to: [NOTIFY_TO],
      reply_to: email,
      subject: `Illumorama NEW Sign Up: ${email}`,
      html: notifyHtml(email),
    }),
  ]);
  for (const [label, r] of [['confirmation', confirm], ['notify', notify]]) {
    if (r.status === 'rejected') console.error(`Resend ${label} failed:`, r.reason);
    else if (!r.value.ok) console.error(`Resend ${label} failed:`, r.value.status, await r.value.text());
  }

  return res.status(200).json({ ok: true });
}
