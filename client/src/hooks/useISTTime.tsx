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

      // Check if it's work hours (2 PM to 11:30 PM IST)
      const inWorkHours = (hours >= 14 && hours < 23) || (hours === 23 && minutes <= 30);
      setIsWorkHours(inWorkHours);

      // Determine current time slot
      let currentSlot: string | null = null;
      
      if (inWorkHours) {
        if (hours === 23 && minutes >= 30) {
          currentSlot = "11:30 PM";
        } else if (hours >= 14 && hours <= 22) {
          const hour12 = hours > 12 ? hours - 12 : hours;
          currentSlot = `${hour12}:00 PM`;
        }
      }

      // Set the current slot (user preferences will validate this)
      setCurrentTimeSlot(currentSlot);
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
