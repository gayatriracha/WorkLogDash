import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateTimeSlots } from "@shared/schema";
import type { UserWorkPreferences } from "@shared/schema";

interface UseTimezoneTimeProps {
  timezone?: string;
  userTimeSlots?: string[];
  startTime?: string;
  endTime?: string;
}

export function useTimezoneTime({
  timezone = 'UTC',
  userTimeSlots,
  startTime = '09:00',
  endTime = '17:00'
}: UseTimezoneTimeProps = {}) {
  const [currentTime, setCurrentTime] = useState('');
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string | null>(null);
  const [isWorkHours, setIsWorkHours] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format current time in specified timezone
      const timezoneTimeString = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(now);

      setCurrentTime(timezoneTimeString);

      // Get timezone hours and minutes for work hour calculation
      const timezoneDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
      const hours = timezoneDate.getHours();
      const minutes = timezoneDate.getMinutes();
      const currentTimeFormatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check if currently in work hours
      setIsWorkHours(currentTimeFormatted >= startTime && currentTimeFormatted <= endTime);
      
      // Find current time slot
      if (userTimeSlots && userTimeSlots.length > 0) {
        let foundSlot = null;
        for (const slot of userTimeSlots) {
          if (currentTimeFormatted <= slot) {
            foundSlot = slot;
            break;
          }
        }
        setCurrentTimeSlot(foundSlot);
      } else {
        setCurrentTimeSlot(null);
      }
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [timezone, userTimeSlots, startTime, endTime]);

  return {
    currentTime,
    currentTimeSlot,
    isWorkHours,
  };
}

// Hook that gets user work preferences and provides timezone-aware time
export function useUserTime() {
  // Fetch user work preferences
  const { data: workPreferences } = useQuery<UserWorkPreferences>({
    queryKey: ['/api/work-preferences'],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Generate time slots based on user preferences
  const userTimeSlots = workPreferences 
    ? generateTimeSlots(
        workPreferences.startTime, 
        workPreferences.endTime, 
        parseInt(workPreferences.slotDurationMinutes)
      )
    : [];

  // Use timezone time with user preferences
  const timeData = useTimezoneTime({
    timezone: workPreferences?.timezone || 'UTC',
    userTimeSlots,
    startTime: workPreferences?.startTime || '09:00',
    endTime: workPreferences?.endTime || '17:00'
  });

  return {
    ...timeData,
    workPreferences,
    userTimeSlots,
  };
}

// Keep the old function name for backward compatibility
export function useISTTime() {
  return useTimezoneTime({ timezone: 'Asia/Kolkata' });
}
