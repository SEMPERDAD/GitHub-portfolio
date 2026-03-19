// TypeScript declarations for @pos/sdk

export interface POSClientOptions {
  baseUrl: string;
  token?: string;
  onAuthExpired?: () => void;
}

export interface LoginResult {
  token: string;
  employee: Employee;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  permissions: string[];
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  category_name?: string;
  price: number;
  cost: number;
  tax_rate?: number;
  track_inventory: boolean;
  stock_qty: number;
  low_stock_alert: number;
  unit: string;
  image_url?: string;
  active: boolean;
  modifiers: Modifier[];
}

export interface Modifier { name: string; price: number; }

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  sort_order: number;
}

export interface OrderItem {
  id?: string;
  product_id?: string;
  name: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  tax_rate?: number;
  line_total?: number;
  modifiers?: Modifier[];
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: 'open' | 'partial' | 'completed' | 'voided' | 'refunded';
  customer_id?: string;
  employee_id?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
  amount_paid: number;
  change_due: number;
  notes?: string;
  created_at: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  order_id: string;
  method: 'cash' | 'card' | 'mobile' | 'gift_card' | 'check' | 'store_credit' | 'external';
  amount: number;
  reference?: string;
  card_last4?: string;
  card_brand?: string;
  status: 'approved' | 'declined' | 'refunded';
  order_status: string;
  amount_paid: number;
  change_due: number;
}

export interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  loyalty_pts: number;
}

export interface CheckoutResult {
  order: Order;
  payment: Payment;
  receipt: ReceiptData;
}

export interface ReceiptData {
  store: { name: string; address?: string; phone?: string; receiptFooter?: string };
  order: Order;
  items: OrderItem[];
  payments: Payment[];
  currency: { code: string; symbol: string };
  printed_at: string;
}

export interface Totals {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  tip_amount: number;
  total: number;
}

// ─── Module Interfaces ──────────────────────────────────────────

export interface AuthModule {
  login(email: string, pin: string): Promise<LoginResult>;
  logout(): void;
}

export interface ProductsModule {
  list(filters?: Record<string, any>): Promise<Product[]>;
  get(id: string): Promise<Product>;
  getByBarcode(barcode: string): Promise<Product>;
  categories(): Promise<Category[]>;
  create(data: Partial<Product>): Promise<Product>;
  update(id: string, data: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
  createCategory(data: Partial<Category>): Promise<Category>;
}

export interface OrdersModule {
  list(filters?: Record<string, any>): Promise<Order[]>;
  get(id: string): Promise<Order>;
  create(data: { items: OrderItem[]; customer_id?: string; discount_amount?: number; tip_amount?: number; notes?: string }): Promise<Order>;
  update(id: string, data: Partial<Order>): Promise<Order>;
  void(id: string, reason: string): Promise<{ id: string; status: string }>;
  receipt(id: string): Promise<ReceiptData>;
}

export interface PaymentsModule {
  charge(data: { order_id: string; method: string; amount: number; reference?: string }): Promise<Payment>;
  refund(paymentId: string, data: { amount: number; reason: string }): Promise<Payment>;
  methods(): Promise<Array<{ id: string; label: string }>>;
}

export interface CustomersModule {
  list(filters?: Record<string, any>): Promise<Customer[]>;
  get(id: string): Promise<Customer>;
  create(data: Partial<Customer>): Promise<Customer>;
  update(id: string, data: Partial<Customer>): Promise<Customer>;
  addLoyaltyPoints(id: string, points: number, reason: string): Promise<{ loyalty_pts: number }>;
}

export interface InventoryModule {
  list(filters?: Record<string, any>): Promise<Array<Product & { category_name: string }>>;
  adjust(data: { product_id: string; qty_change: number; reason: string; notes?: string }): Promise<any>;
  bulkAdjust(data: any): Promise<any>;
  adjustments(filters?: Record<string, any>): Promise<any[]>;
}

export interface DiscountsModule {
  list(): Promise<any[]>;
  validate(code: string, subtotal: number): Promise<{ valid: boolean; applied_amount: number; discount: any }>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export interface ReportsModule {
  summary(params?: Record<string, string>): Promise<any>;
  topProducts(params?: Record<string, string>): Promise<any>;
  topCategories(params?: Record<string, string>): Promise<any>;
  employees(params?: Record<string, string>): Promise<any>;
  inventoryValue(): Promise<any>;
  discounts(params?: Record<string, string>): Promise<any>;
}

// ─── Main Classes ───────────────────────────────────────────────

export declare class POSClient {
  auth:       AuthModule;
  products:   ProductsModule;
  orders:     OrdersModule;
  payments:   PaymentsModule;
  customers:  CustomersModule;
  inventory:  InventoryModule;
  discounts:  DiscountsModule;
  reports:    ReportsModule;

  readonly employee: Employee | null;
  readonly isAuthenticated: boolean;

  constructor(options: POSClientOptions);

  on(event: string, handler: (...args: any[]) => void): () => void;
  off(event: string, handler: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;

  checkout(options: {
    items: OrderItem[];
    customerId?: string;
    discountAmount?: number;
    discountCode?: string;
    tipAmount?: number;
    notes?: string;
    paymentMethod?: string;
    amountTendered?: number;
  }): Promise<CheckoutResult>;

  health(): Promise<{ status: string; version: string }>;
}

export declare class POSEmbed {
  constructor(options: { container: string | HTMLElement; posUrl: string; token?: string; width?: string; height?: string });
  mount(): this;
  unmount(): void;
  on(event: string, handler: (...args: any[]) => void): () => void;
  off(event: string, handler: (...args: any[]) => void): void;
}

export declare class POSCheckout {
  constructor(client: POSClient);
  addItem(item: OrderItem): this;
  removeItem(productId: string): this;
  setCustomer(customerId: string): this;
  setTip(amount: number): this;
  setNote(note: string): this;
  applyDiscount(code: string): Promise<any>;
  readonly totals: Totals;
  charge(paymentMethod?: string, amountTendered?: number): Promise<CheckoutResult>;
  reset(): this;
}
