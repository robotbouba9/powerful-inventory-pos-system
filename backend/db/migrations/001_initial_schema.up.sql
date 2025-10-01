-- Users and Authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'sales', 'warehouse')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Categories
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Products
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  barcode TEXT UNIQUE,
  unit TEXT NOT NULL DEFAULT 'unit',
  cost_price DOUBLE PRECISION NOT NULL,
  selling_price DOUBLE PRECISION NOT NULL,
  min_stock_level BIGINT NOT NULL DEFAULT 10,
  max_stock_level BIGINT,
  reorder_point BIGINT NOT NULL DEFAULT 20,
  current_stock BIGINT NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- Stock Movements
CREATE TABLE stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'return')),
  quantity BIGINT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('sale', 'purchase', 'adjustment', 'return')),
  reference_id BIGINT,
  notes TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

-- Suppliers
CREATE TABLE suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_number TEXT,
  payment_terms TEXT,
  credit_limit DOUBLE PRECISION,
  current_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- Customers
CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  tax_number TEXT,
  credit_limit DOUBLE PRECISION,
  current_balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  loyalty_points BIGINT NOT NULL DEFAULT 0,
  customer_type TEXT NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type ON customers(customer_type);

-- Purchase Orders
CREATE TABLE purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'confirmed', 'received', 'cancelled')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_delivery_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date DESC);

-- Purchase Order Items
CREATE TABLE purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity BIGINT NOT NULL,
  received_quantity BIGINT NOT NULL DEFAULT 0,
  unit_price DOUBLE PRECISION NOT NULL,
  tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_purchase_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_items_product ON purchase_order_items(product_id);

-- Sales Orders
CREATE TABLE sales_orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id BIGINT REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'credit')),
  subtotal DOUBLE PRECISION NOT NULL,
  tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL,
  paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_date ON sales_orders(order_date DESC);
CREATE INDEX idx_sales_orders_payment ON sales_orders(payment_status);

-- Sales Order Items
CREATE TABLE sales_order_items (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id),
  quantity BIGINT NOT NULL,
  unit_price DOUBLE PRECISION NOT NULL,
  tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  total_amount DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_sales_items_order ON sales_order_items(sales_order_id);
CREATE INDEX idx_sales_items_product ON sales_order_items(product_id);

-- Payments
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  payment_number TEXT NOT NULL UNIQUE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('sale', 'purchase', 'expense')),
  reference_id BIGINT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque')),
  amount DOUBLE PRECISION NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Expenses
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  expense_number TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque')),
  receipt_url TEXT,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);
