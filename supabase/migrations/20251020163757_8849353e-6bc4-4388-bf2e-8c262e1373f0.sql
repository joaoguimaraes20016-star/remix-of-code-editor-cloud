-- Update the Aaron Goldsmith sale to use correct full name
UPDATE sales 
SET 
  setter = 'Isai rivera',
  sales_rep = 'Isai rivera',
  updated_at = now()
WHERE id = '81adfc3b-2aa3-4eb0-9e20-3a641d515f6f'
  AND team_id = 'c2cbfeed-8710-428b-966d-534804a256fb';