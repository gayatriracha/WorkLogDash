import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { storage } from './storage';
import { emailService } from './emailService';
import type { SignupData, LoginData, ForgotPasswordData, ResetPasswordData, VerifyEmailData, User } from '@shared/schema';

export class AuthService {
  // Generate secure random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
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
    const { email, password, firstName, lastName } = signupData;

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
      isEmailVerified: false,
    });

    // Generate email verification token
    const verificationToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await storage.createEmailVerificationToken(user.id, verificationToken, expiresAt);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error - user is created, they can request new verification
    }

    return {
      message: 'Account created successfully. Please check your email to verify your account.',
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

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new Error('Please verify your email address before logging in');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      message: 'Login successful',
    };
  }

  // Verify email
  async verifyEmail(verifyData: VerifyEmailData): Promise<{ message: string }> {
    const { token } = verifyData;

    // Get verification token
    const verificationToken = await storage.getEmailVerificationToken(token);
    if (!verificationToken) {
      throw new Error('Invalid or expired verification token');
    }

    // Check if token is expired
    if (new Date() > verificationToken.expiresAt) {
      await storage.deleteEmailVerificationToken(token);
      throw new Error('Verification token has expired. Please request a new one.');
    }

    // Update user email verification status
    await storage.updateUser(verificationToken.userId, { isEmailVerified: true });

    // Delete verification token
    await storage.deleteEmailVerificationToken(token);

    return { message: 'Email verified successfully. You can now login.' };
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

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email. Please try again later.');
    }

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

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    // Get user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return { message: 'If an account with that email exists, we sent a new verification email.' };
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    // Delete existing verification tokens
    // This could be improved to query by userId, but for simplicity we'll generate a new one
    
    // Generate new verification token
    const verificationToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await storage.createEmailVerificationToken(user.id, verificationToken, expiresAt);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email. Please try again later.');
    }

    return { message: 'If an account with that email exists, we sent a new verification email.' };
  }
}

export const authService = new AuthService();