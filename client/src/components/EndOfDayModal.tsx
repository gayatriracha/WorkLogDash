import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DailySummaryCard from "./DailySummaryCard";
import type { DailySummary } from "@shared/schema";
import { CheckCircle, Calendar } from "lucide-react";

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailySummary: DailySummary | undefined;
  date: string;
}

export default function EndOfDayModal({ isOpen, onClose, dailySummary, date }: EndOfDayModalProps) {
  const [hasShown, setHasShown] = useState(false);

  // Reset hasShown when date changes
  useEffect(() => {
    setHasShown(false);
  }, [date]);

  const handleClose = () => {
    setHasShown(true);
    onClose();
  };

  if (!dailySummary || hasShown) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
            End of Day Summary
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center py-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
              Great job today!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Here's what you accomplished
            </p>
          </div>
          
          <DailySummaryCard summary={dailySummary} date={date} />
          
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleClose}
              className="px-6"
              data-testid="close-end-of-day-modal"
            >
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}