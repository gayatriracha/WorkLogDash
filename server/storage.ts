import {
  users,
  workLogs,
  smsVerificationTokens,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type WorkLog,
  type InsertWorkLog,
  type UpdateWorkLog,
  type SMSVerificationToken,
  type PasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: Omit<UpsertUser, 'id'>): Promise<User>;
  updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // SMS verification tokens
  createSMSVerificationToken(userId: string, phoneNumber: string, code: string, expiresAt: Date): Promise<SMSVerificationToken>;
  getSMSVerificationToken(phoneNumber: string, code: string): Promise<SMSVerificationToken | undefined>;
  deleteSMSVerificationToken(phoneNumber: string): Promise<void>;
  
  // Password reset tokens
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(userId: string): Promise<void>;
  
  // Work log methods
  getWorkLogsByDate(userId: string, date: string): Promise<WorkLog[]>;
  getWorkLog(userId: string, date: string, timeSlot: string): Promise<WorkLog | undefined>;
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  updateWorkLog(userId: string, date: string, timeSlot: string, updates: UpdateWorkLog): Promise<WorkLog | undefined>;
  getWorkLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<WorkLog[]>;
  getMonthlyWorkLogs(userId: string, year: number, month: number): Promise<WorkLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // SMS verification tokens
  async createSMSVerificationToken(userId: string, phoneNumber: string, code: string, expiresAt: Date): Promise<SMSVerificationToken> {
    const [verificationToken] = await db
      .insert(smsVerificationTokens)
      .values({ userId, phoneNumber, code, expiresAt })
      .returning();
    return verificationToken;
  }

  async getSMSVerificationToken(phoneNumber: string, code: string): Promise<SMSVerificationToken | undefined> {
    const [verificationToken] = await db
      .select()
      .from(smsVerificationTokens)
      .where(and(eq(smsVerificationTokens.phoneNumber, phoneNumber), eq(smsVerificationTokens.code, code)));
    return verificationToken;
  }

  async deleteSMSVerificationToken(phoneNumber: string): Promise<void> {
    await db
      .delete(smsVerificationTokens)
      .where(eq(smsVerificationTokens.phoneNumber, phoneNumber));
  }

  // Password reset tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async deleteExpiredPasswordResetTokens(userId: string): Promise<void> {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
  }

  // Work log methods
  async getWorkLogsByDate(userId: string, date: string): Promise<WorkLog[]> {
    return await db
      .select()
      .from(workLogs)
      .where(and(eq(workLogs.userId, userId), eq(workLogs.date, date)));
  }

  async getWorkLog(userId: string, date: string, timeSlot: string): Promise<WorkLog | undefined> {
    const [workLog] = await db
      .select()
      .from(workLogs)
      .where(
        and(
          eq(workLogs.userId, userId),
          eq(workLogs.date, date),
          eq(workLogs.timeSlot, timeSlot)
        )
      );
    return workLog;
  }

  async createWorkLog(insertWorkLog: InsertWorkLog): Promise<WorkLog> {
    const [workLog] = await db
      .insert(workLogs)
      .values(insertWorkLog)
      .returning();
    return workLog;
  }

  async updateWorkLog(userId: string, date: string, timeSlot: string, updates: UpdateWorkLog): Promise<WorkLog | undefined> {
    const [updated] = await db
      .update(workLogs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workLogs.userId, userId),
          eq(workLogs.date, date),
          eq(workLogs.timeSlot, timeSlot)
        )
      )
      .returning();
    return updated;
  }

  async getWorkLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<WorkLog[]> {
    return await db
      .select()
      .from(workLogs)
      .where(
        and(
          eq(workLogs.userId, userId),
          gte(workLogs.date, startDate),
          lte(workLogs.date, endDate)
        )
      );
  }

  async getMonthlyWorkLogs(userId: string, year: number, month: number): Promise<WorkLog[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return this.getWorkLogsByDateRange(userId, startDate, endDate);
  }
}

export const storage = new DatabaseStorage();
