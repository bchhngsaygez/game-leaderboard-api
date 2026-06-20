require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./config/logger');
const rankRoutes = require('./routes/rankRoutes');
const healthRoutes = require('./routes/healthRoutes');
const setupSwagger = require('./docs/swagger');
const apiLimiter = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// === Global Middlewares ===
app.use(cors());
app.use(express.json());
app.use(morgan('short', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use('/api/', apiLimiter);

// === API Docs ===
setupSwagger(app);

// === Routes ===
app.use('/health', healthRoutes);
app.use('/api/v1/ranks', rankRoutes);

// === 404 catch-all ===
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// === Global Error Handler ===
app.use(errorHandler);

// === Start server (only when run directly, not when required by tests) ===
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
    logger.info(`Swagger docs at http://localhost:${PORT}/api-docs`);
  });
}

module.exports = app;
