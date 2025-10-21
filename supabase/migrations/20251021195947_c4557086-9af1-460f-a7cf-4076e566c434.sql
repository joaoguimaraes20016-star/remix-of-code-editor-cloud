-- Enable realtime for team_members table so Dashboard can react to membership changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;