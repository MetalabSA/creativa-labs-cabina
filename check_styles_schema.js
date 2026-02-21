import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://elesttjfwfhvzdvldytn.supabase.co';
const supabaseAnonKey = 'sb_publishable_DPfOzwwv2yXK1uvya4RYhQ_uOdKIqn_';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('--- CHECKING styles_metadata SCHEMA ---');

    // Try to get one row to see columns
    const { data, error } = await supabase
        .from('styles_metadata')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching styles_metadata:', error);
    } else if (data && data.length > 0) {
        console.log('Columns found in first row:', Object.keys(data[0]));
    } else {
        console.log('No data found in styles_metadata, trying to fetch columns via RPC or direct select failure');
        // Try to select 'category' specifically to confirm it fails
        const { error: colError } = await supabase
            .from('styles_metadata')
            .select('category')
            .limit(1);

        if (colError) {
            console.log('Confirmed: Error selecting "category":', colError.message);
        } else {
            console.log('Wait, "category" WAS found in a select.');
        }
    }
}

checkSchema();
