-- =============================================================================
-- Maison Kriss E-Commerce — Supabase Row Level Security, Triggers & Safeguards
-- Owned by Agent 1 (Database & Supabase Setup)
-- Apply AFTER Prisma initial migration (`prisma migrate deploy`).
-- =============================================================================

-- 1. Helper: check whether the currently authenticated user is an admin.
--    SECURITY DEFINER + fixed search_path avoids recursive RLS checks on profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- 2. Enable RLS on EVERY application table (non-negotiable).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- 3. PROFILES policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_self_customer" ON public.profiles;
CREATE POLICY "profiles_insert_self_customer"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'customer');

DROP POLICY IF EXISTS "profiles_update_own_customer_only" ON public.profiles;
CREATE POLICY "profiles_update_own_customer_only"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND role = 'customer')
  WITH CHECK (auth.uid() = id AND role = 'customer');

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. PRODUCTS policies
DROP POLICY IF EXISTS "products_select_active" ON public.products;
CREATE POLICY "products_select_active"
  ON public.products
  FOR SELECT
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_all" ON public.products;
CREATE POLICY "products_admin_all"
  ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. PRODUCT_VARIANTS policies
DROP POLICY IF EXISTS "product_variants_select_active_product" ON public.product_variants;
CREATE POLICY "product_variants_select_active_product"
  ON public.product_variants
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.active = true
    )
  );

DROP POLICY IF EXISTS "product_variants_admin_all" ON public.product_variants;
CREATE POLICY "product_variants_admin_all"
  ON public.product_variants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. CARTS policies
DROP POLICY IF EXISTS "carts_own_or_admin" ON public.carts;
CREATE POLICY "carts_own_or_admin"
  ON public.carts
  FOR ALL
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 7. CART_ITEMS policies
DROP POLICY IF EXISTS "cart_items_own_or_admin" ON public.cart_items;
CREATE POLICY "cart_items_own_or_admin"
  ON public.cart_items
  FOR ALL
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND c.user_id = auth.uid()
    )
  );

-- 8. ORDERS policies
--    Customers can SELECT their own orders and INSERT only as themselves.
--    UPDATE/DELETE are blocked for customers (only admin or service_role).
DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_self" ON public.orders;
CREATE POLICY "orders_insert_self"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
  ON public.orders
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete"
  ON public.orders
  FOR DELETE
  USING (public.is_admin());

-- 9. ORDER_ITEMS policies
DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin"
  ON public.order_items
  FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_insert_self" ON public.order_items;
CREATE POLICY "order_items_insert_self"
  ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
CREATE POLICY "order_items_admin_all"
  ON public.order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. PAYMENT_EVENTS policies
--     Admin read-only. Inserts happen exclusively via service_role (bypasses RLS).
--     No INSERT/UPDATE/DELETE policies => denied for anon & authenticated.
DROP POLICY IF EXISTS "payment_events_admin_select" ON public.payment_events;
CREATE POLICY "payment_events_admin_select"
  ON public.payment_events
  FOR SELECT
  USING (public.is_admin());

-- 11. PAGES policies
DROP POLICY IF EXISTS "pages_public_select" ON public.pages;
CREATE POLICY "pages_public_select"
  ON public.pages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "pages_admin_all" ON public.pages;
CREATE POLICY "pages_admin_all"
  ON public.pages
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 12. Trigger: auto-create public.profiles row on auth.users insert.
--     Checks optional Postgres GUC `app.admin_emails` (comma-separated, lowercased).
--     Agent 2's POST /api/auth/signup also reconciles ADMIN_EMAILS from Node env
--     so admin bootstrapping works even without setting a custom Postgres GUC.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_list text[];
  assigned_role text := 'customer';
BEGIN
  admin_list := string_to_array(
    lower(coalesce(current_setting('app.admin_emails', true), '')),
    ','
  );

  IF lower(NEW.email) = ANY(SELECT trim(x) FROM unnest(admin_list) AS x WHERE trim(x) <> '') THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'name',
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = COALESCE(public.profiles.name, EXCLUDED.name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 13. Trigger: prevent hard-deleting products; convert DELETE into soft-delete (active = false).
CREATE OR REPLACE FUNCTION public.soft_delete_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET active = false
  WHERE id = OLD.id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS prevent_product_hard_delete ON public.products;
CREATE TRIGGER prevent_product_hard_delete
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.soft_delete_product();
