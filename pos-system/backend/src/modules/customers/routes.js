const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

// GET /customers
router.get('/', authenticate, [
  query('search').optional().isString(),
  validate,
], (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM customers WHERE active = 1';
  const params = [];
  if (search) {
    sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY first_name, last_name LIMIT 50';
  res.json(getDb().prepare(sql).all(...params));
});

// GET /customers/:id
router.get('/:id', authenticate, (req, res) => {
  const customer = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const orders = getDb().prepare(`
    SELECT id, order_number, status, total, created_at FROM orders
    WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(req.params.id);

  res.json({ ...customer, recent_orders: orders });
});

// POST /customers
router.post('/', authenticate, [
  body('first_name').notEmpty(), body('last_name').notEmpty(),
  body('email').optional().isEmail(),
  validate,
], (req, res) => {
  const { first_name, last_name, email, phone, address, city, state, zip, notes } = req.body;
  const id = uuidv4();
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO customers (id, first_name, last_name, email, phone, address, city, state, zip, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, first_name, last_name, email || null, phone || null, address || null, city || null, state || null, zip || null, notes || null);
    res.status(201).json({ id, first_name, last_name, email, phone, loyalty_pts: 0 });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw err;
  }
});

// PUT /customers/:id
router.put('/:id', authenticate, (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const updates = {
    first_name:   req.body.first_name   ?? customer.first_name,
    last_name:    req.body.last_name    ?? customer.last_name,
    email:        req.body.email        ?? customer.email,
    phone:        req.body.phone        ?? customer.phone,
    address:      req.body.address      ?? customer.address,
    city:         req.body.city         ?? customer.city,
    state:        req.body.state        ?? customer.state,
    zip:          req.body.zip          ?? customer.zip,
    notes:        req.body.notes        ?? customer.notes,
    loyalty_pts:  req.body.loyalty_pts  ?? customer.loyalty_pts,
  };

  db.prepare(`
    UPDATE customers SET first_name=@first_name, last_name=@last_name, email=@email, phone=@phone,
    address=@address, city=@city, state=@state, zip=@zip, notes=@notes, loyalty_pts=@loyalty_pts,
    updated_at=datetime('now') WHERE id='${req.params.id}'
  `).run(updates);

  res.json({ id: req.params.id, ...updates });
});

// DELETE /customers/:id  (soft delete)
router.delete('/:id', authenticate, (req, res) => {
  const result = getDb().prepare("UPDATE customers SET active = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Customer not found' });
  res.status(204).send();
});

// POST /customers/:id/loyalty  — add/subtract loyalty points
router.post('/:id/loyalty', authenticate, [
  body('points').isInt(), body('reason').notEmpty(), validate,
], (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const newPts = Math.max(0, customer.loyalty_pts + req.body.points);
  db.prepare("UPDATE customers SET loyalty_pts = ?, updated_at = datetime('now') WHERE id = ?").run(newPts, req.params.id);
  res.json({ id: req.params.id, loyalty_pts: newPts, change: req.body.points });
});

module.exports = router;
