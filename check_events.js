import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elesttjfwfhvzdvldytn.supabase.co';
const supabaseAnonKey = 'sb_publishable_DPfOzwwv2yXK1uvya4RYhQ_uOdKIqn_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const { data, error } = await supabase.from('events').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns:', Object.keys(data[0] || {}));
    }
}

check();
