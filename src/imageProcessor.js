const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Dossier pour images à vérifier
const REVIEW_DIR = './images/a_controler';

// Vérification si le fond est majoritairement blanc
async function hasWhiteBackground(imagePath) {
    // Redimensionner l'image pour accélérer le traitement
    const resizedBuffer = await sharp(imagePath)
        .resize({ width: 50, height: 50, fit: 'cover' }) // Réduction pour analyse rapide
        .toBuffer();

    // Charger les pixels redimensionnés en format brut
    const { data, info } = await sharp(resizedBuffer).raw().toBuffer({ resolveWithObject: true });

    const WHITE_THRESHOLD = 240; // Seuil pour considérer un pixel "proche du blanc"
    const margin = 5; // Largeur des bords à analyser

    let whitePixels = 0;
    let totalBorderPixels = 0;

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * 3; // Chaque pixel = 3 valeurs (R, G, B)
            const [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]];

            // Si le pixel est dans les bords
            if (x < margin || x >= info.width - margin || y < margin || y >= info.height - margin) {
                totalBorderPixels++;

                // Vérifier si le pixel est proche du blanc
                if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
                    whitePixels++;
                }
            }
        }
    }

    // Calcul du ratio de pixels blancs sur les bords
    const whiteRatio = whitePixels / totalBorderPixels;
    console.log(`Ratio de pixels blancs : ${(whiteRatio * 100).toFixed(2)}%`);

    // Retourner true si plus de 90% des pixels des bords sont blancs
    return whiteRatio > 0.9;
}


// Suppression d’arrière-plan en dernier recours
async function processImage(imagePath, filename) {
    const outputPath = path.join(REVIEW_DIR, `${filename}.png`);

    // Charger l'image
    const image = sharp(imagePath);

    // Extraire les dimensions
    const metadata = await image.metadata();

    // Si l'image n'est pas carrée, recadrer
    const size = Math.min(metadata.width, metadata.height);
    const cropped = image.extract({ left: 0, top: 0, width: size, height: size });

    // Ajouter un fond blanc pour remplacer l'arrière-plan
    const processed = await cropped
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // Ajout d'un fond blanc
        .png()
        .toFile(outputPath);

    console.log(`Image sauvegardée avec fond blanc : ${outputPath}`);
    return outputPath;
}

module.exports = { processImage, hasWhiteBackground };
