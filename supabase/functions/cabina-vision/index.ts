import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

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
                            // Persistimos resultado
                            const imgRes = await fetch(kieImageUrl);
                            const blob = await imgRes.blob();
                            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                            await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                            const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);

                            // Registro en DB
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
                            console.error("[STORAGE] Error persistiendo resultado:", e.message);
                            // Si falla la persistencia, devolvemos la URL de Kie directamente como emergencia
                            return new Response(JSON.stringify({ success: true, state: 'success', image_url: kieImageUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                        }
                    }
                }
                return new Response(JSON.stringify({ success: true, state: state }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            throw new Error(`Kie.ai Status Error: ${queryData.msg}`);
        }

        // --- ACCIÓN: CREATE ---
        console.log(`[CREATE] Iniciando tarea para modelo: ${model_id}`);

        // 1. Storage (Solo si es Base64, si es URL la pasamos directo)
        let publicPhotoUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                console.log("[STORAGE] Procesando Base64...");
                const base64Content = user_photo.split(',')[1];
                const binaryData = decode(base64Content);
                const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png' });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                    publicPhotoUrl = publicUrl;
                } else {
                    console.error("[STORAGE] Error upload:", uploadError.message);
                }
            } catch (e) {
                console.warn("[STORAGE] Error subiendo foto, se enviará Base64 a Kie (puede fallar)");
            }
        }

        // 2. Prompt
        let masterPrompt = "Professional photo shoot.";
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        if (promptData?.master_prompt) masterPrompt = promptData.master_prompt;

        // 3. Kie.ai Request
        console.log(`[KIE] Requesting taskId for model nano-banana-pro...`);
        const createResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
            body: JSON.stringify({
                model: "nano-banana-pro",
                input: {
                    prompt: masterPrompt,
                    image_input: [publicPhotoUrl],
                    aspect_ratio: aspect_ratio || "9:16",
                    resolution: "2K",
                    output_format: "png"
                }
            })
        });

        if (!createResponse.ok) {
            const errText = await createResponse.text();
            console.error("[KIE] HTTP Error:", createResponse.status, errText);
            throw new Error(`Kie.ai API HTTP Error: ${createResponse.status}`);
        }

        const createResult = await createResponse.json();
        console.log("[KIE] Create result:", JSON.stringify(createResult));

        if (createResult.code !== 200) {
            throw new Error(`Kie.ai App Error: ${createResult.msg || 'Fallo al crear tarea'}`);
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
