import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elesttjfwfhvzdvldytn.supabase.co';
const supabaseAnonKey = 'sb_publishable_DPfOzwwv2yXK1uvya4RYhQ_uOdKIqn_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE DATOS ---');

    // 1. Verificar Eventos
    const email = 'metalabia@gmail.com';
    const { data: events, error: eError } = await supabase
        .from('events')
        .select('id, event_name, event_slug, client_email, created_at, is_active')
        .ilike('client_email', email)
        .order('created_at', { ascending: false });

    if (eError) console.error('Error eventos:', eError);
    else {
        console.log(`\nEventos para ${email}:`, events?.length || 0);
        events?.forEach(e => console.log(`- [${e.id}] ${e.event_name} (${e.event_slug}) - Creado: ${e.created_at}`));
    }

    // 2. Verificar Generaciones Recientes (últimas 24h aprox)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2); // Miramos 48h por las dudas del huso horario

    const { data: gens, error: gError } = await supabase
        .from('generations')
        .select('id, event_id, created_at, user_id')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false });

    if (gError) console.error('Error generaciones:', gError);
    else {
        console.log(`\nGeneraciones en las últimas 48h:`, gens?.length || 0);
        gens?.slice(0, 10).forEach(g => console.log(`- [${g.id}] Evento: ${g.event_id} - Creado: ${g.created_at} - User: ${g.user_id}`));
    }

    // 3. Verificar Generaciones Globales
    const { count, error: cError } = await supabase
        .from('generations')
        .select('*', { count: 'exact', head: true });

    if (!cError) console.log(`\nTotal global de generaciones en la DB:`, count);
}

diagnose();
