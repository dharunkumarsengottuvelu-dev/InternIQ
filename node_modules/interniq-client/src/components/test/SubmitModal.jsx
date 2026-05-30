import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/index.jsx';
import { Button } from '@/components/ui/index.jsx';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const SubmitModal = ({ isOpen, onClose, onSubmit, isSubmitting, stats }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={24} />
            Submit Assessment
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to submit your assessment? You will not be able to change your answers after submission.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-muted/50 p-4 rounded-md my-4 space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">MCQs Answered</span>
            <span className="font-medium text-foreground">
              {stats.answeredMCQs} / {stats.totalMCQs}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Coding Challenges Attempted</span>
            <span className="font-medium text-foreground">
              {stats.attemptedCoding} / {stats.totalCoding}
            </span>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Continue Test
          </Button>
          <Button 
            onClick={onSubmit} 
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Submitting...</span>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Final Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitModal;
