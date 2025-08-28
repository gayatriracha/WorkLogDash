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
  generateTimeSlots,
  workPreferencesSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifySMSSchema
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

  app.post('/api/auth/verify-sms', async (req, res) => {
    try {
      const validation = verifySMSSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const result = await authService.verifySMS(validation.data);
      res.json(result);
    } catch (error) {
      console.error('SMS verification error:', error);
      const message = error instanceof Error ? error.message : 'SMS verification failed';
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

  app.post('/api/auth/resend-sms', async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
      }

      const result = await authService.resendSMSVerification(phoneNumber);
      res.json(result);
    } catch (error) {
      console.error('Resend SMS verification error:', error);
      const message = error instanceof Error ? error.message : 'Failed to resend SMS verification';
      res.status(500).json({ message });
    }
  });

  // Work preferences routes
  app.get('/api/work-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      let preferences = await storage.getUserWorkPreferences(userId);
      
      // Create default preferences if none exist
      if (!preferences) {
        preferences = await storage.createWorkPreferences({
          userId,
          startTime: '09:00',
          endTime: '17:00',
          slotDurationMinutes: '60',
          timezone: 'UTC'
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Get work preferences error:', error);
      res.status(500).json({ error: 'Failed to fetch work preferences' });
    }
  });

  app.put('/api/work-preferences', isAuthenticated, async (req: any, res) => {
    try {
      const validation = workPreferencesSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.issues 
        });
      }

      const userId = req.user!.id;
      const updated = await storage.updateWorkPreferences(userId, validation.data);
      
      if (!updated) {
        // Create if doesn't exist
        const created = await storage.createWorkPreferences({
          userId,
          ...validation.data
        });
        return res.json(created);
      }
      
      res.json(updated);
    } catch (error) {
      console.error('Update work preferences error:', error);
      res.status(500).json({ error: 'Failed to update work preferences' });
    }
  });

  app.get('/api/work-preferences/time-slots', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const preferences = await storage.getUserWorkPreferences(userId);
      
      if (!preferences) {
        // Return default time slots
        const defaultSlots = generateTimeSlots('09:00', '17:00', 60);
        return res.json({ timeSlots: defaultSlots });
      }
      
      const timeSlots = generateTimeSlots(
        preferences.startTime, 
        preferences.endTime, 
        parseInt(preferences.slotDurationMinutes)
      );
      
      res.json({ timeSlots });
    } catch (error) {
      console.error('Get time slots error:', error);
      res.status(500).json({ error: 'Failed to generate time slots' });
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
      // Get user's time slots to validate
      const userPreferences = await storage.getUserWorkPreferences(userId);
      const userTimeSlots = userPreferences 
        ? generateTimeSlots(userPreferences.startTime, userPreferences.endTime, parseInt(userPreferences.slotDurationMinutes))
        : generateTimeSlots('09:00', '17:00', 60); // Default slots
        
      if (!userTimeSlots.includes(timeSlot)) {
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
      
      // Get user's time slots for the day
      const userPreferences = await storage.getUserWorkPreferences(userId);
      const userTimeSlots = userPreferences 
        ? generateTimeSlots(userPreferences.startTime, userPreferences.endTime, parseInt(userPreferences.slotDurationMinutes))
        : generateTimeSlots('09:00', '17:00', 60); // Default slots
        
      const results = await Promise.all(
        userTimeSlots.map(async (timeSlot: string) => {
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
      
      // Get user's slot duration for hour calculations
      const userPreferences = await storage.getUserWorkPreferences(userId);
      const slotDurationHours = userPreferences ? parseInt(userPreferences.slotDurationMinutes) / 60 : 1;
      
      const productiveHours = workLogs.filter(
        log => !log.isHoliday && log.workDescription.trim() !== ""
      ).length * slotDurationHours;
      
      const adjustedProductiveHours = productiveHours;

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

  // Get daily summary for a specific date
  app.get("/api/work-logs/daily-summary/:date", isAuthenticated, async (req: any, res) => {
    try {
      const { date } = req.params;
      const userId = req.user!.id;
      
      const workLogs = await storage.getWorkLogsByDate(userId, date);
      
      // Get user's time slots for calculations
      const userPreferences = await storage.getUserWorkPreferences(userId);
      const userTimeSlots = userPreferences 
        ? generateTimeSlots(userPreferences.startTime, userPreferences.endTime, parseInt(userPreferences.slotDurationMinutes))
        : generateTimeSlots('09:00', '17:00', 60); // Default slots
      const slotDurationHours = userPreferences ? parseInt(userPreferences.slotDurationMinutes) / 60 : 1;
      
      // Check if it's a holiday
      const isHoliday = workLogs.some(log => log.isHoliday);
      
      if (isHoliday) {
        return res.json({
          date,
          totalHours: 0,
          completedSlots: 0,
          totalSlots: userTimeSlots.length,
          completionPercentage: 0,
          workAreas: [],
          keyAccomplishments: ["Holiday"],
          isHoliday: true,
        });
      }
      
      // Calculate daily statistics
      const completedSlots = workLogs.filter(log => log.workDescription.trim() !== "").length;
      const totalHours = completedSlots * slotDurationHours;
      const completionPercentage = Math.round((completedSlots / userTimeSlots.length) * 100);
      
      // Analyze work areas
      const workAreaCount = new Map<string, number>();
      const accomplishments = new Set<string>();
      
      workLogs.forEach(log => {
        if (log.workDescription.trim() !== "") {
          const description = log.workDescription.toLowerCase();
          
          // Categorize work areas
          if (description.includes('frontend') || description.includes('react') || description.includes('ui')) {
            workAreaCount.set('Frontend Development', (workAreaCount.get('Frontend Development') || 0) + 1);
          } else if (description.includes('backend') || description.includes('api') || description.includes('server')) {
            workAreaCount.set('Backend Development', (workAreaCount.get('Backend Development') || 0) + 1);
          } else if (description.includes('review') || description.includes('code review')) {
            workAreaCount.set('Code Review', (workAreaCount.get('Code Review') || 0) + 1);
          } else if (description.includes('meeting') || description.includes('standup')) {
            workAreaCount.set('Meetings', (workAreaCount.get('Meetings') || 0) + 1);
          } else if (description.includes('documentation') || description.includes('docs')) {
            workAreaCount.set('Documentation', (workAreaCount.get('Documentation') || 0) + 1);
          } else if (description.includes('testing') || description.includes('test')) {
            workAreaCount.set('Testing', (workAreaCount.get('Testing') || 0) + 1);
          } else if (description.includes('deployment') || description.includes('deploy')) {
            workAreaCount.set('Deployment', (workAreaCount.get('Deployment') || 0) + 1);
          } else {
            workAreaCount.set('Other', (workAreaCount.get('Other') || 0) + 1);
          }
          
          // Extract key accomplishments (non-empty descriptions)
          if (log.workDescription.length > 10) { // More substantial descriptions
            accomplishments.add(log.workDescription);
          }
        }
      });
      
      const workAreas = Array.from(workAreaCount.entries()).map(([area, hours]) => ({
        area,
        hours,
        percentage: Math.round((hours / completedSlots) * 100),
      })).sort((a, b) => b.hours - a.hours);
      
      res.json({
        date,
        totalHours,
        completedSlots,
        totalSlots: userTimeSlots.length,
        completionPercentage,
        workAreas,
        keyAccomplishments: Array.from(accomplishments).slice(0, 5),
        isHoliday: false,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate daily summary" });
    }
  });

  // Get enhanced monthly summary with daily breakdowns
  app.get("/api/work-logs/enhanced-summary/:year/:month", isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      const userId = req.user!.id;
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      // Get user's time slots for calculations
      const userPreferences = await storage.getUserWorkPreferences(userId);
      const userTimeSlots = userPreferences 
        ? generateTimeSlots(userPreferences.startTime, userPreferences.endTime, parseInt(userPreferences.slotDurationMinutes))
        : generateTimeSlots('09:00', '17:00', 60); // Default slots
      const slotDurationHours = userPreferences ? parseInt(userPreferences.slotDurationMinutes) / 60 : 1;

      const workLogs = await storage.getMonthlyWorkLogs(userId, year, month);
      
      // Group logs by date
      const logsByDate = new Map<string, typeof workLogs>();
      workLogs.forEach(log => {
        if (!logsByDate.has(log.date)) {
          logsByDate.set(log.date, []);
        }
        logsByDate.get(log.date)!.push(log);
      });
      
      // Calculate daily summaries
      const dailySummaries = Array.from(logsByDate.entries()).map(([date, logs]) => {
        const isHoliday = logs.some(log => log.isHoliday);
        const completedSlots = logs.filter(log => !log.isHoliday && log.workDescription.trim() !== "").length;
        const totalHours = isHoliday ? 0 : completedSlots * slotDurationHours;
        
        return {
          date,
          hours: totalHours,
          completionPercentage: isHoliday ? 0 : Math.round((completedSlots / userTimeSlots.length) * 100),
        };
      }).sort((a, b) => a.date.localeCompare(b.date));
      
      // Calculate monthly statistics
      const totalDays = logsByDate.size;
      const holidayDays = Array.from(logsByDate.values()).filter(logs => logs.some(log => log.isHoliday)).length;
      const workingDays = totalDays - holidayDays;
      
      const productiveHours = workLogs.filter(
        log => !log.isHoliday && log.workDescription.trim() !== ""
      ).length * slotDurationHours;
      
      const adjustedProductiveHours = productiveHours;
      
      // Work area analysis
      const workAreas = new Map<string, number>();
      const allAccomplishments = new Set<string>();
      
      workLogs.forEach(log => {
        if (!log.isHoliday && log.workDescription.trim() !== "") {
          const description = log.workDescription.toLowerCase();
          
          // Categorize work areas
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
          } else if (description.includes('testing') || description.includes('test')) {
            workAreas.set('Testing', (workAreas.get('Testing') || 0) + 1);
          } else if (description.includes('deployment') || description.includes('deploy')) {
            workAreas.set('Deployment', (workAreas.get('Deployment') || 0) + 1);
          } else {
            workAreas.set('Other', (workAreas.get('Other') || 0) + 1);
          }
          
          // Collect key accomplishments
          if (log.workDescription.length > 15) {
            allAccomplishments.add(log.workDescription);
          }
        }
      });
      
      const topWorkAreas = Array.from(workAreas.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([area, hours]) => ({
          area,
          hours,
          percentage: Math.round((hours / (adjustedProductiveHours || 1)) * 100)
        }));
      
      // Find most productive days
      const mostProductiveDays = dailySummaries
        .filter(day => !day.date.endsWith('holiday'))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 5)
        .map(day => ({
          date: day.date,
          hours: day.hours,
          completionPercentage: day.completionPercentage,
        }));
      
      res.json({
        year,
        month,
        totalDays,
        workingDays,
        holidayDays,
        totalProductiveHours: adjustedProductiveHours,
        averageHoursPerDay: workingDays > 0 ? Math.round((adjustedProductiveHours / workingDays) * 10) / 10 : 0,
        topWorkAreas,
        dailySummaries: dailySummaries.map(day => ({
          date: day.date,
          totalHours: day.hours,
          completedSlots: Math.ceil(day.hours),
          totalSlots: userTimeSlots.length,
          completionPercentage: day.completionPercentage,
          workAreas: [], // Could be populated per day if needed
          keyAccomplishments: [],
          isHoliday: day.completionPercentage === 0 && day.hours === 0,
        })),
        keyAccomplishments: Array.from(allAccomplishments).slice(0, 10),
        mostProductiveDays,
      });
    } catch (error) {
      console.error("Enhanced monthly summary error:", error);
      res.status(500).json({ error: "Failed to generate enhanced monthly summary" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
