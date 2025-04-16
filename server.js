const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Basic Authentication Middleware
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.set('WWW-Authenticate', 'Basic realm="Art Flow"');
        return res.status(401).send('Authentication required.');
    }

    const [username, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
        .toString()
        .split(':');
    const expectedUsername = process.env.AUTH_USERNAME;
    const expectedPassword = process.env.AUTH_PASSWORD;

    if (username === expectedUsername && password === expectedPassword) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Art Flow"');
    res.status(401).send('Invalid credentials.');
};

// Apply auth to all routes
app.use(auth);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// API Routes
app.use('/api', apiRoutes);

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Periodic cleanup of uploads folder (every 24 hours)
const cleanupUploads = async () => {
    const uploadsDir = path.join(__dirname, 'public/uploads');
    try {
        const files = await fs.readdir(uploadsDir);
        for (const file of files) {
            await fs.unlink(path.join(uploadsDir, file)).catch(err =>
                console.warn(`Failed to delete ${file}: ${err.message}`)
            );
        }
        console.log('Uploads folder cleaned.');
    } catch (err) {
        console.error(`Error cleaning uploads: ${err.message}`);
    }
};
setInterval(cleanupUploads, 24 * 60 * 60 * 1000); // 24 hours
cleanupUploads(); // Run on startup

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});