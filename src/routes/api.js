const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { generateImageDescription, generateImageFromText, generateInspiredArt, generateArtFromDescription, regenerateImage } = require('../services/geminiService');

const router = express.Router();

// Ensure /tmp/uploads exists
const uploadDir = path.join(__dirname, '../../tmp/uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(err => {
    console.error('Error creating upload directory:', err.message);
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// API Endpoints
router.post('/image-description', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }
        const language = req.body.language || 'en';
        const description = await generateImageDescription(req.file.path, language);
        res.json({ description });
    } catch (error) {
        console.error('Error in /image-description:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate description.' });
    }
});

router.post('/text-to-image', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided.' });
        }
        const filename = await generateImageFromText(prompt, language);
        res.json({ filename });
    } catch (error) {
        console.error('Error in /text-to-image:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate image.' });
    }
});

router.post('/image-inspired', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }
        const { instructions, language } = req.body;
        const result = await generateInspiredArt(req.file.path, instructions, language);
        res.json(result);
    } catch (error) {
        console.error('Error in /image-inspired:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate inspired art.' });
    }
});

router.post('/description-to-art', async (req, res) => {
    try {
        const { description, language } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'No description provided.' });
        }
        const result = await generateArtFromDescription(description, language);
        res.json(result);
    } catch (error) {
        console.error('Error in /description-to-art:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate art from description.' });
    }
});

router.post('/regenerate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided.' });
        }
        const filename = await regenerateImage(prompt);
        res.json({ filename });
    } catch (error) {
        console.error('Error in /regenerate-image:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to regenerate image.' });
    }
});

module.exports = router;