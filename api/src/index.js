const express = require('express');
const cors = require('cors');
const { pool, connectWithRetry } = require('./db');
const itemsRouter = require('./routes/items');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});

// API routes
app.use('/api/items', itemsRouter);
app.use('/api/orders', ordersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with database connection retry
async function start() {
  try {
    await connectWithRetry();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server running on port ${PORT}`);
      console.log(`Health check available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
