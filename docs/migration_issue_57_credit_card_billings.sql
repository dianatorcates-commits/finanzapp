-- ==============================================================================
-- MIGRATION SCRIPT - ISSUE #57
-- Crear tabla credit_card_billings para trazabilidad formal de estados de cuenta
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.credit_card_billings (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  card_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  total_billed NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid',
  payment_transaction_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
  source_account_id TEXT REFERENCES public.accounts(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para búsqueda rápida por tarjeta, período y transacción de pago
CREATE INDEX IF NOT EXISTS idx_credit_card_billings_user_card_period 
  ON public.credit_card_billings(user_id, card_id, period);

CREATE INDEX IF NOT EXISTS idx_credit_card_billings_payment_tx 
  ON public.credit_card_billings(payment_transaction_id);

-- Habilitar RLS
ALTER TABLE public.credit_card_billings ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento estricto por usuario
DROP POLICY IF EXISTS "Credit Card Billings Policy" ON public.credit_card_billings;
CREATE POLICY "Credit Card Billings Policy" 
  ON public.credit_card_billings 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
