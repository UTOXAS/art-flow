const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Explicit routes for feature pages
app.get('/image-description', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/image-description.html'));
});

app.get('/text-to-image', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/text-to-image.html'));
});

app.get('/image-inspired', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/image-inspired.html'));
});

// API Routes
app.use('/api', apiRoutes);

// Fallback to index.html for other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});