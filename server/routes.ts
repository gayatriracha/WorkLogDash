import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkLogSchema, updateWorkLogSchema, TIME_SLOTS } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get work logs for a specific date
  app.get("/api/work-logs/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const workLogs = await storage.getWorkLogsByDate(date);
      
      // Ensure all time slots are represented
      const completeWorkLogs = TIME_SLOTS.map(timeSlot => {
        const existing = workLogs.find(log => log.timeSlot === timeSlot);
        return existing || {
          id: `temp-${date}-${timeSlot}`,
          date,
          timeSlot,
          workDescription: "",
          isHoliday: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      res.json(completeWorkLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work logs" });
    }
  });

  // Create or update a work log entry
  app.put("/api/work-logs/:date/:timeSlot", async (req, res) => {
    try {
      const { date, timeSlot } = req.params;
      
      // Validate time slot
      if (!TIME_SLOTS.includes(timeSlot as any)) {
        return res.status(400).json({ error: "Invalid time slot" });
      }

      const validation = updateWorkLogSchema.safeParse({
        ...req.body,
        date,
        timeSlot,
      });

      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
      }

      const existing = await storage.getWorkLog(date, timeSlot);
      
      if (existing && !existing.id.startsWith('temp-')) {
        // Update existing
        const updated = await storage.updateWorkLog(date, timeSlot, validation.data);
        res.json(updated);
      } else {
        // Create new
        const created = await storage.createWorkLog({
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
  app.put("/api/work-logs/:date/holiday", async (req, res) => {
    try {
      const { date } = req.params;
      const { isHoliday } = req.body;
      
      const results = await Promise.all(
        TIME_SLOTS.map(async (timeSlot) => {
          const existing = await storage.getWorkLog(date, timeSlot);
          
          if (existing && !existing.id.startsWith('temp-')) {
            return storage.updateWorkLog(date, timeSlot, { isHoliday });
          } else {
            return storage.createWorkLog({
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
  app.get("/api/work-logs/summary/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }

      const workLogs = await storage.getMonthlyWorkLogs(year, month);
      
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
