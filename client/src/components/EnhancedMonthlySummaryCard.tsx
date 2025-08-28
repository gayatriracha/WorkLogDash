import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, TrendingUp, Award, Star, BarChart3, Clock } from "lucide-react";
import type { MonthlySummaryEnhanced } from "@shared/schema";

interface EnhancedMonthlySummaryCardProps {
  summary: MonthlySummaryEnhanced;
}

export default function EnhancedMonthlySummaryCard({ summary }: EnhancedMonthlySummaryCardProps) {
  const monthName = new Date(summary.year, summary.month - 1).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
          <CalendarDays className="w-6 h-6" />
          Enhanced Monthly Summary - {monthName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100" data-testid="enhanced-total-hours">
              {summary.totalProductiveHours}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Total Hours</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {summary.workingDays}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Working Days</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {summary.averageHoursPerDay}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Avg Hours/Day</div>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {summary.holidayDays}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">Holidays</div>
          </div>
        </div>

        {/* Top Work Areas */}
        {summary.topWorkAreas.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Top Work Areas This Month
              </span>
            </div>
            <div className="space-y-2">
              {summary.topWorkAreas.map((area, index) => (
                <div key={area.area} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">
                      {area.area}
                    </span>
                    <span className="font-medium text-purple-900 dark:text-purple-100">
                      {area.hours}h ({area.percentage}%)
                    </span>
                  </div>
                  <Progress 
                    value={area.percentage} 
                    className="h-2"
                    data-testid={`work-area-progress-${area.area.toLowerCase().replace(/\s+/g, '-')}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Productive Days */}
        {summary.mostProductiveDays.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Most Productive Days
              </span>
            </div>
            <div className="space-y-2">
              {summary.mostProductiveDays.map((day, index) => (
                <div 
                  key={day.date} 
                  className="flex items-center justify-between p-2 bg-white/30 dark:bg-gray-800/30 rounded border-l-2 border-purple-400 dark:border-purple-500"
                  data-testid={`productive-day-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-purple-700 dark:text-purple-300">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                      {day.hours}h
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">
                      {day.completionPercentage}% complete
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Accomplishments */}
        {summary.keyAccomplishments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Key Accomplishments This Month
              </span>
            </div>
            <div className="grid gap-2 max-h-32 overflow-y-auto">
              {summary.keyAccomplishments.map((accomplishment, index) => (
                <div 
                  key={index}
                  className="text-xs bg-purple-100 dark:bg-purple-900 p-2 rounded border-l-2 border-purple-500 dark:border-purple-400 text-purple-800 dark:text-purple-200"
                  data-testid={`monthly-accomplishment-${index}`}
                >
                  • {accomplishment}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Progress Chart (simplified) */}
        {summary.dailySummaries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-purple-800 dark:text-purple-200">
                Daily Progress Overview
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {summary.dailySummaries.slice(0, 28).map((day, index) => {
                const dayNum = new Date(day.date).getDate();
                const completionColor = day.isHoliday 
                  ? 'bg-amber-200 dark:bg-amber-800' 
                  : day.completionPercentage >= 80 
                    ? 'bg-green-200 dark:bg-green-800'
                    : day.completionPercentage >= 50
                      ? 'bg-blue-200 dark:bg-blue-800'
                      : day.completionPercentage > 0
                        ? 'bg-orange-200 dark:bg-orange-800'
                        : 'bg-gray-200 dark:bg-gray-700';
                
                return (
                  <div 
                    key={day.date}
                    className={`w-8 h-8 rounded flex items-center justify-center ${completionColor} text-gray-700 dark:text-gray-200`}
                    title={`${day.date}: ${day.isHoliday ? 'Holiday' : `${day.totalHours}h (${day.completionPercentage}%)`}`}
                    data-testid={`daily-cell-${dayNum}`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-2 text-xs text-purple-600 dark:text-purple-400">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-800"></div>
                <span>80%+</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800"></div>
                <span>50-79%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-200 dark:bg-orange-800"></div>
                <span>1-49%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-800"></div>
                <span>Holiday</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}