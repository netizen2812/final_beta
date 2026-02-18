
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

const supabaseUrl = 'https://arrbmvbsndztnldqfbyt.supabase.co';
const supabaseAnonKey = 'sb_publishable_ysgYOQMnR_XMtPFlDKi4YA_pdKxfgaY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
