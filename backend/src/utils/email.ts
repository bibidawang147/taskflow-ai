import nodemailer from 'nodemailer'
import logger from './logger'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_FROM || `"瓴积AI" <${process.env.SMTP_USER}>`,
    to,
    subject: '重置您的瓴积AI密码',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;">
        <div style="text-align:center;padding:24px 0;">
          <h1 style="color:#8b5cf6;font-size:24px;margin:0;">瓴积AI</h1>
        </div>
        <div style="padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="font-size:20px;margin-top:0;">密码重置请求</h2>
          <p>您好，我们收到了您的密码重置请求。请点击下方按钮重置密码：</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 32px;background:#8b5cf6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;">
              重置密码
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            如果按钮无法点击，请复制以下链接到浏览器：<br/>
            <a href="${resetUrl}" style="color:#8b5cf6;word-break:break-all;">${resetUrl}</a>
          </p>
          <p style="font-size:13px;color:#6b7280;">此链接将在 1 小时后失效。如果您没有请求重置密码，请忽略此邮件。</p>
        </div>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
  logger.info('Password reset email sent', { to })
}
