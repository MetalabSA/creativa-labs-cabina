import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    // Token proporcionado por el usuario
    const MP_ACCESS_TOKEN = "TEST-1cfad41c-8fee-4f1e-a007-eea541f8f08a";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const url = new URL(req.url);
        const isWebhook = url.searchParams.get("webhook") === "true";

        if (req.method === "POST" && !isWebhook) {
            const { user_id, credits, price, pack_name, redirect_url } = await req.json();

            const preference = {
                items: [{
                    title: `Pack ${pack_name} - ${credits} Créditos`,
                    unit_price: Number(price),
                    quantity: 1,
                    currency_id: "ARS"
                }],
                external_reference: `${user_id}:${credits}`,
                back_urls: {
                    success: redirect_url || "https://metalab30.com/cabina/",
                    failure: redirect_url || "https://metalab30.com/cabina/",
                    pending: redirect_url || "https://metalab30.com/cabina/"
                },
                auto_return: "approved",
                notification_url: `https://elesttjfwfhvzdvldytn.supabase.co/functions/v1/mercadopago-payment?webhook=true`
            };

            const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(preference)
            });

            const data = await res.json();

            if (!res.ok) {
                return new Response(JSON.stringify({
                    error: true,
                    message: data.message || "Error en Mercado Pago",
                    code: data.code || "unknown_error",
                    details: data
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200
                });
            }

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200
            });
        }

        if (isWebhook) {
            const body = await req.json();
            const id = body.data?.id || body.id;
            const topic = body.type || body.topic;

            if ((topic === "payment" || topic === "merchant_order" || topic === "pay") && id) {
                const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
                    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
                });
                const paymentData = await mpRes.json();

                if (paymentData.status === "approved") {
                    const [userId, creditsToAdd] = paymentData.external_reference.split(":");
                    const creditsNum = parseInt(creditsToAdd);

                    const { data: existing } = await supabase
                        .from("payment_notifications")
                        .select("id")
                        .eq("mercadopago_id", id.toString())
                        .maybeSingle();

                    if (!existing) {
                        await supabase.from("payment_notifications").insert({
                            mercadopago_id: id.toString(),
                            data: paymentData,
                            status: "approved",
                            user_id: userId,
                            credits_added: creditsNum,
                            amount: paymentData.transaction_amount
                        });

                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("credits")
                            .eq("id", userId)
                            .single();

                        if (profile) {
                            await supabase
                                .from("profiles")
                                .update({ credits: (profile.credits || 0) + creditsNum })
                                .eq("id", userId);
                        }
                    }
                }
            }

            return new Response(JSON.stringify({ received: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response("Not found", { status: 404 });
    } catch (error) {
        return new Response(JSON.stringify({ error: true, message: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
        });
    }
});
