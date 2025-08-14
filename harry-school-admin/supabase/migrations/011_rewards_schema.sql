-- Migration: Rewards Management System
-- Description: Creates tables for rewards catalog and redemption system
-- Version: 011
-- Author: Claude Code
-- Date: 2025-08-13

-- Create rewards_catalog table
CREATE TABLE rewards_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
  reward_type VARCHAR(50) NOT NULL DEFAULT 'privilege' CHECK (reward_type IN ('privilege', 'certificate', 'recognition', 'physical', 'special')),
  reward_category VARCHAR(50) DEFAULT 'general' CHECK (reward_category IN ('general', 'academic', 'behavioral', 'attendance', 'special')),
  inventory_quantity INTEGER DEFAULT NULL, -- NULL means unlimited
  max_redemptions_per_student INTEGER DEFAULT NULL, -- NULL means unlimited
  requires_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  terms_conditions TEXT,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create reward_redemptions table
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards_catalog(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL CHECK (coins_spent > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'cancelled', 'rejected')),
  request_notes TEXT,
  admin_notes TEXT,
  delivery_method VARCHAR(50) DEFAULT 'pickup', -- pickup, delivery, digital, etc.
  delivery_address TEXT,
  delivery_date TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES profiles(id),
  delivered_at TIMESTAMP WITH TIME ZONE,
  certificate_number VARCHAR(100) UNIQUE,
  certificate_url TEXT,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create student_rankings table if it doesn't exist (for points/coins tracking)
CREATE TABLE IF NOT EXISTS student_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  available_coins INTEGER DEFAULT 0,
  spent_coins INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_rank INTEGER,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, student_id)
);

-- Create points_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earned', 'deducted', 'bonus', 'redeemed')),
  points_amount INTEGER NOT NULL,
  coins_earned INTEGER DEFAULT 0,
  reason TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'manual',
  related_entity_type VARCHAR(50), -- 'achievement', 'reward_redemption', etc.
  related_entity_id UUID,
  awarded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50) DEFAULT '🏆',
  badge_color VARCHAR(7) DEFAULT '#4F7942',
  points_reward INTEGER DEFAULT 0 CHECK (points_reward >= 0),
  coins_reward INTEGER DEFAULT 0 CHECK (coins_reward >= 0),
  achievement_type VARCHAR(50) NOT NULL DEFAULT 'manual',
  criteria JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_automatic BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create student_achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  awarded_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(organization_id, student_id, achievement_id)
);

-- Create indexes for better performance
CREATE INDEX idx_rewards_catalog_organization_active ON rewards_catalog(organization_id, is_active);
CREATE INDEX idx_rewards_catalog_type_category ON rewards_catalog(reward_type, reward_category);
CREATE INDEX idx_rewards_catalog_featured_order ON rewards_catalog(is_featured DESC, display_order);
CREATE INDEX idx_rewards_catalog_valid_period ON rewards_catalog(valid_from, valid_until);

CREATE INDEX idx_reward_redemptions_organization ON reward_redemptions(organization_id);
CREATE INDEX idx_reward_redemptions_student_status ON reward_redemptions(student_id, status);
CREATE INDEX idx_reward_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_status_date ON reward_redemptions(status, redeemed_at);
CREATE INDEX idx_reward_redemptions_approval ON reward_redemptions(approved_by, approved_at);

CREATE INDEX idx_student_rankings_organization ON student_rankings(organization_id);
CREATE INDEX idx_student_rankings_student ON student_rankings(student_id);
CREATE INDEX idx_student_rankings_coins ON student_rankings(available_coins DESC);
CREATE INDEX idx_student_rankings_points ON student_rankings(total_points DESC);
CREATE INDEX idx_student_rankings_rank ON student_rankings(current_rank);

CREATE INDEX idx_points_transactions_student_date ON points_transactions(student_id, created_at DESC);
CREATE INDEX idx_points_transactions_organization ON points_transactions(organization_id);
CREATE INDEX idx_points_transactions_type_category ON points_transactions(transaction_type, category);
CREATE INDEX idx_points_transactions_related_entity ON points_transactions(related_entity_type, related_entity_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rewards_catalog_updated_at BEFORE UPDATE ON rewards_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reward_redemptions_updated_at BEFORE UPDATE ON reward_redemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_rankings_updated_at BEFORE UPDATE ON student_rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update student ranking after points transaction
CREATE OR REPLACE FUNCTION update_student_ranking(
  p_student_id UUID,
  p_points_change INTEGER,
  p_coins_change INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO student_rankings (organization_id, student_id, total_points, available_coins, spent_coins)
  SELECT 
    s.organization_id,
    p_student_id,
    GREATEST(0, p_points_change),
    GREATEST(0, p_coins_change),
    0
  FROM students s 
  WHERE s.id = p_student_id
  ON CONFLICT (organization_id, student_id) 
  DO UPDATE SET
    total_points = GREATEST(0, student_rankings.total_points + p_points_change),
    available_coins = GREATEST(0, student_rankings.available_coins + p_coins_change),
    last_activity_at = NOW(),
    updated_at = NOW();
    
  -- Update student ranks within organization
  WITH ranked_students AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, last_activity_at DESC) as new_rank
    FROM student_rankings 
    WHERE organization_id = (SELECT organization_id FROM students WHERE id = p_student_id)
      AND deleted_at IS NULL
  )
  UPDATE student_rankings 
  SET current_rank = ranked_students.new_rank
  FROM ranked_students 
  WHERE student_rankings.id = ranked_students.id;
