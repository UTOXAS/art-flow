const express = require('express');
const multer = require('multer');
const path = require('path');
const { generateImageDescription, generateImageFromText, generateInspiredArt } = require('../services/geminiService');

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../public/uploads'),
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
        const description = await generateImageDescription(req.file.path);
        res.json({ description });
    } catch (error) {
        console.error('Error in /image-description:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate description.' });
    }
});

router.post('/text-to-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'No prompt provided.' });
        }
        const filename = await generateImageFromText(prompt);
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
        const { instructions } = req.body;
        const result = await generateInspiredArt(req.file.path, instructions);
        res.json(result);
    } catch (error) {
        console.error('Error in /image-inspired:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to generate inspired art.' });
    }
});

module.exports = router;