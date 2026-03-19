/**
 * @pos/sdk — Modular POS System Integration SDK
 *
 * Integrates the POS system into any web application via:
 *   1. POSClient      — full REST API client
 *   2. POSEmbed       — embeds the POS terminal as an iframe
 *   3. POSWebhooks    — receive real-time order/payment events
 *   4. POSCheckout    — headless checkout flow for custom UIs
 *
 * Quick start:
 *   const pos = new POSClient({ baseUrl: 'http://your-pos-api.com' });
 *   await pos.auth.login('admin@store.com', '1234');
 *   const products = await pos.products.list();
 */

'use strict';

// ─── HTTP Client ──────────────────────────────────────────────────────────────

class HttpClient {
  constructor(baseUrl) {
    this._base  = baseUrl.replace(/\/$/, '');
    this._token = null;
  }

  setToken(token) { this._token = token; }
  clearToken()    { this._token = null; }

  async _request(method, path, body, params) {
    const url = new URL(this._base + path);
    if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, v));

    const headers = { 'Content-Type': 'application/json' };
    if (this._token) headers['Authorization'] = `Bearer ${this._token}`;

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, data });
    return data;
  }

  get(path, params)   { return this._request('GET',    path, null,  params); }
  post(path, body)    { return this._request('POST',   path, body); }
  put(path, body)     { return this._request('PUT',    path, body); }
  patch(path, body)   { return this._request('PATCH',  path, body); }
  delete(path)        { return this._request('DELETE', path); }
}

// ─── Module Clients ───────────────────────────────────────────────────────────

class AuthModule {
  constructor(http, sdk) { this._http = http; this._sdk = sdk; }

  async login(email, pin) {
    const result = await this._http.post('/api/auth/login', { email, pin });
    this._http.setToken(result.token);
    this._sdk._token    = result.token;
    this._sdk._employee = result.employee;
    this._sdk.emit('auth:login', result.employee);
    return result;
  }

  logout() {
    this._http.clearToken();
    this._sdk._token    = null;
    this._sdk._employee = null;
    this._sdk.emit('auth:logout');
  }
}

class ProductsModule {
  constructor(http) { this._http = http; }

  list(filters = {})        { return this._http.get('/api/products', filters); }
  get(id)                   { return this._http.get(`/api/products/${id}`); }
  getByBarcode(barcode)     { return this._http.get(`/api/products/barcode/${barcode}`); }
  categories()              { return this._http.get('/api/products/categories'); }
  create(data)              { return this._http.post('/api/products', data); }
  update(id, data)          { return this._http.put(`/api/products/${id}`, data); }
  delete(id)                { return this._http.delete(`/api/products/${id}`); }
  createCategory(data)      { return this._http.post('/api/products/categories', data); }
}

class OrdersModule {
  constructor(http) { this._http = http; }

  list(filters = {})        { return this._http.get('/api/orders', filters); }
  get(id)                   { return this._http.get(`/api/orders/${id}`); }
  create(data)              { return this._http.post('/api/orders', data); }
  update(id, data)          { return this._http.patch(`/api/orders/${id}`, data); }
  void(id, reason)          { return this._http.post(`/api/orders/${id}/void`, { reason }); }
  receipt(id)               { return this._http.get(`/api/orders/${id}/receipt`); }
}

class PaymentsModule {
  constructor(http) { this._http = http; }

  charge(data)              { return this._http.post('/api/payments', data); }
  refund(paymentId, data)   { return this._http.post(`/api/payments/${paymentId}/refund`, data); }
  methods()                 { return this._http.get('/api/payments/methods'); }
}

class CustomersModule {
  constructor(http) { this._http = http; }

  list(filters = {})        { return this._http.get('/api/customers', filters); }
  get(id)                   { return this._http.get(`/api/customers/${id}`); }
  create(data)              { return this._http.post('/api/customers', data); }
  update(id, data)          { return this._http.put(`/api/customers/${id}`, data); }
  addLoyaltyPoints(id, pts, reason) { return this._http.post(`/api/customers/${id}/loyalty`, { points: pts, reason }); }
}

class InventoryModule {
  constructor(http) { this._http = http; }

  list(filters = {})        { return this._http.get('/api/inventory', filters); }
  adjust(data)              { return this._http.post('/api/inventory/adjust', data); }
  bulkAdjust(data)          { return this._http.post('/api/inventory/bulk-adjust', data); }
  adjustments(filters = {}) { return this._http.get('/api/inventory/adjustments', filters); }
}

