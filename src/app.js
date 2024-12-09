const fs = require('fs-extra');
const path = require('path');
const { scrapeImage } = require('./src/scraper');
const { processImage } = require('./src/imageProcessor');
const { loadProgress, saveProgress, generateReport } = require('./src/utils');

// Configurations
const INPUT_FILE = './data/input.csv';
const OUTPUT_DIR = './images';
const PROGRESS_FILE = './data/progress.json';
const REPORT_FILE = './data/report.csv';

// Fonction principale
async function main() {
    console.log("Démarrage du bot...");

    // Charger les produits
    const products = fs.readFileSync(INPUT_FILE, 'utf8')
        .split('\n')
        .slice(1) // Ignorer l'entête
        .map(line => {
            const [refFabricant, nomComplet, refInterne] = line.split(',');
            return { refFabricant, nomComplet, refInterne };
        });

    // Charger l'état de progression
    const progress = loadProgress(PROGRESS_FILE);

    for (const product of products) {
        if (progress[product.refInterne]) continue; // Produit déjà traité

        try {
            console.log(`Traitement de ${product.nomComplet} (${product.refInterne})...`);

            // Étape 1 : Scraper l'image
            const imagePath = await scrapeImage(product.refFabricant, OUTPUT_DIR, product.refInterne);

            // Étape 2 : Traiter l'image (recadrage, fond blanc)
            await processImage(imagePath);

            // Marquer le produit comme traité
            progress[product.refInterne] = { success: true };
            saveProgress(PROGRESS_FILE, progress);
        } catch (error) {
            console.error(`Erreur avec ${product.refInterne} : ${error.message}`);
            progress[product.refInterne] = { success: false, error: error.message };
            saveProgress(PROGRESS_FILE, progress);
        }
    }

    // Générer un rapport
    generateReport(products, progress, REPORT_FILE);

    console.log("Processus terminé.");
}

main();
