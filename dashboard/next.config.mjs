import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load single central root .env file (../.env) into process.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/admin',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Sentry Home Security Admin',
    NEXT_PUBLIC_POLLING_INTERVAL: process.env.NEXT_PUBLIC_POLLING_INTERVAL || '3000',
    PORT: process.env.FRONTEND_PORT || '3001'
  }
};

export default nextConfig;