class DiscountsModule {
  constructor(http) { this._http = http; }

  list()                    { return this._http.get('/api/discounts'); }
  validate(code, subtotal)  { return this._http.post('/api/discounts/validate', { code, subtotal }); }
  create(data)              { return this._http.post('/api/discounts', data); }
  update(id, data)          { return this._http.put(`/api/discounts/${id}`, data); }
  delete(id)                { return this._http.delete(`/api/discounts/${id}`); }
}

class ReportsModule {
  constructor(http) { this._http = http; }

  summary(params = {})      { return this._http.get('/api/reports/summary', params); }
  topProducts(params = {})  { return this._http.get('/api/reports/top-products', params); }
  topCategories(params = {}) { return this._http.get('/api/reports/top-categories', params); }
  employees(params = {})    { return this._http.get('/api/reports/employees', params); }
  inventoryValue()          { return this._http.get('/api/reports/inventory-value'); }
  discounts(params = {})    { return this._http.get('/api/reports/discounts', params); }
}

// ─── Main SDK Client ──────────────────────────────────────────────────────────

class POSClient {
  /**
   * @param {Object} options
   * @param {string} options.baseUrl         — POS API URL (e.g., 'http://localhost:3001')
   * @param {string} [options.token]         — Pre-existing JWT token (optional)
   * @param {Function} [options.onAuthExpired] — Called when token expires (401)
   */
  constructor({ baseUrl, token, onAuthExpired } = {}) {
    if (!baseUrl) throw new Error('[POSClient] baseUrl is required');

    this._http      = new HttpClient(baseUrl);
    this._token     = token || null;
    this._employee  = null;
    this._listeners = {};

    if (token) this._http.setToken(token);
    if (onAuthExpired) this.on('auth:expired', onAuthExpired);

    // Modules
    this.auth       = new AuthModule(this._http, this);
    this.products   = new ProductsModule(this._http);
    this.orders     = new OrdersModule(this._http);
    this.payments   = new PaymentsModule(this._http);
    this.customers  = new CustomersModule(this._http);
    this.inventory  = new InventoryModule(this._http);
    this.discounts  = new DiscountsModule(this._http);
    this.reports    = new ReportsModule(this._http);
  }

  get employee() { return this._employee; }
  get isAuthenticated() { return !!this._token; }

  // ─── Event Emitter ────────────────────────────────────────────
  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._listeners[event] = (this._listeners[event] || []).filter(h => h !== handler);
  }

  emit(event, ...args) {
    (this._listeners[event] || []).forEach(h => h(...args));
  }

  // ─── Convenience: One-call checkout ──────────────────────────
  /**
   * Complete a checkout in one call:
   *   const result = await pos.checkout({ items, customerId, paymentMethod, amountTendered });
   */
  async checkout({ items, customerId, discountAmount = 0, tipAmount = 0, notes,
                   paymentMethod, amountTendered, discountCode }) {
    // 1. Validate discount
    if (discountCode) {
      const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      const disc = await this.discounts.validate(discountCode, subtotal);
      discountAmount = disc.applied_amount;
    }

    // 2. Create order
    const order = await this.orders.create({
      items, customer_id: customerId || undefined,
      discount_amount: discountAmount, tip_amount: tipAmount, notes,
    });

    // 3. Charge
    const payment = await this.payments.charge({
      order_id: order.id,
      method:   paymentMethod || 'cash',
      amount:   amountTendered || order.total,
    });

    // 4. Get receipt
    const receipt = await this.orders.receipt(order.id);

    this.emit('checkout:complete', { order, payment, receipt });
    return { order, payment, receipt };
  }

  // ─── Health check ─────────────────────────────────────────────
  health() { return this._http.get('/health'); }
}

// ─── POSEmbed — iframe-based embedding ───────────────────────────────────────

class POSEmbed {
  /**
   * Embed the full POS terminal into any DOM element.
   *
   * @example
   * const embed = new POSEmbed({
   *   container: '#pos-container',
   *   posUrl: 'http://localhost:3000',
   *   token: 'jwt-token-here',
   * });
   * embed.mount();
   * embed.on('checkout:complete', ({ order }) => console.log('Order:', order));
   */
  constructor({ container, posUrl, token, width = '100%', height = '100%' } = {}) {
    if (!container) throw new Error('[POSEmbed] container is required');
    if (!posUrl)    throw new Error('[POSEmbed] posUrl is required');

    this._container = typeof container === 'string' ? document.querySelector(container) : container;
    this._posUrl    = posUrl;
    this._token     = token;
    this._width     = width;
    this._height    = height;
    this._iframe    = null;
    this._listeners = {};

    window.addEventListener('message', this._onMessage.bind(this));
  }

