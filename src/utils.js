const fs = require('fs-extra');
const { Parser, stringify } = require('json2csv');


// Charger l'état de progression
function loadProgress(progressFile) {
    return fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile, 'utf8')) : {};
}

// Sauvegarder l'état de progression
function saveProgress(progressFile, progress) {
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
}

// Générer un rapport
function generateReport(products, progress, reportFile) {
    // Préparer les données pour le rapport
    const report = products.map(product => {
        const { codeArticle, refFabricant, nomComplet, raisonFabricant } = product;
        const status = progress[product.codeArticle]?.success ? 'Succès' : 'Échec';
        const error = progress[product.codeArticle]?.error || '';
        const backgroundRemoved = progress[product.codeArticle]?.backgroundRemoved ? 'Oui' : 'Non';

        return {
            codeArticle,
            refFabricant,
            nomComplet,
            raisonFabricant,
            status,
            backgroundRemoved,
            error
        };
    });

    // Convertir en CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(report);

    // Sauvegarder le fichier
    fs.writeFileSync(reportFile, csv, 'utf8');
    console.log(`Rapport généré avec succès : ${reportFile}`);
}


module.exports = { loadProgress, saveProgress, generateReport };
