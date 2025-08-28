import { useState, useEffect } from "react";
import { useISTTime } from "./useISTTime";
import type { DailySummary } from "@shared/schema";

export function useEndOfDayNotification(dailySummary: DailySummary | undefined, date: string) {
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [hasShownToday, setHasShownToday] = useState<string | null>(null);
  const { currentTime } = useISTTime();

  useEffect(() => {
    // Reset when date changes
    if (hasShownToday !== date) {
      setHasShownToday(null);
    }
  }, [date, hasShownToday]);

  useEffect(() => {
    // Check if it's end of day (after 11:35 PM IST) and we haven't shown the modal yet
    const now = new Date();
    const istTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const [hours, minutes] = istTime.split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;
    const endOfWorkMinutes = 23 * 60 + 35; // 11:35 PM

    // Show modal if:
    // 1. It's after end of work hours (11:35 PM IST)
    // 2. We have a daily summary
    // 3. Haven't shown today yet
    // 4. The summary has some work logged (not empty day)
    if (
      currentMinutes >= endOfWorkMinutes && 
      dailySummary && 
      hasShownToday !== date &&
      (dailySummary.completedSlots > 0 || dailySummary.isHoliday)
    ) {
      setShowEndOfDayModal(true);
      setHasShownToday(date);
    }
  }, [currentTime, dailySummary, date, hasShownToday]);

  const closeModal = () => {
    setShowEndOfDayModal(false);
  };

  return {
    showEndOfDayModal,
    closeModal,
  };
}