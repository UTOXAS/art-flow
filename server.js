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

// API Routes
app.use('/api', apiRoutes);

// View Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/index.html'));
});

app.get('/image-description', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/image-description.html'));
});

app.get('/text-to-image', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/text-to-image.html'));
});

app.get('/image-inspired', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/image-inspired.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});