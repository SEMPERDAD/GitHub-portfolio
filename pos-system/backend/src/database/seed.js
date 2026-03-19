const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { initSchema, getDb } = require('./index');

async function seed() {
  initSchema();
  const db = getDb();

  console.log('[Seed] Clearing existing data...');
  db.exec(`
    DELETE FROM order_items;
    DELETE FROM payments;
    DELETE FROM orders;
    DELETE FROM inventory_adjustments;
    DELETE FROM discounts;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM customers;
    DELETE FROM employees;
    DELETE FROM registers;
  `);

  // ─── Categories ────────────────────────────────────────────────
  const categories = [
    { id: uuidv4(), name: 'Food & Beverage', color: '#f59e0b', icon: 'coffee', sort_order: 1 },
    { id: uuidv4(), name: 'Electronics',     color: '#3b82f6', icon: 'cpu',    sort_order: 2 },
    { id: uuidv4(), name: 'Clothing',        color: '#8b5cf6', icon: 'shirt',  sort_order: 3 },
    { id: uuidv4(), name: 'Home & Garden',   color: '#10b981', icon: 'home',   sort_order: 4 },
    { id: uuidv4(), name: 'Services',        color: '#ef4444', icon: 'wrench', sort_order: 5 },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, color, icon, sort_order)
    VALUES (@id, @name, @color, @icon, @sort_order)
  `);
  categories.forEach(c => insertCategory.run(c));
  console.log(`[Seed] Inserted ${categories.length} categories`);

  // ─── Products ──────────────────────────────────────────────────
  const [food, electronics, clothing, home, services] = categories;
  const products = [
    { id: uuidv4(), sku: 'BEV-001', barcode: '012345678901', name: 'Coffee - Small',     category_id: food.id,        price: 2.99,  cost: 0.50,  stock_qty: 999, track_inventory: 0 },
    { id: uuidv4(), sku: 'BEV-002', barcode: '012345678902', name: 'Coffee - Large',     category_id: food.id,        price: 4.49,  cost: 0.75,  stock_qty: 999, track_inventory: 0 },
    { id: uuidv4(), sku: 'BEV-003', barcode: '012345678903', name: 'Green Tea',          category_id: food.id,        price: 3.49,  cost: 0.40,  stock_qty: 999, track_inventory: 0 },
    { id: uuidv4(), sku: 'SNK-001', barcode: '012345678904', name: 'Croissant',          category_id: food.id,        price: 3.99,  cost: 1.20,  stock_qty: 24,  track_inventory: 1, low_stock_alert: 5 },
    { id: uuidv4(), sku: 'SNK-002', barcode: '012345678905', name: 'Blueberry Muffin',  category_id: food.id,        price: 3.49,  cost: 1.00,  stock_qty: 18,  track_inventory: 1, low_stock_alert: 5 },
    { id: uuidv4(), sku: 'ELC-001', barcode: '098765432101', name: 'USB-C Cable 2m',    category_id: electronics.id, price: 19.99, cost: 4.00,  stock_qty: 45,  track_inventory: 1 },
    { id: uuidv4(), sku: 'ELC-002', barcode: '098765432102', name: 'Wireless Earbuds',  category_id: electronics.id, price: 79.99, cost: 25.00, stock_qty: 12,  track_inventory: 1, low_stock_alert: 3 },
    { id: uuidv4(), sku: 'ELC-003', barcode: '098765432103', name: 'Phone Stand',       category_id: electronics.id, price: 14.99, cost: 3.00,  stock_qty: 30,  track_inventory: 1 },
    { id: uuidv4(), sku: 'CLO-001', barcode: '011223344551', name: 'Cotton T-Shirt',    category_id: clothing.id,    price: 24.99, cost: 6.00,  stock_qty: 50,  track_inventory: 1 },
    { id: uuidv4(), sku: 'CLO-002', barcode: '011223344552', name: 'Denim Jeans',       category_id: clothing.id,    price: 59.99, cost: 18.00, stock_qty: 20,  track_inventory: 1, low_stock_alert: 5 },
    { id: uuidv4(), sku: 'HOM-001', barcode: '055667788991', name: 'Scented Candle',    category_id: home.id,        price: 16.99, cost: 4.50,  stock_qty: 35,  track_inventory: 1 },
    { id: uuidv4(), sku: 'HOM-002', barcode: '055667788992', name: 'Bamboo Cutting Board', category_id: home.id,     price: 29.99, cost: 9.00,  stock_qty: 15,  track_inventory: 1 },
    { id: uuidv4(), sku: 'SVC-001', barcode: null,           name: 'Gift Wrapping',     category_id: services.id,    price: 4.99,  cost: 0.50,  stock_qty: 0,   track_inventory: 0 },
    { id: uuidv4(), sku: 'SVC-002', barcode: null,           name: 'Custom Engraving',  category_id: services.id,    price: 12.99, cost: 2.00,  stock_qty: 0,   track_inventory: 0 },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (id, sku, barcode, name, category_id, price, cost, stock_qty, track_inventory, low_stock_alert)
    VALUES (@id, @sku, @barcode, @name, @category_id, @price, @cost, @stock_qty, @track_inventory, @low_stock_alert)
  `);
  products.forEach(p => insertProduct.run({ low_stock_alert: 10, ...p }));
  console.log(`[Seed] Inserted ${products.length} products`);

  // ─── Employees ─────────────────────────────────────────────────
  const pin1 = bcrypt.hashSync('1234', 10);
  const pin2 = bcrypt.hashSync('5678', 10);
  const employees = [
    { id: uuidv4(), first_name: 'Admin',  last_name: 'User',   email: 'admin@store.com',  pin: pin1, role: 'admin',   permissions: JSON.stringify(['all']) },
    { id: uuidv4(), first_name: 'Jane',   last_name: 'Smith',  email: 'jane@store.com',   pin: pin2, role: 'manager', permissions: JSON.stringify(['orders', 'products', 'customers', 'reports', 'discounts']) },
    { id: uuidv4(), first_name: 'Bob',    last_name: 'Johnson',email: 'bob@store.com',    pin: pin1, role: 'cashier', permissions: JSON.stringify(['orders', 'customers']) },
  ];

  const insertEmployee = db.prepare(`
    INSERT INTO employees (id, first_name, last_name, email, pin, role, permissions)
    VALUES (@id, @first_name, @last_name, @email, @pin, @role, @permissions)
  `);
  employees.forEach(e => insertEmployee.run(e));
  console.log(`[Seed] Inserted ${employees.length} employees`);

  // ─── Customers ─────────────────────────────────────────────────
  const customers = [
    { id: uuidv4(), first_name: 'Alice',   last_name: 'Brown',   email: 'alice@example.com',   phone: '555-0101', loyalty_pts: 250 },
    { id: uuidv4(), first_name: 'Charlie', last_name: 'Davis',   email: 'charlie@example.com', phone: '555-0102', loyalty_pts: 80  },
    { id: uuidv4(), first_name: 'Eva',     last_name: 'Martinez',email: 'eva@example.com',     phone: '555-0103', loyalty_pts: 410 },
  ];

  const insertCustomer = db.prepare(`
    INSERT INTO customers (id, first_name, last_name, email, phone, loyalty_pts)
    VALUES (@id, @first_name, @last_name, @email, @phone, @loyalty_pts)
  `);
  customers.forEach(c => insertCustomer.run(c));
  console.log(`[Seed] Inserted ${customers.length} customers`);

  // ─── Discounts ─────────────────────────────────────────────────
  const discounts = [
    { id: uuidv4(), code: 'WELCOME10', name: '10% Off Welcome',   type: 'percentage', value: 10,   min_order: 0,    max_uses: null },
    { id: uuidv4(), code: 'SAVE5',     name: '$5 Off $30+',       type: 'fixed',      value: 5.00, min_order: 30.0, max_uses: null },
    { id: uuidv4(), code: 'STAFF',     name: 'Staff Discount 20%',type: 'percentage', value: 20,   min_order: 0,    max_uses: null },
  ];

  const insertDiscount = db.prepare(`
    INSERT INTO discounts (id, code, name, type, value, min_order, max_uses)
    VALUES (@id, @code, @name, @type, @value, @min_order, @max_uses)
  `);
  discounts.forEach(d => insertDiscount.run(d));
  console.log(`[Seed] Inserted ${discounts.length} discounts`);

  // ─── Registers ─────────────────────────────────────────────────
  const registers = [
    { id: uuidv4(), name: 'Register 1', location: 'Front Desk', status: 'open' },
    { id: uuidv4(), name: 'Register 2', location: 'Kiosk',      status: 'closed' },
  ];

  const insertRegister = db.prepare(`
    INSERT INTO registers (id, name, location, status) VALUES (@id, @name, @location, @status)
  `);
  registers.forEach(r => insertRegister.run(r));
  console.log(`[Seed] Inserted ${registers.length} registers`);

  console.log('\n[Seed] ✓ Done!\n');
  console.log('Default employee credentials:');
  console.log('  Admin:   admin@store.com  | PIN: 1234');
  console.log('  Manager: jane@store.com   | PIN: 5678');
  console.log('  Cashier: bob@store.com    | PIN: 1234');
}

seed().catch(err => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
