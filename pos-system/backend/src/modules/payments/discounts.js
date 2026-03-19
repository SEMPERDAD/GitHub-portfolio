const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const router = express.Router();

// GET /discounts
router.get('/', authenticate, (req, res) => {
  res.json(getDb().prepare('SELECT * FROM discounts WHERE active = 1 ORDER BY name').all());
});

// POST /discounts/validate  — validate a discount code against an order subtotal
router.post('/validate', authenticate, [
  body('code').notEmpty(),
  body('subtotal').isFloat({ min: 0 }),
  validate,
], (req, res) => {
  const { code, subtotal } = req.body;
  const discount = getDb().prepare('SELECT * FROM discounts WHERE code = ? AND active = 1').get(code.toUpperCase());

  if (!discount) return res.status(404).json({ error: 'Invalid discount code' });

  const now = new Date().toISOString();
  if (discount.starts_at  && now < discount.starts_at)  return res.status(400).json({ error: 'Discount not yet active' });
  if (discount.expires_at && now > discount.expires_at) return res.status(400).json({ error: 'Discount expired' });
  if (discount.max_uses   && discount.uses_count >= discount.max_uses) return res.status(400).json({ error: 'Discount usage limit reached' });
  if (subtotal < discount.min_order) return res.status(400).json({ error: `Minimum order of $${discount.min_order} required` });

  let amount;
  if (discount.type === 'percentage') {
    amount = parseFloat((subtotal * discount.value / 100).toFixed(2));
  } else {
    amount = Math.min(discount.value, subtotal);
  }

  res.json({ valid: true, discount, applied_amount: amount });
});

// POST /discounts
router.post('/', authenticate, requirePermission('discounts'), [
  body('name').notEmpty(),
  body('type').isIn(['percentage', 'fixed']),
  body('value').isFloat({ min: 0.01 }),
  validate,
], (req, res) => {
  const { code, name, type, value, min_order = 0, max_uses, starts_at, expires_at } = req.body;
  const id = uuidv4();
  getDb().prepare(`
    INSERT INTO discounts (id, code, name, type, value, min_order, max_uses, starts_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, code ? code.toUpperCase() : null, name, type, value, min_order, max_uses || null, starts_at || null, expires_at || null);
  res.status(201).json({ id, code, name, type, value });
});

// PUT /discounts/:id
router.put('/:id', authenticate, requirePermission('discounts'), (req, res) => {
  const db = getDb();
  const discount = db.prepare('SELECT * FROM discounts WHERE id = ?').get(req.params.id);
  if (!discount) return res.status(404).json({ error: 'Discount not found' });

  const updates = { active: req.body.active ?? discount.active, ...req.body };
  db.prepare(`
    UPDATE discounts SET name=@name, type=@type, value=@value, min_order=@min_order,
    max_uses=@max_uses, active=@active, starts_at=@starts_at, expires_at=@expires_at WHERE id='${req.params.id}'
  `).run({ ...discount, ...updates });
  res.json({ id: req.params.id, ...discount, ...updates });
});

// DELETE /discounts/:id
router.delete('/:id', authenticate, requirePermission('discounts'), (req, res) => {
  const result = getDb().prepare("UPDATE discounts SET active = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Discount not found' });
  res.status(204).send();
});

module.exports = router;
