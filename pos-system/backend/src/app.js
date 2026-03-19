require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const config       = require('./config');
const { initSchema } = require('./database');

// Route modules
const employeeRoutes  = require('./modules/employees/routes');
const productRoutes   = require('./modules/products/routes');
const customerRoutes  = require('./modules/customers/routes');
const orderRoutes     = require('./modules/orders/routes');
const paymentRoutes   = require('./modules/payments/routes');
const inventoryRoutes = require('./modules/inventory/routes');
const reportRoutes    = require('./modules/reports/routes');
const discountRoutes  = require('./modules/payments/discounts');

// ─── Initialize DB ──────────────────────────────────────────────
initSchema();

const app = express();

// ─── Security & Middleware ──────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || config.allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(morgan(config.server.env === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ─── Routes ─────────────────────────────────────────────────────
app.use('/api/employees', employeeRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders',    orderRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/discounts', discountRoutes);

// Auth endpoint lives under employees module but also aliased
app.use('/api', employeeRoutes);

// ─── Health Check ───────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    env: config.server.env,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Docs ───────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name: 'Modular POS System API',
    version: '1.0.0',
    endpoints: {
      auth:       'POST /api/auth/login',
      employees:  '/api/employees',
      products:   '/api/products',
      categories: '/api/products/categories',
      customers:  '/api/customers',
      orders:     '/api/orders',
      payments:   '/api/payments',
      inventory:  '/api/inventory',
      discounts:  '/api/discounts',
      reports:    '/api/reports/{summary|top-products|top-categories|employees|inventory-value}',
    },
  });
});

// ─── Error Handler ──────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);
  if (err.message.includes('CORS')) return res.status(403).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error', details: config.server.env === 'development' ? err.message : undefined });
});

// ─── Start ──────────────────────────────────────────────────────
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`\n🏪 POS System API running on http://localhost:${PORT}`);
  console.log(`   API Docs: http://localhost:${PORT}/api`);
  console.log(`   Health:   http://localhost:${PORT}/health\n`);
});

module.exports = app;
