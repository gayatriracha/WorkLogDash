import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { WorkLog } from "@shared/schema";

interface TimeSlotCardProps {
  timeSlot: string;
  workLog?: WorkLog;
  isCurrent?: boolean;
  isHoliday?: boolean;
  onUpdate: (description: string) => void;
}

export default function TimeSlotCard({ 
  timeSlot, 
  workLog, 
  isCurrent = false, 
  isHoliday = false,
  onUpdate 
}: TimeSlotCardProps) {
  const [localDescription, setLocalDescription] = useState(workLog?.workDescription || '');
  const [isDirty, setIsDirty] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isCompleted = !isHoliday && workLog?.workDescription?.trim() !== '';

  // Update local state when workLog changes
  useEffect(() => {
    setLocalDescription(workLog?.workDescription || '');
  }, [workLog?.workDescription]);

  const handleTextChange = useCallback((value: string) => {
    setLocalDescription(value);
    setIsDirty(true);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      onUpdate(value);
      setIsDirty(false);
      timeoutRef.current = null;
    }, 2000); // Increased to 2 seconds
  }, [onUpdate]);

  const handleBlur = useCallback(() => {
    // Clear timeout if user clicks away
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (isDirty) {
      onUpdate(localDescription);
      setIsDirty(false);
    }
  }, [isDirty, localDescription, onUpdate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Convert time slot to 24-hour format for display
  const get24HourFormat = (timeSlot: string) => {
    const [time, period] = timeSlot.split(' ');
    const [hour, minute] = time.split(':');
    let hour24 = parseInt(hour);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }

    return `${hour24.toString().padStart(2, '0')}:${minute || '00'}`;
  };

  return (
    <Card 
      className={cn(
        "time-slot-card transition-all duration-200",
        isCurrent && "current-slot ring-2 ring-primary ring-opacity-50",
        isCompleted && "completed-slot border-l-4 border-l-primary bg-primary/5",
        !isCompleted && !isCurrent && "pending-slot hover:border-primary/50",
        isHoliday && "opacity-50"
      )}
      data-testid={`time-slot-${timeSlot}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "rounded-full w-10 h-10 flex items-center justify-center font-mono text-sm font-semibold",
              isCompleted ? "bg-primary text-primary-foreground" : 
              isCurrent ? "bg-accent text-accent-foreground animate-pulse" :
              "bg-muted text-muted-foreground"
            )}>
              {get24HourFormat(timeSlot).split(':')[0]}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{timeSlot}</h3>
              <p className="text-xs text-muted-foreground">
                {get24HourFormat(timeSlot)} IST
                {isCurrent && <span className="ml-2 text-accent">• Current Hour</span>}
              </p>
            </div>
          </div>
          <div className="text-lg">
            {isCompleted ? (
              <i className="fas fa-check-circle text-green-600"></i>
            ) : isCurrent ? (
              <i className="fas fa-edit text-accent"></i>
            ) : (
              <i className="fas fa-clock text-muted-foreground"></i>
            )}
          </div>
        </div>
        
        <Textarea
          value={localDescription}
          onChange={(e) => handleTextChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={
            isHoliday 
              ? "Holiday - No work log required"
              : isCurrent 
                ? "What are you working on right now?" 
                : "What did you work on during this hour?"
          }
          rows={2}
          disabled={isHoliday}
          className={cn(
            "resize-none text-sm",
            isCurrent && "ring-2 ring-primary ring-opacity-50",
            isDirty && "border-accent"
          )}
          data-testid={`textarea-${timeSlot}`}
        />
        
        {isDirty && (
          <div className="flex items-center mt-2 text-xs text-muted-foreground">
            <i className="fas fa-save mr-1"></i>
            Saving...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
