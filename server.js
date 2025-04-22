const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Basic Authentication Middleware
const auth = (req, res, next) => {
    // Skip authentication for static assets and API routes will handle their own auth if needed
    if (
        req.path.startsWith('/css') ||
        req.path.startsWith('/js') ||
        req.path.startsWith('/images') ||
        req.path.startsWith('/bootstrap')
    ) {
        return next();
    }

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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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