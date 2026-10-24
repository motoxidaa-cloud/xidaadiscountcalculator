-- =============================================================================
-- XIDAA MOTO DISCOUNT CALCULATOR & COMMERCIAL QUOTATION ENGINE
-- Supabase PostgreSQL Schema & Security Policies (RLS)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'sales_rep');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE model_category AS ENUM ('DL Model', 'Other Model');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE discount_allocation_option AS ENUM (
    'Scooty/Battery Discount',
    'Transport Support',
    'No Discount / Support'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE profitability_status AS ENUM (
    'Verified',
    'Below Target',
    'Not Verified'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'Xidaa Commercial Officer',
  role user_role NOT NULL DEFAULT 'sales_rep',
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CUSTOMERS / DEALERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dealership_code TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. ORDERS TABLE (Core Order Header)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  battery_included BOOLEAN NOT NULL DEFAULT false,
  transport_distance_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  allocation_mode TEXT NOT NULL DEFAULT 'Scooty/Battery Discount',
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy reference lookups and date sorts
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);

-- 5. ORDER SCOOTER ITEMS
CREATE TABLE IF NOT EXISTS public.order_scooter_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  unit_price NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scooter_items_order_id ON public.order_scooter_items(order_id);

-- 6. ORDER BATTERY ITEMS
CREATE TABLE IF NOT EXISTS public.order_battery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  unit_price NUMERIC(12, 2),
  eligible_discount_quantity INTEGER NOT NULL DEFAULT 0 CHECK (eligible_discount_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_battery_items_order_id ON public.order_battery_items(order_id);

-- 7. TRANSPORT FLEET ALLOCATIONS
CREATE TABLE IF NOT EXISTS public.transport_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  truck_id TEXT NOT NULL,
  truck_name TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  rate_per_km NUMERIC(10, 2) NOT NULL,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transport_allocations_order_id ON public.transport_allocations(order_id);

-- 8. CALCULATION SNAPSHOTS (Immutable Financial Snapshot)
CREATE TABLE IF NOT EXISTS public.calculation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  total_scooters INTEGER NOT NULL DEFAULT 0,
  total_dl_scooters INTEGER NOT NULL DEFAULT 0,
  total_other_scooters INTEGER NOT NULL DEFAULT 0,
  total_batteries INTEGER NOT NULL DEFAULT 0,
  scooter_discount_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  battery_discount_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_discount_allowance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  base_transport_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transport_extra_percent NUMERIC(5, 2) NOT NULL DEFAULT 10,
  transport_extra_charge NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transport_subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transport_gst_percent NUMERIC(5, 2) NOT NULL DEFAULT 5,
  transport_gst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_transport_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  half_transport_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transport_cost_per_scooter NUMERIC(12, 2),
  customer_transport_per_scooter NUMERIC(12, 2),
  allocation_option TEXT NOT NULL,
  company_transport_support NUMERIC(12, 2) NOT NULL DEFAULT 0,
  customer_transport_payment NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_scooter_discount_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
  actual_battery_discount_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
  scooter_battery_discount_applied NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_scooter_discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_customer_discount_benefit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  has_all_prices BOOLEAN NOT NULL DEFAULT false,
  gross_scooter_amount NUMERIC(12, 2),
  gross_battery_amount NUMERIC(12, 2),
  total_product_invoice_amount NUMERIC(12, 2),
  final_payable_amount NUMERIC(12, 2),
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calc_snapshots_order_id ON public.calculation_snapshots(order_id);

-- 9. DISCOUNT RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.discount_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  recommended_scenario_id TEXT NOT NULL,
  recommended_strategy_name TEXT NOT NULL,
  recommended_discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  company_transport_support NUMERIC(12, 2) NOT NULL DEFAULT 0,
  customer_transport_payment NUMERIC(12, 2) NOT NULL DEFAULT 0,
  estimated_company_profit NUMERIC(12, 2),
  profit_margin_percent NUMERIC(6, 2),
  target_profit_comparison TEXT,
  recommendation_reason TEXT NOT NULL,
  profitability_status TEXT NOT NULL,
  scenarios_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_disc_recommendations_order_id ON public.discount_recommendations(order_id);

-- 10. APP SETTINGS & DISCOUNT CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_config',
  config_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 11. AUDIT HISTORY TABLE (Financial Governance)
CREATE TABLE IF NOT EXISTS public.audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_history(entity_type, entity_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_scooter_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_battery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- Helper function: Get user role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view and manage all profiles"
  ON public.profiles FOR ALL
  USING (public.get_auth_role() = 'admin');

CREATE POLICY "Users can update non-role fields of their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ORDERS & RELATED POLICIES (Authenticated Commercial Staff)
CREATE POLICY "Authenticated staff can view orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can insert orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update their own orders or Admin/Manager can update any"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.get_auth_role() IN ('admin', 'manager'));

CREATE POLICY "Admins and Managers can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'manager') OR created_by = auth.uid());

-- ORDER ITEMS POLICIES
CREATE POLICY "Authenticated staff can manage scooter items"
  ON public.order_scooter_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff can manage battery items"
  ON public.order_battery_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff can manage transport allocations"
  ON public.transport_allocations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff can manage snapshots"
  ON public.calculation_snapshots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated staff can manage recommendations"
  ON public.discount_recommendations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CUSTOMERS POLICIES
CREATE POLICY "Authenticated staff can view customers"
  ON public.customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated staff can create customers"
  ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- APP SETTINGS POLICIES
CREATE POLICY "Authenticated staff can read settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only Admins can update app settings"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (public.get_auth_role() = 'admin')
  WITH CHECK (public.get_auth_role() = 'admin');

-- AUDIT HISTORY POLICIES
CREATE POLICY "Authenticated staff can view audit logs"
  ON public.audit_history FOR SELECT
  TO authenticated
  USING (public.get_auth_role() IN ('admin', 'manager'));

CREATE POLICY "System can record audit logs"
  ON public.audit_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role, must_change_password)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Xidaa Commercial Officer'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sales_rep'),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
