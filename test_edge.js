const fetch = require('node-fetch'); // Usando Node 22 global fetch is available 

async function run() {
    const url = "https://elesttjfwfhvzdvldytn.supabase.co/functions/v1/cabina-vision";
    const anonKey = "sb_publishable_DPfOzwwv2yXK1uvya4RYhQ_uOdKIqn_";

    // Test base64 image (small)
    const fs = require('fs');
    let base64Photo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    try {
        const testImg = fs.readFileSync('test_img.png');
        base64Photo = 'data:image/png;base64,' + Buffer.from(testImg).toString('base64');
    } catch (e) { }

    console.log("LLAMANDO A CABINA-VISION...");

    const startTime = Date.now();
    try {
        const response = await globalThis.fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${anonKey}`,
                'apikey': anonKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_photo: base64Photo,
                model_id: 'neon',
                aspect_ratio: '9:16',
                action: 'create',
                taskId: null
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
