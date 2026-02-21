import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Test RPC
  console.log("Testeando RPC increment_event_credit con null event id...");
  let { data, error } = await supabase.rpc('increment_event_credit', { p_event_id: '123' });
  console.log("RPC result:", { data, error: error?.message });

  // Test KIE api key 
  console.log("Testing Kie.ai with hardcoded key");
  const upRes = await fetch("https://api.kie.ai/api/v1/user/account", {
        method: 'GET',
        headers: { 'Authorization': `Bearer e12c19f419743e747757b4f164d55e87` }
  });
  console.log("Kie AI status:", upRes.status);
  const json = await upRes.json();
  console.log("Kie ai balance", json);
}
run();
