import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Mail, Phone, User } from 'lucide-react';

// Define a minimal settings interface that works with both FunnelRenderer's local type and editorTypes
interface PopupOptInSettings {
  primary_color?: string;
  primaryColor?: string;
  background_color?: string;
  backgroundColor?: string;
  popup_optin_enabled?: boolean;
  popup_optin_headline?: string;
  popup_optin_subtext?: string;
  popup_optin_fields?: ('name' | 'email' | 'phone')[];
  popup_optin_button_text?: string;
  popup_optin_require_phone?: boolean;
  popup_optin_require_name?: boolean;
}

interface PopupOptInGateProps {
  settings: PopupOptInSettings;
  onSubmit: (data: { name?: string; email?: string; phone?: string }) => void;
  onClose?: () => void;
}

export function PopupOptInGate({ settings, onSubmit, onClose }: PopupOptInGateProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fields = settings.popup_optin_fields || ['email'];
  const showName = fields.includes('name');
  const showEmail = fields.includes('email');
  const showPhone = fields.includes('phone');

  const headline = settings.popup_optin_headline || 'Before we begin...';
  const subtext = settings.popup_optin_subtext || 'Enter your details to continue';
  const buttonText = settings.popup_optin_button_text || 'Continue';

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^[\d\s\-+()]{7,}$/.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    // Email is always required
    if (showEmail && !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (showEmail && !validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Name required if configured
    if (showName && settings.popup_optin_require_name && !name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Phone required if configured
    if (showPhone && settings.popup_optin_require_phone && !phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (showPhone && phone.trim() && !validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    const data: { name?: string; email?: string; phone?: string } = {};
    if (showName && name.trim()) data.name = name.trim();
    if (showEmail && email.trim()) data.email = email.trim();
    if (showPhone && phone.trim()) data.phone = phone.trim();

    onSubmit(data);
  };

  const primaryColor = settings.primary_color || settings.primaryColor || '#8B5CF6';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-2xl p-8 shadow-2xl"
        style={{ 
          backgroundColor: settings.background_color || settings.backgroundColor || '#ffffff',
        }}
      >
        {/* Close button (optional) */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Content */}
        <div className="text-center mb-6">
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: settings.background_color === '#ffffff' || !settings.background_color ? '#1f2937' : '#ffffff' }}
          >
            {headline}
          </h2>
          <p 
            className="text-sm opacity-80"
            style={{ color: settings.background_color === '#ffffff' || !settings.background_color ? '#6b7280' : '#d1d5db' }}
          >
            {subtext}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {showName && (
            <div className="space-y-2">
              <Label htmlFor="popup-name" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4" />
                Name {settings.popup_optin_require_name && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="popup-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                placeholder="Your name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
          )}

          {showEmail && (
            <div className="space-y-2">
              <Label htmlFor="popup-email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4" />
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="popup-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                placeholder="you@example.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          )}

          {showPhone && (
            <div className="space-y-2">
              <Label htmlFor="popup-phone" className="flex items-center gap-2 text-sm font-medium">
                <Phone className="w-4 h-4" />
                Phone {settings.popup_optin_require_phone && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="popup-phone"
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setErrors(prev => ({ ...prev, phone: '' })); }}
                placeholder="+1 (555) 000-0000"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-6 text-lg font-semibold rounded-xl transition-all hover:scale-[1.02]"
            style={{ 
              backgroundColor: primaryColor,
              color: '#ffffff',
            }}
          >
            {isSubmitting ? 'Please wait...' : buttonText}
          </Button>
        </form>

        {/* Trust badge */}
        <p className="text-center text-xs opacity-50 mt-4">
          🔒 Your information is secure and never shared
        </p>
      </div>
    </div>
  );
}
