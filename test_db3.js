import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
// Using ANON key here, so RPC increment_event_credit might fail!

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Simulando llamada a la capa de base de datos desde Edge (como usuario anónimo)...");
  
  let { data, error } = await supabase.rpc('increment_event_credit', { p_event_id: '123' });
  console.log("RPC result:", { data, error: error?.message });
}

run();
