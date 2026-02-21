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
        const { user_photo, model_id, aspect_ratio, user_id, email, phone, guest_id, event_id, action, taskId: existingTaskId } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. LOAD BALANCER (Round Robin) ---
        let currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"
        let keyId = null;

        try {
            const { data: poolData } = await supabase
                .from('api_key_pool')
                .select('id, api_key')
                .eq('is_active', true)
                .order('last_used_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (poolData && poolData.api_key) {
                currentApiKey = poolData.api_key;
                keyId = poolData.id;
                console.log(`[BALANCER] Usando llave de pool: ${poolData.id}`);
            }
        } catch (e) {
            console.error("[BALANCER] Error crítico buscando llave:", e.message);
        }

        // --- ACCIÓN: CHECK (Rescate desde frontend, exactamente como Gastronomia) ---
        if (action === 'check' && existingTaskId) {
            console.log(`[CABINA-CHECK] Consultando tarea de rescate: ${existingTaskId}`);
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200 && queryData.data.state === 'success') {
                try {
                    const resJson = typeof queryData.data.resultJson === 'string' ? JSON.parse(queryData.data.resultJson) : queryData.data.resultJson;
                    const url = resJson?.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;

                    if (url) {
                        return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                    }
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

        // 1. SUBIDA DE FOTO (Protocolo Híbrido Gastronomía/n8n)
        let publicPhotoUrl = user_photo;
        let upDebug = '';

        if (user_photo && user_photo.startsWith('data:image')) {
            // METODO PRIMARIO: Uploader Nativo KIE (Igual que en Gastronomia y tu n8n)
            try {
                console.log("[CABINA] Subiendo foto via KIE.AI Nativo (RedPanda)...");
                const upRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
                    body: JSON.stringify({ base64Data: user_photo, uploadPath: "images/base64", fileName: `cabina_${Date.now()}.png` })
                });

                const upText = await upRes.text();
                try {
                    const upData = JSON.parse(upText);
                    const possibleUrl = upData.data?.url || upData.data?.fileUrl || upData.data?.imageUrl || upData.data?.image_url || upData.data?.link || upData.data?.src || upData.url;

                    let foundUrl = possibleUrl;
                    // Búsqueda exhaustiva de cualquier URL https en la respuesta
                    if (!foundUrl && upData.data && typeof upData.data === 'object') {
                        for (const key of Object.keys(upData.data)) {
                            if (typeof upData.data[key] === 'string' && upData.data[key].startsWith('http')) {
                                foundUrl = upData.data[key]; break;
                            }
                        }
                    }
                    if (!foundUrl && typeof upData.data === 'string' && upData.data.startsWith('http')) {
                        foundUrl = upData.data;
                    }

                    if (upData.code === 200 && foundUrl) {
                        publicPhotoUrl = foundUrl;
                        console.log("[CABINA] ✅ Foto subida a KIE.AI (RedPanda):", publicPhotoUrl);
                    } else {
                        upDebug += `KIE (${upData.code}): ${upData.msg}. `;
                    }
                } catch { upDebug += "KIE Res No-JSON. "; }
            } catch (e) { upDebug += `KIE Ex: ${e.message}. `; }

            // METODO SECUNDARIO: Supabase Storage Fallback (A BUCKET PUBLICO 'user_photos' EXACTO A FUTBOL/GASTRO)
            if (publicPhotoUrl === user_photo) {
                try {
                    console.log("[CABINA] KIE falló, usando Supabase Storage (user_photos)...");
                    const base64Content = user_photo.split(',')[1];
                    const binaryData = decode(base64Content);
                    const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

                    // IMPORTANTE: user_photos bucket ES público y Kie.ai lo puede leer (mismo de Futbol)
                    const { error: upErr } = await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png', upsert: true });

                    if (!upErr) {
                        const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                        publicPhotoUrl = publicUrl;
                        console.log("[CABINA] ✅ Foto subida a user_photos de Supabase:", publicPhotoUrl);
                    } else {
                        upDebug += `SupaErr: ${upErr.message}. `;
                    }
                } catch (e) { upDebug += `SupaEx: ${e.message}. `; }
            }

            // Si ambos fallaron, abortamos.
            if (publicPhotoUrl.startsWith('data:image')) {
                throw new Error(`Kie.ai y Supabase rechazaron la carga. Debug: ${upDebug}`);
            }
        }

        // 2. Prompt Maestro
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        const masterPrompt = promptData?.master_prompt || `Professional portrait photography, studio lighting.`;

        // 3. Crear Tarea en Kie.ai
        console.log(`[CABINA] Creando Tarea. Input URL: ${publicPhotoUrl.substring(0, 50)}...`);
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

        if (createResult.code === 402) throw new Error("Saldo insuficiente en la cuenta de IA.");
        if (createResult.code === 401) throw new Error("Error de credenciales de IA.");
        if (createResult.code !== 200) throw new Error(`Kie.ai Error (${createResult.code}): ${createResult.msg || createResult.message}`);

        const taskId = createResult.data.taskId;
        console.log(`[CABINA] Tarea ${taskId} creada. Polling Inicia...`);

        // Rotar llave (Asincrónico)
        if (keyId) {
            supabase.from('api_key_pool').update({ last_used_at: new Date().toISOString(), usage_count: 1 }).eq('id', keyId).then(() => { });
        }

        // 4. Polling Interno (Espera activa - Modo Largo Gastro)
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
                console.log(`[CABINA] Intento ${attempts + 1}: Estado = ${state}`);

                if (state === 'success') {
                    try {
                        const resJson = typeof queryData.data.resultJson === 'string' ? JSON.parse(queryData.data.resultJson) : queryData.data.resultJson;
                        kieImageUrl = resJson?.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;
                    } catch {
                        kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }
                    break; // Salimos del bucle si ya terminó
                }

                if (state === 'fail') throw new Error(`La IA falló la generación: ${queryData.data.failMsg || 'Cancelada'}`);
            }
            attempts++;
        }

        // Si el polling expiró pero no falló, devolvemos success=true y taskId para que siga App.tsx
        if (!kieImageUrl) {
            console.log("[CABINA] Timeout 180s en Edge Function, pasando posta al frontend.");
            return new Response(JSON.stringify({ success: true, taskId: taskId, state: 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Persistencia (Salvar en Supabase 'generations')
        let finalImageUrl = kieImageUrl;
        try {
            console.log("[CABINA] Persistiendo imagen final en Supabase generations...");
            const imgRes = await fetch(kieImageUrl);
            const blob = await imgRes.blob();
            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('generations')
                .upload(fileName, blob, { contentType: 'image/png' });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                finalImageUrl = publicUrl;
                console.log("[CABINA] Imagen persistida exitosamente:", finalImageUrl);
            }
        } catch (e) {
            console.error("[STORAGE] Error en persistencia, usando URL original de KIE:", e.message);
        }

        // 6. Registro Asincrónico y Notificaciones
        (async () => {
            let userName = 'Usuario';
            try {
                if (user_id) {
                    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user_id).single();
                    if (profile?.full_name) userName = profile.full_name;
                }
            } catch (e) {
                userName = guest_id ? `Guest_${guest_id.slice(-4)}` : 'Usuario';
            }

            await supabase.from('generations').insert({
                user_id: user_id || null,
                model_id: model_id,
                image_url: finalImageUrl,
                aspect_ratio: aspect_ratio,
                event_id: event_id || null
            });

            if (user_id) fetch(`${SB_URL}/functions/v1/push-notification`, { method: 'POST', body: JSON.stringify({ user_id, title: "¡Tu Alquimia está lista!", body: "Entrá ahora para ver tu foto.", url: "https://metalab30.com/cabina/", image: finalImageUrl }) }).catch(() => { });
            if (email) fetch(`${SB_URL}/functions/v1/send-email`, { method: 'POST', body: JSON.stringify({ to: email, subject: "🪄 ¡Tu Alquimia Creativa está lista!", image_url: finalImageUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
            if (phone) fetch(`${SB_URL}/functions/v1/send-whatsapp`, { method: 'POST', body: JSON.stringify({ phone, image_url: finalImageUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
        })();

        return new Response(JSON.stringify({ image_url: finalImageUrl, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[CRITICAL] ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})
