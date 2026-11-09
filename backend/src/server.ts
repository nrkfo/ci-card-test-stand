import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase, db } from './config/database.js';
import { testRoutes } from './routes/testRoutes.js';
import { statsRoutes } from './routes/statsRoutes.js';
import { adbRoutes } from './routes/adbRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize SQLite database with WAL mode
try {
  initDatabase();
  console.log('[DB] SQLite 3 database initialized with WAL mode (PRAGMA journal_mode=WAL)');
} catch (err) {
  console.error('[DB] Failed to initialize database:', err);
  process.exit(1);
}

// REST API Routes
app.use('/api/tests', testRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/adb', adbRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'qms-ci-station-backend',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  QMS-CI Test Station Backend (ADB CI/CI+ Validator)   `);
  console.log(`  Listening on: http://localhost:${PORT}               `);
  console.log(`  API Routes: /api/tests, /api/stats, /api/adb         `);
  console.log(`=======================================================`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down gracefully...');
  db.close();
  server.close(() => {
    console.log('[Server] Closed.');
    process.exit(0);
  });
});
