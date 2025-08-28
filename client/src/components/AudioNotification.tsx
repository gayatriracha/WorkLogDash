import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AudioNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: string;
  onLogNow: () => void;
}

export default function AudioNotification({ 
  isOpen, 
  onClose, 
  currentTime, 
  onLogNow 
}: AudioNotificationProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-4 bg-card">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-bell text-2xl text-accent-foreground"></i>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Time to Log Your Work!
          </h3>
          <p className="text-muted-foreground mb-6">
            It's <span className="font-medium">{currentTime}</span>. Please update your work log.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              data-testid="notification-dismiss-button"
            >
              Dismiss
            </Button>
            <Button
              className="flex-1"
              onClick={onLogNow}
              data-testid="notification-log-now-button"
            >
              Log Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
