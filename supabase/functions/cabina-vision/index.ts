import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const body = await req.json()
        const { user_photo, model_id, aspect_ratio, user_id, email, guest_id, action, taskId: existingTaskId } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)
        const currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"

        // --- ACCIÓN: CHECK ---
        if (action === 'check' && existingTaskId) {
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();
            if (queryData.code === 200 && queryData.data.state === 'success') {
                const resJson = JSON.parse(queryData.data.resultJson);
                const url = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ success: true, state: queryData.data?.state || 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ACCIÓN: CREATE ---
        // 1. Carga nativa a Kie
        let kieNativeUrl = user_photo;
        if (user_photo?.startsWith('data:image')) {
            const uploadRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
                body: JSON.stringify({ base64Data: user_photo, uploadPath: "images/base64", fileName: `cabina_${Date.now()}.png` })
            });
            const uploadData = await uploadRes.json();
            if (uploadData.code === 200) kieNativeUrl = uploadData.data?.url;
        }

        // 2. Prompt
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        const masterPrompt = promptData?.master_prompt || "Professional portrait.";

        // 3. Crear Tarea
        const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
            body: JSON.stringify({
                model: "nano-banana-pro",
                input: { prompt: masterPrompt, image_input: [kieNativeUrl], aspect_ratio: aspect_ratio || "9:16", resolution: "2K" }
            })
        });
        const createResult = await createRes.json();
        if (createResult.code !== 200) throw new Error(createResult.msg);
        const taskId = createResult.data.taskId;

        // 4. Polling Interno (Mantenemos la conexión viva hasta 50s)
        let finalUrl = null;
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 3000));
            const cRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, { headers: { 'Authorization': `Bearer ${currentApiKey}` } });
            const cData = await cRes.json();
            if (cData.code === 200 && cData.data.state === 'success') {
                const rJson = JSON.parse(cData.data.resultJson);
                finalUrl = rJson.resultUrls?.[0] || cData.data.imageUrl;
                break;
            }
        }

        return new Response(JSON.stringify({ success: true, image_url: finalUrl, taskId: taskId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ success: false, error: e.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
})
