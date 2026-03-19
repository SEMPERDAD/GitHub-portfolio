const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

// GET /products
router.get('/', authenticate, [
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('active').optional().isBoolean(),
  query('low_stock').optional().isBoolean(),
  validate,
], (req, res) => {
  const { category, search, active = 1, low_stock } = req.query;
  let sql = `
    SELECT p.*, c.name as category_name, c.color as category_color
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.active = ?
  `;
  const params = [active === 'false' ? 0 : 1];

  if (category) { sql += ' AND p.category_id = ?'; params.push(category); }
  if (search)   { sql += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (low_stock === 'true') { sql += ' AND p.track_inventory = 1 AND p.stock_qty <= p.low_stock_alert'; }

  sql += ' ORDER BY c.sort_order, p.name';
  const rows = getDb().prepare(sql).all(...params);
  rows.forEach(r => { r.modifiers = JSON.parse(r.modifiers || '[]'); });
  res.json(rows);
});

// GET /products/categories
router.get('/categories', authenticate, (req, res) => {
  const rows = getDb().prepare('SELECT * FROM categories WHERE active = 1 ORDER BY sort_order, name').all();
  res.json(rows);
});

// GET /products/barcode/:barcode
router.get('/barcode/:barcode', authenticate, (req, res) => {
  const row = getDb().prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.barcode = ? AND p.active = 1
  `).get(req.params.barcode);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  row.modifiers = JSON.parse(row.modifiers || '[]');
  res.json(row);
});

// GET /products/:id
router.get('/:id', authenticate, (req, res) => {
  const row = getDb().prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  row.modifiers = JSON.parse(row.modifiers || '[]');
  res.json(row);
});

// POST /products
router.post('/', authenticate, requirePermission('products'), [
  body('name').notEmpty(), body('sku').notEmpty(),
  body('price').isFloat({ min: 0 }),
  validate,
], (req, res) => {
  const { name, sku, barcode, description, category_id, price, cost = 0,
          tax_rate, track_inventory = 1, stock_qty = 0, low_stock_alert = 10,
          unit = 'ea', image_url, modifiers = [] } = req.body;
  const id = uuidv4();
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO products (id, sku, barcode, name, description, category_id, price, cost, tax_rate,
        track_inventory, stock_qty, low_stock_alert, unit, image_url, modifiers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, sku, barcode || null, name, description || null, category_id || null,
           price, cost, tax_rate || null, track_inventory ? 1 : 0, stock_qty,
           low_stock_alert, unit, image_url || null, JSON.stringify(modifiers));
    res.status(201).json({ id, ...req.body });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'SKU or barcode already exists' });
    throw err;
  }
});

// PUT /products/:id
router.put('/:id', authenticate, requirePermission('products'), (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const updates = {
    name:            req.body.name            ?? product.name,
    sku:             req.body.sku             ?? product.sku,
    barcode:         req.body.barcode         ?? product.barcode,
    description:     req.body.description     ?? product.description,
    category_id:     req.body.category_id     ?? product.category_id,
    price:           req.body.price           ?? product.price,
    cost:            req.body.cost            ?? product.cost,
    tax_rate:        req.body.tax_rate        ?? product.tax_rate,
    track_inventory: req.body.track_inventory ?? product.track_inventory,
    stock_qty:       req.body.stock_qty       ?? product.stock_qty,
    low_stock_alert: req.body.low_stock_alert ?? product.low_stock_alert,
    unit:            req.body.unit            ?? product.unit,
    image_url:       req.body.image_url       ?? product.image_url,
    active:          req.body.active          ?? product.active,
    modifiers:       JSON.stringify(req.body.modifiers ?? JSON.parse(product.modifiers || '[]')),
  };

  db.prepare(`
    UPDATE products SET name=@name, sku=@sku, barcode=@barcode, description=@description,
    category_id=@category_id, price=@price, cost=@cost, tax_rate=@tax_rate,
    track_inventory=@track_inventory, stock_qty=@stock_qty, low_stock_alert=@low_stock_alert,
    unit=@unit, image_url=@image_url, active=@active, modifiers=@modifiers,
    updated_at=datetime('now') WHERE id='${req.params.id}'
  `).run(updates);

  res.json({ id: req.params.id, ...updates, modifiers: JSON.parse(updates.modifiers) });
});

// DELETE /products/:id  (soft delete)
router.delete('/:id', authenticate, requirePermission('products'), (req, res) => {
  const db = getDb();
  const result = db.prepare("UPDATE products SET active = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.status(204).send();
});

// POST /products/categories
router.post('/categories', authenticate, requirePermission('products'), [
  body('name').notEmpty(), validate,
], (req, res) => {
  const { name, description, color = '#6366f1', icon = 'tag', sort_order = 0 } = req.body;
  const id = uuidv4();
  const db = getDb();
  try {
    db.prepare('INSERT INTO categories (id, name, description, color, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, description || null, color, icon, sort_order);
    res.status(201).json({ id, name, description, color, icon, sort_order });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Category name already exists' });
    throw err;
  }
});

module.exports = router;
