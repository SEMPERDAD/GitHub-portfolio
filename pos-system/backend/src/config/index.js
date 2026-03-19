require('dotenv').config();

module.exports = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    env: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    path: process.env.DB_PATH || './pos_data.db',
    postgres: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'pos_system',
      user: process.env.DB_USER || 'pos_user',
      password: process.env.DB_PASSWORD || '',
    },
  },
  tax: {
    defaultRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.08'),
    inclusive: process.env.TAX_INCLUSIVE === 'true',
  },
  currency: {
    code: process.env.CURRENCY_CODE || 'USD',
    symbol: process.env.CURRENCY_SYMBOL || '$',
  },
  store: {
    name: process.env.STORE_NAME || 'My Store',
    address: process.env.STORE_ADDRESS || '',
    phone: process.env.STORE_PHONE || '',
    receiptFooter: process.env.RECEIPT_FOOTER || 'Thank you for your business!',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '500', 10),
  },
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(','),
};
