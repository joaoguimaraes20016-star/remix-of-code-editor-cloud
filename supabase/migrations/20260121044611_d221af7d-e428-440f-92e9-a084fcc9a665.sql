-- Create automation_folders table for organizing automations
CREATE TABLE public.automation_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'folder',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_folders ENABLE ROW LEVEL SECURITY;

-- Policies for folder access
CREATE POLICY "Team members can view folders"
ON public.automation_folders
FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team admins can create folders"
ON public.automation_folders
FOR INSERT
WITH CHECK (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can update folders"
ON public.automation_folders
FOR UPDATE
USING (public.is_team_admin(auth.uid(), team_id));

CREATE POLICY "Team admins can delete folders"
ON public.automation_folders
FOR DELETE
USING (public.is_team_admin(auth.uid(), team_id));

-- Create index for faster lookups
CREATE INDEX idx_automation_folders_team_id ON public.automation_folders(team_id);

-- Add trigger for updated_at
CREATE TRIGGER update_automation_folders_updated_at
BEFORE UPDATE ON public.automation_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint from automations.folder_id to automation_folders.id
ALTER TABLE public.automations
ADD CONSTRAINT automations_folder_id_fkey
FOREIGN KEY (folder_id) REFERENCES public.automation_folders(id) ON DELETE SET NULL;