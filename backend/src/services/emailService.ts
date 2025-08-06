import nodemailer from 'nodemailer';

// Create transporter with fallback for development
const createTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email configuration not found. Using mock email service for development.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = createTransporter();

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset - EcoWasteGo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1C3301;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You have requested to reset your password for your EcoWasteGo account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #1C3301; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The EcoWasteGo Team</p>
      </div>
    `
  };

  try {
    if (!transporter) {
      console.log('Mock: Password reset email would be sent to:', email);
      console.log('Mock: Reset URL:', resetUrl);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send email verification
 */
export const sendVerificationEmail = async (email: string, verificationToken: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email - EcoWasteGo',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1C3301;">Verify Your Email Address</h2>
        <p>Hello,</p>
        <p>Thank you for signing up for EcoWasteGo! Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="background-color: #1C3301; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Verify Email</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The EcoWasteGo Team</p>
      </div>
    `
  };

  try {
    if (!transporter) {
      console.log('Mock: Verification email would be sent to:', email);
      console.log('Mock: Verification URL:', verificationUrl);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send notification email
 */
export const sendNotificationEmail = async (email: string, subject: string, message: string): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1C3301;">EcoWasteGo Notification</h2>
        <p>Hello,</p>
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          ${message}
        </div>
        <p>Best regards,<br>The EcoWasteGo Team</p>
      </div>
    `
  };

  try {
    if (!transporter) {
      console.log('Mock: Notification email would be sent to:', email);
      console.log('Mock: Subject:', subject);
      console.log('Mock: Message:', message);
      return;
    }
    await transporter.sendMail(mailOptions);
    console.log('Notification email sent to:', email);
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw new Error('Failed to send notification email');
  }
}; 