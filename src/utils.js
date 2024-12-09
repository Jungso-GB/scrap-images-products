const fs = require('fs-extra');
const { parse, stringify } = require('json2csv');

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
    const report = products.map(product => ({
        reference: product.refInterne,
        nom: product.nomComplet,
        status: progress[product.refInterne]?.success ? 'Succès' : 'Échec',
        error: progress[product.refInterne]?.error || ''
    }));

    const csv = stringify(report);
    fs.writeFileSync(reportFile, csv);
}

module.exports = { loadProgress, saveProgress, generateReport };
