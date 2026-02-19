import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elesttjfwfhvzdvldytn.supabase.co';
const supabaseAnonKey = 'sb_publishable_DPfOzwwv2yXK1uvya4RYhQ_uOdKIqn_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
