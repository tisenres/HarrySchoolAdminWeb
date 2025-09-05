-- Finance Module Schema Migration
-- Harry School CRM - Phase 4

-- Create custom types for finance module
CREATE TYPE payment_method_type AS ENUM (
  'cash', 'card', 'bank_transfer', 'online', 'mobile_money', 'crypto', 'other'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
);

CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'
);

CREATE TYPE transaction_type AS ENUM (
  'income', 'expense', 'refund', 'adjustment', 'transfer'
);

CREATE TYPE discount_type AS ENUM (
  'percentage', 'fixed_amount'
);

CREATE TYPE scholarship_status AS ENUM (
  'active', 'expired', 'suspended', 'completed'
);

CREATE TYPE installment_status AS ENUM (
  'scheduled', 'paid', 'late', 'cancelled', 'written_off'
);

-- Payment Methods Configuration
CREATE TABLE payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type payment_method_type NOT NULL,
  is_active boolean DEFAULT true,
  gateway_config jsonb,
  processing_fee_percentage numeric(5,2) DEFAULT 0,
  processing_fee_fixed numeric(10,2) DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id),
  CONSTRAINT payment_methods_organization_name_key UNIQUE(organization_id, name, deleted_at)
);

-- Payment Schedules (Templates for installment plans)
CREATE TABLE payment_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  number_of_installments integer NOT NULL CHECK (number_of_installments > 0),
  interval_days integer NOT NULL CHECK (interval_days > 0),
  late_fee_percentage numeric(5,2) DEFAULT 0,
  late_fee_fixed numeric(10,2) DEFAULT 0,
  grace_period_days integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

-- Discounts Configuration
CREATE TABLE discounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type discount_type NOT NULL,
  value numeric(10,2) NOT NULL CHECK (value > 0),
  max_usage integer,
  usage_count integer DEFAULT 0,
  valid_from date,
  valid_until date,
  applicable_to jsonb, -- {groups: [], students: [], all: true/false}
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

-- Scholarships
CREATE TABLE scholarships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type discount_type NOT NULL,
  value numeric(10,2) NOT NULL CHECK (value > 0),
  start_date date NOT NULL,
  end_date date,
  status scholarship_status DEFAULT 'active',
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id)
);

-- Invoices
CREATE TABLE invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  status invoice_status DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'UZS')),
  subtotal numeric(10,2) DEFAULT 0,
  tax_percentage numeric(5,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_id uuid REFERENCES discounts(id),
  discount_amount numeric(10,2) DEFAULT 0,
  scholarship_id uuid REFERENCES scholarships(id),
  scholarship_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  paid_amount numeric(10,2) DEFAULT 0,
  notes text,
  payment_schedule_id uuid REFERENCES payment_schedules(id),
  sent_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id),
  CONSTRAINT invoices_organization_number_key UNIQUE(organization_id, invoice_number)
);

-- Invoice Line Items
CREATE TABLE invoice_line_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,2) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  tax_percentage numeric(5,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  discount_percentage numeric(5,2) DEFAULT 0,
  discount_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_number text NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES payment_methods(id),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'UZS')),
  exchange_rate numeric(10,4) DEFAULT 1,
  status payment_status DEFAULT 'pending',
  gateway_transaction_id text,
  gateway_response jsonb,
  processing_fee numeric(10,2) DEFAULT 0,
  net_amount numeric(10,2),
  payment_date timestamptz DEFAULT now(),
  notes text,
  receipt_url text,
  refund_amount numeric(10,2) DEFAULT 0,
  refund_reason text,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id),
  CONSTRAINT payments_organization_number_key UNIQUE(organization_id, payment_number)
);

-- Payment Installments
CREATE TABLE payment_installments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  status installment_status DEFAULT 'scheduled',
  payment_id uuid REFERENCES payments(id),
  late_fee_applied numeric(10,2) DEFAULT 0,
  paid_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT payment_installments_invoice_number_key UNIQUE(invoice_id, installment_number)
);

-- Financial Transactions (General ledger)
CREATE TABLE financial_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  transaction_number text NOT NULL,
  type transaction_type NOT NULL,
  category text,
  subcategory text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD' CHECK (currency IN ('USD', 'UZS')),
  payment_id uuid REFERENCES payments(id),
  invoice_id uuid REFERENCES invoices(id),
  student_id uuid REFERENCES students(id),
  group_id uuid REFERENCES groups(id),
  description text NOT NULL,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  attachment_url text,
  notes text,
  reconciled boolean DEFAULT false,
  reconciled_at timestamptz,
  reconciled_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES profiles(id),
  CONSTRAINT financial_transactions_organization_number_key UNIQUE(organization_id, transaction_number)
);

-- Student Account Balances
CREATE TABLE student_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  balance numeric(10,2) DEFAULT 0,
  total_invoiced numeric(10,2) DEFAULT 0,
  total_paid numeric(10,2) DEFAULT 0,
  total_refunded numeric(10,2) DEFAULT 0,
  total_discounts numeric(10,2) DEFAULT 0,
  total_scholarships numeric(10,2) DEFAULT 0,
  last_payment_date timestamptz,
  last_payment_amount numeric(10,2),
  credit_limit numeric(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT student_accounts_student_key UNIQUE(student_id)
);

-- Create indexes for performance
CREATE INDEX idx_payment_methods_organization ON payment_methods(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_methods_type ON payment_methods(type) WHERE deleted_at IS NULL;

CREATE INDEX idx_payment_schedules_organization ON payment_schedules(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payment_schedules_active ON payment_schedules(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_discounts_organization ON discounts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_discounts_valid_dates ON discounts(valid_from, valid_until) WHERE deleted_at IS NULL;
CREATE INDEX idx_discounts_active ON discounts(is_active) WHERE deleted_at IS NULL;

CREATE INDEX idx_scholarships_organization ON scholarships(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_scholarships_student ON scholarships(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_scholarships_status ON scholarships(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_scholarships_dates ON scholarships(start_date, end_date) WHERE deleted_at IS NULL;

CREATE INDEX idx_invoices_organization ON invoices(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_student ON invoices(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_group ON invoices(group_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);

CREATE INDEX idx_payments_organization ON payments(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_student ON payments(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_invoice ON payments(invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_date ON payments(payment_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_number ON payments(payment_number);

CREATE INDEX idx_payment_installments_invoice ON payment_installments(invoice_id);
CREATE INDEX idx_payment_installments_due_date ON payment_installments(due_date);
CREATE INDEX idx_payment_installments_status ON payment_installments(status);

CREATE INDEX idx_financial_transactions_organization ON financial_transactions(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_transactions_type ON financial_transactions(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_transactions_student ON financial_transactions(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_financial_transactions_reconciled ON financial_transactions(reconciled) WHERE deleted_at IS NULL;

CREATE INDEX idx_student_accounts_student ON student_accounts(student_id);
CREATE INDEX idx_student_accounts_organization ON student_accounts(organization_id);
CREATE INDEX idx_student_accounts_balance ON student_accounts(balance);

-- Update timestamp triggers
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_schedules_updated_at BEFORE UPDATE ON payment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scholarships_updated_at BEFORE UPDATE ON scholarships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_line_items_updated_at BEFORE UPDATE ON invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_installments_updated_at BEFORE UPDATE ON payment_installments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_accounts_updated_at BEFORE UPDATE ON student_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();