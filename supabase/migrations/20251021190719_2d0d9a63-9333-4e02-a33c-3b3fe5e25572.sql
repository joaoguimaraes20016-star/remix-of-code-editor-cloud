-- Add 'creator' role to global_role enum
ALTER TYPE global_role ADD VALUE IF NOT EXISTS 'creator';