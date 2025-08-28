import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Save, Settings } from "lucide-react";
import { Link } from "wouter";

interface WorkPreferences {
  startTime: string;
  endTime: string;
  slotDurationMinutes: string;
  timezone: string;
}

export default function WorkPreferences() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState<WorkPreferences>({
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: '60',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPreferences();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Generate preview time slots whenever preferences change
    generatePreviewTimeSlots();
  }, [preferences]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/work-preferences', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences({
          startTime: data.startTime,
          endTime: data.endTime,
          slotDurationMinutes: data.slotDurationMinutes,
          timezone: data.timezone
        });
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewTimeSlots = () => {
    try {
      const slots: string[] = [];
      const start = new Date(`2000-01-01T${preferences.startTime}:00`);
      const end = new Date(`2000-01-01T${preferences.endTime}:00`);
      const duration = parseInt(preferences.slotDurationMinutes);
      
      if (start >= end || duration <= 0) {
        setTimeSlots([]);
        return;
      }
      
      let current = new Date(start);
      while (current < end) {
        const hours = current.getHours();
        const minutes = current.getMinutes();
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
        current.setMinutes(current.getMinutes() + duration);
      }
      
      setTimeSlots(slots);
    } catch (error) {
      setTimeSlots([]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/work-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        toast({
          title: "Work preferences saved",
          description: "Your work schedule has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error saving preferences",
          description: error.message || "Failed to save work preferences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error saving preferences",
        description: "Failed to save work preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Work Preferences</h1>
              <p className="text-muted-foreground">Configure your work schedule and time slots</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Schedule Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Start Time */}
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={preferences.startTime}
                  onChange={(e) => setPreferences(prev => ({ ...prev, startTime: e.target.value }))}
                  data-testid="input-start-time"
                />
              </div>

              {/* End Time */}
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={preferences.endTime}
                  onChange={(e) => setPreferences(prev => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-end-time"
                />
              </div>

              {/* Slot Duration */}
              <div className="space-y-2">
                <Label htmlFor="slotDuration">Time Slot Duration</Label>
                <Select
                  value={preferences.slotDurationMinutes}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, slotDurationMinutes: value }))}
                >
                  <SelectTrigger data-testid="select-slot-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={preferences.timezone}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">Coordinated Universal Time (UTC)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India Standard Time (IST)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
                    <SelectItem value="Europe/London">Greenwich Mean Time (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                    <SelectItem value="Europe/Berlin">Central European Time (CET)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan Standard Time (JST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">China Standard Time (CST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australian Eastern Time (AET)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
                data-testid="button-save-preferences"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Time Slots</CardTitle>
              <p className="text-sm text-muted-foreground">
                {timeSlots.length} time slots will be created
              </p>
            </CardHeader>
            <CardContent>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {timeSlots.map((slot, index) => (
                    <Badge key={index} variant="outline" className="justify-center py-2">
                      {slot}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Configure your schedule to see time slots
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}