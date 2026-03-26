const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

async function sendOtpEmail(toEmail, otp) {
  const from = process.env.SMTP_FROM || `SuiVault <${process.env.SMTP_USER}>`

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: 'SuiVault — Password Reset Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0A0A0F;color:#E2E8F0;padding:40px;border-radius:16px;border:1px solid rgba(153,69,255,0.3)">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="font-size:28px;font-weight:900;color:#fff;margin:0">
            Sui<span style="color:#9945FF">Vault</span>
          </h1>
          <p style="color:#6B7280;font-size:14px;margin-top:8px">Password Reset Request</p>
        </div>

        <p style="color:#94A3B8;font-size:14px;line-height:1.6">
          You requested a password reset. Enter this code to continue:
        </p>

        <div style="text-align:center;margin:32px 0">
          <div style="display:inline-block;background:linear-gradient(135deg,rgba(153,69,255,0.15),rgba(0,240,255,0.08));border:1px solid rgba(153,69,255,0.4);border-radius:16px;padding:24px 48px">
            <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;font-family:monospace">
              ${otp}
            </span>
          </div>
        </div>

        <p style="color:#6B7280;font-size:12px;text-align:center;line-height:1.6">
          This code expires in <strong style="color:#14F195">15 minutes</strong>.<br/>
          If you didn't request this, ignore this email — your wallet is safe.
        </p>

        <div style="margin-top:32px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
          <p style="color:#4B5563;font-size:11px;margin:0">Built by Snow · SuiVault</p>
        </div>
      </div>
    `,
  })
}

module.exports = { sendOtpEmail }
