import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="bg-primary text-primary-foreground p-3 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-clock text-2xl"></i>
          </div>
          <CardTitle className="text-2xl">Work Log Dashboard</CardTitle>
          <p className="text-muted-foreground">
            Track your daily productivity from 2 PM to 11:30 PM IST
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Hourly time slot tracking</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Real-time IST clock</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Monthly productivity summaries</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Audio reminders every hour</span>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin} 
            className="w-full" 
            size="lg"
            data-testid="login-button"
          >
            Sign In to Get Started
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Secure authentication powered by Replit
          </p>
        </CardContent>
      </Card>
    </div>
  );
}