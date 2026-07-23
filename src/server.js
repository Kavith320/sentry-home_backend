require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const adminRoutes = require('./routes/admin');
const { initMqttService } = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint & API status
app.get('/', (req, res) => {
  res.json({
    name: 'Smart Home Security IoT Backend',
    status: 'Running',
    endpoints: {
      gateways: '/api/admin/gateways',
      sensors: '/api/admin/sensors',
      simulateTelemetry: 'POST /api/admin/telemetry/simulate'
    }
  });
});

// Admin API Routes
app.use('/api/admin', adminRoutes);

// Server startup logic
async function startServer() {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize MQTT Service
    initMqttService();

    // 3. Start HTTP Express Listener
    const server = app.listen(PORT, () => {
      console.log(`🚀 [HTTP Server] Smart Home Security Backend listening on http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ [HTTP Server Error] Port ${PORT} is already in use by another process.`);
        console.error(`💡 Tip: Stop existing server instance or run: kill -9 $(lsof -t -i:${PORT})`);
      } else {
        console.error(`❌ [HTTP Server Error] ${err.message}`);
      }
      process.exit(1);
    });

    return { app, server };
  } catch (error) {
    console.error(`❌ [Server Error] Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

// Automatically start server if file executed directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
