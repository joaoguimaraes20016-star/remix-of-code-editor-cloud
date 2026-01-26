-- Clear presets from existing team
UPDATE public.teams SET asset_categories = '[]'::jsonb WHERE id = 'e865e81b-ecba-4d9d-98d9-bd0a7367d63c';

-- Change default for new teams to empty array
ALTER TABLE public.teams ALTER COLUMN asset_categories SET DEFAULT '[]'::jsonb;