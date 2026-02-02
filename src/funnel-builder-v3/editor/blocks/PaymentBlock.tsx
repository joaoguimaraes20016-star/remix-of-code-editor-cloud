import React, { useState } from 'react';
import { PaymentContent, ConsentSettings } from '@/funnel-builder-v3/types/funnel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Default consent settings
const defaultConsent: ConsentSettings = {
  enabled: false,
  text: 'I have read and accept the',
  linkText: 'privacy policy',
  linkUrl: '#',
  required: true,
};

interface PaymentBlockProps {
  content: PaymentContent;
}

export function PaymentBlock({ content }: PaymentBlockProps) {
  const { amount, currency, buttonText, description, buttonColor, buttonGradient, amountColor, consent = defaultConsent } = content;
  const [hasConsented, setHasConsented] = useState(false);

  const handlePayment = () => {
    // Validate consent if required
    if (consent.enabled && consent.required && !hasConsented) {
      toast.error('Please accept the privacy policy to continue');
      return;
    }
    // Payment processing would happen here
  };

  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(value);
  };

  // Button styles
  const buttonStyle: React.CSSProperties = {};
  if (buttonGradient) {
    buttonStyle.background = buttonGradient;
  } else if (buttonColor) {
    buttonStyle.backgroundColor = buttonColor;
  }
  
  const hasCustomBg = !!buttonColor || !!buttonGradient;

  // Amount styles
  const amountStyle: React.CSSProperties = {};
  if (amountColor) {
    amountStyle.color = amountColor;
  }

  return (
    <div className="space-y-4">
      {/* Amount Display */}
      <div className="text-center p-4 bg-muted/50 rounded-xl">
        <p className="text-sm text-muted-foreground">Amount Due</p>
        <p className="text-3xl font-bold text-foreground" style={amountStyle}>
          {formatCurrency(amount, currency)}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Card Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Card Number</Label>
          <div className="relative">
            <Input
              placeholder="1234 5678 9012 3456"
              className="pl-10"
            />
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Expiry Date</Label>
            <Input placeholder="MM/YY" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">CVC</Label>
            <Input placeholder="123" />
          </div>
        </div>

        {/* Privacy Consent Checkbox */}
        {consent.enabled && (
          <div className="flex items-start gap-3 py-2">
            <Checkbox
              id="privacy-consent-payment"
              checked={hasConsented}
              onCheckedChange={(checked) => setHasConsented(checked === true)}
              className="mt-0.5"
            />
            <label 
              htmlFor="privacy-consent-payment" 
              className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
            >
              {consent.text}{' '}
              <a 
                href={consent.linkUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                {consent.linkText}
              </a>
              {consent.required && <span className="text-destructive ml-0.5">*</span>}
            </label>
          </div>
        )}

        <Button 
          className={cn("w-full", hasCustomBg && "hover:opacity-90")}
          variant={hasCustomBg ? "ghost" : "default"}
          style={buttonStyle}
          size="lg"
          onClick={handlePayment}
        >
          <Lock className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>

        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Secured with 256-bit SSL encryption
        </p>
      </div>
    </div>
  );
}
