import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const from = process.env.EMAIL_FROM || 'no-reply@example.com';

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
};

export const sendApprovalEmail = async ({ to, name }) => {
  const subject = 'Your Vidyalaya Teacher Account is Approved!';
  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1d4ed8; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to Vidyalaya</h1>
      </div>
      <div style="padding: 32px;">
        <p style="color: #334155; font-size: 16px;">Dear <strong>${name}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">
          Great news! Your teacher account has been reviewed and approved by the administration.
        </p>
        <p style="color: #334155; font-size: 16px;">
          You can now log in to the Vidyalaya platform and start creating courses, assignments, and helping students achieve their goals.
        </p>
        <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
             style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Log In to Your Dashboard
          </a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Vidyalaya. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html });
};
