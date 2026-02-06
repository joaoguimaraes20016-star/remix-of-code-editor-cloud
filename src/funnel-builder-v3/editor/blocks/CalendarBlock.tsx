import React, { useState, useEffect } from 'react';
import { CalendarContent } from '@/funnel-builder-v3/types/funnel';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarDays, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';
import { format } from 'date-fns';

interface CalendarBlockProps {
  content: CalendarContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

interface TimeSlot {
  time: string;
  utc: string;
  available: boolean;
}

export function CalendarBlock({ content, blockId, stepId, isPreview }: CalendarBlockProps) {
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const [date, setDate] = useState<Date | undefined>(undefined);
  const accentColor = content.accentColor || '#6366f1';
  const { titleColor } = content;

  // Native booking state
  const [bookingStep, setBookingStep] = useState<'date' | 'time' | 'form' | 'confirmed'>('date');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'calendar',
    hintText: 'Click to edit calendar'
  });

  const handleTitleChange = (newTitle: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { title: newTitle });
    }
  };

  const handleButtonTextChange = (newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { buttonText: newText });
    }
  };

  // Fetch available slots when date is selected (native_booking mode)
  useEffect(() => {
    if (content.provider !== 'native_booking' || !date || !content.event_type_id || !isPreview) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const dateStr = format(date!, 'yyyy-MM-dd');
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const url = `${supabaseUrl}/functions/v1/get-available-slots?event_type_id=${content.event_type_id}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`;
        const response = await fetch(url, { headers: { apikey: supabaseKey } });

        if (response.ok) {
          const data = await response.json();
          setSlots(data.slots || []);
        } else {
          setSlots([]);
        }
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [date, content.event_type_id, content.provider, isPreview]);

  const handleNativeBookingSubmit = async () => {
    if (!selectedSlot || !date || !content.event_type_id || !bookingName || !bookingEmail) return;

    setSubmitting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          event_type_id: content.event_type_id,
          date: format(date, 'yyyy-MM-dd'),
          time: selectedSlot.time,
          timezone,
          name: bookingName,
          email: bookingEmail,
          phone: bookingPhone || undefined,
        }),
      });

      if (response.ok) {
        setBookingStep('confirmed');
      }
    } catch (err) {
      console.error('[CalendarBlock] Booking error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime12 = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  // For Calendly embed
  if (content.provider === 'calendly' && content.url) {
    return wrapWithOverlay(
      <div className="space-y-4">
        {(content.title || canEdit) && (
          <div className={cn("text-lg font-semibold text-center", !titleColor && "text-foreground")} style={titleColor ? { color: titleColor } : undefined}>
            {canEdit ? (
              <EditableText
                value={content.title || ''}
                onChange={handleTitleChange}
                as="h3"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={titleColor ? { color: titleColor } : {}}
                onStyleChange={() => {}}
                placeholder="Add title..."
              />
            ) : (
              content.title
            )}
          </div>
        )}
        <iframe
          src={content.url}
          width="100%"
          height={content.height || 630}
          frameBorder="0"
          className="rounded-lg"
        />
      </div>
    );
  }

  // Native Booking provider
  if (content.provider === 'native_booking') {
    // Editor mode — show a preview mockup
    if (!isPreview) {
      return wrapWithOverlay(
        <div className="space-y-4">
          {(content.title || canEdit) && (
            <div className={cn("text-lg font-semibold text-center", !titleColor && "text-foreground")} style={titleColor ? { color: titleColor } : undefined}>
              {canEdit ? (
                <EditableText
                  value={content.title || ''}
                  onChange={handleTitleChange}
                  as="h3"
                  isPreview={isPreview}
                  showToolbar={true}
                  richText={true}
                  styles={titleColor ? { color: titleColor } : {}}
                  onStyleChange={() => {}}
                  placeholder="Add title..."
                />
              ) : (
                content.title
              )}
            </div>
          )}
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Native Booking Widget
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {content.event_type_id
                ? 'Event type connected — visitors will see a date/time picker'
                : 'Select an event type in the inspector panel'}
            </p>
          </div>
        </div>
      );
    }

    // Runtime mode — full booking widget
    return wrapWithOverlay(
      <div className="space-y-4">
        {content.title && (
          <div className={cn("text-lg font-semibold text-center", !titleColor && "text-foreground")} style={titleColor ? { color: titleColor } : undefined}>
            {content.title}
          </div>
        )}

        {/* Confirmed state */}
        {bookingStep === 'confirmed' && (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: accentColor }} />
            <h3 className="text-lg font-bold">You're Booked!</h3>
            <p className="text-sm text-muted-foreground">Check your email for confirmation.</p>
          </div>
        )}

        {/* Date selection */}
        {bookingStep === 'date' && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  if (d) {
                    setSelectedSlot(null);
                    setBookingStep('time');
                  }
                }}
                className="rounded-lg border bg-card p-3 pointer-events-auto"
                disabled={(d) => d < new Date()}
                modifiersStyles={{
                  selected: { backgroundColor: accentColor, color: 'white' },
                }}
              />
            </div>
          </div>
        )}

        {/* Time selection */}
        {bookingStep === 'time' && (
          <div className="space-y-3">
            <button
              onClick={() => setBookingStep('date')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Change date
            </button>
            {date && (
              <p className="text-sm font-medium text-center">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </p>
            )}
            {slotsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                No available times for this date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                {slots.map((slot) => (
                  <Button
                    key={slot.utc}
                    variant={selectedSlot?.utc === slot.utc ? 'default' : 'outline'}
                    size="sm"
                    className="text-sm pointer-events-auto"
                    style={
                      selectedSlot?.utc === slot.utc
                        ? { backgroundColor: accentColor, borderColor: accentColor }
                        : undefined
                    }
                    onClick={() => {
                      setSelectedSlot(slot);
                      setBookingStep('form');
                    }}
                  >
                    {formatTime12(slot.time)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {bookingStep === 'form' && (
          <div className="space-y-3">
            <button
              onClick={() => setBookingStep('time')}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              &larr; Change time
            </button>
            {date && selectedSlot && (
              <p className="text-sm font-medium text-center">
                {format(date, 'MMM d')} at {formatTime12(selectedSlot.time)}
              </p>
            )}
            <div className="space-y-2">
              <Input
                placeholder="Your name"
                value={bookingName}
                onChange={(e) => setBookingName(e.target.value)}
                className="pointer-events-auto"
              />
              <Input
                type="email"
                placeholder="Email address"
                value={bookingEmail}
                onChange={(e) => setBookingEmail(e.target.value)}
                className="pointer-events-auto"
              />
              <Input
                type="tel"
                placeholder="Phone (optional)"
                value={bookingPhone}
                onChange={(e) => setBookingPhone(e.target.value)}
                className="pointer-events-auto"
              />
            </div>
            <Button
              className="w-full pointer-events-auto"
              style={{ backgroundColor: accentColor }}
              disabled={!bookingName || !bookingEmail || submitting}
              onClick={handleNativeBookingSubmit}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4 mr-2" />
              )}
              {content.buttonText || 'Confirm Booking'}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Default native date picker (original behavior)
  return wrapWithOverlay(
    <div className="space-y-4">
      {(content.title || canEdit) && (
        <div className={cn("text-lg font-semibold text-center", !titleColor && "text-foreground")} style={titleColor ? { color: titleColor } : undefined}>
            {canEdit ? (
              <EditableText
                value={content.title || ''}
                onChange={handleTitleChange}
                as="h3"
                isPreview={isPreview}
                showToolbar={true}
                richText={true}
                styles={titleColor ? { color: titleColor } : {}}
                onStyleChange={() => {}}
                placeholder="Add title..."
              />
          ) : (
            content.title
          )}
        </div>
      )}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className={cn("rounded-lg border bg-card p-3 pointer-events-auto")}
          disabled={(date) => date < new Date()}
          modifiersStyles={{
            selected: {
              backgroundColor: accentColor,
              color: 'white',
            },
          }}
        />
      </div>
      <Button 
        className="w-full" 
        size="lg" 
        disabled={!date}
        style={{ backgroundColor: date ? accentColor : undefined }}
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        {canEdit ? (
          <EditableText
            value={content.buttonText || 'Book Now'}
            onChange={handleButtonTextChange}
            as="span"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            styles={{}}
            onStyleChange={() => {}}
          />
        ) : (
          content.buttonText || 'Book Now'
        )}
      </Button>
    </div>
  );
}
