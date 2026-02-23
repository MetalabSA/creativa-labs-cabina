
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Leer .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envConfig[key.trim()] = value.trim();
});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function cleanup() {
    console.log('--- BUSCANDO DUPLICADOS DE CARTOON ---');

    // Obtener todos los estilos que mencionen cartoon en category
    const { data: styles } = await supabase.from('styles_metadata').select('*');

    const cartoonStyles = styles.filter(s => s.category?.toLowerCase() === 'cartoon');
    console.log('Estilos bajo categoría "Cartoon":', cartoonStyles.length);

    const cartoonEntries = styles.filter(s => s.id?.toLowerCase() === 'cartoon' || s.label?.toLowerCase() === 'cartoon');
    console.log('Entradas de metadatos "Cartoon":');
    console.table(cartoonEntries.map(e => ({ id: e.id, label: e.label, category: e.category, is_active: e.is_active })));

    // Si hay una entrada que dice "CARTOON" (all caps) y es de tipo categoría (ID = cartoon), la borramos si está vacía o duplicada.
    // El usuario dice que "CARTOON" es la que no tiene nada.

    const toDelete = cartoonEntries.find(e => e.label === 'CARTOON' || e.id === 'CARTOON');

    if (toDelete) {
        console.log(`Borrando duplicado: ${toDelete.id} (${toDelete.label})`);
        const { error } = await supabase.from('styles_metadata').delete().eq('id', toDelete.id);
        if (error) console.error('Error al borrar:', error);
        else console.log('✅ Borrado exitosamente.');
    } else {
        console.log('No se encontró una entrada exacta con "CARTOON".');
    }
}

cleanup();
