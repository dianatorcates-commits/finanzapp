-- ==============================================================================
-- MIGRATION SCRIPT - ISSUE #72
-- Cumplimiento Legal: Bitácora de Consentimientos + Eliminación Total de Cuenta
-- Script 100% idempotente para ejecutar en el SQL Editor de Supabase
-- ==============================================================================

-- 1. Tabla inmutable y auditable de consentimientos legales
CREATE TABLE IF NOT EXISTS public.user_legal_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  is_adult_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'web_signup'
);

-- Índice para consultar rápidamente el consentimiento más reciente por usuario
CREATE INDEX IF NOT EXISTS idx_user_legal_consents_user_date
  ON public.user_legal_consents(user_id, accepted_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_legal_consents ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento estricto (SELECT e INSERT propios; sin UPDATE/DELETE manual para preservar auditoría)
DROP POLICY IF EXISTS "Users can view own legal consents" ON public.user_legal_consents;
CREATE POLICY "Users can view own legal consents"
  ON public.user_legal_consents
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own legal consents" ON public.user_legal_consents;
CREATE POLICY "Users can insert own legal consents"
  ON public.user_legal_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Función RPC segura para supresión total de datos y cuenta (Derecho al Olvido / Ley 21.719)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid UUID;
  v_tables TEXT[] := ARRAY[
    'savings_goal_contributions',
    'savings_goals',
    'credit_card_billings',
    'credits',
    'payment_allocations',
    'transactions',
    'accounts',
    'category_mappings',
    'auto_rules',
    'category_budgets',
    'telegram_profiles',
    'user_settings',
    'user_api_tokens',
    'user_legal_consents'
  ];
  v_table TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', v_table) USING v_uid;
    END IF;
  END LOOP;

  -- Eliminar cuenta de autenticación de Supabase (elimina identidad e historial auth del usuario)
  DELETE FROM auth.users WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
