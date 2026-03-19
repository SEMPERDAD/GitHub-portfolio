const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const { getDb } = require('../../database');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');
const config = require('../../config');

const router = express.Router();

const PAYMENT_METHODS = ['cash', 'card', 'mobile', 'gift_card', 'check', 'store_credit', 'external'];

/**
 * Simulate a payment gateway — replace with Stripe / Square / Adyen in production.
 */
function processPaymentGateway(method, amount, gatewayData = {}) {
  if (method === 'cash') return { status: 'approved', reference: null };

  // Simulate decline for test card 4000000000000002
  if (gatewayData.card_number === '4000000000000002') {
    return { status: 'declined', error: 'Card declined' };
  }

  return {
    status: 'approved',
    reference: `TXN-${Date.now()}`,
    authorization_code: Math.random().toString(36).slice(2, 8).toUpperCase(),
  };
}

// POST /payments  — process payment for an order
router.post('/', authenticate, [
  body('order_id').notEmpty(),
  body('method').isIn(PAYMENT_METHODS),
  body('amount').isFloat({ min: 0.01 }),
  validate,
], (req, res) => {
  const { order_id, method, amount, reference, card_last4, card_brand, gateway_data = {} } = req.body;
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'completed' || order.status === 'voided') {
    return res.status(400).json({ error: `Order is ${order.status}` });
  }

  // Process via gateway (pluggable)
  const gatewayResult = processPaymentGateway(method, amount, gateway_data);
  if (gatewayResult.status === 'declined') {
    return res.status(402).json({ error: gatewayResult.error || 'Payment declined', gateway: gatewayResult });
  }

  const paymentId = uuidv4();
  const processPayment = db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (id, order_id, method, amount, reference, card_last4, card_brand, status, gateway_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(paymentId, order_id, method, amount, gatewayResult.reference || reference || null,
           card_last4 || null, card_brand || null, 'approved', JSON.stringify(gatewayResult));

    const totalPaid = db.prepare('SELECT SUM(amount) as total FROM payments WHERE order_id = ? AND status = "approved"').get(order_id).total || 0;
    const changeDue = Math.max(0, parseFloat((totalPaid - order.total).toFixed(2)));
    const newStatus = totalPaid >= order.total ? 'completed' : 'partial';

    db.prepare(`
      UPDATE orders SET amount_paid = ?, change_due = ?, status = ?,
      completed_at = CASE WHEN ? = 'completed' THEN datetime('now') ELSE completed_at END,
      updated_at = datetime('now')
      WHERE id = ?
    `).run(parseFloat(totalPaid.toFixed(2)), changeDue, newStatus, newStatus, order_id);

    // Deduct inventory for completed orders
    if (newStatus === 'completed') {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order_id);
      items.forEach(item => {
        if (!item.product_id) return;
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND track_inventory = 1').get(item.product_id);
        if (!product) return;

        const newQty = product.stock_qty - item.quantity;
        db.prepare("UPDATE products SET stock_qty = ?, updated_at = datetime('now') WHERE id = ?").run(newQty, item.product_id);
        db.prepare(`
          INSERT INTO inventory_adjustments (id, product_id, qty_before, qty_change, qty_after, reason, reference, employee_id)
          VALUES (?, ?, ?, ?, ?, 'sale', ?, ?)
        `).run(uuidv4(), item.product_id, product.stock_qty, -item.quantity, newQty, order_id, req.employee.id);
      });

      // Award loyalty points (1 pt per dollar)
      if (order.customer_id) {
        const pts = Math.floor(order.total);
        db.prepare("UPDATE customers SET loyalty_pts = loyalty_pts + ? WHERE id = ?").run(pts, order.customer_id);
      }
    }

    return { totalPaid, changeDue, newStatus };
  });

  const result = processPayment();
  res.status(201).json({
    id: paymentId,
    order_id,
    method,
    amount: parseFloat(amount),
    status: 'approved',
    reference: gatewayResult.reference || reference || null,
    order_status: result.newStatus,
    amount_paid: result.totalPaid,
    change_due: result.changeDue,
    gateway: gatewayResult,
  });
});

// POST /payments/:id/refund
router.post('/:id/refund', authenticate, requirePermission => authenticate, [
  body('amount').isFloat({ min: 0.01 }),
  body('reason').notEmpty(),
  validate,
], (req, res) => {
  const db = getDb();
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });

  const refundAmount = Math.min(parseFloat(req.body.amount), payment.amount);
  const refundId = uuidv4();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(payment.order_id);

  db.transaction(() => {
    db.prepare(`
      INSERT INTO payments (id, order_id, method, amount, reference, status, gateway_data)
      VALUES (?, ?, ?, ?, ?, 'refunded', ?)
    `).run(refundId, payment.order_id, payment.method, -refundAmount,
           `REFUND-${payment.reference || payment.id}`, JSON.stringify({ reason: req.body.reason }));

    db.prepare("UPDATE payments SET status = 'refunded' WHERE id = ?").run(payment.id);
    db.prepare("UPDATE orders SET status = 'refunded', updated_at = datetime('now') WHERE id = ?").run(payment.order_id);

    // Return inventory
    if (order) {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(payment.order_id);
      items.forEach(item => {
        if (!item.product_id) return;
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND track_inventory = 1').get(item.product_id);
        if (!product) return;
        const newQty = product.stock_qty + item.quantity;
        db.prepare("UPDATE products SET stock_qty = ? WHERE id = ?").run(newQty, item.product_id);
        db.prepare(`
          INSERT INTO inventory_adjustments (id, product_id, qty_before, qty_change, qty_after, reason, reference, employee_id)
          VALUES (?, ?, ?, ?, ?, 'refund', ?, ?)
        `).run(uuidv4(), item.product_id, product.stock_qty, item.quantity, newQty, payment.order_id, req.employee.id);
      });
    }
  })();

  res.json({ id: refundId, original_payment_id: payment.id, amount: refundAmount, status: 'refunded' });
});

// GET /payments/methods
router.get('/methods', authenticate, (req, res) => {
  res.json(PAYMENT_METHODS.map(m => ({
    id: m,
    label: m.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    requires_amount: true,
  })));
});

module.exports = router;
