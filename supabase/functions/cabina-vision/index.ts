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

        // --- 0. LOAD BALANCER (Round Robin) ---
        let currentApiKey = Deno.env.get('BANANA_API_KEY') || "e12c19f419743e747757b4f164d55e87"
        let keyId = null;

        try {
            // Buscamos la llave activa que haga más tiempo no se usa (Round Robin)
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

        // --- ACCIÓN: CHECK (para polling de rescate desde el frontend) ---
        if (action === 'check' && existingTaskId) {
            const queryRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${existingTaskId}`, {
                headers: { 'Authorization': `Bearer ${currentApiKey}` }
            });
            const queryData = await queryRes.json();
            if (queryData.code === 200 && queryData.data.state === 'success') {
                try {
                    const resJson = JSON.parse(queryData.data.resultJson);
                    const url = resJson.resultUrls?.[0] || queryData.data.imageUrl;

                    // Persistir en Storage también en el check
                    let finalUrl = url;
                    try {
                        const imgRes = await fetch(url);
                        const blob = await imgRes.blob();
                        const fileName = `results/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                        const { error: uploadError } = await supabase.storage
                            .from('generations')
                            .upload(fileName, blob, { contentType: 'image/png' });
                        if (!uploadError) {
                            const { data: { publicUrl } } = supabase.storage.from('generations').getPublicUrl(fileName);
                            finalUrl = publicUrl;
                        }
                    } catch (e) {
                        console.warn("[STORAGE-CHECK] No se pudo persistir en check, usando URL original");
                    }

                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: finalUrl }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                } catch {
                    const url = queryData.data.resultUrl || queryData.data.imageUrl;
                    return new Response(JSON.stringify({ success: true, state: 'success', image_url: url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
                }
            }
            return new Response(JSON.stringify({ success: true, state: queryData.data?.state || 'waiting' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ACCIÓN: CREATE ---

        // 1. Procesar Foto del Usuario -> Subir a KIE.AI (primario) + Supabase Storage (backup)
        let publicPhotoUrl = user_photo;
        let uploadDebugInfo = '';
        if (user_photo && user_photo.startsWith('data:image')) {
            const b64Length = user_photo.length;
            console.log(`[CABINA] Foto recibida: ${b64Length} chars, API Key: ${currentApiKey.substring(0, 8)}...`);

            // Método PRIMARIO: Uploader nativo de KIE.AI (probado y confiable)
            try {
                console.log("[CABINA] Subiendo foto via KIE.AI nativo...");
                const uploadRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
                    body: JSON.stringify({ base64Data: user_photo, uploadPath: "images/base64", fileName: `cabina_${Date.now()}.png` })
                });
                console.log(`[KIE-UPLOAD] HTTP Status: ${uploadRes.status}`);
                const uploadText = await uploadRes.text();
                console.log(`[KIE-UPLOAD] Response: ${uploadText.substring(0, 500)}`);
                try {
                    const uploadData = JSON.parse(uploadText);
                    // Buscar URL en múltiples campos posibles
                    const possibleUrl = uploadData.data?.url
                        || uploadData.data?.fileUrl
                        || uploadData.data?.imageUrl
                        || uploadData.data?.image_url
                        || uploadData.data?.link
                        || uploadData.data?.src
                        || uploadData.url;

                    // Si no encontramos en campos conocidos, buscar cualquier string con http en data
                    let foundUrl = possibleUrl;
                    if (!foundUrl && uploadData.data && typeof uploadData.data === 'object') {
                        console.log("[KIE-UPLOAD] Campos en data:", Object.keys(uploadData.data).join(', '));
                        for (const key of Object.keys(uploadData.data)) {
                            const val = uploadData.data[key];
                            if (typeof val === 'string' && val.startsWith('http')) {
                                foundUrl = val;
                                console.log(`[KIE-UPLOAD] URL encontrada en campo '${key}': ${val}`);
                                break;
                            }
                        }
                    }
                    // Si data es directamente un string URL
                    if (!foundUrl && typeof uploadData.data === 'string' && uploadData.data.startsWith('http')) {
                        foundUrl = uploadData.data;
                    }

                    if (uploadData.code === 200 && foundUrl) {
                        publicPhotoUrl = foundUrl;
                        console.log("[CABINA] ✅ Foto subida via KIE.AI:", publicPhotoUrl);
                    } else {
                        console.warn("[KIE-UPLOAD] data completo:", JSON.stringify(uploadData.data)?.substring(0, 300));
                        uploadDebugInfo += `KIE(${uploadData.code}): ${uploadData.msg || 'ok'}, data keys: ${uploadData.data ? Object.keys(uploadData.data).join(',') : 'null'}. `;
                    }
                } catch (parseErr) {
                    uploadDebugInfo += `KIE: No-JSON response (HTTP ${uploadRes.status}). `;
                }
            } catch (e) {
                console.error("[KIE-UPLOAD] Excepción:", e.message);
                uploadDebugInfo += `KIE Exception: ${e.message}. `;
            }

            // Método SECUNDARIO: Supabase Storage (para persistencia/backup)
            if (publicPhotoUrl === user_photo) {
                try {
                    console.log("[CABINA] Intentando Supabase Storage como fallback...");
                    const base64Content = user_photo.split(',')[1];
                    const binaryData = decode(base64Content);
                    const fileName = `uploads/${guest_id || user_id || 'anon'}_${Date.now()}.png`;
                    const { error: uploadError } = await supabase.storage.from('user_photos').upload(fileName, binaryData, { contentType: 'image/png' });
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('user_photos').getPublicUrl(fileName);
                        publicPhotoUrl = publicUrl;
                        console.log("[CABINA] ✅ Foto subida a Supabase Storage:", publicPhotoUrl);
                    } else {
                        console.warn("[STORAGE] Error en upload:", uploadError.message);
                        uploadDebugInfo += `Storage: ${uploadError.message}. `;
                    }
                } catch (e) {
                    console.warn("[STORAGE] Falló:", e.message);
                    uploadDebugInfo += `Storage Exception: ${e.message}. `;
                }
            }

            // Safety check: si después de ambos intentos sigue siendo base64, abortar
            if (publicPhotoUrl.startsWith('data:image')) {
                console.error(`[CABINA] ❌ AMBOS UPLOADS FALLARON. Debug: ${uploadDebugInfo}`);
                throw new Error(`No se pudo subir la foto. Detalles: ${uploadDebugInfo}`);
            }
        }

        // 2. Obtener el Prompt Maestro
        // Nota: Cabina usa la tabla 'identity_prompts', diferente a futbol que usa 'identities'
        const { data: promptData } = await supabase.from('identity_prompts').select('master_prompt').eq('id', model_id).maybeSingle();
        const masterPrompt = promptData?.master_prompt || "Professional portrait photography, studio lighting, high quality.";
        console.log(`[CABINA] Prompt cargado para model_id: ${model_id}`);

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

            // Registrar generación en DB
            supabase.from('generations').insert({
                user_id: user_id || null,
                style_id: model_id,
                image_url: finalImageUrl,
                aspect_ratio: aspect_ratio,
                prompt: masterPrompt.substring(0, 500)
            }).then(() => console.log("[CABINA] Registro DB OK"));

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
