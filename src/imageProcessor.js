const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Dossier pour images à vérifier
const REVIEW_DIR = './images/a_controler';

// Vérification si le fond est majoritairement blanc
async function hasWhiteBackground(imagePath) {
    // Redimensionner l'image pour accélérer le traitement
    const resizedImageBuffer = await sharp(imagePath)
        .resize({ width: 100, height: 100, fit: 'cover' }) // Réduire à 100x100 pixels
        .toBuffer();

    // Charger les pixels de l'image redimensionnée
    const { data, info } = await sharp(resizedImageBuffer).raw().toBuffer({ resolveWithObject: true });

    let totalRed = 0, totalGreen = 0, totalBlue = 0;
    let borderPixelCount = 0;

    const margin = 5; // Zone de bord en pixels (haut, bas, gauche, droite)

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const index = (y * info.width + x) * 3;
            const [r, g, b] = [data[index], data[index + 1], data[index + 2]];

            // Vérifier si le pixel est sur les bords
            if (
                x < margin || x >= info.width - margin || // Bord gauche ou droit
                y < margin || y >= info.height - margin  // Bord haut ou bas
            ) {
                totalRed += r;
                totalGreen += g;
                totalBlue += b;
                borderPixelCount++;
            }
        }
    }

    // Calculer la moyenne des couleurs des bords
    const avgRed = totalRed / borderPixelCount;
    const avgGreen = totalGreen / borderPixelCount;
    const avgBlue = totalBlue / borderPixelCount;

    // Considérer comme blanc si chaque canal est supérieur à un seuil
    const WHITE_THRESHOLD = 200; // Ajuster selon les besoins
    return avgRed >= WHITE_THRESHOLD && avgGreen >= WHITE_THRESHOLD && avgBlue >= WHITE_THRESHOLD;
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
