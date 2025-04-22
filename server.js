const express = require('express');
const path = require('path');
const apiRoutes = require('./src/routes/api');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Basic Authentication Middleware
const auth = (req, res, next) => {
    // Skip authentication for /uploads
    if (req.path.startsWith('/uploads')) {
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

// Serve uploads directory without authentication
app.use('/uploads', (req, res, next) => {
    console.log(`Serving file: ${req.path}`);
    express.static(path.join(__dirname, 'tmp/uploads'))(req, res, next);
});

// Apply auth to API routes and other routes
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