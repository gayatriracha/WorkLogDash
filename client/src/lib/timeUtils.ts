import { generateTimeSlots } from "@shared/schema";

export function formatTimeInTimezone(date: Date, timezone: string = 'UTC'): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function getDateInTimezone(date: Date = new Date(), timezone: string = 'UTC'): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: timezone }));
}

export function getCurrentTimeSlot(userTimeSlots?: string[], timezone: string = 'UTC'): string | null {
  if (!userTimeSlots || userTimeSlots.length === 0) {
    return null; // No time slots configured
  }

  const timezoneDate = getDateInTimezone(new Date(), timezone);
  const hours = timezoneDate.getHours();
  const minutes = timezoneDate.getMinutes();
  const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Find the current or next time slot
  for (const slot of userTimeSlots) {
    if (currentTime <= slot) {
      return slot;
    }
  }

  return null; // After all time slots
}

export function isWorkingHours(startTime: string = '09:00', endTime: string = '17:00', timezone: string = 'UTC'): boolean {
  const timezoneDate = getDateInTimezone(new Date(), timezone);
  const hours = timezoneDate.getHours();
  const minutes = timezoneDate.getMinutes();
  const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return currentTime >= startTime && currentTime <= endTime;
}

export function getNextTimeSlot(currentSlot?: string, userTimeSlots?: string[]): string | null {
  if (!userTimeSlots || userTimeSlots.length === 0) {
    return null;
  }

  if (!currentSlot) {
    const current = getCurrentTimeSlot(userTimeSlots);
    if (!current) return userTimeSlots[0];
    currentSlot = current;
  }

  const currentIndex = userTimeSlots.indexOf(currentSlot);
  if (currentIndex === -1 || currentIndex === userTimeSlots.length - 1) {
    return null; // Invalid slot or last slot
  }

  return userTimeSlots[currentIndex + 1];
}

export function getPreviousTimeSlot(currentSlot?: string, userTimeSlots?: string[]): string | null {
  if (!userTimeSlots || userTimeSlots.length === 0) {
    return null;
  }

  if (!currentSlot) {
    const current = getCurrentTimeSlot(userTimeSlots);
    if (!current) return null;
    currentSlot = current;
  }

  const currentIndex = userTimeSlots.indexOf(currentSlot);
  if (currentIndex <= 0) {
    return null; // Invalid slot or first slot
  }

  return userTimeSlots[currentIndex - 1];
}

export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday = 1, Friday = 5
}

export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export function getMonthStart(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function calculateWorkingDaysInMonth(year: number, month: number): number {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  let workingDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (isWeekday(d)) {
      workingDays++;
    }
  }

  return workingDays;
}
