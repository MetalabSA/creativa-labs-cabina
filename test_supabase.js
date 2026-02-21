import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('generations').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(error ? error : data);
}
run();
