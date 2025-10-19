-- Add refresh token and expiry fields to teams table
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS calendly_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS calendly_token_expires_at TIMESTAMP WITH TIME ZONE;