const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elesttjfwfhvzdvldytn.supabase.co';
const supabaseAnonKey = 'sb_publishable_DPfOzwwv2yXK1uvya4RYhQ_uOdKIqn_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- DB CHECK ---');
    const { data: styles } = await supabase.from('styles_metadata').select('id, label, category');
    console.log('Styles Metadata:', styles?.map(s => s.id));

    const { data: prompts } = await supabase.from('identity_prompts').select('id');
    console.log('Identity Prompts IDs:', prompts?.map(p => p.id));
}

check();
