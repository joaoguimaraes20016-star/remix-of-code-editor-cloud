-- Reset payment method fields for fresh test
UPDATE team_billing 
SET 
  stripe_payment_method_id = NULL,
  payment_method_brand = NULL,
  payment_method_last4 = NULL
WHERE team_id = 'e865e81b-ecba-4d9d-98d9-bd0a7367d63c';