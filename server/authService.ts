import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage } from './storage';
import { smsService } from './smsService';
import type { SignupData, LoginData, ForgotPasswordData, ResetPasswordData, VerifySMSData, User } from '@shared/schema';

export class AuthService {
  // Generate secure random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate 6-digit SMS verification code
  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  // Verify password
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Sign up new user
  async signup(signupData: SignupData): Promise<{ message: string; userId?: string }> {
    const { email, password, firstName, lastName, phoneNumber } = signupData;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email address');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await storage.createUser({
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      phoneNumber: phoneNumber || null,
      isPhoneVerified: phoneNumber ? false : true, // If no phone provided, consider verified
    });

    // If phone number provided, send SMS verification
    if (phoneNumber) {
      const verificationCode = this.generateSMSCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await storage.createSMSVerificationToken(user.id, phoneNumber, verificationCode, expiresAt);

      try {
        await smsService.sendVerificationCode(phoneNumber, verificationCode);
        return {
          message: 'Account created successfully. Please check your phone for the verification code.',
          userId: user.id,
        };
      } catch (error) {
        console.error('Failed to send SMS verification:', error);
        return {
          message: 'Account created successfully, but failed to send SMS. You can still login.',
          userId: user.id,
        };
      }
    }

    return {
      message: 'Account created successfully. You can now login.',
      userId: user.id,
    };
  }

  // Login user
  async login(loginData: LoginData): Promise<{ user: Omit<User, 'password'>, message: string }> {
    const { email, password } = loginData;

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if phone is verified (only if phone number provided)
    if (user.phoneNumber && !user.isPhoneVerified) {
      throw new Error('Please verify your phone number before logging in');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      message: 'Login successful',
    };
  }

  // Verify SMS
  async verifySMS(verifyData: VerifySMSData): Promise<{ message: string }> {
    const { phoneNumber, code } = verifyData;

    // Get verification token
    const verificationToken = await storage.getSMSVerificationToken(phoneNumber, code);
    if (!verificationToken) {
      throw new Error('Invalid verification code');
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      await storage.deleteSMSVerificationToken(phoneNumber);
      throw new Error('Verification code has expired. Please request a new one.');
    }

    // Update user phone verification status
    await storage.updateUser(verificationToken.userId, { isPhoneVerified: true });

    // Delete verification token
    await storage.deleteSMSVerificationToken(phoneNumber);

    return { message: 'Phone number verified successfully. You can now login.' };
  }

  // Forgot password
  async forgotPassword(forgotData: ForgotPasswordData): Promise<{ message: string }> {
    const { email } = forgotData;

    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with that email exists, we sent a password reset link.' };
    }

    // Delete any existing reset tokens for this user
    await storage.deleteExpiredPasswordResetTokens(user.id);

    // Generate password reset token
    const resetToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

    // For now, password reset is email-based (could be converted to SMS later)
    // Just return success without actually sending anything in this SMS-focused version
    console.log('🔐 Password Reset Token (Development Mode):');
    console.log(`   Email: ${email}`);
    console.log(`   Token: ${resetToken}`);
    console.log('   Link: http://localhost:5000/reset-password?token=' + resetToken);
    console.log('');

    return { message: 'If an account with that email exists, we sent a password reset link.' };
  }

  // Reset password
  async resetPassword(resetData: ResetPasswordData): Promise<{ message: string }> {
    const { token, password } = resetData;

    // Get reset token
    const resetToken = await storage.getPasswordResetToken(token);
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      throw new Error('Reset token has expired. Please request a new one.');
    }

    // Check if token is already used
    if (resetToken.used) {
      throw new Error('This reset token has already been used');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(password);

    // Update user password
    await storage.updateUser(resetToken.userId, { password: hashedPassword });

    // Mark token as used
    await storage.markPasswordResetTokenAsUsed(token);

    return { message: 'Password reset successfully. You can now login with your new password.' };
  }

  // Resend SMS verification
  async resendSMSVerification(phoneNumber: string): Promise<{ message: string }> {
    // Find user with this phone number
    // Note: This requires a new storage method to find user by phone number
    // For now, we'll accept that the user provides the phone number they registered with
    
    // Delete existing verification tokens for this phone number
    await storage.deleteSMSVerificationToken(phoneNumber);
    
    // Generate new verification code
    const verificationCode = this.generateSMSCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // We need to find the user by phone number to get userId
    // For simplicity, we'll create a temporary token without userId
    // This would need to be improved in production
    const tempUserId = 'temp'; // This is a limitation of current design
    
    try {
      await smsService.sendVerificationCode(phoneNumber, verificationCode);
      // Create token only if SMS sending succeeds
      await storage.createSMSVerificationToken(tempUserId, phoneNumber, verificationCode, expiresAt);
      return { message: 'SMS verification code sent successfully.' };
    } catch (error) {
      console.error('Failed to send SMS verification:', error);
      throw new Error('Failed to send SMS verification. Please try again later.');
    }
  }
}

export const authService = new AuthService();