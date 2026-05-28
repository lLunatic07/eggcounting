import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendOtpEmail(to: string, otpCode: string) {
  const mailOptions = {
    from: `"Aplikasi EggCounting" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Kode Verifikasi OTP Anda - EggCounting',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="460" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#0FA6E5,#8BC5E0);padding:32px 40px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                      EggCounting
                    </h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">
                      Verifikasi Email
                    </p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <p style="margin:0 0 8px;color:#1e293b;font-size:18px;font-weight:600;">
                      Halo!
                    </p>
                    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                      Gunakan kode verifikasi berikut untuk menyelesaikan pendaftaran. Kode ini berlaku selama <strong>5 menit</strong>.
                    </p>
                    <!-- OTP Code -->
                    <div style="background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                      <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#0FA6E5;font-family:'Courier New',monospace;">
                        ${otpCode}
                      </span>
                    </div>
                    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;">
                      Jika Anda tidak meminta kode ini, abaikan email ini.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                    <p style="margin:0;color:#94a3b8;font-size:11px;">
                      &copy; ${new Date().getFullYear()} Aplikasi EggCounting. Seluruh hak cipta dilindungi.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
