-- Add new columns for SSL provisioning and health monitoring
ALTER TABLE public.funnel_domains 
ADD COLUMN IF NOT EXISTS ssl_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ssl_provisioned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ssl_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_health_check timestamp with time zone,
ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS dns_a_record_valid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dns_txt_record_valid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS alert_sent_at timestamp with time zone;

-- Add comment for ssl_status values
COMMENT ON COLUMN public.funnel_domains.ssl_status IS 'pending, provisioning, active, failed, expired';
COMMENT ON COLUMN public.funnel_domains.health_status IS 'unknown, healthy, degraded, offline';