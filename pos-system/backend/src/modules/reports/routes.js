const express = require('express');
const { query } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

function dateRange(req) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    from: req.query.date_from || today,
    to:   req.query.date_to   || today,
  };
}

// GET /reports/summary  — daily/range sales summary
router.get('/summary', authenticate, requirePermission('reports'), [
  query('date_from').optional().isString(),
  query('date_to').optional().isString(),
  validate,
], (req, res) => {
  const { from, to } = dateRange(req);
  const db = getDb();

  const sales = db.prepare(`
    SELECT
      COUNT(*) as order_count,
      SUM(total) as gross_sales,
      SUM(discount_amount) as total_discounts,
      SUM(tax_amount) as total_tax,
      SUM(tip_amount) as total_tips,
      SUM(total) as net_sales,
      AVG(total) as avg_order_value
    FROM orders
    WHERE status = 'completed'
      AND date(created_at) BETWEEN ? AND ?
  `).get(from, to);

  const byMethod = db.prepare(`
    SELECT p.method, COUNT(*) as count, SUM(p.amount) as total
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    WHERE p.status = 'approved' AND p.amount > 0
      AND date(o.created_at) BETWEEN ? AND ?
    GROUP BY p.method
  `).all(from, to);

  const byHour = db.prepare(`
    SELECT strftime('%H', created_at) as hour, COUNT(*) as orders, SUM(total) as sales
    FROM orders WHERE status = 'completed' AND date(created_at) BETWEEN ? AND ?
    GROUP BY hour ORDER BY hour
  `).all(from, to);

  const refunds = db.prepare(`
    SELECT COUNT(*) as count, ABS(SUM(amount)) as total
    FROM payments WHERE status = 'refunded' AND date(created_at) BETWEEN ? AND ?
  `).get(from, to);

  res.json({
    period: { from, to },
    sales: {
      order_count:      sales.order_count    || 0,
      gross_sales:      +(sales.gross_sales  || 0).toFixed(2),
      total_discounts:  +(sales.total_discounts || 0).toFixed(2),
      total_tax:        +(sales.total_tax    || 0).toFixed(2),
      total_tips:       +(sales.total_tips   || 0).toFixed(2),
      net_sales:        +(sales.net_sales    || 0).toFixed(2),
      avg_order_value:  +(sales.avg_order_value || 0).toFixed(2),
    },
    refunds: {
      count: refunds.count || 0,
      total: +(refunds.total || 0).toFixed(2),
    },
    payment_methods: byMethod,
    sales_by_hour: byHour,
  });
});

// GET /reports/top-products
router.get('/top-products', authenticate, requirePermission('reports'), [
  query('date_from').optional().isString(),
  query('date_to').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  validate,
], (req, res) => {
  const { from, to } = dateRange(req);
  const limit = parseInt(req.query.limit || '10');

  const rows = getDb().prepare(`
    SELECT oi.name, oi.sku, oi.product_id,
           SUM(oi.quantity) as total_qty,
           SUM(oi.line_total) as total_revenue,
           COUNT(DISTINCT oi.order_id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'completed' AND date(o.created_at) BETWEEN ? AND ?
    GROUP BY COALESCE(oi.product_id, oi.name)
    ORDER BY total_revenue DESC
    LIMIT ?
  `).all(from, to, limit);

  res.json({ period: { from, to }, products: rows });
});

// GET /reports/top-categories
router.get('/top-categories', authenticate, requirePermission('reports'), [
  query('date_from').optional().isString(),
  query('date_to').optional().isString(),
  validate,
], (req, res) => {
  const { from, to } = dateRange(req);

  const rows = getDb().prepare(`
    SELECT c.name as category, c.color,
           SUM(oi.quantity) as total_qty,
           SUM(oi.line_total) as total_revenue,
           COUNT(DISTINCT o.id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE o.status = 'completed' AND date(o.created_at) BETWEEN ? AND ?
    GROUP BY c.id
    ORDER BY total_revenue DESC
  `).all(from, to);

  res.json({ period: { from, to }, categories: rows });
});

// GET /reports/employees
router.get('/employees', authenticate, requirePermission('reports'), [
  query('date_from').optional().isString(),
  query('date_to').optional().isString(),
  validate,
], (req, res) => {
  const { from, to } = dateRange(req);

  const rows = getDb().prepare(`
    SELECT e.id, e.first_name || ' ' || e.last_name as name, e.role,
           COUNT(o.id) as orders_handled,
           SUM(o.total) as total_sales,
           AVG(o.total) as avg_order
    FROM orders o
    JOIN employees e ON o.employee_id = e.id
    WHERE o.status = 'completed' AND date(o.created_at) BETWEEN ? AND ?
    GROUP BY o.employee_id
    ORDER BY total_sales DESC
  `).all(from, to);

  res.json({ period: { from, to }, employees: rows });
});

// GET /reports/inventory-value
router.get('/inventory-value', authenticate, requirePermission('reports'), (req, res) => {
  const summary = getDb().prepare(`
    SELECT
      COUNT(*) as product_count,
      SUM(stock_qty * cost) as cost_value,
      SUM(stock_qty * price) as retail_value,
      SUM(CASE WHEN stock_qty <= low_stock_alert THEN 1 ELSE 0 END) as low_stock_count
    FROM products WHERE active = 1 AND track_inventory = 1
  `).get();

  res.json({
    product_count:   summary.product_count   || 0,
    cost_value:      +(summary.cost_value    || 0).toFixed(2),
    retail_value:    +(summary.retail_value  || 0).toFixed(2),
    potential_margin: +(((summary.retail_value || 0) - (summary.cost_value || 0)).toFixed(2)),
    low_stock_count: summary.low_stock_count || 0,
  });
});

// GET /reports/discounts
router.get('/discounts', authenticate, requirePermission('reports'), [
  query('date_from').optional().isString(),
  query('date_to').optional().isString(),
  validate,
], (req, res) => {
  const { from, to } = dateRange(req);

  const usage = getDb().prepare(`
    SELECT SUM(discount_amount) as total_discounts, COUNT(*) as orders_with_discount
    FROM orders
    WHERE status = 'completed' AND discount_amount > 0
      AND date(created_at) BETWEEN ? AND ?
  `).get(from, to);

  const codes = getDb().prepare(`
    SELECT d.code, d.name, d.type, d.value, d.uses_count
    FROM discounts d ORDER BY d.uses_count DESC
  `).all();

  res.json({
    period: { from, to },
    total_discounts: +(usage.total_discounts || 0).toFixed(2),
    orders_with_discount: usage.orders_with_discount || 0,
    discount_codes: codes,
  });
});

module.exports = router;
