import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workLogs = pgTable("work_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  timeSlot: varchar("time_slot", { length: 10 }).notNull(), // "2:00 PM", "3:00 PM", etc.
  workDescription: text("work_description").notNull().default(""),
  isHoliday: boolean("is_holiday").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertWorkLogSchema = createInsertSchema(workLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWorkLogSchema = createInsertSchema(workLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type UpdateWorkLog = z.infer<typeof updateWorkLogSchema>;
export type WorkLog = typeof workLogs.$inferSelect;

// Time slots from 2 PM to 11:30 PM IST
export const TIME_SLOTS = [
  "2:00 PM",
  "3:00 PM", 
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
  "8:00 PM",
  "9:00 PM",
  "10:00 PM",
  "11:00 PM",
  "11:30 PM"
] as const;

export type TimeSlot = typeof TIME_SLOTS[number];
