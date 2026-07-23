const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const mongoURI = uri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sentry-home';
  try {
    const conn = await mongoose.connect(mongoURI, { family: 4 });
    console.log(`🗄️  [Database] Connected successfully to Mongo DB '${conn.connection.name}' at ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ [Database] Connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
