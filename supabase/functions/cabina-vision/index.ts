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

        // --- 0. LOAD BALANCER / API KEY ---
        // LLAVE MAESTRA PROPORCIONADA POR EL USUARIO
        const currentApiKey = "e12c19f419743e747757b4f164d55e87"
        console.log(`[CABINA] Accion: ${action || 'create'} | Model: ${model_id}`);

        // --- ACCIÓN: CHECK (Polling de rescate desde el frontend) ---
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

                    // Persistir en Storage si tenemos URL
                    if (url) {
                        (async () => {
                            try {
                                const imgRes = await fetch(url);
                                const blob = await imgRes.blob();
                                const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                                await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                            } catch (e) { console.error("[CHECK-PERSIST] fail", e.message); }
                        })();
                    }

                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                } catch (e) {
                    const url = queryData.data.resultUrl || queryData.data.imageUrl;
                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }
            return new Response(JSON.stringify({ success: true, state: queryData.data?.state || 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ACCIÓN: CREATE ---

        // 0.5 DEDUCCIÓN CRÉDITO EVENTO (Atómico)
        if (event_id) {
            const { data: creditOk } = await supabase.rpc('increment_event_credit', { p_event_id: event_id });
            if (!creditOk) throw new Error("🎟️ Créditos del evento agotados.");
        }

        // 1. PROCESAR FOTO (Upload a KIE.AI Nativo - Estrategia GASTRO)
        let publicPhotoUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                console.log("[CABINA] Subiendo foto via KIE.AI Nativo (RedPanda)...");
                const uploadRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
                    body: JSON.stringify({
                        base64Data: user_photo,
                        uploadPath: "images/base64",
                        fileName: `cabina_${Date.now()}.png`
                    })
                });

                const uploadData = await uploadRes.json();
                const foundUrl = uploadData.data?.url || uploadData.data?.fileUrl || uploadData.data?.imageUrl || uploadData.url;

                if (uploadData.code === 200 && foundUrl) {
                    publicPhotoUrl = foundUrl;
                    console.log("[CABINA] ✅ Foto subida via KIE.AI:", publicPhotoUrl);
                } else {
                    console.warn("[CABINA] Falló upload nativo KIE, intentando Supabase como backup...");
                    // Fallback a Supabase Storage
                    const base64Content = user_photo.split(',')[1];
                    const binaryData = decode(base64Content);
                    const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                    await supabase.storage.from('generations').upload(fileName, binaryData, { contentType: 'image/png', upsert: true });
                    const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                    publicPhotoUrl = publicUrl;
                }
            } catch (e) {
                console.error("[CABINA] Error en upload:", e.message);
                throw new Error("No se pudo procesar tu foto para la IA.");
            }
        }

        // 2. Obtener el Prompt Maestro de identity_prompts
        const { data: promptData } = await supabase
            .from('identity_prompts')
            .select('master_prompt')
            .eq('id', model_id)
            .maybeSingle();

        const masterPrompt = promptData?.master_prompt || "Professional portrait photography, studio lighting, high quality.";
        console.log(`[CABINA] Prompt: ${masterPrompt.substring(0, 30)}...`);

        // 3. Crear Tarea en Kie.ai
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

        if (createResult.code !== 200) {
            throw new Error(`Kie.ai Error (${createResult.code}): ${createResult.msg || createResult.message}`);
        }

        const taskId = createResult.data.taskId;
        console.log(`[CABINA] Tarea creada: ${taskId}.`);

        // 4. Polling Interno (Corto para evitar Timeouts de 60s)
        let kieImageUrl = null;
        let attempts = 0;

        while (attempts < 8) { // ~30 segundos max
            await new Promise(r => setTimeout(r, 4000));
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
                if (state === 'fail') throw new Error(`IA Falló: ${queryData.data.failMsg}`);
            }
            attempts++;
        }

        // 5. Respuesta al Cliente
        if (kieImageUrl) {
            // Persistencia asincrónica
            (async () => {
                let finalUrl = kieImageUrl;
                try {
                    const imgRes = await fetch(kieImageUrl);
                    const blob = await imgRes.blob();
                    const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                    await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
                    const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                    finalUrl = publicUrl;
                } catch (e) { console.error("[PERSIST] fail", e.message); }

                await supabase.from('generations').insert({
                    user_id: user_id || null,
                    model_id: model_id,
                    image_url: finalUrl,
                    aspect_ratio: aspect_ratio,
                    event_id: event_id || null
                });

                // Notificaciones asincrónicas
                const userName = guest_id ? `Guest_${guest_id.slice(-4)}` : 'Usuario';
                if (email) fetch(`${SB_URL}/functions/v1/send-email`, { method: 'POST', body: JSON.stringify({ to: email, subject: "🪄 ¡Tu foto está lista!", image_url: finalUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
                if (phone) fetch(`${SB_URL}/functions/v1/send-whatsapp`, { method: 'POST', body: JSON.stringify({ phone, image_url: finalUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
            })();

            return new Response(JSON.stringify({ success: true, image_url: kieImageUrl, taskId: taskId, state: 'success' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Si no terminó a tiempo, el frontend seguirá con el polling
        return new Response(JSON.stringify({ success: true, taskId: taskId, state: 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[CRITICAL] ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})
