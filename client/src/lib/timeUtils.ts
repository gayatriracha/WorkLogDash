import { TIME_SLOTS } from "@shared/schema";

export function formatISTTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function getISTDate(date: Date = new Date()): Date {
  return new Date(date.toLocaleString("en-US", { timeZone: 'Asia/Kolkata' }));
}

export function getCurrentTimeSlot(): string | null {
  const istDate = getISTDate();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();

  // Check if it's within work hours (2 PM to 11:30 PM IST)
  if (hours < 14 || hours > 23 || (hours === 23 && minutes > 30)) {
    return null;
  }

  // Handle special case for 11:30 PM
  if (hours === 23 && minutes >= 30) {
    return "11:30 PM";
  }

  // Handle regular hourly slots
  if (hours >= 14 && hours <= 22) {
    const hour12 = hours > 12 ? hours - 12 : hours;
    const timeSlot = `${hour12}:00 PM`;
    return TIME_SLOTS.includes(timeSlot as any) ? timeSlot : null;
  }

  return null;
}

export function isWorkingHours(): boolean {
  const istDate = getISTDate();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();

  return (hours >= 14 && hours < 23) || (hours === 23 && minutes <= 30);
}

export function getNextTimeSlot(currentSlot?: string): string | null {
  if (!currentSlot) {
    const current = getCurrentTimeSlot();
    if (!current) return TIME_SLOTS[0];
    currentSlot = current;
  }

  const currentIndex = TIME_SLOTS.indexOf(currentSlot as any);
  if (currentIndex === -1 || currentIndex === TIME_SLOTS.length - 1) {
    return null; // Invalid slot or last slot
  }

  return TIME_SLOTS[currentIndex + 1];
}

export function getPreviousTimeSlot(currentSlot?: string): string | null {
  if (!currentSlot) {
    const current = getCurrentTimeSlot();
    if (!current) return null;
    currentSlot = current;
  }

  const currentIndex = TIME_SLOTS.indexOf(currentSlot as any);
  if (currentIndex <= 0) {
    return null; // Invalid slot or first slot
  }

  return TIME_SLOTS[currentIndex - 1];
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
