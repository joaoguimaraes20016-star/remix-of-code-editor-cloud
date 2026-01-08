import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://kqfyevdblvgxaycdvfxe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZnlldmRibHZneGF5Y2R2ZnhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1ODEzNDUsImV4cCI6MjA4MTE1NzM0NX0.2qw-D1zz7uPumYRqDfFm1ur-0uxqXiBDPH4EWIDH66o";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
