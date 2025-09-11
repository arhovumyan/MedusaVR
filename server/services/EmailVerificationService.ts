import sgMail from '@sendgrid/mail';
import crypto from 'crypto';
import { UserModel } from '../db/models/UserModel.js';

class EmailVerificationService {
  private isConfigured: boolean = false;
  private fromEmail: string;
  private baseUrl: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@medusavr.com';
    this.baseUrl = process.env.BASE_URL || 'https://medusavr.com';
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    try {
      // Check if SendGrid is configured
      if (!process.env.SENDGRID_API_KEY) {
        console.warn('⚠️ SendGrid API key not configured. Email verification will be logged instead of sent.');
        console.warn('⚠️ Set SENDGRID_API_KEY environment variable to enable email sending.');
        return;
      }

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      console.log('SendGrid email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SendGrid email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Generate a secure verification token
   */
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(email: string, username: string, token: string): Promise<boolean> {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - MedusaVR</title>
        <style>
          body { font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a, #2a2a2a); border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(255, 107, 0, 0.2); }
          .header { background: linear-gradient(135deg, #ff6b00, #ff8c42); padding: 40px 30px; text-align: center; }
          .logo { font-size: 32px; font-weight: bold; color: #ffffff; margin-bottom: 10px; }
          .header-text { font-size: 18px; color: #ffffff; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .welcome { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #ff6b00; }
          .message { font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #e0e0e0; }
          .verify-button { display: inline-block; background: linear-gradient(135deg, #ff6b00, #ff8c42); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; transition: transform 0.2s; }
          .verify-button:hover { transform: translateY(-2px); }
          .warning { background: rgba(255, 107, 0, 0.1); border: 1px solid #ff6b00; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .warning-title { font-weight: bold; color: #ff6b00; margin-bottom: 10px; }
          .footer { background: #1a1a1a; padding: 30px; text-align: center; font-size: 14px; color: #888; }
          .footer a { color: #ff6b00; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">MedusaVR</div>
            <div class="header-text">AI-Powered Virtual Reality Platform</div>
          </div>
          
          <div class="content">
            <div class="welcome">Welcome to MedusaVR, ${username}!</div>
            
            <div class="message">
              Thank you for creating your account. To complete your registration and start exploring our AI-powered virtual reality platform, please verify your email address by clicking the button below.
            </div>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="verify-button">Verify Your Email Address</a>
            </div>
            
            <div class="warning">
              <div class="warning-title">⚠️ User Responsibility Notice</div>
              <div>You are 100% responsible for all content you generate on MedusaVR. Please ensure all activities comply with applicable laws. Read our full liability disclaimer for complete details.</div>
            </div>
            
            <div class="message">
              If you didn't create this account, please ignore this email or contact us at <a href="mailto:${this.fromEmail}" style="color: #ff6b00;">${this.fromEmail}</a>.
            </div>
            
            <div style="font-size: 14px; color: #888; margin-top: 30px;">
              <strong>Link expires in 24 hours</strong><br>
              If the button doesn't work, copy and paste this link: <br>
              <span style="color: #ff6b00; word-break: break-all;">${verificationUrl}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>MedusaVR - AI Character Generation Platform</div>
            <div style="margin-top: 10px;">
              <a href="${this.baseUrl}/legal/terms-of-service">Terms of Service</a> | 
              <a href="${this.baseUrl}/legal/privacy-policy">Privacy Policy</a> | 
              <a href="mailto:${this.fromEmail}">Contact Us</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Welcome to MedusaVR, ${username}!
      
      Thank you for creating your account. To complete your registration and start exploring our AI-powered virtual reality platform, please verify your email address by visiting:
      
      ${verificationUrl}
      
      IMPORTANT: You are 100% responsible for all content you generate on MedusaVR. Please ensure all activities comply with applicable laws.
      
      If you didn't create this account, please ignore this email or contact us at ${this.fromEmail}.
      
      This link expires in 24 hours.
      
      Best regards,
      The MedusaVR Team
    `;

    const mailOptions = {
      to: email,
      from: {
        email: this.fromEmail,
        name: 'MedusaVR'
      },
      subject: 'Verify Your Email - Complete Your MedusaVR Registration',
      text: textContent,
      html: htmlContent,
    };

    try {
      if (this.isConfigured) {
        await sgMail.send(mailOptions);
        console.log(`✅ Verification email sent to ${email} via SendGrid`);
        return true;
      } else {
        // Log email content for development/testing when SendGrid is not configured
        console.log('📧 Email verification (would be sent via SendGrid):');
        console.log(`To: ${email}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Verification URL: ${verificationUrl}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to send verification email via SendGrid:', error);
      return false;
    }
  }

  /**
   * Verify email token and activate user account
   */
  async verifyEmailToken(token: string): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      // Find user with this verification token
      const user = await UserModel.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() }
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token. Please request a new verification email.'
        };
      }

      // Mark user as verified
      user.verified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      console.log(`✅ Email verified successfully for user: ${user.email}`);

      return {
        success: true,
        message: 'Email verified successfully! You can now log in to your account.',
        user: {
          id: user._id.toString(),
          email: user.email,
          username: user.username,
          verified: user.verified
        }
      };
    } catch (error) {
      console.error('❌ Email verification error:', error);
      return {
        success: false,
        message: 'Email verification failed. Please try again.'
      };
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await UserModel.findOne({ email, verified: false });

      if (!user) {
        return {
          success: false,
          message: 'User not found or already verified.'
        };
      }

      // Generate new verification token
      const verificationToken = this.generateVerificationToken();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update user with new token
      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = verificationExpires;
      await user.save();

      // Send verification email
      const emailSent = await this.sendVerificationEmail(user.email, user.username, verificationToken);

      if (emailSent) {
        return {
          success: true,
          message: 'Verification email sent successfully. Please check your inbox.'
        };
      } else {
        return {
          success: false,
          message: 'Failed to send verification email. Please try again later.'
        };
      }
    } catch (error) {
      console.error('❌ Resend verification email error:', error);
      return {
        success: false,
        message: 'Failed to resend verification email. Please try again.'
      };
    }
  }

  /**
   * Check if email service is configured
   */
  isEmailServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const emailVerificationService = new EmailVerificationService();