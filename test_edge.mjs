import fs from 'fs';

async function run() {
    // La url de Deno se extrae del .env.local de la app
    const url = "https://elesttjfwfhvzdvldytn.supabase.co/functions/v1/cabina-vision";

    // Necesitamos pasarle el VITE_SUPABASE_ANON_KEY 
    const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZXN0dGpmd2ZodnpkdmxkeXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ5OTIwNzEsImV4cCI6MjAyMDU2ODA3MX0.8-X... ";

    // La sacaré cargandola de dotenv (está instalado dotenv localmente?) No, pero el usuario la usa.
    // Voy a reemplazar esto leyendo en tiempo real el .env.local del disco.
    let realAnonKey = '';
    try {
        const data = fs.readFileSync('.env.local', 'utf8');
        const lines = data.split('\n');
        for (const line of lines) {
            if (line.includes('VITE_SUPABASE_ANON_KEY=')) {
                realAnonKey = line.split('=')[1].trim();
            }
        }
    } catch (e) { }

    let base64Photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    try {
        const testImg = fs.readFileSync('test_img.png');
        base64Photo = 'data:image/png;base64,' + Buffer.from(testImg).toString('base64');
    } catch (e) { }

    console.log("LLAMANDO A CABINA-VISION...");

    const startTime = Date.now();
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${realAnonKey}`,
                'apikey': realAnonKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_photo: base64Photo,
                model_id: 'neon',
                aspect_ratio: '9:16',
                action: 'create'
            })
        });

        const status = response.status;
        console.log("Tiempo:", ((Date.now() - startTime) / 1000).toFixed(1) + "s");
        console.log("HTTP STATUS:", status);

        const txt = await response.text();
        console.log("BODY:", txt);

    } catch (err) {
        console.log("Tiempo:", ((Date.now() - startTime) / 1000).toFixed(1) + "s");
        console.error("FETCH EXCEPTION:", err.message);
    }
}

run();
