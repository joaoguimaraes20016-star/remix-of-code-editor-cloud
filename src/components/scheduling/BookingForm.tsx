// src/components/scheduling/BookingForm.tsx
// Lead information form + custom intake questions for booking confirmation

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
      if (q.required && !intakeAnswers[q.id]?.toString().trim()) {
        newErrors[q.id] = `${q.label} is required`;
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
