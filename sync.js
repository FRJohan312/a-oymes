const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img');
const dataFile = path.join(__dirname, 'images-data.js');
const settingsFile = path.join(__dirname, 'settings.json');
const playlistFile = path.join(__dirname, 'playlist.json');

// Extensiones permitidas
const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function sync() {
    console.log('🔍 Escaneando carpeta /img/ y ajustes...');

    // 1. Asegurar carpeta de imágenes
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir);
    }

    // 2. Leer imágenes
    const files = fs.readdirSync(imgDir);
    const images = files
        .filter(file => validExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => {
            const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
            const date = dateMatch ? dateMatch[1] : '';
            return {
                src: `img/${file}`,
                date: date
            };
        });

    // 3. Leer ajustes
    let settings = {
        startDate: "",
        victoryMessage: "¡Ganaste, mi amor! Cada momento contigo es una victoria ❤️",
        soundCloudUrl: ""
    };

    if (fs.existsSync(settingsFile)) {
        try {
            const savedSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
            settings = { ...settings, ...savedSettings };
        } catch (e) {
            console.error('Error leyendo settings.json:', e);
        }
    }

    // 4. Leer Playlist
    let playlist = [];
    if (fs.existsSync(playlistFile)) {
        try {
            playlist = JSON.parse(fs.readFileSync(playlistFile, 'utf8'));
        } catch (e) {
            console.error('Error leyendo playlist.json:', e);
        }
    }

    const appData = {
        settings: settings,
        images: images,
        playlist: playlist
    };

    const content = `/**
 * ARCHIVO DE DATOS DE ANIVERSARIO (GENERADO)
 * Generado el: ${new Date().toLocaleString()}
 */
const APP_IMAGES_DATA = ${JSON.stringify(appData, null, 4)};

if (typeof window !== 'undefined') {
    window.APP_IMAGES_DATA = APP_IMAGES_DATA;
}
`;

    fs.writeFileSync(dataFile, content);
    console.log(`✅ Sincronización completa: ${images.length} imágenes y ajustes actualizados.`);
    return appData;
}

if (require.main === module) {
    sync();
}

module.exports = sync;
