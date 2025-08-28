import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { WorkLog, UpdateWorkLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MonthlySummary {
  totalDays: number;
  holidayDays: number;
  workingDays: number;
  totalProductiveHours: number;
  averageHoursPerDay: number;
  topWorkAreas: Array<{
    area: string;
    hours: number;
    percentage: number;
  }>;
}

export function useWorkLog(date: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get work logs for a specific date
  const { data: workLogs = [], isLoading } = useQuery<WorkLog[]>({
    queryKey: ['/api/work-logs', date],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get monthly summary
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const { data: monthlySummary } = useQuery<MonthlySummary>({
    queryKey: ['/api/work-logs/summary', currentYear, currentMonth],
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Update work log mutation
  const updateMutation = useMutation({
    mutationFn: async ({ date, timeSlot, description }: { 
      date: string; 
      timeSlot: string; 
      description: string; 
    }) => {
      const response = await apiRequest('PUT', `/api/work-logs/${date}/${timeSlot}`, {
        workDescription: description,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs/summary'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to update work log",
        variant: "destructive",
      });
    },
  });

  // Holiday status mutation
  const holidayMutation = useMutation({
    mutationFn: async ({ date, isHoliday }: { date: string; isHoliday: boolean }) => {
      const response = await apiRequest('PUT', `/api/work-logs/${date}/holiday`, {
        isHoliday,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-logs/summary'] });
      
      toast({
        title: variables.isHoliday ? "Holiday Set" : "Holiday Removed",
        description: variables.isHoliday 
          ? "This day has been marked as a holiday" 
          : "This day is now marked as a working day",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to update holiday status",
        variant: "destructive",
      });
    },
  });

  const updateWorkLog = (date: string, timeSlot: string, description: string) => {
    updateMutation.mutate({ date, timeSlot, description });
  };

  const setHolidayStatus = (date: string, isHoliday: boolean) => {
    holidayMutation.mutate({ date, isHoliday });
  };

  return {
    workLogs,
    isLoading: isLoading || updateMutation.isPending || holidayMutation.isPending,
    updateWorkLog,
    setHolidayStatus,
    monthlySummary,
  };
}
