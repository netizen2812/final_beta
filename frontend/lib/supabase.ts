
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://arrbmvbsndztnldqfbyt.supabase.co';
const supabaseAnonKey = 'sb_publishable_ysgYOQMnR_XMtPFlDKi4YA_pdKxfgaY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
