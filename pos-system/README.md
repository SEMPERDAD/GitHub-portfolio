# Modular POS System

Enterprise-grade, integrable Point-of-Sale system. Plug it into any application via REST API, embeddable UI widget, or JavaScript SDK — similar to the Microsoft Dynamics 365 Commerce modular architecture.

---

## Architecture

```
pos-system/
├── backend/          # Node.js + Express REST API (SQLite / PostgreSQL)
│   └── src/
│       ├── modules/
│       │   ├── products/     # Catalog, categories, barcode lookup
│       │   ├── orders/       # Cart management, checkout, receipts
│       │   ├── payments/     # Multi-method payment processing, refunds, discounts
│       │   ├── customers/    # CRM, loyalty points
│       │   ├── inventory/    # Stock tracking, adjustments, audit trail
│       │   ├── employees/    # Auth (PIN/JWT), roles & permissions
│       │   └── reports/      # Sales, top products, employee performance
│       └── database/         # Schema + seed data
│
├── frontend/         # React POS Terminal
│   └── src/
│       ├── components/
│       │   ├── POSTerminal/  # Main POS screen
│       │   ├── ProductGrid/  # Catalog with barcode scanning
│       │   ├── Cart/         # Live cart with discounts & notes
│       │   ├── Payment/      # Multi-method checkout modal
│       │   ├── Receipt/      # Printable receipt
│       │   ├── CustomerSearch/ # Search / create customers inline
│       │   └── ReportsPanel/ # Analytics dashboard
│       └── context/          # AuthContext, CartContext
│
└── sdk/              # Integration SDK (@pos/sdk)
    └── src/
        ├── index.js          # POSClient, POSEmbed, POSCheckout
        └── index.d.ts        # Full TypeScript declarations
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- npm 9+

### 2. Install dependencies

```bash
cd pos-system
npm install --workspace=backend
npm install --workspace=frontend
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env as needed
```

### 4. Seed the database

```bash
npm run seed --workspace=backend
```

Default accounts:
| Email | PIN | Role |
|---|---|---|
| admin@store.com | 1234 | Admin |
| jane@store.com | 5678 | Manager |
| bob@store.com | 1234 | Cashier |

### 5. Run

```bash
# Terminal 1 — API server (port 3001)
npm run dev --workspace=backend

# Terminal 2 — POS terminal UI (port 3000)
npm run dev --workspace=frontend
```

Open **http://localhost:3000** → login with `admin@store.com` / `1234`

---

## REST API Reference

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login` and `/health`.

### Authentication
```
POST /api/auth/login       { email, pin }  → { token, employee }
```

### Products
```
GET    /api/products              ?search=&category=&active=&low_stock=
GET    /api/products/categories
GET    /api/products/barcode/:barcode
GET    /api/products/:id
POST   /api/products              { name, sku, price, category_id, ... }
PUT    /api/products/:id
DELETE /api/products/:id          (soft delete)
POST   /api/products/categories   { name, color, icon }
```

### Orders
```
GET    /api/orders                ?status=&customer_id=&date_from=&date_to=
GET    /api/orders/:id            (includes items + payments)
GET    /api/orders/:id/receipt
POST   /api/orders                { items[], customer_id, discount_amount, tip_amount }
PATCH  /api/orders/:id
POST   /api/orders/:id/void       { reason }
```

### Payments
```
POST   /api/payments              { order_id, method, amount }
POST   /api/payments/:id/refund   { amount, reason }
GET    /api/payments/methods
```

### Customers
```
GET    /api/customers             ?search=
GET    /api/customers/:id         (includes recent orders)
POST   /api/customers
PUT    /api/customers/:id
POST   /api/customers/:id/loyalty { points, reason }
```

### Inventory
```
GET    /api/inventory             ?low_stock=&category=
POST   /api/inventory/adjust      { product_id, qty_change, reason }
POST   /api/inventory/bulk-adjust { adjustments[], reason }
GET    /api/inventory/adjustments
```

### Discounts
```
GET    /api/discounts
POST   /api/discounts/validate    { code, subtotal }
POST   /api/discounts
PUT    /api/discounts/:id
DELETE /api/discounts/:id
```

### Reports
```
GET    /api/reports/summary           ?date_from=&date_to=
GET    /api/reports/top-products      ?date_from=&date_to=&limit=
GET    /api/reports/top-categories    ?date_from=&date_to=
GET    /api/reports/employees         ?date_from=&date_to=
GET    /api/reports/inventory-value
GET    /api/reports/discounts         ?date_from=&date_to=
```

---

## SDK Integration

The `@pos/sdk` package lets you integrate the POS into any web application.

