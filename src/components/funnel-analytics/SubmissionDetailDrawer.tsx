/**
 * SubmissionDetailDrawer - Full details view for a form submission
 */

import { format } from 'date-fns';
import { 
  X, Mail, Phone, User, Calendar, CheckCircle, XCircle, 
  Globe, Tag, Clock, FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface FunnelLead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  opt_in_status: boolean | null;
  opt_in_timestamp?: string | null;
  answers: Record<string, any>;
  created_at: string;
  last_step_index: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  funnel?: { id: string; name: string } | null;
}

interface SubmissionDetailDrawerProps {
  submission: FunnelLead | null;
  onClose: () => void;
}

export function SubmissionDetailDrawer({ submission, onClose }: SubmissionDetailDrawerProps) {
  if (!submission) return null;

  const isComplete = submission.name && submission.email;

  return (
    <Sheet open={!!submission} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span>{submission.name || 'Anonymous Visitor'}</span>
              {isComplete ? (
                <Badge variant="outline" className="ml-2 border-emerald-500/50 text-emerald-600">
                  Complete
                </Badge>
              ) : (
                <Badge variant="outline" className="ml-2 border-amber-500/50 text-amber-600">
                  Partial
                </Badge>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h3>
            <div className="space-y-3">
              {submission.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${submission.email}`} className="text-primary hover:underline">
                    {submission.email}
                  </a>
                </div>
              )}
              {submission.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${submission.phone}`} className="text-primary hover:underline">
                    {submission.phone}
                  </a>
                </div>
              )}
              {!submission.email && !submission.phone && (
                <p className="text-sm text-muted-foreground italic">No contact information provided</p>
              )}
            </div>
          </section>

          <Separator />

          {/* Submission Details */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Submission Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>Funnel: <strong>{submission.funnel?.name || 'Unknown'}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Submitted: <strong>{format(new Date(submission.created_at), 'PPpp')}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                {submission.opt_in_status ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Opted in to communications</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Did not opt in</span>
                  </>
                )}
              </div>
              {submission.last_step_index !== null && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Reached step: <strong>{submission.last_step_index + 1}</strong></span>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Form Answers */}
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Form Answers</h3>
            {Object.keys(submission.answers || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(submission.answers).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground capitalize mb-1">
                      {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-sm font-medium">
                      {typeof value === 'object' 
                        ? JSON.stringify(value, null, 2) 
                        : String(value) || <span className="text-muted-foreground italic">Empty</span>
                      }
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No additional form answers</p>
            )}
          </section>

          {/* UTM Tracking */}
          {(submission.utm_source || submission.utm_medium || submission.utm_campaign) && (
            <>
              <Separator />
              <section>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">UTM Tracking</h3>
                <div className="grid grid-cols-1 gap-3">
                  {submission.utm_source && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span>Source: <Badge variant="secondary">{submission.utm_source}</Badge></span>
                    </div>
                  )}
                  {submission.utm_medium && (
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span>Medium: <Badge variant="secondary">{submission.utm_medium}</Badge></span>
                    </div>
                  )}
                  {submission.utm_campaign && (
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span>Campaign: <Badge variant="secondary">{submission.utm_campaign}</Badge></span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* ID for debugging */}
          <section>
            <p className="text-xs text-muted-foreground">
              Submission ID: <code className="bg-muted px-1 rounded">{submission.id}</code>
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
