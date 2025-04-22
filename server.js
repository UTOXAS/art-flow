const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware to set correct MIME types for font files
app.use((req, res, next) => {
    if (req.path.endsWith('.woff')) {
        res.set('Content-Type', 'font/woff');
    } else if (req.path.endsWith('.woff2')) {
        res.set('Content-Type', 'font/woff2');
    }
    next();
});

// Basic Authentication Middleware
const auth = (req, res, next) => {
    // Skip authentication for static assets and API routes
    if (
        req.path.startsWith('/css') ||
        req.path.startsWith('/js') ||
        req.path.startsWith('/images') ||
        req.path.startsWith('/bootstrap') ||
        req.path.startsWith('/api')
    ) {
        console.log(`Serving static asset: ${req.path}`);
        return next();
    }

    // Log User-Agent for debugging
    const userAgent = req.headers['user-agent'] || 'Unknown';
    console.log(`Request for ${req.path} from User-Agent: ${userAgent}`);

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.set('WWW-Authenticate', 'Basic realm="Art Flow"');
        // Prevent caching of authentication prompt
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
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
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(401).send('Invalid credentials.');
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), {
    // Ensure correct MIME types for fonts
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.woff')) {
            res.set('Content-Type', 'font/woff');
        } else if (filePath.endsWith('.woff2')) {
            res.set('Content-Type', 'font/woff2');
        }
    }
}));

// Apply auth to non-static routes
app.use(auth);

// API Routes
app.use('/api', apiRoutes);

// Serve index.html for all non-static routes
app.get('*', (req, res) => {
    console.log(`Catch-all route hit: ${req.path}`);
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});