const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const sync = require('./sync');

const app = express();
const port = 3000;

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, 'img');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Usar la fecha enviada en el body o la actual si no hay
        const date = req.body.date || new Date().toISOString().split('T')[0];
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${date}_${uniqueSuffix}${ext}`);
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Endpoint para subir múltiples fotos
app.post('/upload', upload.array('photos'), (req, res) => {
    try {
        console.log(`📸 Recibidas ${req.files.length} fotos con fecha: ${req.body.date}`);
        // Forzar sincronización de images-data.js
        sync();
        res.status(200).json({
            success: true,
            message: `${req.files.length} fotos guardadas en /img/ y sincronizadas.`
        });
    } catch (err) {
        console.error('Error en /upload:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint para borrar una foto
app.post('/delete', (req, res) => {
    try {
        const { src } = req.body;
        if (!src) return res.status(400).json({ success: false, message: 'No se especificó la ruta de la imagen.' });

        // Normalizar la ruta para evitar borrados fuera de /img/
        const fileName = path.basename(src);
        const filePath = path.join(__dirname, 'img', fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Archivo borrado: ${filePath}`);
            // Re-sincronizar
            sync();
            res.status(200).json({ success: true, message: 'Imagen borrada correctamente.' });
        } else {
            res.status(404).json({ success: false, message: 'La imagen no existe en el servidor.' });
        }
    } catch (err) {
        console.error('Error en /delete:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint para guardar ajustes globales (Persistencia Total en CÓDIGO)
app.post('/save-settings', (req, res) => {
    try {
        const settings = req.body;
        const settingsPath = path.join(__dirname, 'settings.json');

        let currentSettings = {};
        if (fs.existsSync(settingsPath)) {
            currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }

        const newSettings = {
            ...currentSettings,
            ...settings
        };

        fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 4));
        console.log('⚙️ Ajustes actualizados físicamente:', newSettings);

        // Sincronizar images-data.js
        sync();

        res.status(200).json({ success: true, message: 'Ajustes guardados en el CÓDIGO.' });
    } catch (err) {
        console.error('Error en /save-settings:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint para guardar la playlist (múltiples canciones)
app.post('/save-playlist', (req, res) => {
    try {
        const playlist = req.body; // Se espera un array de strings
        if (!Array.isArray(playlist)) {
            return res.status(400).json({ success: false, message: 'La playlist debe ser un array.' });
        }

        const playlistPath = path.join(__dirname, 'playlist.json');
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 4));
        console.log('🎵 Playlist actualizada físicamente:', playlist);

        sync();
        res.status(200).json({ success: true, message: 'Playlist guardada en el CÓDIGO.' });
    } catch (err) {
        console.error('Error en /save-playlist:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Endpoint para verificar si el servidor está activo
app.get('/ping', (req, res) => res.send('pong'));

app.listen(port, () => {
    console.log(`
🚀 SERVIDOR DE ANIVERSARIO ACTIVO
----------------------------------
URL: http://localhost:${port}
Carpeta de destino: /img/

Este servidor permite que el panel admin guarde fotos directamente en tu disco.
¡Mantén esta ventana abierta mientras configuras tu álbum!
----------------------------------
    `);
});
