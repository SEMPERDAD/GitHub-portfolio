const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const config = require('../../config');

const router = express.Router();

// POST /auth/login  — PIN or password login
router.post('/auth/login', [
  body('email').isEmail(),
  body('pin').isLength({ min: 4, max: 8 }),
  validate,
], (req, res) => {
  const { email, pin } = req.body;
  const db = getDb();
  const emp = db.prepare('SELECT * FROM employees WHERE email = ? AND active = 1').get(email);
  if (!emp) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = bcrypt.compareSync(pin, emp.pin);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { id: emp.id, email: emp.email, role: emp.role, name: `${emp.first_name} ${emp.last_name}`,
      permissions: JSON.parse(emp.permissions || '[]') },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  const { pin: _pin, password: _pw, ...safe } = emp;
  safe.permissions = JSON.parse(safe.permissions || '[]');
  res.json({ token, employee: safe });
});

// GET /employees
router.get('/', authenticate, requireRole('admin', 'manager'), (req, res) => {
  const rows = getDb().prepare(
    'SELECT id, first_name, last_name, email, role, permissions, active, created_at FROM employees ORDER BY first_name'
  ).all();
  rows.forEach(r => { r.permissions = JSON.parse(r.permissions || '[]'); });
  res.json(rows);
});

// POST /employees
router.post('/', authenticate, requireRole('admin'), [
  body('first_name').notEmpty(), body('last_name').notEmpty(),
  body('email').isEmail(), body('pin').isLength({ min: 4, max: 8 }),
  body('role').isIn(['admin', 'manager', 'cashier']),
  validate,
], (req, res) => {
  const { first_name, last_name, email, pin, role, permissions = [] } = req.body;
  const id      = uuidv4();
  const hashedPin = bcrypt.hashSync(pin, 10);
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO employees (id, first_name, last_name, email, pin, role, permissions)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, first_name, last_name, email, hashedPin, role, JSON.stringify(permissions));
    res.status(201).json({ id, first_name, last_name, email, role, permissions });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    throw err;
  }
});

// PUT /employees/:id
router.put('/:id', authenticate, requireRole('admin'), (req, res) => {
  const { first_name, last_name, email, role, permissions, pin, active } = req.body;
  const db = getDb();
  const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const updates = {
    first_name: first_name ?? emp.first_name,
    last_name:  last_name  ?? emp.last_name,
    email:      email      ?? emp.email,
    role:       role       ?? emp.role,
    active:     active     ?? emp.active,
    permissions: JSON.stringify(permissions ?? JSON.parse(emp.permissions || '[]')),
    pin: pin ? bcrypt.hashSync(pin, 10) : emp.pin,
  };

  db.prepare(`
    UPDATE employees SET first_name=@first_name, last_name=@last_name, email=@email,
    role=@role, permissions=@permissions, pin=@pin, active=@active,
    updated_at=datetime('now') WHERE id=?
  `).run({ ...updates }, req.params.id);

  res.json({ id: req.params.id, ...updates, permissions: JSON.parse(updates.permissions) });
});

module.exports = router;
