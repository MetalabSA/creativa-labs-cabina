
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Leer .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE ESTILOS (DB) ---');

    // 1. Ver qué hay en styles_metadata
    const { data: styles, error: sError } = await supabase.from('styles_metadata').select('*');
    if (sError) {
        console.error('Error styles_metadata:', sError);
    } else {
        console.log(`Total estilos en DB: ${styles.length}`);

        const cartoonRelated = styles.filter(s =>
            s.id?.toLowerCase().includes('cartoon') ||
            s.label?.toLowerCase().includes('cartoon') ||
            s.category?.toLowerCase().includes('cartoon') ||
            s.subcategory?.toLowerCase().includes('cartoon')
        );

        console.log('\nElementos relacionados con "Cartoon":');
        console.table(cartoonRelated.map(s => ({
            id: s.id,
            label: s.label,
            category: s.category,
            subcategory: s.subcategory,
            is_active: s.is_active
        })));

        const categories = [...new Set(styles.map(s => s.category))];
        console.log('\nCategorías encontradas en DB:', categories);

        const inactiveCategories = styles.filter(s => s.id === s.category?.toLowerCase() && s.is_active === false);
        console.log('\nRegistros de control de categorías inactivos:', inactiveCategories.map(c => c.id));
    }

    // 2. Ver prompts
    const { data: prompts, error: pError } = await supabase.from('identity_prompts').select('id');
    console.log(`\nTotal prompts en DB: ${prompts?.length || 0}`);
}

diagnose();
