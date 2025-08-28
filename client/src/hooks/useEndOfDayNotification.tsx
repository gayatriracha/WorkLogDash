import { useState, useEffect } from "react";
import { useUserTime } from "./useISTTime";
import type { DailySummary } from "@shared/schema";

export function useEndOfDayNotification(dailySummary: DailySummary | undefined, date: string) {
  const [showEndOfDayModal, setShowEndOfDayModal] = useState(false);
  const [hasShownToday, setHasShownToday] = useState<string | null>(null);
  const { currentTime } = useUserTime();

  useEffect(() => {
    // Reset when date changes
    if (hasShownToday !== date) {
      setHasShownToday(null);
    }
  }, [date, hasShownToday]);

  useEffect(() => {
    // End of day notifications are now based on user work preferences
    // For now, disable automatic end-of-day modal until work preferences are integrated
    // This will be enhanced when user work hours are properly configured
  }, [currentTime, dailySummary, date, hasShownToday]);

  const closeModal = () => {
    setShowEndOfDayModal(false);
  };

  return {
    showEndOfDayModal,
    closeModal,
  };
}