END;
$$ LANGUAGE plpgsql;

-- Function to process reward redemption
CREATE OR REPLACE FUNCTION process_reward_redemption(
  p_redemption_id UUID,
  p_approved_by UUID,
  p_admin_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_student_id UUID;
  v_coins_spent INTEGER;
  v_organization_id UUID;
  v_reward_name TEXT;
BEGIN
  -- Get redemption details
  SELECT student_id, coins_spent, organization_id, rc.name
  INTO v_student_id, v_coins_spent, v_organization_id, v_reward_name
  FROM reward_redemptions rr
  JOIN rewards_catalog rc ON rr.reward_id = rc.id
  WHERE rr.id = p_redemption_id;
  
  -- Update redemption status
  UPDATE reward_redemptions 
  SET 
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW(),
    admin_notes = COALESCE(p_admin_notes, admin_notes)
  WHERE id = p_redemption_id;
  
  -- Deduct coins from student ranking
  UPDATE student_rankings 
  SET 
    available_coins = available_coins - v_coins_spent,
    spent_coins = spent_coins + v_coins_spent,
    updated_at = NOW()
  WHERE student_id = v_student_id AND organization_id = v_organization_id;
  
  -- Create points transaction record
  INSERT INTO points_transactions (
    organization_id,
    student_id,
    transaction_type,
    points_amount,
    coins_earned,
    reason,
    category,
    related_entity_type,
    related_entity_id,
    awarded_by
  ) VALUES (
    v_organization_id,
    v_student_id,
    'redeemed',
    0,
    -v_coins_spent,
    'Redeemed reward: ' || v_reward_name,
    'reward_redemption',
    'reward_redemption',
    p_redemption_id,
    p_approved_by
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get student coin balance
CREATE OR REPLACE FUNCTION get_student_coin_balance(p_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(available_coins, 0)
  INTO v_balance
  FROM student_rankings
  WHERE student_id = p_student_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to validate reward redemption eligibility
CREATE OR REPLACE FUNCTION can_redeem_reward(
  p_student_id UUID,
  p_reward_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_coin_cost INTEGER;
  v_available_coins INTEGER;
  v_inventory_quantity INTEGER;
  v_max_redemptions INTEGER;
  v_student_redemptions INTEGER;
  v_is_active BOOLEAN;
  v_valid_from TIMESTAMP WITH TIME ZONE;
  v_valid_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get reward details
  SELECT 
    coin_cost, 
    inventory_quantity, 
    max_redemptions_per_student,
    is_active,
    valid_from,
    valid_until
  INTO 
    v_coin_cost, 
    v_inventory_quantity, 
    v_max_redemptions,
    v_is_active,
    v_valid_from,
    v_valid_until
  FROM rewards_catalog 
  WHERE id = p_reward_id AND deleted_at IS NULL;
  
  -- Check if reward exists and is active
  IF NOT FOUND OR NOT v_is_active THEN
    RETURN FALSE;
  END IF;
  
  -- Check validity period
  IF v_valid_from > NOW() OR (v_valid_until IS NOT NULL AND v_valid_until < NOW()) THEN
    RETURN FALSE;
  END IF;
  
  -- Get student's available coins
  SELECT COALESCE(available_coins, 0)
  INTO v_available_coins
  FROM student_rankings
  WHERE student_id = p_student_id;
  
  -- Check if student has enough coins
  IF v_available_coins < v_coin_cost THEN
    RETURN FALSE;
  END IF;
  
  -- Check inventory if limited
  IF v_inventory_quantity IS NOT NULL THEN
    -- Count approved redemptions that haven't been delivered
    SELECT COUNT(*)
    INTO v_student_redemptions
    FROM reward_redemptions
    WHERE reward_id = p_reward_id 
      AND status IN ('approved', 'delivered')
      AND deleted_at IS NULL;
      
    IF v_student_redemptions >= v_inventory_quantity THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check per-student redemption limit
  IF v_max_redemptions IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_student_redemptions
    FROM reward_redemptions
    WHERE reward_id = p_reward_id 
      AND student_id = p_student_id
      AND status IN ('approved', 'delivered')
      AND deleted_at IS NULL;
      
    IF v_student_redemptions >= v_max_redemptions THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert some sample rewards for testing
INSERT INTO rewards_catalog (organization_id, name, description, coin_cost, reward_type, reward_category, created_by) 
SELECT 
  o.id,
  'Extra Break Time',
  'Enjoy an additional 10 minutes of break time',
  50,
  'privilege',
  'behavioral',
  p.id
FROM organizations o
CROSS JOIN profiles p
WHERE p.role = 'admin'
LIMIT 1;

INSERT INTO rewards_catalog (organization_id, name, description, coin_cost, reward_type, reward_category, created_by) 
SELECT 
  o.id,
  'Achievement Certificate',
  'Personalized certificate recognizing your accomplishments',
  100,
  'certificate',
  'academic',
  p.id
FROM organizations o
CROSS JOIN profiles p
WHERE p.role = 'admin'
LIMIT 1;

INSERT INTO rewards_catalog (organization_id, name, description, coin_cost, reward_type, reward_category, created_by) 
SELECT 
  o.id,
  'Student of the Month',
  'Special recognition as Student of the Month',
  200,
  'recognition',
  'special',
  p.id
FROM organizations o
CROSS JOIN profiles p
WHERE p.role = 'admin'
LIMIT 1;

-- Update schema version
INSERT INTO schema_versions (version, description, applied_by) 
VALUES ('011', 'Rewards Management System', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));