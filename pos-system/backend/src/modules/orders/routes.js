const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate, requirePermission } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const config = require('../../config');

const router = express.Router();

function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = String(now.getTime()).slice(-6);
  return `ORD-${date}-${time}`;
}

function calcTotals(items, discountAmount = 0, tipAmount = 0, taxRate = config.tax.defaultRate) {
  const subtotal = items.reduce((sum, item) => {
    const base = item.unit_price * item.quantity;
    const disc = base * ((item.discount_pct || 0) / 100);
    return sum + (base - disc);
  }, 0);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const tax = parseFloat((discountedSubtotal * taxRate).toFixed(2));
  const total = parseFloat((discountedSubtotal + tax + tipAmount).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), discount_amount: parseFloat(discountAmount.toFixed(2)),
           tax_amount: tax, tip_amount: parseFloat(tipAmount.toFixed(2)), total };
}

// GET /orders
router.get('/', authenticate, [
  query('status').optional().isString(),
  query('customer_id').optional().isString(),
  query('date_from').optional().isString(),
  query('date_to').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 }),
  validate,
], (req, res) => {
  const { status, customer_id, date_from, date_to, limit = 50, offset = 0 } = req.query;
  let sql = `
    SELECT o.*, c.first_name || ' ' || c.last_name as customer_name,
           e.first_name || ' ' || e.last_name as employee_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN employees e ON o.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (status)      { sql += ' AND o.status = ?';                       params.push(status); }
  if (customer_id) { sql += ' AND o.customer_id = ?';                  params.push(customer_id); }
  if (date_from)   { sql += ' AND o.created_at >= ?';                  params.push(date_from); }
  if (date_to)     { sql += ' AND o.created_at <= ?';                  params.push(date_to + ' 23:59:59'); }
  sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const orders = getDb().prepare(sql).all(...params);
  res.json(orders);
});

// GET /orders/:id  — with items and payments
router.get('/:id', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare(`
    SELECT o.*, c.first_name || ' ' || c.last_name as customer_name,
           e.first_name || ' ' || e.last_name as employee_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN employees e ON o.employee_id = e.id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.metadata = JSON.parse(order.metadata || '{}');
  order.items    = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  order.items.forEach(i => { i.modifiers = JSON.parse(i.modifiers || '[]'); });
  order.payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(req.params.id);

  res.json(order);
});

// POST /orders  — create new order / cart
router.post('/', authenticate, [
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').optional().isString(),
  body('items.*.name').notEmpty(),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  validate,
], (req, res) => {
  const db = getDb();
  const { items, customer_id, discount_amount = 0, tip_amount = 0,
          tax_rate, notes, register_id, metadata = {} } = req.body;

  const id = uuidv4();
  const order_number = generateOrderNumber();
  const totals = calcTotals(items, parseFloat(discount_amount), parseFloat(tip_amount),
                             tax_rate !== undefined ? parseFloat(tax_rate) : config.tax.defaultRate);

  const insertOrder = db.transaction(() => {
    db.prepare(`
      INSERT INTO orders (id, order_number, customer_id, employee_id, register_id,
        subtotal, discount_amount, tax_amount, tip_amount, total, notes, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, order_number, customer_id || null, req.employee.id, register_id || null,
           totals.subtotal, totals.discount_amount, totals.tax_amount, totals.tip_amount,
           totals.total, notes || null, JSON.stringify(metadata));

    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, name, sku, quantity, unit_price, discount_pct, tax_rate, line_total, modifiers, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      const base      = item.unit_price * item.quantity;
      const disc      = base * ((item.discount_pct || 0) / 100);
      const line_total = parseFloat((base - disc).toFixed(2));
      insertItem.run(uuidv4(), id, item.product_id || null, item.name, item.sku || null,
                     item.quantity, item.unit_price, item.discount_pct || 0,
                     item.tax_rate || config.tax.defaultRate, line_total,
                     JSON.stringify(item.modifiers || []), item.notes || null);
    });
  });

  insertOrder();
  res.status(201).json({ id, order_number, ...totals, status: 'open' });
});

// PATCH /orders/:id  — update cart before checkout
router.patch('/:id', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'completed' || order.status === 'refunded') {
    return res.status(400).json({ error: 'Cannot modify a completed order' });
  }

  const { customer_id, notes, discount_amount, tip_amount, tax_rate, status, items } = req.body;

  const updateData = {
    customer_id:     customer_id     !== undefined ? customer_id     : order.customer_id,
    notes:           notes           !== undefined ? notes           : order.notes,
    discount_amount: discount_amount !== undefined ? parseFloat(discount_amount) : order.discount_amount,
    tip_amount:      tip_amount      !== undefined ? parseFloat(tip_amount)      : order.tip_amount,
    status:          status          !== undefined ? status          : order.status,
  };

  // Recalculate if items or amounts changed
  if (items || discount_amount !== undefined || tip_amount !== undefined) {
    const currentItems = items || db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const totals = calcTotals(
      currentItems.map(i => ({ ...i, unit_price: i.unit_price || i.price })),
      updateData.discount_amount, updateData.tip_amount,
      tax_rate !== undefined ? parseFloat(tax_rate) : config.tax.defaultRate
    );
    Object.assign(updateData, totals);
  }

  db.prepare(`
    UPDATE orders SET customer_id=@customer_id, notes=@notes, discount_amount=@discount_amount,
    tip_amount=@tip_amount, status=@status, subtotal=@subtotal, tax_amount=@tax_amount,
    total=@total, updated_at=datetime('now') WHERE id='${order.id}'
  `).run({ subtotal: order.subtotal, tax_amount: order.tax_amount, total: order.total, ...updateData });

  if (items) {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(order.id);
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, name, sku, quantity, unit_price, discount_pct, tax_rate, line_total, modifiers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    items.forEach(item => {
      const base = item.unit_price * item.quantity;
      const disc = base * ((item.discount_pct || 0) / 100);
      insertItem.run(uuidv4(), order.id, item.product_id || null, item.name, item.sku || null,
                     item.quantity, item.unit_price, item.discount_pct || 0,
                     item.tax_rate || config.tax.defaultRate,
                     parseFloat((base - disc).toFixed(2)), JSON.stringify(item.modifiers || []));
    });
  }

  res.json({ id: order.id, ...updateData });
});

// POST /orders/:id/void  — void an order
router.post('/:id/void', authenticate, requirePermission('orders'), [
  body('reason').notEmpty(), validate,
], (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'voided') return res.status(400).json({ error: 'Order already voided' });

  db.prepare("UPDATE orders SET status = 'voided', updated_at = datetime('now') WHERE id = ?").run(order.id);
  res.json({ id: order.id, status: 'voided', reason: req.body.reason });
});

// GET /orders/:id/receipt  — structured receipt data
router.get('/:id/receipt', authenticate, (req, res) => {
  const db = getDb();
  const order = db.prepare('SELECT o.*, c.first_name || " " || c.last_name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items    = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(order.id);

  res.json({
    store:   config.store,
    order:   { ...order, metadata: JSON.parse(order.metadata || '{}') },
    items,
    payments,
    currency: config.currency,
    printed_at: new Date().toISOString(),
  });
});

module.exports = router;
