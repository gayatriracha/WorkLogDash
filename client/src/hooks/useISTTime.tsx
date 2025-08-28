import { useState, useEffect } from "react";

export function useISTTime() {
  const [currentTime, setCurrentTime] = useState('');
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string | null>(null);
  const [isWorkHours, setIsWorkHours] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // Format current time in IST
      const istTimeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(now);

      setCurrentTime(istTimeString);

      // Get IST hours and minutes for work hour calculation
      const istDate = new Date(now.toLocaleString("en-US", { timeZone: 'Asia/Kolkata' }));
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();

      // Work hours will be determined by user preferences
      // For now, just set basic defaults
      setIsWorkHours(true); // Always true since work hours are now customizable
      setCurrentTimeSlot(null); // Will be determined by user's time slots
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    currentTime,
    currentTimeSlot,
    isWorkHours,
  };
}
