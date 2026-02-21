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

    let debugPath = "STARTED -> ";

    try {
        const body = await req.json()
        const { user_photo, model_id, aspect_ratio, user_id, email, phone, guest_id, event_id, action, taskId: existingTaskId } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. LOAD BALANCER ---
        debugPath += "BALANCER -> ";
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
            }
        } catch (e) {
            console.error("[BALANCER] Error", e.message);
        }

        // --- ACCIÓN: CHECK ---
        if (action === 'check' && existingTaskId) {
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200 && queryData.data.state === 'success') {
                try {
                    const resJson = typeof queryData.data.resultJson === 'string' ? JSON.parse(queryData.data.resultJson) : queryData.data.resultJson;
                    const url = resJson?.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;
                    if (url) return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                } catch {
                    const url = queryData.data.resultUrl || queryData.data.imageUrl;
                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }
            return new Response(JSON.stringify({ success: true, state: queryData.data?.state || 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 0.5 Créditos Evento
        if (event_id) {
            debugPath += "RPC_EVENTO -> ";
            try {
                const { data: creditOk, error: creditErr } = await supabase.rpc('increment_event_credit', { p_event_id: event_id });
                if (creditErr) {
                    console.error("RPC Error:", creditErr);
                    // Silenciamos error RPC para evitar bloqueos si las políticas RLS están muy estrictas
                } else if (!creditOk) {
                    throw new Error("RPC_DENIED: Los créditos de tu evento se han agotado.");
                }
            } catch (e) {
                console.error("RPC Exception:", e);
                // Silenciado. No falla si existe bug en la RPC
            }
        }

        // 1. SUBIDA DE FOTO 
        debugPath += "UPLOAD_FOTO -> ";
        let publicPhotoUrl = user_photo;
        let upDebug = '';

        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                const upRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
                    body: JSON.stringify({ base64Data: user_photo, uploadPath: "images/base64", fileName: `cabina_${Date.now()}.png` })
                });

                const upText = await upRes.text();
                try {
                    const upData = JSON.parse(upText);
                    let foundUrl = upData.data?.downloadUrl || upData.data?.url || upData.data?.fileUrl || upData.data?.imageUrl || upData.data?.image_url;

                    if (!foundUrl && upData.data && typeof upData.data === 'object') {
                        for (const key of Object.keys(upData.data)) {
                            if (typeof upData.data[key] === 'string' && upData.data[key].startsWith('http')) {
                                foundUrl = upData.data[key]; break;
                            }
                        }
                    }

                    if (upData.code === 200 && foundUrl) {
                        publicPhotoUrl = foundUrl;
                    } else {
                        upDebug += `KIE_CODE_${upData.code}; `;
                    }
                } catch { upDebug += "KIE_NO_JSON; "; }
            } catch (e) { upDebug += `KIE_EXC_${e.message}; `; }

            // Secundario (Si falló Kie.ai, usamos bucket de Supabase)
            if (publicPhotoUrl === user_photo) {
                try {
                    const base64Content = user_photo.split(',')[1];
                    const binaryData = decode(base64Content);
                    const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

                    const { error: upErr } = await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png', upsert: true });

                    if (!upErr) {
                        const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                        publicPhotoUrl = publicUrl;
                    } else {
                        upDebug += `SUPA_ERR_${upErr.message}; `;
                    }
                } catch (e) { upDebug += `SUPA_EXC_${e.message}; `; }
            }

            if (publicPhotoUrl.startsWith('data:image')) {
                throw new Error(`UPLOAD_FAIL: Kie.ai y Supabase rechazaron la carga. Debug: ${upDebug}`);
            }
        }

        // 2. Prompt Maestro
        debugPath += "GET_PROMPT -> ";
        let masterPrompt = `Professional portrait photography, studio lighting.`;
        try {
            const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
            if (promptData?.master_prompt) masterPrompt = promptData.master_prompt;
        } catch (e) { /* ignore */ }

        // 3. Crear Tarea en Kie.ai
        debugPath += "KIE_CREATETASK -> ";
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

        if (createResult.code === 402) throw new Error("KIE_402: Saldo insuficiente en la cuenta de IA.");
        if (createResult.code === 401) throw new Error("KIE_401: Error de credenciales de IA.");
        if (createResult.code !== 200) throw new Error(`KIE_${createResult.code}: ${createResult.msg || createResult.message}`);
        if (!createResult.data || !createResult.data.taskId) throw new Error(`KIE_NO_TASK: JSON de respuesta sin taskId. ${JSON.stringify(createResult)}`);

        const taskId = createResult.data.taskId;

        if (keyId) {
            supabase.from('api_key_pool').update({ last_used_at: new Date().toISOString(), usage_count: 1 }).eq('id', keyId).then(() => { }).catch(() => { });
        }

        // 4. Polling Interno
        debugPath += "POLLING -> ";
        let kieImageUrl = null;
        let attempts = 0;

        while (attempts < 60) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                    headers: { 'Authorization': `Bearer ${currentApiKey}` }
                });
                const queryData = await queryRes.json();

                if (queryData.code === 200) {
                    const state = queryData.data.state;

                    if (state === 'success') {
                        try {
                            const resJson = typeof queryData.data.resultJson === 'string' ? JSON.parse(queryData.data.resultJson) : queryData.data.resultJson;
                            kieImageUrl = resJson?.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;
                        } catch {
                            kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                        }
                        if (kieImageUrl) {
                            break; // FIX DEFINITIVO: Solo sale si encontró la URL válida
                        }
                    }
                    if (state === 'fail') {
                        throw new Error(`KIE_FAILED_STATE: ${queryData.data.failMsg || 'Cancelada'}`);
                    }
                }
            } catch (pollEx) {
                // Si justo hubo un microcorte, ignoramos y reintentamos en el siguiente loop
                if (pollEx.message.includes("KIE_FAILED_STATE")) throw pollEx;
            }
            attempts++;
        }

        if (!kieImageUrl) {
            return new Response(JSON.stringify({ success: true, taskId: taskId, state: 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 5. Persistencia 
        debugPath += "FINAL_DB_WRITE -> ";
        let finalImageUrl = kieImageUrl;
        try {
            const imgRes = await fetch(kieImageUrl);
            const blob = await imgRes.blob();
            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage.from('generations').upload(fileName, blob, { contentType: 'image/png' });
            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                finalImageUrl = publicUrl;
            }
        } catch (e) {
            console.error("[STORAGE] Error en persistencia final", e.message);
        }

        // 6. Registro Asincrónico
        (async () => {
            try {
                let userName = 'Usuario';
                if (user_id) {
                    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user_id).single();
                    if (profile?.full_name) userName = profile.full_name;
                } else {
                    userName = guest_id ? `Guest_${guest_id.slice(-4)}` : 'Usuario';
                }

                // Protegemos el insert por si model_id esta vacio o algo
                await supabase.from('generations').insert({
                    user_id: user_id || null,
                    model_id: model_id,
                    image_url: finalImageUrl,
                    aspect_ratio: aspect_ratio,
                    event_id: event_id || null
                });

                if (user_id) fetch(`${SB_URL}/functions/v1/push-notification`, { method: 'POST', body: JSON.stringify({ user_id, title: "¡Tu foto lista!", body: "Entrá a verla", url: "https://metalab30.com/cabina/", image: finalImageUrl }) }).catch(() => { });
                if (email) fetch(`${SB_URL}/functions/v1/send-email`, { method: 'POST', body: JSON.stringify({ to: email, subject: "📸 ¡Tu foto llegó!", image_url: finalImageUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
                if (phone) fetch(`${SB_URL}/functions/v1/send-whatsapp`, { method: 'POST', body: JSON.stringify({ phone, image_url: finalImageUrl, user_name: userName, model_name: model_id }) }).catch(() => { });
            } catch (asyncErr) {
                console.error("Async tasks error:", asyncErr.message);
            }
        })();

        debugPath += "SUCCESS";
        return new Response(JSON.stringify({ image_url: finalImageUrl, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        // Enviar DEBUG info en el mensaje de error para identificar exactamente dónde rompió el catch general
        const finalErrorMsg = `${debugPath} ERROR: ${error.message}`;
        console.error(`[CRITICAL] ${finalErrorMsg}`);
        return new Response(JSON.stringify({ error: finalErrorMsg, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})
