-- Finance Module Functions and RLS Policies
-- Harry School CRM - Phase 4

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(org_id uuid)
RETURNS text AS $$
DECLARE
  org_code text;
  year_month text;
  sequence_num integer;
  new_invoice_number text;
BEGIN
  -- Get organization code (first 3 letters of name)
  SELECT UPPER(LEFT(name, 3)) INTO org_code FROM organizations WHERE id = org_id;
  
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(invoice_number, '^[A-Z]{3}-\d{6}-', '')
      AS INTEGER
    )
  ), 0) + 1 INTO sequence_num
  FROM invoices
  WHERE organization_id = org_id
    AND invoice_number LIKE org_code || '-' || year_month || '-%';
  
  -- Generate invoice number: ORG-YYYYMM-XXXX
  new_invoice_number := org_code || '-' || year_month || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate payment numbers
CREATE OR REPLACE FUNCTION generate_payment_number(org_id uuid)
RETURNS text AS $$
DECLARE
  org_code text;
  year_month text;
  sequence_num integer;
  new_payment_number text;
BEGIN
  -- Get organization code
  SELECT UPPER(LEFT(name, 3)) INTO org_code FROM organizations WHERE id = org_id;
  
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(payment_number, '^PAY-[A-Z]{3}-\d{6}-', '')
      AS INTEGER
    )
  ), 0) + 1 INTO sequence_num
  FROM payments
  WHERE organization_id = org_id
    AND payment_number LIKE 'PAY-' || org_code || '-' || year_month || '-%';
  
  -- Generate payment number: PAY-ORG-YYYYMM-XXXX
  new_payment_number := 'PAY-' || org_code || '-' || year_month || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN new_payment_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate transaction numbers
CREATE OR REPLACE FUNCTION generate_transaction_number(org_id uuid)
RETURNS text AS $$
DECLARE
  year_month text;
  sequence_num integer;
  new_transaction_number text;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(CURRENT_DATE, 'YYYYMM');
  
  -- Get next sequence number
  SELECT COALESCE(MAX(
    CAST(
      REGEXP_REPLACE(transaction_number, '^TXN-\d{6}-', '')
      AS INTEGER
    )
  ), 0) + 1 INTO sequence_num
  FROM financial_transactions
  WHERE organization_id = org_id
    AND transaction_number LIKE 'TXN-' || year_month || '-%';
  
  -- Generate transaction number: TXN-YYYYMM-XXXXX
  new_transaction_number := 'TXN-' || year_month || '-' || LPAD(sequence_num::text, 5, '0');
  
  RETURN new_transaction_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(inv_id uuid)
RETURNS void AS $$
DECLARE
  inv_subtotal numeric(10,2);
  inv_tax numeric(10,2);
  inv_discount numeric(10,2);
  inv_scholarship numeric(10,2);
  inv_total numeric(10,2);
  tax_rate numeric(5,2);
BEGIN
  -- Get tax rate from invoice
  SELECT tax_percentage INTO tax_rate FROM invoices WHERE id = inv_id;
  
  -- Calculate subtotal from line items
  SELECT COALESCE(SUM(total_amount), 0) INTO inv_subtotal
  FROM invoice_line_items WHERE invoice_id = inv_id;
  
  -- Calculate tax
  inv_tax := inv_subtotal * (COALESCE(tax_rate, 0) / 100);
  
  -- Get discount and scholarship amounts
  SELECT discount_amount, scholarship_amount 
  INTO inv_discount, inv_scholarship
  FROM invoices WHERE id = inv_id;
  
  -- Calculate total
  inv_total := inv_subtotal + inv_tax - COALESCE(inv_discount, 0) - COALESCE(inv_scholarship, 0);
  
  -- Update invoice
  UPDATE invoices
  SET 
    subtotal = inv_subtotal,
    tax_amount = inv_tax,
    total_amount = inv_total
  WHERE id = inv_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update student account balance
CREATE OR REPLACE FUNCTION update_student_balance(stud_id uuid)
RETURNS void AS $$
DECLARE
  org_id uuid;
  total_inv numeric(10,2);
  total_pd numeric(10,2);
  total_ref numeric(10,2);
  total_disc numeric(10,2);
  total_schol numeric(10,2);
  last_pay_date timestamptz;
  last_pay_amt numeric(10,2);
  new_balance numeric(10,2);
