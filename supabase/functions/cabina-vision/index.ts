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
        const { user_photo, model_id, aspect_ratio, user_id, email, phone, guest_id, action, taskId: existingTaskId, event_id } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. API KEY (MASTER KEY ALWAY FIRST AS FALLBACK) ---
        const MASTER_KEY = "e12c19f419743e747757b4f164d55e87"
        let currentApiKey = MASTER_KEY
        let keyId = null;

        try {
            const { data: poolData, error: poolError } = await supabase
                .from('api_key_pool')
                .select('id, api_key')
                .eq('is_active', true)
                .order('last_used_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (poolData && !poolError && poolData.api_key) {
                currentApiKey = poolData.api_key;
                keyId = poolData.id;
                console.log(`[CABINA] Usando llave de pool: ${poolData.id}`);
            } else {
                console.log("[CABINA] Usando llave maestra (pool vacío o inválido)");
            }
        } catch (e) {
            console.warn("[BALANCER] Error pool, usando maestra");
        }

        // --- ACCIÓN: CHECK ---
        if (action === 'check' && existingTaskId) {
            console.log(`[CABINA-CHECK] Consultando tarea: ${existingTaskId}`);
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200 && queryData.data.state === 'success') {
                try {
                    const resJson = JSON.parse(queryData.data.resultJson || '{}');
                    const url = resJson.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;

                    if (url) {
                        // Persistencia asincrónica
                        (async () => {
                            try {
                                const imgRes = await fetch(url);
                                const blob = await imgRes.blob();
                                const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                                await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                            } catch (e) { console.error("[CHECK-PERSIST] fail"); }
                        })();
                    }

                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                } catch {
                    const url = queryData.data.resultUrl || queryData.data.imageUrl;
                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }
            return new Response(JSON.stringify({ success: true, state: queryData.data?.state || 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ACCIÓN: CREATE ---

        // 0.5 Créditos Evento
        if (event_id) {
            const { data: creditOk } = await supabase.rpc('increment_event_credit', { p_event_id: event_id });
            if (!creditOk) throw new Error("🎟️ Créditos del evento agotados.");
        }

        // 1. UPLOAD A KIE NATIVO (REDPANDA - PATRÓN GASTRO)
        let publicPhotoUrl = user_photo;
        let upDebug = '';

        if (user_photo && user_photo.startsWith('data:image')) {
            console.log(`[CABINA] Iniciando upload nativo. Longitud: ${user_photo.length}`);
            try {
                const upRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
                    body: JSON.stringify({ base64Data: user_photo, uploadPath: "images/base64", fileName: `cabina_${Date.now()}.png` })
                });

                const upText = await upRes.text();
                try {
                    const upData = JSON.parse(upText);
                    const foundUrl = upData.data?.url || upData.data?.fileUrl || upData.data?.imageUrl || upData.data?.image_url || upData.data?.link || upData.data?.src || upData.url;

                    if (upData.code === 200 && foundUrl) {
                        publicPhotoUrl = foundUrl;
                        console.log("[CABINA] ✅ Upload KIE OK:", publicPhotoUrl);
                    } else {
                        upDebug += `KIE_CODE_${upData.code}_MSG_${upData.msg}. `;
                    }
                } catch { upDebug += "KIE_NON_JSON. "; }
            } catch (e) { upDebug += `KIE_EX_${e.message}. `; }

            // Fallback: Supabase Storage
            if (publicPhotoUrl === user_photo) {
                try {
                    console.log("[CABINA] Fallback a Supabase Storage...");
                    const base64Content = user_photo.split(',')[1];
                    const binaryData = decode(base64Content);
                    const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                    const { error: upErr } = await supabase.storage.from('generations').upload(fileName, binaryData, { contentType: 'image/png', upsert: true });
                    if (!upErr) {
                        const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                        publicPhotoUrl = publicUrl;
                        console.log("[CABINA] ✅ Upload Supabase OK:", publicPhotoUrl);
                    } else upDebug += `SUPA_ERR_${upErr.message}. `;
                } catch (e) { upDebug += `SUPA_EX_${e.message}. `; }
            }

            if (publicPhotoUrl.startsWith('data:image')) {
                throw new Error(`Incapaz de subir imagen a la IA. Errores: ${upDebug}`);
            }
        }

        // 2. Prompt Maestro
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        const masterPrompt = promptData?.master_prompt || "Professional portrait photography, studio lighting.";
        console.log(`[CABINA] Prompt: ${masterPrompt.substring(0, 30)}...`);

        // 3. Crear Tarea
        console.log("[CABINA] Creando tarea en Kie.ai...");
        const createRes = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
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

        const createResult = await createRes.json();
        if (createResult.code !== 200) {
            throw new Error(`Kie.ai Error (${createResult.code}): ${createResult.msg || createResult.message}`);
        }

        const taskId = createResult.data.taskId;
        console.log(`[CABINA] Tarea ${taskId} creada con éxito.`);

        // Rotar llave (Asincrónico)
        if (keyId) {
            supabase.from('api_key_pool').update({ last_used_at: new Date().toISOString(), usage_count: 1 }).eq('id', keyId).then(() => { });
        }

        // 4. Polling (Espera activa - Modo Largo Gastro)
        let kieImageUrl = null;
        let attempts = 0;
        while (attempts < 60) {
            await new Promise(r => setTimeout(r, 3000));
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();
            if (queryData.code === 200) {
                const state = queryData.data.state;
                if (state === 'success') {
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson || '{}');
                        kieImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;
                    } catch { kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl; }
                    break;
                }
                if (state === 'fail') throw new Error(`La IA falló: ${queryData.data.failMsg}`);
            }
            attempts++;
        }

        if (!kieImageUrl) {
            // No tiramos error, retornamos el taskId para que el frontend siga.
            return new Response(JSON.stringify({ success: true, taskId: taskId, state: 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Persistencia
        let finalImageUrl = kieImageUrl;
        try {
            const imgRes = await fetch(kieImageUrl);
            const blob = await imgRes.blob();
            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
            const { error: stErr } = await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
            if (!stErr) {
                const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                finalImageUrl = publicUrl;
            }
        } catch (e) { console.warn("[STORAGE] Error persistencia final"); }

        // 6. Registro + Notificaciones (Asincrónico)
        (async () => {
            await supabase.from('generations').insert({
                user_id: user_id || null,
                model_id: model_id,
                image_url: finalImageUrl,
                aspect_ratio: aspect_ratio,
                event_id: event_id || null
            });

            const userName = guest_id ? `Guest_${guest_id.slice(-4)}` : 'Usuario';
            if (email) fetch(`${SB_URL}/functions/v1/send-email`, { method: 'POST', body: JSON.stringify({ to: email, subject: "🪄 ¡Tu foto está lista!", image_url: finalImageUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
            if (phone) fetch(`${SB_URL}/functions/v1/send-whatsapp`, { method: 'POST', body: JSON.stringify({ phone, image_url: finalImageUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
        })();

        return new Response(JSON.stringify({ success: true, image_url: finalImageUrl, taskId: taskId, state: 'success' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[CRITICAL] ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})
