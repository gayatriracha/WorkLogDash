import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Target, Award } from "lucide-react";
import type { DailySummary } from "@shared/schema";

interface DailySummaryCardProps {
  summary: DailySummary;
  date: string;
}

export default function DailySummaryCard({ summary, date }: DailySummaryCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (summary.isHoliday) {
    return (
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Calendar className="w-5 h-5" />
            Daily Summary - {formatDate(date)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Award className="w-12 h-12 mx-auto mb-3 text-amber-600 dark:text-amber-400" />
            <p className="text-lg font-medium text-amber-800 dark:text-amber-200">Holiday</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Enjoy your well-deserved break!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Calendar className="w-5 h-5" />
          Daily Summary - {formatDate(date)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Day Completion
              </span>
            </div>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
              {summary.completionPercentage}%
            </span>
          </div>
          <Progress value={summary.completionPercentage} className="h-2" data-testid="daily-progress" />
          <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
            <span>{summary.completedSlots} of {summary.totalSlots} slots completed</span>
            <span>{summary.totalHours} hours worked</span>
          </div>
        </div>

        {/* Work Areas */}
        {summary.workAreas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Work Areas
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.workAreas.map((area) => (
                <Badge 
                  key={area.area} 
                  variant="secondary" 
                  className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  data-testid={`work-area-${area.area.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {area.area} ({area.percentage}%)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Accomplishments */}
        {summary.keyAccomplishments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Key Accomplishments
              </span>
            </div>
            <div className="space-y-1">
              {summary.keyAccomplishments.map((accomplishment, index) => (
                <div 
                  key={index} 
                  className="text-xs bg-blue-100 dark:bg-blue-900 p-2 rounded border-l-2 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200"
                  data-testid={`accomplishment-${index}`}
                >
                  • {accomplishment}
                </div>
              ))}
            </div>
          </div>
        )}

        {summary.completedSlots === 0 && (
          <div className="text-center py-4">
            <p className="text-blue-600 dark:text-blue-400 text-sm">
              No work logged yet for this day.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}