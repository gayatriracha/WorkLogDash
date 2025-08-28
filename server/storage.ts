import {
  users,
  workLogs,
  type User,
  type UpsertUser,
  type WorkLog,
  type InsertWorkLog,
  type UpdateWorkLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Work log methods
  getWorkLogsByDate(userId: string, date: string): Promise<WorkLog[]>;
  getWorkLog(userId: string, date: string, timeSlot: string): Promise<WorkLog | undefined>;
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  updateWorkLog(userId: string, date: string, timeSlot: string, updates: UpdateWorkLog): Promise<WorkLog | undefined>;
  getWorkLogsByDateRange(userId: string, startDate: string, endDate: string): Promise<WorkLog[]>;
  getMonthlyWorkLogs(userId: string, year: number, month: number): Promise<WorkLog[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
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
