-- ==============================================================================
-- MIGRATION SCRIPT - ISSUE #60
-- Crear tabla savings_goal_contributions para trazabilidad de aportes y extracciones
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.savings_goal_contributions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_id TEXT NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  transaction_id TEXT REFERENCES public.transactions(id) ON DELETE SET NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento para consultas por meta, usuario y orden cronológico
CREATE INDEX IF NOT EXISTS idx_savings_goal_contrib_user_goal 
  ON public.savings_goal_contributions(user_id, goal_id);

CREATE INDEX IF NOT EXISTS idx_savings_goal_contrib_tx 
  ON public.savings_goal_contributions(transaction_id);

CREATE INDEX IF NOT EXISTS idx_savings_goal_contrib_chronological 
  ON public.savings_goal_contributions(date DESC, created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.savings_goal_contributions ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento estricto por usuario
DROP POLICY IF EXISTS "Savings Goal Contributions Policy" ON public.savings_goal_contributions;
CREATE POLICY "Savings Goal Contributions Policy" 
  ON public.savings_goal_contributions 
  FOR ALL 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
