import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, boolean, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phoneNumber: varchar("phone_number"),
  profileImageUrl: varchar("profile_image_url"),
  isPhoneVerified: boolean("is_phone_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS verification tokens table
export const smsVerificationTokens = pgTable("sms_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  phoneNumber: varchar("phone_number").notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workLogs = pgTable("work_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  timeSlot: varchar("time_slot", { length: 10 }).notNull(), // "09:00", "10:00", etc. (24-hour format)
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

// Authentication schemas
export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const verifySMSSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  code: z.string().length(6, "Verification code must be 6 digits"),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SMSVerificationToken = typeof smsVerificationTokens.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertWorkLog = z.infer<typeof insertWorkLogSchema>;
export type UpdateWorkLog = z.infer<typeof updateWorkLogSchema>;
export type WorkLog = typeof workLogs.$inferSelect;

// Authentication type exports
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type VerifySMSData = z.infer<typeof verifySMSSchema>;

// Daily and Monthly Summary schemas
export const dailySummarySchema = z.object({
  date: z.string(),
  totalHours: z.number(),
  completedSlots: z.number(),
  totalSlots: z.number(),
  completionPercentage: z.number(),
  workAreas: z.array(z.object({
    area: z.string(),
    hours: z.number(),
    percentage: z.number(),
  })),
  keyAccomplishments: z.array(z.string()),
  isHoliday: z.boolean(),
});

export const monthlySummaryEnhancedSchema = z.object({
  year: z.number(),
  month: z.number(),
  totalDays: z.number(),
  workingDays: z.number(),
  holidayDays: z.number(),
  totalProductiveHours: z.number(),
  averageHoursPerDay: z.number(),
  topWorkAreas: z.array(z.object({
    area: z.string(),
    hours: z.number(),
    percentage: z.number(),
  })),
  dailySummaries: z.array(dailySummarySchema),
  keyAccomplishments: z.array(z.string()),
  mostProductiveDays: z.array(z.object({
    date: z.string(),
    hours: z.number(),
    completionPercentage: z.number(),
  })),
});

export type DailySummary = z.infer<typeof dailySummarySchema>;
export type MonthlySummaryEnhanced = z.infer<typeof monthlySummaryEnhancedSchema>;

// User work preferences table
export const userWorkPreferences = pgTable("user_work_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  startTime: varchar("start_time").notNull().default("09:00"), // 24-hour format
  endTime: varchar("end_time").notNull().default("17:00"), // 24-hour format
  slotDurationMinutes: varchar("slot_duration_minutes").notNull().default("60"), // Duration of each time slot
  timezone: varchar("timezone").notNull().default("UTC"), // User's timezone
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema for work preferences
export const workPreferencesSchema = z.object({
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in HH:MM format"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time in HH:MM format"),
  slotDurationMinutes: z.string().refine(val => ["15", "30", "60"].includes(val), "Slot duration must be 15, 30, or 60 minutes"),
  timezone: z.string().min(1, "Timezone is required"),
}).refine(data => {
  const start = new Date(`2000-01-01T${data.startTime}:00`);
  const end = new Date(`2000-01-01T${data.endTime}:00`);
  return start < end;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

// Helper function to generate time slots based on user preferences
export function generateTimeSlots(startTime: string, endTime: string, slotDurationMinutes: number): string[] {
  const slots: string[] = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  let current = new Date(start);
  while (current < end) {
    const hours = current.getHours();
    const minutes = current.getMinutes();
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + slotDurationMinutes);
  }
  
  return slots;
}

// Type exports for work preferences
export type UserWorkPreferences = typeof userWorkPreferences.$inferSelect;
export type InsertWorkPreferences = typeof userWorkPreferences.$inferInsert;
export type WorkPreferencesData = z.infer<typeof workPreferencesSchema>;
