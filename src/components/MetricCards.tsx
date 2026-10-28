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
  Zap,
  Layers,
  Filter,
  Sliders
} from 'lucide-react';
import {
  ComputedTransaction,
  Account,
  CustomMetricCard,
  Credit,
  CategoryBudget,
  DEFAULT_DASHBOARD_CONFIG,
  MetricType
} from '../types';
import {
  isPaymentOrIncomeTransaction,
  isCreditCardPaymentTransaction
} from '../utils/paymentAllocation';
import { WakingMascotWidget } from './WakingMascotWidget';

interface MetricCardsProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  activeAccountId: string;
  metrics?: CustomMetricCard[];
  credits?: Credit[];
  budgets?: CategoryBudget[];
  currentPeriod?: string;
  onOpenBillingModal?: () => void;
  onOpenCustomizeModal?: () => void;
  onQuickAdd?: () => void;
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
  onOpenBillingModal,
  onOpenCustomizeModal,
  onQuickAdd
}) => {
  const transactions = computedTransactions || [];
  const selectedPeriod = currentPeriod || new Date().toISOString().slice(0, 7);

  // Active selected account & cycle banner
  const selectedAcc = accounts.find((a) => a.id === activeAccountId);
  const cycleInfo = selectedAcc?.closingDay
    ? `Ciclo de Facturación: Corte el día ${selectedAcc.closingDay}${selectedAcc.dueDay ? ` • Vencimiento el día ${selectedAcc.dueDay}` : ''}`
    : null;

  // Active enabled metrics list
  const activeMetrics = useMemo(() => {
    return (metrics || []).filter((m) => m.enabled);
  }, [metrics]);

  // 1. Data Calculation: Saldo Disponible en Cuentas (Liquidez real)
  const liquidityData = useMemo(() => {
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

  // 2. Data Calculation: Deuda Utilizada en TC (Cupo y Endeudamiento)
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

  // 3. Data Calculation: Facturación Estimada al Corte (TC)
  const billingProjectionData = useMemo(() => {
    const targetCards = activeAccountId !== 'ALL'
      ? accounts.filter((a) => a.id === activeAccountId && a.type === 'credit_card')
      : accounts.filter((a) => a.type === 'credit_card');

    const cyclePurchases = transactions
      .filter((tx) => targetCards.some((a) => a.id === tx.accountId) && !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);

    const activeInstallments = credits
      .filter((c) => c.type === 'cuotas_tc' && (targetCards.some((a) => a.id === c.accountId) || (!c.accountId && targetCards.length > 0)))
      .reduce((sum, c) => sum + (c.myShareAmount || c.installmentAmount || 0), 0);

    const activeSubs = credits
      .filter((c) => c.type === 'suscripcion' && c.isActive !== false && (targetCards.some((a) => a.id === c.accountId) || (!c.accountId && targetCards.length > 0)))
      .reduce((sum, c) => sum + (c.myShareAmount || c.installmentAmount || 0), 0);

    const grandTotal = cyclePurchases + activeInstallments + activeSubs;
    const nextClosingDay = targetCards[0]?.closingDay || 24;

    return {
      total: grandTotal,
      cycle: cyclePurchases,
      installments: activeInstallments,
      subs: activeSubs,
      closingDay: nextClosingDay
    };
  }, [accounts, transactions, credits, activeAccountId]);

  // 4. Data Calculation: Gasto Neto Real del Mes (Presupuesto)
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

  // 5. Classic Metric Calculations (Original Gross, Payments, Net Amount, Unallocated, Balance)
  const grossExpenses = useMemo(() => {
    return transactions
      .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalPayments = useMemo(() => {
    return transactions
      .filter((tx) => isPaymentOrIncomeTransaction(tx) || tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  const netAmountUsed = useMemo(() => {
    return transactions
      .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);
  }, [transactions]);

  const unallocatedTcBalance = useMemo(() => {
    return transactions
      .filter((tx) => isCreditCardPaymentTransaction(tx))
      .reduce((sum, tx) => sum + (tx.unallocatedPaymentBalance || 0), 0);
  }, [transactions]);

  const netBalance = useMemo(() => {
    return totalPayments - grossExpenses;
  }, [totalPayments, grossExpenses]);

  // Helper to calculate custom metrics by category/account
  const calculateCustomMetric = (metric: CustomMetricCard) => {
    let filtered = transactions;
    if (metric.filterAccountId && metric.filterAccountId !== 'ALL') {
      filtered = filtered.filter((tx) => tx.accountId === metric.filterAccountId);
    }
    if (metric.filterCategory && metric.filterCategory !== 'ALL') {
      filtered = filtered.filter((tx) => tx.category === metric.filterCategory || tx.subcategory === metric.filterCategory);
    }

    if (metric.type === 'compra') {
      const total = filtered
        .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { value: total, subtitle: 'Gasto total registrado' };
    }

    if (metric.type === 'pago_tc') {
      const total = filtered
        .filter((tx) => isCreditCardPaymentTransaction(tx) || tx.transactionType === 'pago_tc')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { value: total, subtitle: 'Abonos y pagos de tarjeta' };
    }

    if (metric.type === 'total_payments') {
      const total = filtered
        .filter((tx) => isPaymentOrIncomeTransaction(tx) || tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { value: total, subtitle: 'Total recibido / abonado' };
    }

    // Default custom expense
    const total = filtered
      .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);
    return { value: total, subtitle: `Filtro: ${metric.filterCategory || metric.filterAccountId || 'Personalizado'}` };
  };

  // Color & Theme resolver
  const getColorStyles = (color: string) => {
    switch (color) {
      case 'neon-cyan':
      case 'sky':
        return {
          iconBg: 'bg-[#00FFCC]/10',
          iconBorder: 'border-[#00FFCC]/30',
          iconText: 'text-[#00FFCC]',
          hoverBorder: 'hover:border-[#00FFCC]/50',
          accentColor: '#00FFCC',
          progressGrad: 'from-[#00FFCC] to-[#38bdf8]'
        };
      case 'neon-magenta':
      case 'rose':
        return {
          iconBg: 'bg-[#FF2D78]/10',
          iconBorder: 'border-[#FF2D78]/30',
          iconText: 'text-[#FF2D78]',
          hoverBorder: 'hover:border-[#FF2D78]/50',
          accentColor: '#FF2D78',
          progressGrad: 'from-[#FF2D78] to-[#f43f5e]'
        };
      case 'neon-amber':
      case 'amber':
        return {
          iconBg: 'bg-[#FFE04A]/10',
          iconBorder: 'border-[#FFE04A]/30',
          iconText: 'text-[#FFE04A]',
          hoverBorder: 'hover:border-[#FFE04A]/50',
          accentColor: '#FFE04A',
          progressGrad: 'from-[#FFE04A] to-amber-500'
        };
      case 'neon-blue':
      case 'indigo':
        return {
          iconBg: 'bg-[#38bdf8]/10',
          iconBorder: 'border-[#38bdf8]/30',
          iconText: 'text-[#38bdf8]',
          hoverBorder: 'hover:border-[#38bdf8]/50',
          accentColor: '#38bdf8',
          progressGrad: 'from-[#38bdf8] to-blue-600'
        };
      case 'emerald':
      case 'teal':
        return {
          iconBg: 'bg-emerald-500/10',
          iconBorder: 'border-emerald-500/30',
          iconText: 'text-emerald-400',
          hoverBorder: 'hover:border-emerald-500/50',
          accentColor: '#10b981',
          progressGrad: 'from-emerald-400 to-teal-500'
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-500/10',
          iconBorder: 'border-purple-500/30',
          iconText: 'text-purple-400',
          hoverBorder: 'hover:border-purple-500/50',
          accentColor: '#c084fc',
          progressGrad: 'from-purple-400 to-indigo-500'
        };
      default:
        return {
          iconBg: 'bg-[#00FFCC]/10',
          iconBorder: 'border-[#00FFCC]/30',
          iconText: 'text-[#00FFCC]',
          hoverBorder: 'hover:border-[#00FFCC]/50',
          accentColor: '#00FFCC',
          progressGrad: 'from-[#00FFCC] to-[#38bdf8]'
        };
    }
  };

  // Helper for dynamic icon
  const renderMetricIcon = (iconName: string, iconClass: string) => {
    switch (iconName) {
      case 'wallet':
        return <Wallet className={iconClass} />;
      case 'credit-card':
        return <CreditCard className={iconClass} />;
      case 'calendar':
        return <Calendar className={iconClass} />;
      case 'shield-check':
        return <ShieldCheck className={iconClass} />;
      case 'trending-down':
        return <TrendingDown className={iconClass} />;
      case 'trending-up':
        return <TrendingUp className={iconClass} />;
      case 'piggy-bank':
        return <PiggyBank className={iconClass} />;
      case 'shopping-cart':
        return <ShoppingCart className={iconClass} />;
      case 'landmark':
        return <Landmark className={iconClass} />;
      case 'layers':
        return <Layers className={iconClass} />;
      default:
        return <Zap className={iconClass} />;
    }
  };

  // Grid responsiveness based on active cards count
  const gridClasses = useMemo(() => {
    const count = activeMetrics.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }, [activeMetrics.length]);

  return (
    <div className="space-y-4 mb-6">
      {/* Waking Mascot Interactive Dashboard Banner ("Billetera con Vida" - Issue #29) */}
      <WakingMascotWidget
        transactions={transactions}
        onQuickAdd={onQuickAdd}
      />

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

      {/* Dynamic Grid of Metric Cards */}
      {activeMetrics.length === 0 ? (
        <div className="bg-[#111118] border border-dashed border-[#302840] panel-rim rounded-2xl p-8 text-center space-y-3">
          <Sliders className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No hay tarjetas de métricas activas</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Todas las tarjetas de indicadores están ocultas. Puedes reactivarlas o crear nuevos indicadores en Personalizar Dashboard.
          </p>
          {onOpenCustomizeModal && (
            <button
              onClick={onOpenCustomizeModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] text-[#0A0A12] text-xs font-black shadow-lg"
            >
              Configurar Métricas
            </button>
          )}
        </div>
      ) : (
        <div className={`grid ${gridClasses} gap-4`}>
          {activeMetrics.map((metric) => {
            const styles = getColorStyles(metric.color);

            // Specific Card 1: Liquidity (Saldo en Cuentas)
            if (metric.type === 'liquidity' || metric.id === 'm-liquidity') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
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
              );
            }

            // Specific Card 2: Deuda TC
            if (metric.type === 'credit_card_debt' || metric.id === 'm-credit-card-debt') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
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

                      {creditCardData.limit > 0 ? (
                        <div className="w-full bg-[#141422] h-1.5 rounded-full overflow-hidden mt-2.5 border border-[#302840]/40">
                          <div
                            className="bg-[#00FFCC] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,255,204,0.4)]"
                            style={{ width: `${creditCardData.percentage}%` }}
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                          Suma de deudas activas en tarjetas
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Cupo: {formatCLP(creditCardData.limit)}</span>
                    <span className="text-emerald-400 font-bold">
                      Disp: {formatCLP(creditCardData.available)}
                    </span>
                  </div>
                </div>
              );
            }

            // Specific Card 3: Facturación al Corte
            if (metric.type === 'billing_projection' || metric.id === 'm-billing-projection') {
              return (
                <div
                  key={metric.id}
                  onClick={onOpenBillingModal}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group cursor-pointer`}
                  title="Haz clic para abrir el Simulador de Facturación TC"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30">
                          Corte d.{billingProjectionData.closingDay}
                        </span>
                        <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                          {renderMetricIcon(metric.icon, 'w-4 h-4')}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-[#FFE04A] transition-colors">
                        {formatCLP(billingProjectionData.total)}
                      </p>
                      <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans flex items-center gap-1">
                        <span>Cargos proyectados al cierre del ciclo</span>
                        <span className="text-[#00FFCC] font-bold text-[10px] underline">Simular ⚡</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span title="Compras directas del mes">Ciclo: {formatCLP(billingProjectionData.cycle)}</span>
                    <span title="Cuotas de compras">Cuotas: {formatCLP(billingProjectionData.installments)}</span>
                    <span title="Suscripciones recurrentes">Sub: {formatCLP(billingProjectionData.subs)}</span>
                  </div>
                </div>
              );
            }

            // Specific Card 4: Gasto Neto Real del Mes
            if (metric.type === 'monthly_net_spent' || metric.id === 'm-monthly-net-spent') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-[#FF2D78] transition-colors">
                          {formatCLP(monthlyExpenseData.spent)}
                        </p>
                        {monthlyExpenseData.limit > 0 && (
                          <span className={`text-xs font-mono font-semibold ${monthlyExpenseData.percentage >= 100 ? 'text-[#FF2D78]' : 'text-emerald-400'}`}>
                            {monthlyExpenseData.percentage}%
                          </span>
                        )}
                      </div>

                      {monthlyExpenseData.limit > 0 ? (
                        <div className="w-full bg-[#141422] h-1.5 rounded-full overflow-hidden mt-2.5 border border-[#302840]/40">
                          <div
                            className="bg-[#FF2D78] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,45,120,0.4)]"
                            style={{ width: `${monthlyExpenseData.percentage}%` }}
                          />
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                          Gastos descontando abonos aplicados
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Límite: {formatCLP(monthlyExpenseData.limit)}</span>
                    <span className={monthlyExpenseData.margin >= 0 ? 'text-emerald-400 font-bold' : 'text-[#FF2D78] font-bold'}>
                      {monthlyExpenseData.margin >= 0 ? `Margen: ${formatCLP(monthlyExpenseData.margin)}` : `Excedido: ${formatCLP(Math.abs(monthlyExpenseData.margin))}`}
                    </span>
                  </div>
                </div>
              );
            }

            // Classic 5: Gastos Totales Original
            if (metric.type === 'gross_expenses' || metric.id === 'm-gross-expenses') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-rose-400 transition-colors">
                        {formatCLP(grossExpenses)}
                      </p>
                      <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                        Suma bruta de compras sin descontar abonos
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Compras del período</span>
                    <span className="text-rose-400 font-bold">{transactions.filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0).length} tx</span>
                  </div>
                </div>
              );
            }

            // Classic 6: Abonos y Sueldos
            if (metric.type === 'total_payments' || metric.id === 'm-total-payments') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                        {formatCLP(totalPayments)}
                      </p>
                      <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                        Ingresos, sueldos y abonos registrados
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Entradas del período</span>
                    <span className="text-emerald-400 font-bold">+{formatCLP(totalPayments)}</span>
                  </div>
                </div>
              );
            }

            // Classic 7: Monto Real Utilizado
            if (metric.type === 'net_amount_used' || metric.id === 'm-net-amount') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
                        {formatCLP(netAmountUsed)}
                      </p>
                      <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                        Gasto neto imputable tras aplicar abonos FIFO
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Abonos aplicados</span>
                    <span className="text-sky-400 font-bold">{formatCLP(Math.max(0, grossExpenses - netAmountUsed))}</span>
                  </div>
                </div>
              );
            }

            // Classic 8: Abonos TC sin asignar
            if (metric.type === 'unallocated_tc' || metric.id === 'm-unallocated-tc') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors">
                        {formatCLP(unallocatedTcBalance)}
                      </p>
                      <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                        Remanente de pagos a favor para futuras compras
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Fondo disponible TC</span>
                    <span className="text-purple-400 font-bold">Saldo a favor</span>
                  </div>
                </div>
              );
            }

            // Classic 9: Balance Neto / Ahorro
            if (metric.type === 'net_balance' || metric.id === 'm-net-balance') {
              return (
                <div
                  key={metric.id}
                  className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider">
                        {metric.title}
                      </span>
                      <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm`}>
                        {renderMetricIcon(metric.icon, 'w-4 h-4')}
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className={`text-2xl sm:text-[26px] font-mono font-bold tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-[#FF2D78]'}`}>
                        {formatCLP(netBalance)}
                      </p>
                      <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                        {netBalance >= 0 ? 'Superávit / Capacidad de ahorro' : 'Déficit del período'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Ingresos - Egresos</span>
                    <span className={netBalance >= 0 ? 'text-emerald-400 font-bold' : 'text-[#FF2D78] font-bold'}>
                      {netBalance >= 0 ? 'Positivo' : 'Negativo'}
                    </span>
                  </div>
                </div>
              );
            }

            // Custom Metric Card (User-created)
            const customCalc = calculateCustomMetric(metric);
            return (
              <div
                key={metric.id}
                className={`bg-[#111118] border border-[#302840]/80 panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all ${styles.hoverBorder} group`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-bold text-[#A098B0] uppercase tracking-wider truncate mr-2">
                      {metric.title}
                    </span>
                    <div className={`p-2 rounded-xl ${styles.iconBg} ${styles.iconText} border ${styles.iconBorder} shadow-sm shrink-0`}>
                      {renderMetricIcon(metric.icon, 'w-4 h-4')}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-2xl sm:text-[26px] font-mono font-bold tracking-tight text-white transition-colors" style={{ color: styles.accentColor }}>
                      {formatCLP(customCalc.value)}
                    </p>
                    <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans truncate">
                      {customCalc.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                  <span>Indicador Personalizado</span>
                  <span className="font-bold" style={{ color: styles.accentColor }}>
                    Activo
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
