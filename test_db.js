import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const currentApiKey = "e12c19f419743e747757b4f164d55e87";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testeando crear tarea con KIE");
  const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
        body: JSON.stringify({
            model: "nano-banana-pro",
            input: {
                prompt: "A beautiful scenery",
                image_input: ["https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"],
                aspect_ratio: "9:16",
                resolution: "2K",
                output_format: "png"
            }
        })
    });
  console.log("Resp KIe status:", createRes.status);
  const data = await createRes.json();
  console.log("Data Kie:", data);
}
run();
