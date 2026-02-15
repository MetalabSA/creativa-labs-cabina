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
        const { user_photo, model_id, aspect_ratio, user_id, email, guest_id, event_id } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // API KEY
        const currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"

        console.log(`[ALQUIMISTA] Inicio de proceso para modelo: ${model_id}`);

        // --- PASO 1: SUBIR A KIE.AI NATIVE STORAGE ---
        // (Como sugirió el USER basado en su nodo de n8n)
        let kieNativeUrl = null;
        if (user_photo && user_photo.startsWith('data:image')) {
            console.log("[KIE-UPLOAD] Subiendo base64 a Kie Service Nativo...");
            try {
                const uploadRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentApiKey}`
                    },
                    body: JSON.stringify({
                        base64Data: user_photo,
                        uploadPath: "images/base64",
                        fileName: `cabina_${Date.now()}.png`
                    })
                });

                const uploadData = await uploadRes.json();
                if (uploadData.code === 200 || uploadData.success) {
                    kieNativeUrl = uploadData.data?.url || uploadData.url;
                    console.log("[KIE-UPLOAD] Éxito. URL de Kie:", kieNativeUrl);
                } else {
                    console.error("[KIE-UPLOAD] Falló carga nativa de Kie:", JSON.stringify(uploadData));
                }
            } catch (e) {
                console.error("[KIE-UPLOAD] Error en subida Kie:", e.message);
            }
        }

        // Si falló la subida nativa, probamos pasarle la URL de Supabase como fallback
        // o directamente el user_photo si ya era una URL.
        if (!kieNativeUrl) {
            kieNativeUrl = user_photo;
        }

        // --- PASO 2: OBTENER PROMPT ---
        let masterPrompt = "Professional photo shoot.";
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        if (promptData?.master_prompt) masterPrompt = promptData.master_prompt;

        // --- PASO 3: CREAR TAREA (KIE.AI) ---
        console.log("[KIE] Creando tarea en createTask...");
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
            throw new Error(`Kie.ai Error: ${createResult.msg}`);
        }

        const taskId = createResult.data.taskId;
        console.log(`[KIE] Tarea creada: ${taskId}. Iniciando Polling Interno (Modo Futbol)...`);

        // --- PASO 4: POLLING INTERNO (Como Fútbol lo resuelve) ---
        let finalKieUrl = null;
        let attempts = 0;
        const maxAttempts = 18; // 18 x 3s = 54s (Cerca del timeout de 60s de Supabase)

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 3000));
            attempts++;

            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200) {
                const state = queryData.data.state;
                console.log(`[POLLING] Intento ${attempts}: Estado = ${state}`);

                if (state === 'success') {
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson);
                        finalKieUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                    } catch {
                        finalKieUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }
                    if (finalKieUrl) break;
                }
                if (state === 'fail') {
                    throw new Error(`Kie.ai falló: ${queryData.data.failMsg || 'Error desconocido'}`);
                }
            }
        }

        // Si terminó el polling exitosamente o por tiempo
        if (finalKieUrl) {
            // --- PASO 5: PERSISTENCIA Y REGISTRO ---
            try {
                const imgRes = await fetch(finalKieUrl);
                const blob = await imgRes.blob();
                const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);

                await supabase.from('generations').insert({
                    user_id: user_id || null,
                    style_id: model_id,
                    image_url: publicUrl,
                    aspect_ratio: aspect_ratio || "9:16",
                    prompt: masterPrompt.substring(0, 500),
                    event_id: event_id || null
                });

                return new Response(JSON.stringify({ success: true, image_url: publicUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (e) {
                console.warn("[STORAGE] Error persistiendo, devolviendo URL directa.");
                return new Response(JSON.stringify({ success: true, image_url: finalKieUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        } else {
            // Si agota el tiempo de polling pero la tarea sigue viva
            return new Response(JSON.stringify({
                success: true,
                taskId: taskId,
                message: "La IA sigue trabajando, ver galería pronto."
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error("[CRITICAL]", error.message);
        return new Response(JSON.stringify({ error: error.message, success: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });
    }
})
