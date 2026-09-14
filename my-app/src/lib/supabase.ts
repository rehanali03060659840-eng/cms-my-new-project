import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_STORAGE_BUCKETS = {
  ANIME_COVERS: 'anime-covers',
  ANIME_VIDEOS: 'anime-videos',
} as const;

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@aniverse.com';
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';