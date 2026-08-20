// Thin wrapper over Resend's REST API — deliberately just `fetch`, not the
// Resend SDK, so this feature doesn't add a new dependency to the lockfile
// story (see README > Deployment for why that matters here).

const RESEND_API_URL = "https://api.resend.com/emails";

// Falls back to logging the email to the console instead of sending it when
// RESEND_API_KEY isn't set, so the verification/reset flows are testable
// locally without a real Resend account — the token is right there in the
// server log to copy into the frontend by hand.
export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "AI Data Analyst <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`RESEND_API_KEY not set — logging email instead of sending it.`);
    console.log(`\n--- Email to ${to} ---\nSubject: ${subject}\n${html}\n----------------------\n`);
    return { sent: false, logged: true };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from, to, subject, html })
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Resend send failed:", res.status, body);
      return { sent: false, logged: false };
    }
    return { sent: true, logged: false };
  } catch (err) {
    console.error("Resend request failed:", err);
    return { sent: false, logged: false };
  }
}

export function verificationEmailHtml(verifyUrl) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Verify your email</h2>
      <p>Confirm this is your email address to finish setting up your AI Data Analyst account.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#2B2A27;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Verify email</a></p>
      <p style="color:#8A8580;font-size:13px;">This link expires in 24 hours. If you didn't create this account, you can ignore this email.</p>
    </div>
  `;
}

export function passwordResetEmailHtml(resetUrl) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your AI Data Analyst password.</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#2B2A27;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">Reset password</a></p>
      <p style="color:#8A8580;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.</p>
    </div>
  `;
}

export function newSignupAlertEmailHtml(userEmail, companyName) {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #EAE7E0; border-radius: 12px; padding: 24px; background: #FFF;">
      <h2 style="color: #8B5CF6; margin-top: 0;">🎉 New User Signup Alert!</h2>
      <p style="font-size: 15px; color: #2B2A27;">A new user just registered on <strong>AI Data & Science Copilot</strong>:</p>
      <div style="background: #F8F9FA; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>User Email:</strong> ${userEmail}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Company Workspace:</strong> ${companyName}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Signup Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      <p style="font-size: 13px; color: #8A8580;">Log into your Admin Dashboard at <a href="https://ai-data-analyst-tawny.vercel.app/" style="color: #8B5CF6;">ai-data-analyst-tawny.vercel.app</a> to view full member details and audit logs.</p>
    </div>
  `;
}
