import nodemailer from 'nodemailer';
import config from '../config/config';
import logger from '../config/logger';

// Email service debug logger
const emailDebugger = logger.withTraceId('EMAIL');

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: config.smtp.host || 'smtp.gmail.com',
    port: config.smtp.port || 587,
    secure: config.smtp.secure || false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  // Prepare mail options
  const mailOptions = {
    from: config.smtp.user,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || [],
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    emailDebugger.info(`Email sent successfully: ${result.messageId}`);
  } catch (error: any) {
    emailDebugger.error(`Failed to send email: ${error.message}`);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};