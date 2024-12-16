const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

function randomDelay(min = 3000, max = 10000) {
    return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
}


async function scrapeImage(query, outputDir, filename) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const cookiesPath = './cookies.json';

    try {
        const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

        if (fs.existsSync(cookiesPath)) {
            const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
            await page.setCookie(...cookies);
        }
        
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        ];
        
        await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
        

        // Changer la fenetre d'affichage.
        const randomViewport = () => ({
            width: Math.floor(Math.random() * (1920 - 1024 + 1)) + 1024,
            height: Math.floor(Math.random() * (1080 - 720 + 1)) + 720
        });
        
        await page.setViewport(randomViewport());
        
        await randomDelay(); // Introduire un délai aléatoire

        await page.goto(url, { waitUntil: 'networkidle2' });

        // Enregistrer les cookies après la navigation
        const cookies = await page.cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies));

        const isCaptcha = await page.evaluate(() => {
            return document.title.includes('captcha') || document.body.innerText.includes('Please verify');
        });

        if (isCaptcha) {
            console.log('CAPTCHA détecté, pause de 10 minutes...');
            await page.close();
            await new Promise(resolve => setTimeout(resolve, 600000)); // Pause de 10 minutes
            throw new Error('CAPTCHA détecté');
        }

        // Sélectionner la première image
        const imageUrl = await page.evaluate(() => {
            const img = document.querySelector('img');
            return img ? img.src : null;
        });

        if (!imageUrl) throw new Error('Aucune image trouvée');

        // Télécharger l'image
        const imagePath = path.join(outputDir, `${filename}.jpg`);
        const viewSource = await page.goto(imageUrl);
        await fs.writeFile(imagePath, await viewSource.buffer());

        return imagePath;
    } finally {
        await browser.close();
    }
}

module.exports = { scrapeImage };