  mount() {
    if (this._iframe) return;

    const url = new URL(this._posUrl);
    if (this._token) url.searchParams.set('embed_token', this._token);
    url.searchParams.set('embedded', '1');

    this._iframe = document.createElement('iframe');
    this._iframe.src    = url.toString();
    this._iframe.style.cssText = `width:${this._width};height:${this._height};border:none;border-radius:12px;`;
    this._iframe.allow  = 'camera;microphone';
    this._container.appendChild(this._iframe);
    this.emit('embed:mounted');
    return this;
  }

  unmount() {
    if (this._iframe) {
      this._iframe.remove();
      this._iframe = null;
      this.emit('embed:unmounted');
    }
  }

  _onMessage(event) {
    if (!event.data || event.data.source !== 'pos-embed') return;
    const { type, payload } = event.data;
    this.emit(type, payload);
  }

  on(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this._listeners[event] = (this._listeners[event] || []).filter(h => h !== handler);
  }

  emit(event, ...args) {
    (this._listeners[event] || []).forEach(h => h(...args));
  }
}

// ─── POSCheckout — headless checkout builder ──────────────────────────────────

class POSCheckout {
  /**
   * Build a custom checkout flow without the POS UI.
   *
   * @example
   * const checkout = new POSCheckout(posClient);
   * checkout.addItem({ product_id: 'abc', name: 'Coffee', unit_price: 3.99, quantity: 2 });
   * checkout.setCustomer('customer-id');
   * await checkout.applyDiscount('SAVE10');
   * const result = await checkout.charge('card');
   */
  constructor(client) {
    if (!(client instanceof POSClient)) throw new Error('[POSCheckout] requires a POSClient instance');
    this._client   = client;
    this._items    = [];
    this._customer = null;
    this._discount = 0;
    this._tip      = 0;
    this._note     = '';
  }

  addItem(item) {
    const existing = this._items.findIndex(i => i.product_id && i.product_id === item.product_id);
    if (existing >= 0) {
      this._items[existing].quantity += item.quantity || 1;
    } else {
      this._items.push({ quantity: 1, discount_pct: 0, ...item });
    }
    return this;
  }

  removeItem(productId) {
    this._items = this._items.filter(i => i.product_id !== productId);
    return this;
  }

  setCustomer(customerId) { this._customer = customerId; return this; }
  setTip(amount)          { this._tip = amount; return this; }
  setNote(note)           { this._note = note; return this; }

  async applyDiscount(code) {
    const subtotal = this._items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const result   = await this._client.discounts.validate(code, subtotal);
    this._discount = result.applied_amount;
    return result;
  }

  get totals() {
    const subtotal = this._items.reduce((s, i) => {
      const base = i.unit_price * i.quantity;
      const disc = base * ((i.discount_pct || 0) / 100);
      return s + (base - disc);
    }, 0);
    const discounted = Math.max(0, subtotal - this._discount);
    const tax   = discounted * 0.08;
    const total = discounted + tax + this._tip;
    return {
      subtotal:        parseFloat(subtotal.toFixed(2)),
      discount_amount: parseFloat(this._discount.toFixed(2)),
      tax_amount:      parseFloat(tax.toFixed(2)),
      tip_amount:      parseFloat(this._tip.toFixed(2)),
      total:           parseFloat(total.toFixed(2)),
    };
  }

  async charge(paymentMethod = 'card', amountTendered) {
    if (!this._items.length) throw new Error('[POSCheckout] No items in cart');

    return this._client.checkout({
      items:           this._items,
      customerId:      this._customer,
      discountAmount:  this._discount,
      tipAmount:       this._tip,
      notes:           this._note,
      paymentMethod,
      amountTendered:  amountTendered || this.totals.total,
    });
  }

  reset() {
    this._items    = [];
    this._customer = null;
    this._discount = 0;
    this._tip      = 0;
    this._note     = '';
    return this;
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { POSClient, POSEmbed, POSCheckout };
