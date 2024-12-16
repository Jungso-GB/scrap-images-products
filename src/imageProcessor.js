const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Dossier pour images à vérifier
const REVIEW_DIR = './images/a_controler';

// Vérification si le fond est majoritairement blanc
async function hasWhiteBackground(imagePath) {
    const image = sharp(imagePath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    let whitePixelCount = 0;
    const totalPixels = info.width * info.height;

    // Seuil pour considérer un pixel comme blanc (valeurs RGB proches de 255)
    const WHITE_THRESHOLD = 240;

    for (let i = 0; i < data.length; i += 3) {
        const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
        if (r > WHITE_THRESHOLD && g > WHITE_THRESHOLD && b > WHITE_THRESHOLD) {
            whitePixelCount++;
        }
    }

    const whiteRatio = whitePixelCount / totalPixels;
    return whiteRatio > 0.95; // Considérer l'image comme ayant un fond blanc si 95% des pixels sont blancs
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
