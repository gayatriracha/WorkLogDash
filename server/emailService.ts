import nodemailer from 'nodemailer';

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
}

class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private useSendGrid: boolean = false;

  constructor() {
    // Check if SendGrid API key is available
    if (process.env.SENDGRID_API_KEY) {
      this.useSendGrid = true;
      console.log('✅ Using SendGrid for email delivery');
    } else if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
      // Configure with environment variables for production
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development mode - use a test transporter that doesn't actually send emails
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    }
  }

  private async sendEmailWithSendGrid(to: string, subject: string, html: string): Promise<void> {
    const sendGridUrl = 'https://api.sendgrid.com/v3/mail/send';
    
    const emailData = {
      personalizations: [{
        to: [{ email: to }],
        subject: subject
      }],
      from: { 
        email: process.env.FROM_EMAIL || 'noreply@worklog.app',
        name: 'Work Log Dashboard'
      },
      content: [{
        type: 'text/html',
        value: html
      }]
    };

    const response = await fetch(sendGridUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
    
    const subject = 'Verify your email address';
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #333; margin-bottom: 20px;">Welcome to Work Log Dashboard!</h1>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            Thank you for signing up. Please verify your email address to get started.
          </p>
          <a href="${verificationUrl}" 
             style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log('📧 Email Verification Link (Development Mode):');
      console.log(`   To: ${email}`);
      console.log(`   Link: ${verificationUrl}`);
      console.log('');
    }

    try {
      if (this.useSendGrid) {
        await this.sendEmailWithSendGrid(email, subject, html);
      } else if (this.transporter) {
        const mailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@worklog.app',
          to: email,
          subject: subject,
          html: html,
        };
        await this.transporter.sendMail(mailOptions);
      } else {
        throw new Error('No email service configured');
      }
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const subject = 'Reset your password';
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #333; margin-bottom: 20px;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" 
             style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    if (process.env.NODE_ENV !== 'production') {
      console.log('🔐 Password Reset Link (Development Mode):');
      console.log(`   To: ${email}`);
      console.log(`   Link: ${resetUrl}`);
      console.log('');
    }

    try {
      if (this.useSendGrid) {
        await this.sendEmailWithSendGrid(email, subject, html);
      } else if (this.transporter) {
        const mailOptions = {
          from: process.env.FROM_EMAIL || 'noreply@worklog.app',
          to: email,
          subject: subject,
          html: html,
        };
        await this.transporter.sendMail(mailOptions);
      } else {
        throw new Error('No email service configured');
      }
      console.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export const emailService = new NodemailerEmailService();