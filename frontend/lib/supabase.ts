import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://arrbmvbsndztnldqfbyt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ysgYOQMnR_XMtPFlDKi4YA_pdKxfgaY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
