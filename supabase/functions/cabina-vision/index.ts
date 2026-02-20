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
        // Usamos la llave maestra proporcionada por el usuario
        const currentApiKey = "e12c19f419743e747757b4f164d55e87"
        console.log(`[CABINA] Iniciando proceso. API Key: ${currentApiKey.substring(0, 8)}...`);

        // --- ACCIÓN: CHECK (polling de rescate) ---
        if (action === 'check' && existingTaskId) {
            console.log(`[CABINA-CHECK] Consultando tarea: ${existingTaskId}`);
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200 && queryData.data.state === 'success') {
                const resJson = JSON.parse(queryData.data.resultJson || '{}');
                const url = resJson.resultUrls?.[0] || queryData.data.imageUrl || queryData.data.resultUrl;
                return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ success: true, state: queryData.data?.state || 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ACCIÓN: CREATE ---

        // 0.5 DEDUCCIÓN CRÉDITO EVENTO
        if (event_id) {
            const { data: creditOk } = await supabase.rpc('increment_event_credit', { p_event_id: event_id });
            if (!creditOk) throw new Error("🎟️ Créditos del evento agotados.");
        }

        // 1. PROCESAR FOTO (Upload MANDATORIO a Storage para tener URL)
        let publicPhotoUrl = user_photo;

        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                console.log("[CABINA] Subiendo selfie a Supabase Storage...");
                const base64Content = user_photo.split(',')[1];
                const binaryData = decode(base64Content);
                const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

                const { error: uploadError } = await supabase.storage
                    .from('user_photos')
                    .upload(fileName, binaryData, { contentType: 'image/png', upsert: true });

                if (uploadError) throw new Error(`Error Storage: ${uploadError.message}`);

                const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                publicPhotoUrl = publicUrl;
                console.log("[CABINA] ✅ Selfie lista en Storage:", publicPhotoUrl);
            } catch (e) {
                console.error("[CABINA] ❌ Fallo crítico de carga:", e.message);
                throw new Error("No se pudo procesar tu foto. Intenta de nuevo.");
            }
        }

        if (publicPhotoUrl.startsWith('data:image')) {
            throw new Error("Error de sistema: No se generó una URL válida para la IA.");
        }

        // 2. Obtener el Prompt Maestro de identity_prompts
        const { data: promptData } = await supabase
            .from('identity_prompts')
            .select('master_prompt')
            .eq('id', model_id)
            .maybeSingle();

        const masterPrompt = promptData?.master_prompt || "Professional portrait photography, studio lighting, high quality, highly detailed.";
        console.log(`[CABINA] Prompt cargado (${masterPrompt.substring(0, 30)}...) para model_id: ${model_id}`);

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

        // 3.5 Manejo de Errores de Creación
        if (createResult.code === 402) {
            throw new Error("Saldo insuficiente en la cuenta de IA. Por favor recarga Kie.ai.");
        } else if (createResult.code === 401) {
            throw new Error("Error de autenticación con Kie.ai. Revisa las API Keys.");
        } else if (createResult.code !== 200) {
            throw new Error(`Kie.ai Error (${createResult.code}): ${createResult.msg || createResult.message}`);
        }

        const taskId = createResult.data.taskId;
        console.log(`[CABINA] Tarea creada: ${taskId}. Iniciando polling...`);

        // 4. Polling (Espera activa - 60 intentos x 3s = 180s / 3 min)
        let kieImageUrl = null;
        let attempts = 0;
        while (attempts < 60) {
            await new Promise(r => setTimeout(r, 3000));
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();

            if (queryData.code === 200) {
                const state = queryData.data.state; // waiting, success, fail
                console.log(`[CABINA] Intento ${attempts + 1}: Estado = ${state}`);

                if (state === 'success') {
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson);
                        kieImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                    } catch {
                        kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }
                    if (kieImageUrl) {
                        console.log("[CABINA] ¡Éxito! Imagen recibida.");
                        break;
                    }
                }

                if (state === 'fail') {
                    const errorDetail = queryData.data.failMsg || "Error desconocido en el renderizado.";
                    console.error(`[CABINA] Kie.ai falló: ${errorDetail}`);
                    throw new Error(`La IA falló: ${errorDetail}`);
                }
            } else {
                console.warn(`[CABINA] Error en consulta (${queryData.code}): ${queryData.msg}`);
            }
            attempts++;
        }

        if (!kieImageUrl) {
            console.error("[CABINA] Se agotó el tiempo de espera después de 3 minutos.");
            throw new Error("La IA está tardando más de lo normal. Tu foto llegará en unos minutos a tu Galería.");
        }

        // 5. Descargar de Kie.ai y subir a Supabase Storage (persistencia)
        let finalImageUrl = kieImageUrl;
        try {
            console.log("[CABINA] Persistiendo imagen en Supabase...");
            const imgRes = await fetch(kieImageUrl);
            const blob = await imgRes.blob();
            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('generations')
                .upload(fileName, blob, { contentType: 'image/png' });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                finalImageUrl = publicUrl;
                console.log("[CABINA] Imagen persistida:", finalImageUrl);
            }
        } catch (e) {
            console.error("[STORAGE] Error persistiendo imagen, usando URL original:", e.message);
        }

        // 6. Registro Asincrónico en DB + Notificaciones
        edge_registry: {
            // Obtener nombre del usuario
            let userName = 'Usuario';
            try {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user_id).single();
                if (profile?.full_name) userName = profile.full_name;
            } catch (e) {
                userName = guest_id ? `Guest_${guest_id.slice(-4)}` : 'Usuario';
            }

            // Registrar generación en DB (user_id es nullable para invitados de evento)
            supabase.from('generations').insert({
                user_id: user_id || null,
                model_id: model_id,
                image_url: finalImageUrl,
                aspect_ratio: aspect_ratio,
                event_id: event_id || null
            }).then(({ error: insertErr }) => {
                if (insertErr) console.error("[CABINA] Error registro DB:", insertErr.message);
                else console.log("[CABINA] Registro DB OK");
            });

            // Push Notification
            if (user_id) {
                fetch(`${SB_URL}/functions/v1/push-notification`, {
                    method: 'POST',
                    body: JSON.stringify({ user_id, title: "🪄 ¡Tu foto está lista!", body: "Entrá ahora para verla.", url: "https://metalab30.com/cabina/", image: finalImageUrl })
                }).catch(e => console.error("Push Error", e));
            }

            // Email Notification
            if (email) {
                fetch(`${SB_URL}/functions/v1/send-email`, {
                    method: 'POST',
                    body: JSON.stringify({ to: email, subject: "🪄 ¡Tu foto de Creativa Labs está lista!", image_url: finalImageUrl, user_name: userName, model_name: model_id })
                }).catch(e => console.error("Email Error", e));
            }

            // WhatsApp Notification
            if (phone) {
                console.log(`[CABINA] Disparando WhatsApp a ${phone}`);
                fetch(`${SB_URL}/functions/v1/send-whatsapp`, {
                    method: 'POST',
                    body: JSON.stringify({
                        phone,
                        image_url: finalImageUrl,
                        user_name: userName,
                        model_name: model_id
                    })
                }).catch(e => console.error("WhatsApp Error", e));
            }
        }

        return new Response(JSON.stringify({ image_url: finalImageUrl, success: true, taskId: taskId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[CRITICAL] ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})