BEGIN
  -- Get organization ID
  SELECT organization_id INTO org_id FROM students WHERE id = stud_id;
  
  -- Calculate totals
  SELECT 
    COALESCE(SUM(total_amount), 0)
  INTO total_inv
  FROM invoices 
  WHERE student_id = stud_id 
    AND status NOT IN ('cancelled', 'draft')
    AND deleted_at IS NULL;
  
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(refund_amount), 0)
  INTO total_pd, total_ref
  FROM payments 
  WHERE student_id = stud_id 
    AND status = 'completed'
    AND deleted_at IS NULL;
  
  SELECT 
    COALESCE(SUM(discount_amount), 0),
    COALESCE(SUM(scholarship_amount), 0)
  INTO total_disc, total_schol
  FROM invoices 
  WHERE student_id = stud_id 
    AND status NOT IN ('cancelled', 'draft')
    AND deleted_at IS NULL;
  
  -- Get last payment info
  SELECT payment_date, amount 
  INTO last_pay_date, last_pay_amt
  FROM payments 
  WHERE student_id = stud_id 
    AND status = 'completed'
    AND deleted_at IS NULL
  ORDER BY payment_date DESC 
  LIMIT 1;
  
  -- Calculate balance (negative means student owes money)
  new_balance := total_pd - total_ref - total_inv;
  
  -- Insert or update student account
  INSERT INTO student_accounts (
    student_id, organization_id, balance, total_invoiced, 
    total_paid, total_refunded, total_discounts, total_scholarships,
    last_payment_date, last_payment_amount
  ) VALUES (
    stud_id, org_id, new_balance, total_inv,
    total_pd, total_ref, total_disc, total_schol,
    last_pay_date, last_pay_amt
  )
  ON CONFLICT (student_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    total_invoiced = EXCLUDED.total_invoiced,
    total_paid = EXCLUDED.total_paid,
    total_refunded = EXCLUDED.total_refunded,
    total_discounts = EXCLUDED.total_discounts,
    total_scholarships = EXCLUDED.total_scholarships,
    last_payment_date = EXCLUDED.last_payment_date,
    last_payment_amount = EXCLUDED.last_payment_amount,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION trigger_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number(NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_invoice_number();

-- Trigger to auto-generate payment numbers
CREATE OR REPLACE FUNCTION trigger_generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := generate_payment_number(NEW.organization_id);
  END IF;
  -- Calculate net amount
  IF NEW.net_amount IS NULL THEN
    NEW.net_amount := NEW.amount - COALESCE(NEW.processing_fee, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_payment_number
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_payment_number();

-- Trigger to auto-generate transaction numbers
CREATE OR REPLACE FUNCTION trigger_generate_transaction_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := generate_transaction_number(NEW.organization_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_transaction_number
  BEFORE INSERT ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_transaction_number();

-- Trigger to update invoice totals when line items change
CREATE OR REPLACE FUNCTION trigger_update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_invoice_totals(OLD.invoice_id);
    RETURN OLD;
  ELSE
    PERFORM calculate_invoice_totals(NEW.invoice_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_invoice_totals();

-- Trigger to update student balance when payments change
CREATE OR REPLACE FUNCTION trigger_update_student_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_student_balance(OLD.student_id);
    RETURN OLD;
  ELSE
    PERFORM update_student_balance(NEW.student_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_student_balance_on_payment
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_student_balance();

CREATE TRIGGER auto_update_student_balance_on_invoice
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_student_balance();

-- Trigger to update invoice status based on payments
CREATE OR REPLACE FUNCTION trigger_update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  inv_total numeric(10,2);
  inv_paid numeric(10,2);
BEGIN
  IF NEW.invoice_id IS NOT NULL AND NEW.status = 'completed' THEN
    -- Get invoice total and paid amount
    SELECT total_amount INTO inv_total 
    FROM invoices WHERE id = NEW.invoice_id;
    
    SELECT COALESCE(SUM(amount), 0) INTO inv_paid
    FROM payments 
    WHERE invoice_id = NEW.invoice_id 
      AND status = 'completed'
      AND deleted_at IS NULL;
    
    -- Update invoice status
    IF inv_paid >= inv_total THEN
      UPDATE invoices 
      SET status = 'paid', paid_at = now(), paid_amount = inv_paid
      WHERE id = NEW.invoice_id;
    ELSIF inv_paid > 0 THEN
      UPDATE invoices 
      SET status = 'partially_paid', paid_amount = inv_paid
      WHERE id = NEW.invoice_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_invoice_status
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_invoice_status();

-- Enable Row Level Security
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can view payment methods in their organization"
  ON payment_methods FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment methods"
  ON payment_methods FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = payment_methods.organization_id
    )
  );

-- RLS Policies for payment_schedules
CREATE POLICY "Users can view payment schedules in their organization"
  ON payment_schedules FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment schedules"
  ON payment_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = payment_schedules.organization_id
    )
  );

-- RLS Policies for discounts
CREATE POLICY "Users can view discounts in their organization"
  ON discounts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage discounts"
  ON discounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = discounts.organization_id
    )
  );

-- RLS Policies for scholarships
CREATE POLICY "Users can view scholarships in their organization"
  ON scholarships FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage scholarships"
  ON scholarships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = scholarships.organization_id
    )
  );

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their organization"
  ON invoices FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = invoices.organization_id
    )
  );

-- RLS Policies for invoice_line_items
CREATE POLICY "Users can view invoice line items"
  ON invoice_line_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage invoice line items"
  ON invoice_line_items FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin')
      )
    )
  );

-- RLS Policies for payments
CREATE POLICY "Users can view payments in their organization"
  ON payments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = payments.organization_id
    )
  );

-- RLS Policies for payment_installments
CREATE POLICY "Users can view payment installments"
  ON payment_installments FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id IN (
        SELECT organization_id FROM profiles 
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage payment installments"
  ON payment_installments FOR ALL
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE organization_id IN (
        SELECT organization_id FROM profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'superadmin')
      )
    )
  );

-- RLS Policies for financial_transactions
CREATE POLICY "Users can view transactions in their organization"
  ON financial_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage transactions"
  ON financial_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'superadmin')
        AND organization_id = financial_transactions.organization_id
    )
  );

-- RLS Policies for student_accounts
CREATE POLICY "Users can view student accounts in their organization"
  ON student_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage student accounts"
  ON student_accounts FOR ALL
  USING (true);  -- Managed by triggers, not direct user access