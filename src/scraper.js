const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

function randomDelay(min = 8000, max = 45000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min; // Calculer le délai
    console.log(`Attente de ${Math.floor(delay / 1000)} secondes avant de traiter la prochaine image...`);
    return new Promise(resolve => setTimeout(() => resolve(delay), delay)); // Retourner le délai après l'attente
}

async function scrapeImage(refFabricant, nomComplet, outputDir, filename, fabricant) {
    console.log(`Recherche Google Images : refFabricant=${refFabricant}, nomComplet=${nomComplet}, fabricant=${fabricant}`);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const cookiesPath = './cookies.json';

    try {
        await randomDelay();

        // Construire la requête avec refFabricant, nomComplet et fabricant
        const query = `${refFabricant} ${nomComplet} ${fabricant}`;
        const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
        console.log(`URL générée : ${url}`);

        // Charger les cookies existants
        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            await page.setCookie(...cookies);
        }

        // User-Agent aléatoire
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ];
        await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

        const randomViewport = () => ({
            width: Math.floor(Math.random() * (1920 - 1024 + 1)) + 1024,
            height: Math.floor(Math.random() * (1080 - 720 + 1)) + 720
        });
        await page.setViewport(randomViewport());

        await page.goto(url, { waitUntil: 'networkidle2' });

        // Enregistrer les cookies après la navigation
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies));

        // Vérification CAPTCHA
        const isCaptcha = await page.evaluate(() => {
            return document.title.includes('captcha') || document.body.innerText.includes('Please verify');
        });

        if (isCaptcha) {
            console.log('CAPTCHA détecté, pause de 10 minutes...');
            await page.close();
            await new Promise(resolve => setTimeout(resolve, 600000));
            throw new Error('CAPTCHA détecté');
        }

        // Récupérer toutes les images visibles
        const images = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                width: img.naturalWidth,
                height: img.naturalHeight
            }));
        });

        const validImages = images.filter(img => img.width > 200 && img.height > 200);
        console.log(`Images valides trouvées : ${validImages.length}`);

        if (validImages.length === 0) {
            throw new Error('Aucune image pertinente trouvée.');
        }

        for (const [index, image] of validImages.entries()) {
            try {
                console.log(`Téléchargement de l'image ${index + 1} : ${image.src}`);
                const viewSource = await page.goto(image.src);
                const imagePath = path.join(outputDir, `${filename}.jpg`);
                await fs.writeFile(imagePath, await viewSource.buffer());
                return imagePath;
            } catch (err) {
                console.warn(`Erreur avec l'image ${index + 1} : ${err.message}`);
                continue;
            }
        }

        throw new Error('Impossible de télécharger une image valide.');
    } finally {
        await browser.close();
    }
}


module.exports = { scrapeImage };
