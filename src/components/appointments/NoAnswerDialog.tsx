import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { PhoneOff, Clock } from "lucide-react";

interface NoAnswerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (callbackMinutes: number, notes: string) => void;
  dealName: string;
  callbackOptions?: number[]; // minutes
}

export function NoAnswerDialog({
  open,
  onOpenChange,
  onConfirm,
  dealName,
  callbackOptions = [15, 30, 60, 120]
}: NoAnswerDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>("double_dial");
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    let minutes = 0;
    
    if (selectedOption === "double_dial") {
      minutes = 0; // Immediate retry
    } else if (selectedOption === "custom") {
      minutes = customMinutes;
    } else {
      minutes = parseInt(selectedOption, 10);
    }
    
    onConfirm(minutes, notes);
    
    // Reset form
    setSelectedOption("double_dial");
    setCustomMinutes(30);
    setNotes("");
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins} minutes`;
    const hours = mins / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneOff className="h-5 w-5 text-warning" />
            No Answer - {dealName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">When should we call back?</Label>
            <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="double_dial" id="double_dial" />
                <Label htmlFor="double_dial" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">Double Dial (Try Again Now)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Immediately retry the call</p>
                </Label>
              </div>
              
              {callbackOptions.map((mins) => (
                <div key={mins} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value={mins.toString()} id={`option-${mins}`} />
                  <Label htmlFor={`option-${mins}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">Callback in {formatMinutes(mins)}</span>
                  </Label>
                </div>
              ))}

              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <span className="font-medium">Custom time</span>
                </Label>
                {selectedOption === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 30)}
                      className="w-20 h-8"
                      min={5}
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the call attempt..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            <PhoneOff className="h-4 w-4 mr-2" />
            Log No Answer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}