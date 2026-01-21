-- Update channel pricing to GHL-competitive rates (in fractional cents)
-- Email: $0.000675 per email = 0.0675 cents
-- SMS: $0.00747 per message = 0.747 cents  
-- Voice: $0.02 per minute = 2.0 cents
-- WhatsApp: $0.008 per message = 0.8 cents

UPDATE channel_pricing SET unit_price_cents = 0.0675 WHERE channel = 'email';
UPDATE channel_pricing SET unit_price_cents = 0.747 WHERE channel = 'sms';
UPDATE channel_pricing SET unit_price_cents = 2.0 WHERE channel = 'voice';
UPDATE channel_pricing SET unit_price_cents = 0.8 WHERE channel = 'whatsapp';