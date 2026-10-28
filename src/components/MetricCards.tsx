import React, { useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Calendar,
  PiggyBank,
  ShoppingCart,
  Landmark,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  ComputedTransaction,
  Account,
  CustomMetricCard,
  Credit,
  CategoryBudget,
  DEFAULT_DASHBOARD_CONFIG
} from '../types';
import {
  isPaymentOrIncomeTransaction,
  isCreditCardPaymentTransaction
} from '../utils/paymentAllocation';

interface MetricCardsProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  activeAccountId: string;
  metrics?: CustomMetricCard[];
  credits?: Credit[];
  budgets?: CategoryBudget[];
  currentPeriod?: string;
  onOpenBillingModal?: () => void;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  computedTransactions = [],
  accounts = [],
  activeAccountId = 'ALL',
  metrics = DEFAULT_DASHBOARD_CONFIG.metrics,
  credits = [],
  budgets = [],
  currentPeriod,
  onOpenBillingModal
}) => {
  const transactions = computedTransactions || [];
  const selectedPeriod = currentPeriod || new Date().toISOString().slice(0, 7);

  // Active selected account & cycle banner
  const selectedAcc = accounts.find((a) => a.id === activeAccountId);
  const cycleInfo = selectedAcc?.closingDay
    ? `Ciclo de Facturación: Corte el día ${selectedAcc.closingDay}${selectedAcc.dueDay ? ` • Vencimiento el día ${selectedAcc.dueDay}` : ''}`
    : null;

  // 1. KPI Calculation: Saldo Disponible en Cuentas (Liquidez real)
  const liquidityData = useMemo(() => {
    // Filtrar cuentas no TC (bancarias, débito, vista, ahorro, efectivo)
    const targetAccounts = activeAccountId !== 'ALL'
      ? accounts.filter((a) => a.id === activeAccountId && a.type !== 'credit_card')
      : accounts.filter((a) => a.type !== 'credit_card');

    const baseAmount = targetAccounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0);

    const relevantTxs = transactions.filter((tx) =>
      targetAccounts.some((a) => a.id === tx.accountId)
    );

    const incomeAmount = relevantTxs
      .filter((tx) => isPaymentOrIncomeTransaction(tx) || tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const expensesAmount = relevantTxs
      .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalAvailable = baseAmount + incomeAmount - expensesAmount;

    return {
      total: totalAvailable,
      base: baseAmount,
      income: incomeAmount,
      expenses: expensesAmount
    };
  }, [accounts, transactions, activeAccountId]);

  // 2. KPI Calculation: Deuda Utilizada en TC (Cupo y Endeudamiento)
  const creditCardData = useMemo(() => {
    const targetCards = activeAccountId !== 'ALL'
      ? accounts.filter((a) => a.id === activeAccountId && a.type === 'credit_card')
      : accounts.filter((a) => a.type === 'credit_card');

    const totalLimit = targetCards.reduce((sum, a) => sum + (a.creditLimit || 0), 0);

    const cardTxs = transactions.filter((tx) =>
      targetCards.some((a) => a.id === tx.accountId) && !isPaymentOrIncomeTransaction(tx) && tx.amount > 0
    );

    const totalDebt = cardTxs.reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);
    const availableCredit = Math.max(0, totalLimit - totalDebt);
    const usedPercentage = totalLimit > 0 ? Math.min(100, Math.round((totalDebt / totalLimit) * 100)) : 0;

    return {
      debt: totalDebt,
      limit: totalLimit,
      available: availableCredit,
      percentage: usedPercentage
    };
  }, [accounts, transactions, activeAccountId]);

  // 3. KPI Calculation: Facturación Estimada al Corte (TC)
  const billingProjectionData = useMemo(() => {
    const targetCards = activeAccountId !== 'ALL'
      ? accounts.filter((a) => a.id === activeAccountId && a.type === 'credit_card')
      : accounts.filter((a) => a.type === 'credit_card');

    const cyclePurchases = transactions
      .filter((tx) => targetCards.some((a) => a.id === tx.accountId) && !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);

    // Cuotas vigentes en créditos
    const activeInstallments = credits
      .filter((c) => c.type === 'cuotas_tc' && targetCards.some((a) => a.id === c.accountId))
      .reduce((sum, c) => sum + (c.myShareAmount || c.installmentAmount), 0);

    // Suscripciones activas
    const activeSubs = credits
      .filter((c) => c.type === 'suscripcion' && targetCards.some((a) => a.id === c.accountId))
      .reduce((sum, c) => sum + (c.myShareAmount || c.installmentAmount), 0);

    const grandTotal = cyclePurchases + activeInstallments + activeSubs;

    // Próximo día de corte
    const nextClosingDay = targetCards[0]?.closingDay || 24;

    return {
      total: grandTotal,
      cycle: cyclePurchases,
      installments: activeInstallments,
      subs: activeSubs,
      closingDay: nextClosingDay
    };
  }, [accounts, transactions, credits, activeAccountId]);

  // 4. KPI Calculation: Gasto Neto Real del Mes (Presupuesto)
  const monthlyExpenseData = useMemo(() => {
    const netSpent = transactions
      .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);

    const totalBudgetLimit = budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
    const budgetPct = totalBudgetLimit > 0 ? Math.min(100, Math.round((netSpent / totalBudgetLimit) * 100)) : 0;
    const marginRemaining = totalBudgetLimit - netSpent;

    return {
      spent: netSpent,
      limit: totalBudgetLimit,
      percentage: budgetPct,
      margin: marginRemaining
    };
  }, [transactions, budgets]);

  // Check if standard 4 Terminal KPIs are enabled or if custom metrics should be rendered
  const isDefaultTerminalLayout = !metrics || metrics.length <= 4;

  return (
    <div className="space-y-4 mb-6">
      
      {/* Active Account Billing Cycle Banner */}
      {cycleInfo && (
        <div className="bg-[#141422] border border-[#302840] panel-rim px-4 py-2.5 rounded-2xl text-xs text-[#E8E0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00FFCC] flex-shrink-0" />
            <span>
              <b className="text-white font-headline">{selectedAcc?.name}:</b> {cycleInfo}
            </span>
          </div>
          <span className="text-[11px] text-[#A098B0] font-sans">
            Gastos posteriores al día {selectedAcc?.closingDay} se asignan al ciclo de facturación del mes siguiente
          </span>
        </div>
      )}

      {/* 4 Terminal Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* KPI 1: Saldo Disponible en Cuentas (Liquidez) */}
        <div className="bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all hover:border-[#00FFCC]/40 group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                Saldo en Cuentas
              </span>
              <div className="p-2 rounded-xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/20 shadow-sm">
                <Wallet className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-[#00FFCC] transition-colors">
                {formatCLP(liquidityData.total)}
              </p>
              <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                Liquidez disponible en cuentas vista/corriente
              </p>
            </div>
          </div>

          {/* Micro-Indicadores en el Pie */}
          <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
            <span title="Saldo inicial base">Base: {formatCLP(liquidityData.base)}</span>
            <span className="text-emerald-400 font-bold" title="Ingresos del período">
              +{formatCLP(liquidityData.income)}
            </span>
            <span className="text-rose-400 font-bold" title="Egresos en cuentas">
              -{formatCLP(liquidityData.expenses)}
            </span>
          </div>
        </div>

        {/* KPI 2: Deuda Utilizada en TC (Cupo y Endeudamiento) */}
        <div className="bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all hover:border-[#00FFCC]/40 group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                Deuda Utilizada en TC
              </span>
              <div className="p-2 rounded-xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/20 shadow-sm">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-[#00FFCC] transition-colors">
                  {formatCLP(creditCardData.debt)}
                </p>
                {creditCardData.limit > 0 && (
                  <span className="text-xs font-mono font-semibold text-[#00FFCC]">
                    {creditCardData.percentage}% cupo
                  </span>
                )}
              </div>
              
              {/* Barra de Progreso Cupo Cian */}
              {creditCardData.limit > 0 ? (
                <div className="w-full bg-[#141422] h-1.5 rounded-full overflow-hidden mt-2.5 border border-[#302840]/40">
                  <div
                    className="h-full bg-[#00FFCC] rounded-full transition-all duration-500 shadow-sm shadow-[#00FFCC]/50"
                    style={{ width: `${creditCardData.percentage}%` }}
                  />
                </div>
              ) : (
                <p className="text-[11px] text-[#A098B0] mt-0.5">Saldo acumulado en tarjetas de crédito</p>
              )}
            </div>
          </div>

          {/* Micro-Indicadores en el Pie */}
          <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
            <span>Cupo: {formatCLP(creditCardData.limit)}</span>
            <span className="text-[#00FFCC] font-bold">
              Disp: {formatCLP(creditCardData.available)}
            </span>
          </div>
        </div>

        {/* KPI 3: Facturación al Corte (Proyección TC con Acción de 1 Clic) */}
        <div
          onClick={onOpenBillingModal}
          className="bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all hover:border-[#FFE04A]/60 cursor-pointer group hover:bg-[#141422]"
          title="Ver desglose y simular facturación al corte"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                Facturación al Corte
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>Corte día {billingProjectionData.closingDay}</span>
              </span>
            </div>

            <div className="mt-3">
              <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-[#FFE04A] transition-colors">
                {formatCLP(billingProjectionData.total)}
              </p>
              <p className="text-[11px] text-[#FFE04A]/80 mt-0.5 flex items-center gap-1 font-sans">
                <span>⚡ Simular cargos al corte (1 clic)</span>
              </p>
            </div>
          </div>

          {/* Micro-Indicadores en el Pie */}
          <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
            <span title="Compras del ciclo">Ciclo: {formatCLP(billingProjectionData.cycle)}</span>
            <span title="Cuotas vigentes">Cuotas: {formatCLP(billingProjectionData.installments)}</span>
            <span title="Suscripciones activas">Sub: {formatCLP(billingProjectionData.subs)}</span>
          </div>
        </div>

        {/* KPI 4: Gasto Neto Real del Mes (Control de Presupuesto) */}
        <div className="bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all hover:border-[#FF2D78]/40 group">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                Gasto Neto Real
              </span>
              <div className="p-2 rounded-xl bg-[#FF2D78]/10 text-[#FF2D78] border border-[#FF2D78]/20 shadow-sm">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-[#FF2D78] transition-colors">
                  {formatCLP(monthlyExpenseData.spent)}
                </p>
                {monthlyExpenseData.limit > 0 && (
                  <span className={`text-xs font-mono font-semibold ${monthlyExpenseData.spent > monthlyExpenseData.limit ? 'text-rose-400' : 'text-[#00FFCC]'}`}>
                    {monthlyExpenseData.percentage}%
                  </span>
                )}
              </div>

              {/* Barra de Progreso Presupuesto Magenta */}
              {monthlyExpenseData.limit > 0 ? (
                <div className="w-full bg-[#141422] h-1.5 rounded-full overflow-hidden mt-2.5 border border-[#302840]/40">
                  <div
                    className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                      monthlyExpenseData.spent > monthlyExpenseData.limit
                        ? 'bg-rose-500 shadow-rose-500/50'
                        : 'bg-[#FF2D78] shadow-[#FF2D78]/50'
                    }`}
                    style={{ width: `${monthlyExpenseData.percentage}%` }}
                  />
                </div>
              ) : (
                <p className="text-[11px] text-[#A098B0] mt-0.5">Monto neto utilizado deduciendo abonos</p>
              )}
            </div>
          </div>

          {/* Micro-Indicadores en el Pie */}
          <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
            <span>Límite: {monthlyExpenseData.limit > 0 ? formatCLP(monthlyExpenseData.limit) : 'No fijado'}</span>
            <span className={monthlyExpenseData.margin >= 0 ? 'text-[#00FFCC] font-bold' : 'text-rose-400 font-bold'}>
              Margen: {formatCLP(monthlyExpenseData.margin)}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
