import { useState, useEffect } from "react";
import { useWorkLog } from "@/hooks/useWorkLog";
import { useISTTime } from "@/hooks/useISTTime";
import { useAudioNotifications } from "@/hooks/useAudioNotifications";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import TimeSlotCard from "@/components/TimeSlotCard";
import ProgressRing from "@/components/ProgressRing";
import AudioNotification from "@/components/AudioNotification";
import DailySummaryCard from "@/components/DailySummaryCard";
import EnhancedMonthlySummaryCard from "@/components/EnhancedMonthlySummaryCard";
import EndOfDayModal from "@/components/EndOfDayModal";
import { useEndOfDayNotification } from "@/hooks/useEndOfDayNotification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TIME_SLOTS } from "@shared/schema";
import { formatISO } from "date-fns";
import { LogOut, User } from "lucide-react";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = formatISO(selectedDate, { representation: 'date' });
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentTime, currentTimeSlot, isWorkHours } = useISTTime();
  const { workLogs, updateWorkLog, setHolidayStatus, monthlySummary, dailySummary, enhancedMonthlySummary, isLoading } = useWorkLog(dateString);
  const { audioEnabled, toggleAudio, showNotification, closeNotification } = useAudioNotifications();
  const { showEndOfDayModal, closeModal } = useEndOfDayNotification(dailySummary, dateString);

  const isHoliday = workLogs.some(log => log.isHoliday);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include" 
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Force reload anyway
      window.location.href = "/";
    }
  };
  
  // Calculate progress
  const completedSlots = workLogs.filter(log => !log.isHoliday && log.workDescription.trim() !== '').length;
  const totalSlots = TIME_SLOTS.length;
  const progressPercentage = Math.round((completedSlots / totalSlots) * 100);

  const handleHolidayToggle = async (checked: boolean) => {
    await setHolidayStatus(dateString, checked);
  };

  const handleDateNavigation = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading work log...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <i className="fas fa-clock text-xl"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground" data-testid="dashboard-title">
                  Work Log Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Track your daily productivity</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {(user as any)?.firstName || (user as any)?.email || 'User'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
              <Button
                variant={audioEnabled ? "default" : "secondary"}
                size="sm"
                onClick={toggleAudio}
                className="flex items-center space-x-2"
                data-testid="audio-toggle-button"
              >
                <i className={`fas ${audioEnabled ? 'fa-volume-up audio-pulse' : 'fa-volume-mute'}`}></i>
                <span>Audio Alerts</span>
              </Button>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground" data-testid="current-date">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground" data-testid="current-time">
                  {currentTime} IST
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Work Log */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Navigation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daily Work Log</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateNavigation('prev')}
                      data-testid="date-nav-prev"
                    >
                      <i className="fas fa-chevron-left"></i>
                    </Button>
                    <div className="text-sm font-medium text-foreground">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateNavigation('next')}
                      data-testid="date-nav-next"
                    >
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Holiday Toggle */}
                <div className="flex items-center justify-between mb-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-calendar-day text-muted-foreground"></i>
                    <span className="text-sm font-medium text-foreground">Mark as Holiday</span>
                  </div>
                  <Switch
                    checked={isHoliday}
                    onCheckedChange={handleHolidayToggle}
                    data-testid="holiday-toggle"
                  />
                </div>

                {/* Time Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TIME_SLOTS.map((timeSlot) => {
                    const workLog = workLogs.find(log => log.timeSlot === timeSlot);
                    const isCurrent = currentTimeSlot === timeSlot && isWorkHours;
                    
                    return (
                      <TimeSlotCard
                        key={timeSlot}
                        timeSlot={timeSlot}
                        workLog={workLog}
                        isCurrent={isCurrent}
                        isHoliday={isHoliday}
                        onUpdate={(description) => updateWorkLog(dateString, timeSlot, description)}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Daily Summary */}
            {dailySummary && (
              <DailySummaryCard summary={dailySummary} date={dateString} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressRing percentage={progressPercentage} />
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Time</span>
                    <span className="font-medium text-foreground" data-testid="sidebar-current-time">
                      {currentTime} IST
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Next Log</span>
                    <span className="font-medium text-accent">
                      {currentTimeSlot || 'Outside work hours'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-medium text-foreground">
                      {totalSlots - completedSlots} slots
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Monthly Summary */}
            {enhancedMonthlySummary && (
              <EnhancedMonthlySummaryCard summary={enhancedMonthlySummary} />
            )}
          </div>
        </div>
      </div>

      <AudioNotification
        isOpen={showNotification}
        onClose={closeNotification}
        currentTime={currentTime}
        onLogNow={() => {
          closeNotification();
          // Focus on current time slot
          const currentSlotElement = document.querySelector(`[data-testid="time-slot-${currentTimeSlot}"] textarea`);
          if (currentSlotElement) {
            (currentSlotElement as HTMLTextAreaElement).focus();
          }
        }}
      />

      <EndOfDayModal
        isOpen={showEndOfDayModal}
        onClose={closeModal}
        dailySummary={dailySummary}
        date={dateString}
      />
    </div>
  );
}
