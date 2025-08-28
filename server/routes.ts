import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authService } from "./authService";
import { isAuthenticated, requireGuest } from "./authMiddleware";
import { 
  insertWorkLogSchema, 
  updateWorkLogSchema, 
  TIME_SLOTS, 
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware setup
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl / 1000, // convert to seconds
    tableName: "sessions",
  });
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-here',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  }));

  // Authentication routes
  app.post('/api/auth/signup', requireGuest, async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const result = await authService.signup(validation.data);
      res.status(201).json(result);
    } catch (error) {
      console.error('Signup error:', error);
      const message = error instanceof Error ? error.message : 'Signup failed';
      res.status(400).json({ message });
    }
  });

  app.post('/api/auth/login', requireGuest, async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const result = await authService.login(validation.data);
      
      // Store user in session
      const session = req.session as any;
      session.userId = result.user.id;
      session.user = result.user;
      
      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json({ message });
    }
  });

  app.post('/api/auth/logout', async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/verify-email', async (req, res) => {
    try {
      const validation = verifyEmailSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const result = await authService.verifyEmail(validation.data);
      res.json(result);
    } catch (error) {
      console.error('Email verification error:', error);
      const message = error instanceof Error ? error.message : 'Email verification failed';
      res.status(400).json({ message });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const validation = forgotPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const result = await authService.forgotPassword(validation.data);
      res.json(result);
    } catch (error) {
      console.error('Forgot password error:', error);
      const message = error instanceof Error ? error.message : 'Failed to process forgot password request';
      res.status(500).json({ message });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const validation = resetPasswordSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const result = await authService.resetPassword(validation.data);
      res.json(result);
    } catch (error) {
      console.error('Reset password error:', error);
      const message = error instanceof Error ? error.message : 'Password reset failed';
      res.status(400).json({ message });
    }
  });

  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const result = await authService.resendVerificationEmail(email);
      res.json(result);
    } catch (error) {
      console.error('Resend verification error:', error);
      const message = error instanceof Error ? error.message : 'Failed to resend verification email';
      res.status(500).json({ message });
    }
  });

  // Get work logs for a specific date
  app.get("/api/work-logs/:date", isAuthenticated, async (req: any, res) => {
    try {
      const { date } = req.params;
      const userId = req.user!.id;
      const workLogs = await storage.getWorkLogsByDate(userId, date);
      
      // Return only actual work logs that exist
      res.json(workLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work logs" });
    }
  });

  // Create or update a work log entry
  app.put("/api/work-logs/:date/:timeSlot", isAuthenticated, async (req: any, res) => {
    try {
      const { date, timeSlot } = req.params;
      const userId = req.user!.id;
      
      // Validate time slot
      if (!TIME_SLOTS.includes(timeSlot as any)) {
        return res.status(400).json({ error: "Invalid time slot" });
      }

      const validation = updateWorkLogSchema.safeParse({
        ...req.body,
        userId,
        date,
        timeSlot,
      });

      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
      }

      const existing = await storage.getWorkLog(userId, date, timeSlot);
      
      if (existing) {
        // Update existing
        const updated = await storage.updateWorkLog(userId, date, timeSlot, validation.data);
        res.json(updated);
      } else {
        // Create new
        const created = await storage.createWorkLog({
          userId,
          date,
          timeSlot,
          workDescription: validation.data.workDescription || "",
          isHoliday: validation.data.isHoliday || false,
        });
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to save work log" });
    }
  });

  // Mark entire day as holiday
  app.put("/api/work-logs/:date/holiday", isAuthenticated, async (req: any, res) => {
    try {
      const { date } = req.params;
      const { isHoliday } = req.body;
      const userId = req.user!.id;
      
      const results = await Promise.all(
        TIME_SLOTS.map(async (timeSlot) => {
          const existing = await storage.getWorkLog(userId, date, timeSlot);
          
          if (existing) {
            return storage.updateWorkLog(userId, date, timeSlot, { isHoliday });
          } else {
            return storage.createWorkLog({
              userId,
              date,
              timeSlot,
              workDescription: "",
              isHoliday,
            });
          }
        })
      );

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to update holiday status" });
    }
  });

  // Get monthly summary
  app.get("/api/work-logs/summary/:year/:month", isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const userId = req.user!.id;
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const workLogs = await storage.getMonthlyWorkLogs(userId, year, month);
      
      // Calculate statistics
      const totalDays = new Set(workLogs.map(log => log.date)).size;
      const holidayDays = new Set(
        workLogs.filter(log => log.isHoliday).map(log => log.date)
      ).size;
      const workingDays = totalDays - holidayDays;
      
      const productiveHours = workLogs.filter(
        log => !log.isHoliday && log.workDescription.trim() !== ""
      ).length * 1; // Each slot is 1 hour (except 11:30 PM which is 0.5)
      
      // Adjust for 11:30 PM slots
      const elevenThirtySlots = workLogs.filter(
        log => !log.isHoliday && log.workDescription.trim() !== "" && log.timeSlot === "11:30 PM"
      ).length;
      const adjustedProductiveHours = productiveHours - (elevenThirtySlots * 0.5);

      // Work area analysis
      const workAreas = new Map<string, number>();
      workLogs.forEach(log => {
        if (!log.isHoliday && log.workDescription.trim() !== "") {
          const description = log.workDescription.toLowerCase();
          // Simple categorization based on keywords
          if (description.includes('frontend') || description.includes('react') || description.includes('ui')) {
            workAreas.set('Frontend Development', (workAreas.get('Frontend Development') || 0) + 1);
          } else if (description.includes('backend') || description.includes('api') || description.includes('server')) {
            workAreas.set('Backend Development', (workAreas.get('Backend Development') || 0) + 1);
          } else if (description.includes('review') || description.includes('code review')) {
            workAreas.set('Code Review', (workAreas.get('Code Review') || 0) + 1);
          } else if (description.includes('meeting') || description.includes('standup')) {
            workAreas.set('Meetings', (workAreas.get('Meetings') || 0) + 1);
          } else if (description.includes('documentation') || description.includes('docs')) {
            workAreas.set('Documentation', (workAreas.get('Documentation') || 0) + 1);
          } else {
            workAreas.set('Other', (workAreas.get('Other') || 0) + 1);
          }
        }
      });

      const topWorkAreas = Array.from(workAreas.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([area, hours]) => ({
          area,
          hours,
          percentage: Math.round((hours / (adjustedProductiveHours || 1)) * 100)
        }));

      res.json({
        totalDays,
        holidayDays,
        workingDays,
        totalProductiveHours: adjustedProductiveHours,
        averageHoursPerDay: workingDays > 0 ? Math.round((adjustedProductiveHours / workingDays) * 10) / 10 : 0,
        topWorkAreas,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate monthly summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
