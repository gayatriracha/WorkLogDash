import { type WorkLog, type InsertWorkLog, type UpdateWorkLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Work log methods
  getWorkLogsByDate(date: string): Promise<WorkLog[]>;
  getWorkLog(date: string, timeSlot: string): Promise<WorkLog | undefined>;
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  updateWorkLog(date: string, timeSlot: string, updates: UpdateWorkLog): Promise<WorkLog | undefined>;
  getWorkLogsByDateRange(startDate: string, endDate: string): Promise<WorkLog[]>;
  getMonthlyWorkLogs(year: number, month: number): Promise<WorkLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, any>;
  private workLogs: Map<string, WorkLog>; // key: `${date}-${timeSlot}`

  constructor() {
    this.users = new Map();
    this.workLogs = new Map();
  }

  async getUser(id: string): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  private getWorkLogKey(date: string, timeSlot: string): string {
    return `${date}-${timeSlot}`;
  }

  async getWorkLogsByDate(date: string): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values()).filter(log => log.date === date);
  }

  async getWorkLog(date: string, timeSlot: string): Promise<WorkLog | undefined> {
    return this.workLogs.get(this.getWorkLogKey(date, timeSlot));
  }

  async createWorkLog(insertWorkLog: InsertWorkLog): Promise<WorkLog> {
    const id = randomUUID();
    const now = new Date();
    const workLog: WorkLog = {
      ...insertWorkLog,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.workLogs.set(this.getWorkLogKey(workLog.date, workLog.timeSlot), workLog);
    return workLog;
  }

  async updateWorkLog(date: string, timeSlot: string, updates: UpdateWorkLog): Promise<WorkLog | undefined> {
    const key = this.getWorkLogKey(date, timeSlot);
    const existing = this.workLogs.get(key);
    
    if (!existing) {
      return undefined;
    }

    const updated: WorkLog = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.workLogs.set(key, updated);
    return updated;
  }

  async getWorkLogsByDateRange(startDate: string, endDate: string): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values()).filter(log => 
      log.date >= startDate && log.date <= endDate
    );
  }

  async getMonthlyWorkLogs(year: number, month: number): Promise<WorkLog[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return this.getWorkLogsByDateRange(startDate, endDate);
  }
}

export const storage = new MemStorage();
