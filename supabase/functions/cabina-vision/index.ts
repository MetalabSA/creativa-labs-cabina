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
        const { user_photo, model_id, aspect_ratio, user_id, email, guest_id, action, taskId: existingTaskId, event_id } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. LOAD BALANCER ---
        let currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"

        // --- ACCIÓN: CHECK (Consultar estado) ---
        if (action === 'check' && existingTaskId) {
            try {
                const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                    headers: { 'Authorization': `Bearer ${currentApiKey}` }
                });

                if (!queryRes.ok) throw new Error(`Error en Kie.ai API (${queryRes.status})`);

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

                            // Registrar en DB
                            await supabase.from('generations').insert({
                                user_id: user_id || null,
                                style_id: model_id,
                                image_url: publicUrl,
                                aspect_ratio: aspect_ratio || "9:16",
                                prompt: "Kie.ai Generated",
                                event_id: event_id || null
                            });

                            return new Response(JSON.stringify({ success: true, state: 'success', image_url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                        }
                    }

                    return new Response(JSON.stringify({ success: true, state: state }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
                throw new Error(queryData.msg || "Error consultando estado en Kie.ai");
            } catch (err) {
                console.error("Error en polling check:", err.message);
                throw err;
            }
        }

        // --- ACCIÓN: CREATE (Modo por defecto) ---
        // 1. Procesar Foto -> Storage
        let publicPhotoUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                const base64Content = user_photo.split(',')[1];
                const binaryData = decode(base64Content);
                const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

                const { error: uploadError } = await supabase.storage.from('user_photos').upload(fileName, binaryData, {
                    contentType: 'image/png',
                    upsert: true
                });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                    publicPhotoUrl = publicUrl;
                    console.log("[STORAGE] Foto subida:", publicPhotoUrl);
                } else {
                    console.warn("[STORAGE] Error subiendo (usando base64):", uploadError.message);
                }
            } catch (err) {
                console.warn("[STORAGE] Excepción en upload:", err.message);
            }
        }

        // 2. Obtener Prompt
        let masterPrompt = "Professional photo shoot.";
        const { data: promptData, error: promptError } = await supabase
            .from('identity_prompts')
            .select('master_prompt')
            .eq('id', model_id)
            .maybeSingle();

        if (promptError) console.error("Error buscando prompt:", promptError);
        if (promptData?.master_prompt) masterPrompt = promptData.master_prompt;

        console.log("Iniciando tarea para modelo:", model_id);

        // 3. Crear Tarea en Kie.ai
        const createResponse = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentApiKey}`
            },
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

        if (createResult.code !== 200) {
            console.error("Error Kie.ai:", createResult);
            throw new Error(`IA Error (${createResult.code}): ${createResult.msg || 'Error creando tarea'}`);
        }

        const taskId = createResult.data.taskId;
        console.log("[ALQUIMISTA] Tarea creada:", taskId);

        // --- 4. Polling Interno (Modo Resiliente) ---
        // Esperamos un poco antes de responder, para intentar dar la imagen de una vez
        let attempts = 0;
        let finalImageUrl = null;

        while (attempts < 20) { // Hasta 80 segundos (4s * 20)
            await new Promise(r => setTimeout(r, 4000));
            attempts++;

            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200) {
                const state = queryData.data.state;
                if (state === 'success') {
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson);
                        finalImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                    } catch {
                        finalImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }
                    console.log("[ALQUIMISTA] Imagen lista en intento", attempts);
                    break;
                }
                if (state === 'fail') throw new Error("La IA falló al procesar.");
            }
        }

        if (!finalImageUrl) {
            // Si agota el tiempo, el front seguirá con su propio polling
            return new Response(JSON.stringify({
                success: true,
                taskId: taskId,
                state: 'waiting',
                message: "Tarea en proceso (polling activo)"
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- 5. Persistencia y Registro ---
        try {
            const imgRes = await fetch(finalImageUrl);
            const blob = await imgRes.blob();
            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
            await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
            const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
            finalImageUrl = publicUrl;
        } catch (e) {
            console.warn("[STORAGE] Error persistiendo resultado final.");
        }

        await supabase.from('generations').insert({
            user_id: user_id || null,
            style_id: model_id,
            image_url: finalImageUrl,
            aspect_ratio: aspect_ratio || "9:16",
            prompt: masterPrompt.substring(0, 500),
            event_id: event_id || null
        });

        return new Response(JSON.stringify({
            success: true,
            state: 'success',
            image_url: finalImageUrl,
            taskId: taskId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error("CRITICAL ERROR:", error.message);
        return new Response(JSON.stringify({
            error: error.message,
            success: false
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

})


