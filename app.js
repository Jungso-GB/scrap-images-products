const fs = require('fs-extra');
const path = require('path');
const { scrapeImage } = require('./src/scraper');
const { processImage, hasWhiteBackground } = require('./src/imageProcessor');
const { loadProgress, saveProgress, generateReport } = require('./src/utils');

// Configurations
const INPUT_FILE = './data/input.csv';
const OUTPUT_DIR = './images';
const REVIEW_DIR = './images/a_controler';
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
        const columns = line.split(';');
        if (columns.length < 4) {
            console.warn(`Ligne mal formatée : ${line}`);
            return null; // Ignorer les lignes invalides
        }
        const [codeArticle, refFabricant, nomComplet, raisonFabricant] = columns;
        return { codeArticle, refFabricant, nomComplet, raisonFabricant };
    })
    .filter(product => product !== null); // Supprimer les lignes nulles


    // Charger l'état de progression
    const progress = loadProgress(PROGRESS_FILE);

    for (const product of products) {
        const imagePath = path.join(OUTPUT_DIR, `${product.refInterne}.jpg`);

        // Vérifier si l'image existe déjà
        if (fs.existsSync(imagePath)) {
            console.log(`Image déjà existante pour ${product.nomComplet} (${product.refInterne}), passage au suivant.`);
            progress[product.refInterne] = { success: true, skipped: true }; // Marquer comme traité mais ignoré
            saveProgress(PROGRESS_FILE, progress);
            continue;
        }

        // Vérifier si le produit a déjà été traité (progression)
        if (progress[product.refInterne]) continue;

        try {
            console.log(`Traitement de ${product.nomComplet} (${product.refInterne})...`);

            // Étape 1 : Scraper l'image
            const downloadedImagePath = await scrapeImage(product.refFabricant, OUTPUT_DIR, product.refInterne);

            // Étape 2 : Vérification du fond blanc
            const isWhiteBG = await hasWhiteBackground(downloadedImagePath);

            if (!isWhiteBG) {
                console.log(`Fond non blanc détecté pour ${product.refInterne}. Suppression de l'arrière-plan...`);
                // Étape 3 : Suppression de l'arrière-plan
                if (!fs.existsSync(REVIEW_DIR)) fs.mkdirSync(REVIEW_DIR);

                const reviewedImagePath = await processImage(downloadedImagePath, product.refInterne);
                console.log(`Image traitée avec suppression d'arrière-plan : ${reviewedImagePath}`);
                progress[product.refInterne] = { success: true, backgroundRemoved: true, reviewed: true };
            } else {
                console.log(`Fond blanc détecté pour ${product.refInterne}. Aucun traitement nécessaire.`);
                progress[product.refInterne] = { success: true, backgroundRemoved: false, reviewed: false };
            }

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
