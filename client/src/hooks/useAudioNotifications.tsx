import { useState, useEffect, useCallback } from "react";
import { useUserTime } from "./useISTTime";
import { playNotificationSound } from "@/lib/audioUtils";

export function useAudioNotifications() {
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('worklog-audio-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showNotification, setShowNotification] = useState(false);
  const [lastNotificationTime, setLastNotificationTime] = useState<string | null>(null);

  const { currentTime, isWorkHours, workPreferences } = useUserTime();

  const toggleAudio = useCallback(() => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    localStorage.setItem('worklog-audio-enabled', JSON.stringify(newState));
  }, [audioEnabled]);

  const closeNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  useEffect(() => {
    if (!audioEnabled || !isWorkHours) return;

    const now = new Date();
    const userTimezone = workPreferences?.timezone || 'UTC';
    const timezoneTime = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    const [hours, minutes] = timezoneTime.split(':').map(Number);
    const currentTimeKey = `${hours}:${minutes}`;

    // Audio notifications will be based on user's work preferences
    // For now, disable automatic hourly notifications
    const isHourlyNotification = false;
    const isHalfHourNotification = false;

    if ((isHourlyNotification || isHalfHourNotification) && 
        lastNotificationTime !== currentTimeKey) {
      
      setLastNotificationTime(currentTimeKey);
      setShowNotification(true);
      
      // Play notification sound
      playNotificationSound().catch(error => {
        console.warn('Failed to play notification sound:', error);
      });
    }
  }, [currentTime, audioEnabled, isWorkHours, lastNotificationTime]);

  return {
    audioEnabled,
    toggleAudio,
    showNotification,
    closeNotification,
  };
}
