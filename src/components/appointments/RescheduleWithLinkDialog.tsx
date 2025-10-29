import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ExternalLink, CalendarClock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface RescheduleWithLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rescheduleUrl: string;
  appointmentName: string;
  onConfirm: (reason: string, notes?: string) => Promise<void>;
}

export function RescheduleWithLinkDialog({
  open,
  onOpenChange,
  rescheduleUrl,
  appointmentName,
  onConfirm,
}: RescheduleWithLinkDialogProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(rescheduleUrl);
      setCopied(true);
      toast.success("Reschedule link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason for reschedule");
      return;
    }
    
    setIsLoading(true);
    try {
      await onConfirm(reason, notes || undefined);
      toast.success("Link sent! Awaiting client reschedule...");
      
      // Wait briefly to show success message, then close
      setTimeout(() => {
        onOpenChange(false);
        setReason("");
        setNotes("");
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending reschedule request:", error);
      toast.error("Failed to send reschedule request");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <CalendarClock className="h-5 w-5" />
            Send Reschedule Link
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rescheduling appointment with <span className="font-medium">{appointmentName}</span>
          </p>

          {/* Calendly Reschedule Link */}
          <div className="space-y-2">
            <Label>Calendly Reschedule Link</Label>
            <div className="flex gap-2">
              <Input 
                value={rescheduleUrl} 
                readOnly 
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(rescheduleUrl, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with the client so they can reschedule their appointment
            </p>
          </div>

          {/* Reason for Reschedule */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-destructive">
              Reason for Reschedule *
            </Label>
              <Input
                id="reason"
                placeholder="Client requested different time, scheduling conflict..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isLoading}
                required
              />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">
              After you mark this as "Awaiting Reschedule", the task will update to show "Awaiting Client" status. 
              When the client reschedules via Calendly, a new confirmation task will automatically be created for the new date.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setReason("");
              setNotes("");
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sending...
              </>
            ) : (
              "Mark as Awaiting Reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
