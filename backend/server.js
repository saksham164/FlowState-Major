const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
const config = require('../config');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Security & Parsing
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: !config.isDev, httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

// Logging (dev only)
if (config.isDev) app.use(morgan('dev'));

// API Routes
const apiRouter = require('./routes');
app.use('/api', apiRouter);

// Dev mode: show helpful info at root
if (config.isDev) {
  app.get('/', (req, res) => {
    res.json({
      service: 'FlowState API',
      status: 'running',
      endpoints: {
        health: '/api/health',
        docs: 'API routes are prefixed with /api',
      },
      frontend: 'http://localhost:5173',
      note: 'In dev mode, open the frontend URL above — not this one.',
    });
  });
}

// In production, serve the React build
if (!config.isDev) {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  });
}

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server — use http.createServer for Express 5 compatibility
const PORT = config.port;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  ⚡ FlowState API server running`);
  console.log(`  → Environment : ${config.nodeEnv}`);
  console.log(`  → Port        : ${PORT}`);
  console.log(`  → URL         : http://localhost:${PORT}\n`);
});

module.exports = app;

