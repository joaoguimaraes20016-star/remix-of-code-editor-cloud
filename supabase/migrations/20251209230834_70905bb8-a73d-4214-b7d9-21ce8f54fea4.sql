-- Add Cloudflare hostname ID to funnel_domains for API management
ALTER TABLE public.funnel_domains 
ADD COLUMN cloudflare_hostname_id text;

-- Add comment for documentation
COMMENT ON COLUMN public.funnel_domains.cloudflare_hostname_id IS 'Cloudflare Custom Hostname ID for API management';