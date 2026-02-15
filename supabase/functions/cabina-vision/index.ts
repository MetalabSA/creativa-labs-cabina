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
        const { user_photo, model_id, aspect_ratio, user_id, email, guest_id } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. LOAD BALANCER (Round Robin) ---
        // Usamos la nueva llave proporcionada por el usuario como principal si no hay pool
        let currentApiKey = Deno.env.get('BANANA_API_KEY') || "724779ed7a7157235c5b854034235257"
        let keyId = null;

        try {
            const { data: poolData, error: poolError } = await supabase
                .from('api_key_pool')
                .select('id, api_key')
                .eq('is_active', true)
                .order('last_used_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (poolData && !poolError) {
                currentApiKey = poolData.api_key;
                keyId = poolData.id;
                console.log(`[BALANCER] Usando llave de pool: ${poolData.id}`);
            } else {
                console.log("[BALANCER] Pool vacío o error, usando llave por defecto.");
            }
        } catch (e) {
            console.error("[BALANCER] Error crítico buscando llave:", e.message);
        }

        // 1. Procesar Foto del Usuario -> Subir a Storage
        let publicPhotoUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                const base64Content = user_photo.split(',')[1];
                const binaryData = decode(base64Content);
                const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png' });
                const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                publicPhotoUrl = publicUrl;
            } catch (e) {
                console.warn("[STORAGE] Falló base64 de usuario");
            }
        }

        // 2. Obtener el Prompt (Desde tabla identity_prompts)
        let masterPrompt = `Professional photo shoot, high resolution, detailed lighting.`;
        try {
            const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
            if (promptData?.master_prompt) {
                masterPrompt = promptData.master_prompt;
            } else {
                // Fallback: tratar de buscar en identities por si se renombró la tabla
                const { data: altData } = await supabase.from('identities').select('master_prompt').eq('id', model_id).maybeSingle();
                if (altData?.master_prompt) masterPrompt = altData.master_prompt;
            }
        } catch (e) {
            console.log("[ENGINE] Error al buscar prompt, usando fallback.");
        }

        console.log(`[ENGINE] Iniciando tarea para: ${model_id} con prompt optimizado.`);

        // 3. Invocar Kie.ai (Task Creation)
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

        if (createResult.code === 402) throw new Error("Saldo insuficiente en Alquimia Engine (Kie.ai).");
        if (createResult.code === 401) throw new Error("Error de autorización: API Key inválida.");
        if (createResult.code !== 200) throw new Error(`Engine Error: ${createResult.msg || createResult.message}`);

        const taskId = createResult.data.taskId;
        console.log(`[ENGINE] Tarea creada: ${taskId}.`);

        // Rotar llave en el pool
        if (keyId) {
            await supabase.from('api_key_pool')
                .update({ last_used_at: new Date().toISOString(), usage_count: 1 })
                .eq('id', keyId);
        }

        // 4. Polling con reintentos exponenciales ligeros (60 intentos x ~3s)
        let kieImageUrl = null;
        let attempts = 0;
        const maxAttempts = 60;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 4000)); // Esperamos 4 segundos por intento

            try {
                const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                    headers: { 'Authorization': `Bearer ${currentApiKey}` }
                });
                const queryData = await queryRes.json();

                if (queryData.code === 200) {
                    const state = queryData.data.state;
                    console.log(`[ENGINE] Tarea ${taskId} - Intento ${attempts + 1}: ${state}`);

                    if (state === 'success') {
                        // Intentamos extraer la URL del resultado
                        try {
                            const resJson = JSON.parse(queryData.data.resultJson);
                            kieImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                        } catch {
                            kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                        }
                        if (kieImageUrl) break;
                    }

                    if (state === 'fail') {
                        throw new Error(`La IA falló al procesar: ${queryData.data.failMsg || 'Error desconocido'}`);
                    }
                }
            } catch (e) {
                console.warn(`[ENGINE] Error en polling intento ${attempts}: ${e.message}`);
                // Si es un error crítico de la IA (state 'fail'), lanzamos el error
                if (e.message.includes("IA falló")) throw e;
            }
            attempts++;
        }

        if (!kieImageUrl) {
            throw new Error("El motor de IA está demorando más de lo habitual. Tu foto aparecerá en tu galería en unos minutos.");
        }

        // 5. Persistir Resultado en Supabase Storage (Clave para evitar CORS y expiración)
        let finalImageUrl = kieImageUrl;
        try {
            const imgRes = await fetch(kieImageUrl);
            if (imgRes.ok) {
                const blob = await imgRes.blob();
                const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                const { error: uploadError } = await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                    finalImageUrl = publicUrl;
                    console.log(`[STORAGE] Imagen persistida: ${finalImageUrl}`);
                }
            }
        } catch (e) {
            console.error("[STORAGE] No se pudo persistir la imagen, usando URL directa.");
        }

        return new Response(JSON.stringify({
            image_url: finalImageUrl,
            success: true,
            taskId: taskId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[CRITICAL] ${error.message}`);
        return new Response(JSON.stringify({
            error: error.message,
            success: false
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})

