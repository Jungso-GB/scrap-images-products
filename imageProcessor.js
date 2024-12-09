const sharp = require('sharp');
const fs = require('fs-extra');

async function processImage(imagePath) {
    const metadata = await sharp(imagePath).metadata();

    // Vérifier le ratio
    const isSquare = metadata.width === metadata.height;
    if (!isSquare) {
        await sharp(imagePath)
            .resize({ width: Math.min(metadata.width, metadata.height), height: Math.min(metadata.width, metadata.height), fit: 'cover' })
            .toFile(imagePath);
    }

    // Vérifier le fond blanc (si nécessaire, ajouter une suppression d'arrière-plan ici)
    console.log(`Image traitée : ${imagePath}`);
}

module.exports = { processImage };
