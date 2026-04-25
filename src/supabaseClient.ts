import { createClient } from '@supabase/supabase-js';

// ─── PASTE YOUR VALUES HERE ───────────────────────────────────────────────────
const SUPABASE_URL  = 'https://dqfozkplkdfnudokdklr.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZm96a3Bsa2RmbnVkb2tka2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjEwMTEsImV4cCI6MjA5MjMzNzAxMX0.ACAo-hcH2bZAIVYmmhe9xEkpeYglrS70LgF88-t_3QU';
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