### Install

```bash
npm install ./pos-system/sdk
```

### POSClient — Full API Client

```javascript
import { POSClient } from '@pos/sdk';

const pos = new POSClient({ baseUrl: 'http://your-pos-api.com' });

// Authenticate
await pos.auth.login('admin@store.com', '1234');

// List products
const products = await pos.products.list({ search: 'coffee' });

// One-call checkout
const { order, payment, receipt } = await pos.checkout({
  items: [
    { product_id: 'abc', name: 'Coffee', unit_price: 3.99, quantity: 2 }
  ],
  customerId:    'customer-id',
  paymentMethod: 'card',
  discountCode:  'SAVE5',
});
```

### POSCheckout — Headless Builder

```javascript
import { POSClient, POSCheckout } from '@pos/sdk';

const pos      = new POSClient({ baseUrl: 'http://your-api.com' });
await pos.auth.login('admin@store.com', '1234');

const checkout = new POSCheckout(pos);

checkout
  .addItem({ product_id: 'p1', name: 'Coffee', unit_price: 3.99, quantity: 1 })
  .addItem({ product_id: 'p2', name: 'Muffin',  unit_price: 3.49, quantity: 2 })
  .setCustomer('cust-id')
  .setTip(1.50);

await checkout.applyDiscount('WELCOME10');

console.log(checkout.totals);
// { subtotal: 10.97, discount_amount: 1.10, tax_amount: 0.79, tip_amount: 1.50, total: 12.16 }

const result = await checkout.charge('card');
```

### POSEmbed — Iframe Widget

Embed the full POS terminal inside any webpage:

```javascript
import { POSEmbed } from '@pos/sdk';

const embed = new POSEmbed({
  container: '#pos-wrapper',   // CSS selector or DOM element
  posUrl:    'http://localhost:3000',
  token:     'jwt-token',      // pre-auth (optional)
  width:     '100%',
  height:    '700px',
});

embed.mount();

// Listen for events from the embedded POS
embed.on('checkout:complete', ({ order, payment }) => {
  console.log('New order:', order.order_number, 'Total:', order.total);
  // Sync to your own system here
});
```

---

## Payment Gateway Integration

The payment module uses a **pluggable gateway** pattern. To integrate Stripe, Square, or Adyen:

1. Open `backend/src/modules/payments/routes.js`
2. Replace the `processPaymentGateway()` function:

```javascript
// Stripe example
async function processPaymentGateway(method, amount, gatewayData) {
  if (method !== 'card') return { status: 'approved', reference: null };

  const paymentIntent = await stripe.paymentIntents.create({
    amount:   Math.round(amount * 100),
    currency: 'usd',
    payment_method: gatewayData.payment_method_id,
    confirm: true,
  });

  return {
    status: paymentIntent.status === 'succeeded' ? 'approved' : 'declined',
    reference: paymentIntent.id,
    authorization_code: paymentIntent.latest_charge,
  };
}
```

---

## Database

The system uses **SQLite** by default for zero-config setup. Switch to **PostgreSQL** by setting:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pos_system
DB_USER=pos_user
DB_PASSWORD=your_password
```

The schema is fully relational with:
- **products** (with inventory tracking and modifiers)
- **orders + order_items** (full line-item breakdown)
- **payments** (multi-payment per order, refunds)
- **customers** (CRM + loyalty points)
- **employees** (role-based access control)
- **inventory_adjustments** (full audit trail)
- **discounts** (percentage/fixed, expiry, usage limits)
- **registers** (multi-register support)

---

## Features

| Feature | Status |
|---|---|
| Product catalog with categories | ✓ |
| Barcode scanning | ✓ |
| Real-time cart management | ✓ |
| Multi-payment methods (cash, card, mobile, gift card) | ✓ |
| Change calculation | ✓ |
| Tip handling | ✓ |
| Discount codes (% and fixed) | ✓ |
| Customer CRM + loyalty points | ✓ |
| Inventory tracking + low stock alerts | ✓ |
| Inventory adjustments + audit trail | ✓ |
| Employee roles & PIN auth | ✓ |
| Receipt generation + printing | ✓ |
| Sales reports & analytics | ✓ |
| Top products & categories | ✓ |
| Employee performance reports | ✓ |
| Refunds (full and partial) | ✓ |
| Order voiding | ✓ |
| REST API with JWT auth | ✓ |
| JavaScript SDK | ✓ |
| TypeScript declarations | ✓ |
| Iframe embed widget | ✓ |
| Rate limiting & security headers | ✓ |
| Multi-register support | ✓ |
| Modifiers (add-ons, variants) | ✓ |

---

## License

MIT
