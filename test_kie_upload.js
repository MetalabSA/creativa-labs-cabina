import fs from 'fs';
import https from 'https';

async function run() {
    
    // Necesitamos una imagen real de prueba. Vamos a descargar una pequeña.
    const dest = 'test_img.png';
    const file = fs.createWriteStream(dest);
    
    await new Promise((resolve) => {
        https.get('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', function(response) {
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        });
    });

    const bitmap = fs.readFileSync(dest);
    const base64Data = 'data:image/png;base64,' + Buffer.from(bitmap).toString('base64');
    
    console.log("Subiendo", base64Data.length, "bytes a KIE...");
    const currentApiKey = "e12c19f419743e747757b4f164d55e87";

    try {
        const upRes = await fetch("https://kieai.redpandaai.co/api/file-base64-upload", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentApiKey}` },
            body: JSON.stringify({ base64Data: base64Data, uploadPath: "images/base64", fileName: `cabina_${Date.now()}.png` })
        });
        
        const resText = await upRes.text();
        console.log("KIE RAW Response:", resText);
        
        try {
            const data = JSON.parse(resText);
            console.log("Parsed result:", data);
        } catch (e) {
            console.log("Failed to parse JSON", e);
        }

    } catch (err) {
        console.error("Fetch Error:", err);
    }
}
run();
