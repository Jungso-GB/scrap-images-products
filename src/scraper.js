const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');

async function scrapeImage(query, outputDir, filename) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    try {
        const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
        await page.goto(url, { waitUntil: 'networkidle2' });

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
