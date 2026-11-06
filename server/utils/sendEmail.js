import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

export const sendEmail = async ({ to, subject, html, otpCode }) => {
    dotenv.config({ override: true });

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.FROM_NAME || 'LearnyMo';
    const fromEmail = process.env.FROM_EMAIL || 'learnymo@paulrajeevan.com';

    // Log in server terminal only (never sent to frontend UI)
    if (otpCode) {
        console.log(`\n========================================`);
        console.log(`📧 [LearnyMo Email] To: ${to}`);
        console.log(`🔑 Subject: ${subject}`);
        console.log(`🔢 OTP Code: ${otpCode}`);
        console.log(`========================================\n`);
    }

    const isPlaceholder =
        !smtpPass ||
        smtpPass.includes('xxxx') ||
        smtpPass.includes('your_');

    if (isPlaceholder) {
        return {
            sent: false,
            error: 'SMTP credentials are not configured in server/.env yet.',
        };
    }

    // 1. If using a Resend API Key (re_...), use Resend HTTPS API directly
    if (smtpPass.startsWith('re_')) {
        try {
            let response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${smtpPass}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: `${fromName} <${fromEmail}>`,
                    to: [to],
                    subject,
                    html,
                }),
            });

            let resData = await response.json();

            // If custom domain (e.g. paulrajeevan.com) isn't verified in Resend yet, retry with onboarding@resend.dev
            if (
                !response.ok &&
                resData?.message &&
                resData.message.toLowerCase().includes('domain is not verified')
            ) {
                console.warn(
                    `⚠️ Domain in ${fromEmail} is not verified in Resend yet. Retrying with onboarding@resend.dev...`
                );
                response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${smtpPass}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: `${fromName} <onboarding@resend.dev>`,
                        to: [to],
                        subject,
                        html,
                    }),
                });
                resData = await response.json();
            }

            if (response.ok) {
                console.log(`✅ Email sent via Resend to ${to} (id: ${resData.id})`);
                return { sent: true };
            } else {
                console.error('❌ Resend API Error:', resData?.message || resData);
                return {
                    sent: false,
                    error: resData?.message || 'Resend API rejected the email request',
                };
            }
        } catch (err) {
            console.error('❌ Resend Network Error:', err.message);
        }
    }

    // 2. Standard SMTP via Nodemailer
    try {
        const transporter = nodemailer.createTransport({
            host: smtpPass.startsWith('re_') ? 'smtp.resend.com' : smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            auth: {
                user: smtpPass.startsWith('re_') ? 'resend' : smtpUser,
                pass: smtpPass,
            },
        });

        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
        });

        console.log(`✅ Email sent via SMTP to ${to}`);
        return { sent: true };
    } catch (error) {
        console.error('❌ SMTP Email Error:', error.message);
        return { sent: false, error: error.message };
    }
};

export const buildOtpEmailHtml = ({ name, title, subtitle, otpCode, footerNote }) => {
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #0f172a;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="display: inline-block; padding: 6px 14px; background-color: #eff6ff; color: #2563eb; border-radius: 9999px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
          LEARNYMO • SRI LANKA
        </span>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 800; text-align: center; color: #0f172a;">
        ${title}
      </h2>
      <p style="margin: 0 0 20px; font-size: 14px; color: #475569; text-align: center; line-height: 1.6;">
        Hi ${name || 'there'}, ${subtitle}
      </p>
      <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
        <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">
          Your 6-Digit Verification Code
        </p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #2563eb; font-family: monospace;">
          ${otpCode}
        </div>
      </div>
      <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5;">
        ${footerNote || 'This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.'}
      </p>
    </div>
    `;
};
