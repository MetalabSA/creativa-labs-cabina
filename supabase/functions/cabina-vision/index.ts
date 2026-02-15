import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { user_photo, model_id, aspect_ratio, user_id, email, guest_id, action, taskId: existingTaskId } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. LOAD BALANCER ---
        let currentApiKey = Deno.env.get('BANANA_API_KEY') || "724779ed7a7157235c5b854034235257"

        // --- ACCIÓN: CHECK (Consultar estado) ---
        if (action === 'check' && existingTaskId) {
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200) {
                const state = queryData.data.state; // waiting, success, fail

                if (state === 'success') {
                    let kieImageUrl = null;
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson);
                        kieImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                    } catch {
                        kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }

                    if (kieImageUrl) {
                        // Persistir en Storage
                        const imgRes = await fetch(kieImageUrl);
                        const blob = await imgRes.blob();
                        const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                        await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                        const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);

                        // Registrar en DB (si no existe ya)
                        await supabase.from('generations').insert({
                            user_id: user_id || null,
                            style_id: model_id,
                            image_url: publicUrl,
                            aspect_ratio: aspect_ratio || "9:16",
                            prompt: "Kie.ai Generated"
                        });

                        return new Response(JSON.stringify({ success: true, state: 'success', image_url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    }
                }

                return new Response(JSON.stringify({ success: true, state: state }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            throw new Error("Error consultando estado en Kie.ai");
        }

        // --- ACCIÓN: CREATE (Modo por defecto) ---
        // 1. Procesar Foto -> Storage
        let publicPhotoUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            const base64Content = user_photo.split(',')[1];
            const binaryData = decode(base64Content);
            const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
            await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png' });
            const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
            publicPhotoUrl = publicUrl;
        }

        // 2. Obtener Prompt
        let masterPrompt = "Professional photo shoot.";
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        if (promptData?.master_prompt) masterPrompt = promptData.master_prompt;

        // 3. Crear Tarea
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

        const createResult = await createResponse.json();
        if (createResult.code !== 200) throw new Error(createResult.msg || "Error creando tarea");

        return new Response(JSON.stringify({
            success: true,
            taskId: createResult.data.taskId,
            message: "Tarea iniciada correctamente"
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})


