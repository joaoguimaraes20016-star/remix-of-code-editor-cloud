// src/components/scheduling/BookingForm.tsx
// Lead information form + custom intake questions for booking confirmation

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface IntakeQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox";
  required: boolean;
  options?: string[];
}

interface BookingFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    phone: string;
    intake_answers: Record<string, any>;
  }) => void;
  isSubmitting?: boolean;
  questions?: IntakeQuestion[];
  accentColor?: string;
  // Prefill from funnel context
  prefillName?: string;
  prefillEmail?: string;
  prefillPhone?: string;
}

export default function BookingForm({
  onSubmit,
  isSubmitting,
  questions = [],
  accentColor = "#3B82F6",
  prefillName = "",
  prefillEmail = "",
  prefillPhone = "",
}: BookingFormProps) {
  const [name, setName] = useState(prefillName);
  const [email, setEmail] = useState(prefillEmail);
  const [phone, setPhone] = useState(prefillPhone);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Invalid email";

    questions.forEach((q) => {
      const answer = intakeAnswers[q.id];
      if (q.required) {
        if (q.type === "checkbox") {
          if (!answer || !Array.isArray(answer) || answer.length === 0) {
            newErrors[q.id] = `${q.label} is required`;
          }
        } else {
          if (!answer?.toString().trim()) {
            newErrors[q.id] = `${q.label} is required`;
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      intake_answers: intakeAnswers,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="booking-name" className="text-sm font-medium">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="booking-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label htmlFor="booking-email" className="text-sm font-medium">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="booking-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="booking-phone" className="text-sm font-medium">
          Phone
        </Label>
        <Input
          id="booking-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
        />
      </div>

      {/* Custom Intake Questions */}
      {questions.map((q) => (
        <div key={q.id}>
          <Label className="text-sm font-medium">
            {q.label} {q.required && <span className="text-destructive">*</span>}
          </Label>
          {q.type === "textarea" ? (
            <Textarea
              value={intakeAnswers[q.id] || ""}
              onChange={(e) => setIntakeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder={`Enter ${q.label.toLowerCase()}`}
              rows={3}
              className={errors[q.id] ? "border-destructive" : ""}
            />
          ) : q.type === "select" && q.options ? (
            <Select
              value={intakeAnswers[q.id] || ""}
              onValueChange={(value) => setIntakeAnswers((prev) => ({ ...prev, [q.id]: value }))}
            >
              <SelectTrigger className={errors[q.id] ? "border-destructive" : ""}>
                <SelectValue placeholder={`Select ${q.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {q.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : q.type === "checkbox" ? (
            <div className="space-y-2 mt-2">
              {q.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${q.id}-${option}`}
                    checked={(intakeAnswers[q.id] as string[])?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const current = (intakeAnswers[q.id] as string[]) || [];
                      if (checked) {
                        setIntakeAnswers((prev) => ({ ...prev, [q.id]: [...current, option] }));
                      } else {
                        setIntakeAnswers((prev) => ({
                          ...prev,
                          [q.id]: current.filter((v) => v !== option),
                        }));
                      }
                    }}
                  />
                  <Label
                    htmlFor={`${q.id}-${option}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <Input
              value={intakeAnswers[q.id] || ""}
              onChange={(e) => setIntakeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder={`Enter ${q.label.toLowerCase()}`}
              className={errors[q.id] ? "border-destructive" : ""}
            />
          )}
          {errors[q.id] && <p className="text-xs text-destructive mt-1">{errors[q.id]}</p>}
        </div>
      ))}

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        style={{ backgroundColor: accentColor }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Booking...
          </>
        ) : (
          "Confirm Booking"
        )}
      </Button>
    </form>
  );
}
