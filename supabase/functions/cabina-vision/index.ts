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
        const { user_photo, model_id, aspect_ratio, user_id, email, guest_id, action, taskId: existingTaskId, event_id } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // API KEY
        const currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"

        // --- ACCIÓN: CHECK ---
        if (action === 'check' && existingTaskId) {
            console.log(`[CHECK] Consultando taskId: ${existingTaskId}`);
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200) {
                const state = queryData.data.state;
                if (state === 'success') {
                    let kieImageUrl = null;
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson);
                        kieImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                    } catch {
                        kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }

                    if (kieImageUrl) {
                        try {
                            const imgRes = await fetch(kieImageUrl);
                            const blob = await imgRes.blob();
                            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                            await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                            const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);

                            await supabase.from('generations').insert({
                                user_id: user_id || null,
                                style_id: model_id,
                                image_url: publicUrl,
                                aspect_ratio: aspect_ratio || "9:16",
                                prompt: "Kie.ai Generated",
                                event_id: event_id || null
                            });

                            return new Response(JSON.stringify({ success: true, state: 'success', image_url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                        } catch (e) {
                            return new Response(JSON.stringify({ success: true, state: 'success', image_url: kieImageUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                        }
                    }
                }
                return new Response(JSON.stringify({ success: true, state: state }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ success: false, error: queryData.msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ACCIÓN: CREATE ---
        console.log(`[CREATE] Iniciando tarea...`);

        // 1. Subir a Kie.ai File Service (Para que ellos tengan la foto en su propio storage)
        let kieNativeUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            console.log("[KIE-UPLOAD] Subiendo base64 a Kie.ai...");
            try {
                // n8n style upload
                const uploadRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentApiKey}`
                    },
                    body: JSON.stringify({
                        base64Data: user_photo,
                        uploadPath: "images/base64",
                        fileName: `${Date.now()}.png`
                    })
                });

                const uploadData = await uploadRes.json();
                if (uploadData.code === 200 || uploadData.success) {
                    kieNativeUrl = uploadData.data?.url || uploadData.url;
                    console.log("[KIE-UPLOAD] URL obtenida:", kieNativeUrl);
                } else {
                    console.error("[KIE-UPLOAD] Falló:", JSON.stringify(uploadData));
                }
            } catch (e) {
                console.error("[KIE-UPLOAD] Excepción:", e.message);
            }
        }

        // 2. Obtener Prompt
        let masterPrompt = "Professional photo shoot.";
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        if (promptData?.master_prompt) masterPrompt = promptData.master_prompt;

        // 3. Crear Tarea
        console.log("[KIE] createTask con URL:", kieNativeUrl?.substring(0, 50));
        const createResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
            body: JSON.stringify({
                model: "nano-banana-pro",
                input: {
                    prompt: masterPrompt,
                    image_input: kieNativeUrl ? [kieNativeUrl] : [],
                    aspect_ratio: aspect_ratio || "9:16",
                    resolution: "2K",
                    output_format: "png"
                }
            })
        });

        const createResult = await createResponse.json();
        if (createResult.code !== 200) {
            return new Response(JSON.stringify({ success: false, error: createResult.msg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({
            success: true,
            taskId: createResult.data.taskId,
            state: 'waiting'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("[CRITICAL]", error.message);
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }
})
