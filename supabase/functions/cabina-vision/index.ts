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
        const { user_photo, model_id, aspect_ratio, user_id, email, phone, guest_id, event_id } = body

        const SB_URL = Deno.env.get('SUPABASE_URL') || ""
        const SB_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
        const supabase = createClient(SB_URL, SB_SERVICE_ROLE_KEY)

        // --- 0. LOAD BALANCER (Round Robin) ---
        let currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"
        let keyId = null;

        try {
            // Buscamos la llave activa que haga más tiempo no se usa (Round Robin perfecto)
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

        // 0.5 Créditos Evento
        if (event_id) {
            const { data: creditOk } = await supabase.rpc('increment_event_credit', { p_event_id: event_id });
            if (!creditOk) throw new Error("🎟️ Créditos del evento agotados.");
        }

        // 1. Procesar Foto del Usuario -> Subir a Storage (Modo Futbol: EXACTAMENTE user_photos)
        let publicPhotoUrl = user_photo;
        if (user_photo && user_photo.startsWith('data:image')) {
            try {
                const base64Content = user_photo.split(',')[1];
                const binaryData = decode(base64Content);
                const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png' });
                const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                publicPhotoUrl = publicUrl;
                console.log("[ALQUIMISTA] Selfie subida exitosamente a Supabase user_photos:", publicPhotoUrl);
            } catch (e) {
                console.warn("[STORAGE] Falló base64 de usuario", e.message);
                throw new Error("No pudimos procesar tu selfie inicial. Por favor intenta de nuevo.");
            }
        }

        // 2. Obtener el Oráculo (Prompt Maestro)
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        const masterPrompt = promptData?.master_prompt || `Professional portrait photography, studio lighting.`;

        // 3. Invocar la Gran Alquimia (Kie.ai)
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

        // 3.5 Manejo de Errores de Creación (Saldo, API Key, etc.)
        if (createResult.code === 402) {
            throw new Error("Saldo insuficiente en la cuenta de IA. Por favor recarga Kie.ai.");
        } else if (createResult.code === 401) {
            throw new Error("Error de autenticación con Kie.ai. Revisa las API Keys.");
        } else if (createResult.code !== 200) {
            throw new Error(`Kie.ai Error (${createResult.code}): ${createResult.msg || createResult.message}`);
        }

        const taskId = createResult.data.taskId;
        console.log(`[ALQUIMISTA] Tarea creada: ${taskId}. Iniciando espera profesional...`);

        // 3.6 Actualizar estadísticas de la llave (Asincrónico)
        if (keyId) {
            supabase.from('api_key_pool')
                .update({ last_used_at: new Date().toISOString(), usage_count: 1 })
                .eq('id', keyId)
                .then(() => console.log(`[BALANCER] Llave ${keyId} rotada correctamente.`));
        }

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
                console.log(`[ALQUIMISTA] Intento ${attempts + 1}: Estado = ${state}`);

                if (state === 'success') {
                    try {
                        const resJson = JSON.parse(queryData.data.resultJson);
                        kieImageUrl = resJson.resultUrls?.[0] || queryData.data.imageUrl;
                    } catch {
                        kieImageUrl = queryData.data.resultUrl || queryData.data.imageUrl;
                    }
                    if (kieImageUrl) {
                        console.log("[ALQUIMISTA] ¡Éxito! Imagen recibida.");
                        break;
                    }
                }

                if (state === 'fail') {
                    const errorDetail = queryData.data.failMsg || "Error desconocido en el renderizado.";
                    console.error(`[ALQUIMISTA] Kie.ai falló: ${errorDetail}`);
                    throw new Error(`La IA falló: ${errorDetail}`);
                }
            } else {
                console.warn(`[ALQUIMISTA] Error en consulta (${queryData.code}): ${queryData.msg}`);
            }
            attempts++;
        }

        if (!kieImageUrl) {
            console.error("[ALQUIMISTA] Se agotó el tiempo de espera después de 3 minutos.");
            throw new Error("La IA está tardando más de lo normal. Tu foto llegará en unos minutos a tu Galería.");
        }

        // --- NUEVA LÓGICA: Persistencia en Supabase ---
        let finalImageUrl = kieImageUrl;
        try {
            console.log("[ALQUIMISTA] Persistiendo imagen final en Supabase generations...");
            const imgRes = await fetch(kieImageUrl);
            const blob = await imgRes.blob();
            const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;

            const { error: uploadError } = await supabase.storage
                .from('generations')
                .upload(fileName, blob, { contentType: 'image/png' });

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                finalImageUrl = publicUrl;
                console.log("[ALQUIMISTA] Imagen persistida exitosamente:", finalImageUrl);
            }
        } catch (e) {
            console.error("[STORAGE] Error persistiendo imagen, usando URL original de KIE:", e.message);
        }

        // 6. Registro Asincrónico y Notificaciones
        edge_registry: {
            let userName = 'Usuario';
            try {
                const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user_id).single();
                if (profile?.full_name) userName = profile.full_name;
            } catch (e) {
                userName = guest_id ? `Guest_${guest_id.slice(-4)}` : 'Usuario';
            }

            supabase.from('generations').insert({
                user_id: user_id || null,
                model_id: model_id,
                image_url: finalImageUrl,
                aspect_ratio: aspect_ratio,
                event_id: event_id || null
            }).then(() => console.log("Registro DB OK"));

            if (user_id) {
                fetch(`${SB_URL}/functions/v1/push-notification`, {
                    method: 'POST',
                    body: JSON.stringify({ user_id, title: "¡Tu Alquimia está lista!", body: "Entrá ahora para ver tu foto.", url: "https://metalab30.com/cabina/", image: finalImageUrl })
                }).catch(e => console.error("Push Error", e));
            }

            if (email) {
                fetch(`${SB_URL}/functions/v1/send-email`, {
                    method: 'POST',
                    body: JSON.stringify({ to: email, subject: "🪄 ¡Tu Alquimia Creativa está lista!", image_url: finalImageUrl, user_name: userName, model_name: model_id })
                }).catch(e => console.error("Email Error", e));
            }

            if (phone) {
                console.log(`[ALQUIMISTA] Disparando WhatsApp a ${phone}`);
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

        return new Response(JSON.stringify({ image_url: finalImageUrl, success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error(`[CRITICAL] ${error.message}`);
        return new Response(JSON.stringify({ error: error.message, success: false }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
})
