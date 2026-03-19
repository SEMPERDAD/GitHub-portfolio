const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

// GET /inventory  — current stock levels
router.get('/', authenticate, [
  query('low_stock').optional().isBoolean(),
  query('category').optional().isString(),
  validate,
], (req, res) => {
  const { low_stock, category } = req.query;
  let sql = `
    SELECT p.id, p.sku, p.name, p.stock_qty, p.low_stock_alert, p.unit, p.track_inventory,
           c.name as category_name, c.id as category_id
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = 1 AND p.track_inventory = 1
  `;
  const params = [];
  if (low_stock === 'true') { sql += ' AND p.stock_qty <= p.low_stock_alert'; }
  if (category)             { sql += ' AND p.category_id = ?'; params.push(category); }
  sql += ' ORDER BY p.stock_qty ASC, p.name ASC';
  res.json(getDb().prepare(sql).all(...params));
});

// POST /inventory/adjust  — manual inventory adjustment
router.post('/adjust', authenticate, requirePermission('inventory'), [
  body('product_id').notEmpty(),
  body('qty_change').isFloat(),
  body('reason').isIn(['receive', 'count', 'waste', 'transfer', 'damage', 'other']),
  validate,
], (req, res) => {
  const { product_id, qty_change, reason, notes, reference } = req.body;
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ? AND track_inventory = 1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found or not tracked' });

  const qtyAfter = parseFloat((product.stock_qty + qty_change).toFixed(4));
  const adjId    = uuidv4();

  db.transaction(() => {
    db.prepare("UPDATE products SET stock_qty = ?, updated_at = datetime('now') WHERE id = ?").run(qtyAfter, product_id);
    db.prepare(`
      INSERT INTO inventory_adjustments (id, product_id, qty_before, qty_change, qty_after, reason, reference, employee_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(adjId, product_id, product.stock_qty, qty_change, qtyAfter, reason, reference || null, req.employee.id, notes || null);
  })();

  res.status(201).json({
    id: adjId, product_id, product_name: product.name,
    qty_before: product.stock_qty, qty_change, qty_after: qtyAfter, reason,
  });
});

// GET /inventory/adjustments  — audit trail
router.get('/adjustments', authenticate, [
  query('product_id').optional().isString(),
  query('reason').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 500 }),
  validate,
], (req, res) => {
  const { product_id, reason, limit = 100 } = req.query;
  let sql = `
    SELECT ia.*, p.name as product_name, p.sku,
           e.first_name || ' ' || e.last_name as employee_name
    FROM inventory_adjustments ia
    LEFT JOIN products p ON ia.product_id = p.id
    LEFT JOIN employees e ON ia.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (product_id) { sql += ' AND ia.product_id = ?'; params.push(product_id); }
  if (reason)     { sql += ' AND ia.reason = ?';     params.push(reason); }
  sql += ' ORDER BY ia.created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  res.json(getDb().prepare(sql).all(...params));
});

// POST /inventory/bulk-adjust  — import/receive multiple products
router.post('/bulk-adjust', authenticate, requirePermission('inventory'), [
  body('adjustments').isArray({ min: 1 }),
  body('adjustments.*.product_id').notEmpty(),
  body('adjustments.*.qty_change').isFloat(),
  body('reason').isIn(['receive', 'count', 'transfer']),
  validate,
], (req, res) => {
  const { adjustments, reason, reference, notes } = req.body;
  const db = getDb();

  const results = db.transaction(() => {
    return adjustments.map(adj => {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND track_inventory = 1').get(adj.product_id);
      if (!product) return { product_id: adj.product_id, error: 'Not found or not tracked' };

      const qtyAfter = parseFloat((product.stock_qty + adj.qty_change).toFixed(4));
      const adjId    = uuidv4();

      db.prepare("UPDATE products SET stock_qty = ?, updated_at = datetime('now') WHERE id = ?").run(qtyAfter, adj.product_id);
      db.prepare(`
        INSERT INTO inventory_adjustments (id, product_id, qty_before, qty_change, qty_after, reason, reference, employee_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(adjId, adj.product_id, product.stock_qty, adj.qty_change, qtyAfter,
             reason, reference || null, req.employee.id, notes || null);

      return { id: adjId, product_id: adj.product_id, product_name: product.name,
               qty_before: product.stock_qty, qty_change: adj.qty_change, qty_after: qtyAfter };
    });
  })();

  res.status(201).json({ adjusted: results.filter(r => !r.error), errors: results.filter(r => r.error) });
});

module.exports = router;
