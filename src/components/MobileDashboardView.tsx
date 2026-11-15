import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Link2,
  Landmark,
  CreditCard,
  CalendarClock,
  Gauge,
  Wallet,
  ChevronRight,
  Zap,
  PieChart,
  Receipt,
  ArrowRight,
  Plus,
  ShoppingBag,
  Repeat,
  Laptop,
  TrendingUp,
  PlusCircle
} from 'lucide-react';
import {
  Account,
  CategoryBudget,
  ComputedTransaction,
  Credit,
  CreditCardBillingRecord,
  Transaction
} from '../types';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';
import { getBillingCycleSummary } from '../utils/billingCycleUtils';
import { getBudgetSpending } from '../utils/categorizer';

interface MobileDashboardViewProps {
  accounts: Account[];
  allTransactions: Transaction[];
  filteredTransactions: ComputedTransaction[];
  credits: Credit[];
  budgets: CategoryBudget[];
  creditBillings: CreditCardBillingRecord[];
  currentPeriod: string;
  potentialDuplicates: Transaction[];
  onDismissDuplicate: (txId: string) => void;
  onDeleteDuplicate?: (txId: string) => void;
  onOpenTransactions: () => void;
  onOpenAccounts: () => void;
  onOpenBudgets: () => void;
  onOpenBillingModal: () => void;
  onOpenAddTransaction: () => void;
  onSelectAccount: (accountId: string) => void;
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(Math.round(amount));
}

function formatShortCLP(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
  }
  if (abs >= 10_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return formatCLP(amount);
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  return `${d} ${months[m] || parts[1]}`;
}

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  accounts,
  allTransactions,
  filteredTransactions,
  credits,
  budgets,
  creditBillings,
  currentPeriod,
  potentialDuplicates,
  onDismissDuplicate,
  onDeleteDuplicate,
  onOpenTransactions,
  onOpenAccounts,
  onOpenBudgets,
  onOpenBillingModal,
  onOpenAddTransaction,
  onSelectAccount
}) => {
  // 1. Account Balances & Credit Card Debt
  const { availableBalance, totalTcDebt, totalTcLimit, tcUsagePct, accountSummaries } = useMemo(() => {
    let liquid = 0;
    let tcDebt = 0;
    let tcLimit = 0;

    const summaries = accounts.map((acc) => {
      const accTxs = allTransactions.filter((t) => t.accountId === acc.id);
      let income = 0;
      let spent = 0;
      accTxs.forEach((t) => {
        if (isPaymentOrIncomeTransaction(t)) {
          income += Math.abs(t.amount);
        } else {
          spent += Math.abs(t.amount);
        }
      });

      if (acc.type === 'credit_card') {
        const paidBillings = creditBillings
          .filter((b) => b.cardId === acc.id)
          .reduce((s, b) => s + (b.totalPaid || 0), 0);
        const totalPaid = Math.max(income, paidBillings);
        const used = Math.max(0, spent - totalPaid);
        const limit = acc.creditLimit || 0;
        const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 1000) / 10) : 0;

        tcDebt += used;
        tcLimit += limit;

        return {
          account: acc,
          isTC: true,
          balanceOrUsed: used,
          limit,
          pct
        };
      } else {
        const balance = (acc.initialBalance || 0) + income - spent;
        liquid += balance;
        return {
          account: acc,
          isTC: false,
          balanceOrUsed: balance,
          limit: 0,
          pct: 0
        };
      }
    });

    const overallPct = tcLimit > 0 ? Math.min(100, Math.round((tcDebt / tcLimit) * 1000) / 10) : 0;

    return {
      availableBalance: liquid,
      totalTcDebt: tcDebt,
      totalTcLimit: tcLimit,
      tcUsagePct: overallPct,
      accountSummaries: summaries
    };
  }, [accounts, allTransactions, creditBillings]);

  // 2. Billing Projection & Next Statement Summary
  const billingProjection = useMemo(() => {
    const creditCards = accounts.filter((a) => a.type === 'credit_card');
    const primaryCard = creditCards[0];

    let cyclePurchases = 0;
    let cycleItemsCount = 0;
    let activeInstallments = 0;
    let activeInstallmentsCount = 0;
    let activeSubs = 0;
    let activeSubsCount = 0;

    creditCards.forEach((card) => {
      const summary = getBillingCycleSummary(
        card,
        allTransactions,
        credits,
        currentPeriod,
        new Date(),
        creditBillings
      );
      if (summary) {
        cyclePurchases += summary.pendingBalance;
      }
    });

    cycleItemsCount = filteredTransactions.filter((tx) => {
      const acc = accounts.find((a) => a.id === tx.accountId);
      return acc?.type === 'credit_card' && !isPaymentOrIncomeTransaction(tx) && tx.amount > 0;
    }).length;

    const cardInstallments = credits.filter((c) => c.type === 'cuotas_tc');
    activeInstallmentsCount = cardInstallments.length;
    activeInstallments = cardInstallments.reduce(
      (sum, c) => sum + (c.myShareAmount || c.installmentAmount || 0),
      0
    );

    const cardSubs = credits.filter((c) => c.type === 'suscripcion' && c.isActive !== false);
    activeSubsCount = cardSubs.length;
    activeSubs = cardSubs.reduce(
      (sum, c) => sum + (c.myShareAmount || c.installmentAmount || 0),
      0
    );

    const totalEstimated = cyclePurchases + activeInstallments + activeSubs;
    const closingDay = primaryCard?.closingDay || 24;

    // Days until closing
    const today = new Date();
    const currentDay = today.getDate();
    let daysUntilClosing = closingDay - currentDay;
    if (daysUntilClosing < 0) {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      daysUntilClosing = daysInMonth - currentDay + closingDay;
    }

    return {
      totalEstimated,
      cyclePurchases,
      cycleItemsCount,
      activeInstallments,
      activeInstallmentsCount,
      activeSubs,
      activeSubsCount,
      closingDay,
      daysUntilClosing
    };
  }, [accounts, allTransactions, filteredTransactions, credits, creditBillings, currentPeriod]);

  // 3. Net Expense & Budget Progress
  const { netRealExpense, totalBudgetLimit, budgetProgressPct, budgetItems } = useMemo(() => {
    const netSpent = filteredTransactions
      .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);

    const totalLimit = budgets.reduce((sum, b) => sum + (b.monthlyLimit || 0), 0);
    const pct = totalLimit > 0 ? Math.min(100, Math.round((netSpent / totalLimit) * 100)) : 0;

    const items = budgets.slice(0, 4).map((b) => {
      const { spent } = getBudgetSpending(b, filteredTransactions);
      const itemPct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 1000) / 10 : 0;
      return {
        budget: b,
        spent,
        pct: itemPct
      };
    });

    return {
      netRealExpense: netSpent,
      totalBudgetLimit: totalLimit,
      budgetProgressPct: pct,
      budgetItems: items
    };
  }, [filteredTransactions, budgets]);

  // 4. Recent Movements Feed (Top 4 sorted deterministically)
  const recentMovements = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tB - tA;
      })
      .slice(0, 4);
  }, [filteredTransactions]);

  const topDuplicate = potentialDuplicates[0];

  return (
    <div className="w-full max-w-[440px] mx-auto flex flex-col gap-4 pb-16 animate-fadeIn">
      {/* 1. Alerta Móvil Compacta: Posible Duplicidad (RF-09) */}
      {topDuplicate && (
        <section className="bg-[#141422]/95 border-glow-tertiary rounded-xl p-3 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#FFE04A]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded bg-[#FFE04A]/15 text-[#FFE04A] mt-0.5 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider bg-[#FFE04A]/20 text-[#FFE04A] px-1.5 py-0.5 rounded border border-[#FFE04A]/30">
                  RF-09 DETECTADO ({potentialDuplicates.length})
                </span>
                <span className="text-[11px] font-mono text-[#A098B0]">
                  {topDuplicate.source === 'telegram' ? 'Telegram Bot' : 'Cartola'}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#E8E0F0] truncate">
                Posible duplicidad (±7d):{' '}
                <span className="text-[#FFE04A]">{topDuplicate.description}</span>
              </p>
              <p className="text-[11px] font-mono text-[#A098B0] mt-0.5">
                Monto:{' '}
                <span className="text-white font-bold">
                  {formatCLP(Math.abs(topDuplicate.amount))} CLP
                </span>{' '}
                ({formatShortDate(topDuplicate.date)})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#302840]/60">
            <button
              type="button"
              onClick={onOpenTransactions}
              className="flex-1 py-1.5 px-3 bg-[#FFE04A]/10 hover:bg-[#FFE04A]/20 border border-[#FFE04A]/50 text-[#FFE04A] rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Resolver Duplicado</span>
            </button>
            <button
              type="button"
              onClick={() => onDismissDuplicate(topDuplicate.id)}
              className="py-1.5 px-3 bg-[#1e1e30] hover:bg-[#28283e] text-[#A098B0] hover:text-white rounded-lg font-mono text-xs active:scale-95 transition"
            >
              Omitir
            </button>
          </div>
        </section>
      )}

      {/* 2. KPIs Financieros Principales (Grid 2x2 Bento) */}
      <section className="grid grid-cols-2 gap-2.5">
        {/* KPI 1: Saldo Disponible */}
        <div
          onClick={onOpenAccounts}
          className="bg-[#141422] border border-[#302840] hover:border-[#00FFCC]/50 rounded-xl p-3 transition-colors cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[#A098B0] mb-1">
            <span className="font-mono text-[11px] tracking-tight">Saldo Disponible</span>
            <Landmark className="w-4 h-4 text-[#00FFCC]" />
          </div>
          <div className="font-headline text-base font-bold text-[#E8E0F0] tracking-tight leading-snug">
            {formatCLP(availableBalance)}
          </div>
          <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[#00FFCC] font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>
              {accounts.filter((a) => a.type !== 'credit_card').length} cta(s) activa(s)
            </span>
          </div>
        </div>

        {/* KPI 2: Deuda en TC */}
        <div
          onClick={onOpenAccounts}
          className="bg-[#141422] border border-[#302840] hover:border-[#FF2D78]/50 rounded-xl p-3 transition-colors cursor-pointer relative"
        >
          <div className="flex items-center justify-between text-[#A098B0] mb-1">
            <span className="font-mono text-[11px] tracking-tight">Deuda en TC</span>
            <CreditCard className="w-4 h-4 text-[#FF2D78]" />
          </div>
          <div className="font-headline text-base font-bold text-[#E8E0F0] tracking-tight leading-snug">
            {formatCLP(totalTcDebt)}
          </div>
          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] font-mono text-[#A098B0] mb-1">
              <span>Uso de cupo</span>
              <span className="text-[#FF2D78] font-bold">{tcUsagePct}%</span>
            </div>
            <div className="w-full bg-[#28283e] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#FF2D78] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, tcUsagePct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 3: Fact. al Corte */}
        <div
          onClick={onOpenBillingModal}
          className="bg-[#141422] border border-[#302840] hover:border-[#FFE04A]/50 rounded-xl p-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#A098B0] mb-1">
            <span className="font-mono text-[11px] tracking-tight">Fact. al Corte</span>
            <CalendarClock className="w-4 h-4 text-[#FFE04A]" />
          </div>
          <div className="font-headline text-base font-bold text-[#E8E0F0] tracking-tight leading-snug">
            {formatCLP(billingProjection.totalEstimated)}
          </div>
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30">
              Corte día {billingProjection.closingDay}
            </span>
          </div>
        </div>

        {/* KPI 4: Gasto Real FIFO */}
        <div
          onClick={onOpenBudgets}
          className="bg-[#141422] border border-[#302840] hover:border-[#00FFCC]/50 rounded-xl p-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#A098B0] mb-1">
            <span className="font-mono text-[11px] tracking-tight">Gasto Real</span>
            <Gauge className="w-4 h-4 text-[#00FFCC]" />
          </div>
          <div className="font-headline text-base font-bold text-[#E8E0F0] tracking-tight leading-snug">
            {formatCLP(netRealExpense)}
          </div>
          <div className="mt-1.5">
            <div className="flex justify-between text-[10px] font-mono text-[#A098B0] mb-1">
              <span>
                {totalBudgetLimit > 0 ? `Meta ${formatShortCLP(totalBudgetLimit)}` : 'Sin tope'}
              </span>
              <span className="text-[#00FFCC] font-bold">{budgetProgressPct}%</span>
            </div>
            <div className="w-full bg-[#28283e] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#00FFCC] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, budgetProgressPct)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección 'Mis Cuentas & Tarjetas' (Carrusel Horizontal Swipeable) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-[#00FFCC]" />
            <h2 className="font-headline text-sm font-bold text-[#E8E0F0] tracking-tight">
              Mis Cuentas & Tarjetas
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenAccounts}
            className="text-xs font-mono text-[#00FFCC] hover:underline flex items-center gap-0.5"
          >
            <span>Gestionar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 snap-x snap-mandatory">
          {accountSummaries.map(({ account, isTC, balanceOrUsed, limit, pct }, idx) => {
            const isPrimaryGlow = isTC && idx === 0;
            return (
              <div
                key={account.id}
                onClick={() => onSelectAccount(account.id)}
                className={`snap-center flex-shrink-0 w-64 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden cursor-pointer transition-all active:scale-[0.98] ${
                  isPrimaryGlow
                    ? 'bg-gradient-to-br from-[#141422] to-[#1e1e30] border-glow-primary'
                    : 'bg-[#141422] border border-[#302840] hover:border-[#00FFCC]/50'
                }`}
              >
                {isPrimaryGlow && (
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-[#FF2D78]/20 rounded-full blur-xl pointer-events-none" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 truncate ${
                        isTC ? (isPrimaryGlow ? 'text-[#FF2D78]' : 'text-[#00FFCC]') : 'text-[#A098B0]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isTC ? (isPrimaryGlow ? 'bg-[#FF2D78]' : 'bg-[#00FFCC]') : 'bg-[#5a5068]'
                        }`}
                      />
                      <span className="truncate">{account.name}</span>
                    </span>
                    {account.accountNumber && (
                      <span className="font-mono text-[11px] text-[#A098B0] shrink-0">
                        ••{account.accountNumber.slice(-4)}
                      </span>
                    )}
                  </div>

                  <div className="font-mono text-[11px] text-[#A098B0]">
                    {isTC ? 'Utilizado' : 'Saldo en Cuenta'}
                  </div>
                  <div
                    className={`font-headline text-lg font-bold ${
                      !isTC && balanceOrUsed >= 0 ? 'text-[#00FFCC]' : 'text-[#E8E0F0]'
                    }`}
                  >
                    {formatCLP(balanceOrUsed)}{' '}
                    {isTC && limit > 0 ? (
                      <span className="text-xs font-mono text-[#A098B0] font-normal">
                        / {formatShortCLP(limit)}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#A098B0] font-normal">CLP</span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#302840]/60 flex items-center justify-between text-[11px] font-mono">
                  {isTC ? (
                    <>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFE04A]/15 text-[#FFE04A] border border-[#FFE04A]/30">
                        Corte día {account.closingDay || 24}
                      </span>
                      <span className={`font-bold ${isPrimaryGlow ? 'text-[#FF2D78]' : 'text-[#00FFCC]'}`}>
                        {pct}% de cupo
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[#A098B0] capitalize">{account.bank}</span>
                      <span className="text-[#00FFCC] font-medium">Disponible</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Botón Directo: Agregar Cuenta */}
          <button
            type="button"
            onClick={onOpenAccounts}
            className="snap-center flex-shrink-0 w-28 bg-[#141422]/60 border border-dashed border-[#302840] rounded-xl flex flex-col items-center justify-center p-3 text-center active:scale-95 transition hover:border-[#00FFCC]/60"
          >
            <PlusCircle className="w-7 h-7 text-[#00FFCC] mb-1" />
            <span className="font-mono text-[11px] font-semibold text-[#E8E0F0]">
              Gestionar Cuentas
            </span>
          </button>
        </div>
      </section>

      {/* 4. Widget Móvil de Próxima Facturación al Corte */}
      <section className="bg-[#141422] border border-[#302840] rounded-xl p-3.5 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#FF2D78]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF2D78] font-bold">
              Liquidación Próxima
            </span>
            <h3 className="font-headline text-sm font-bold text-[#E8E0F0]">
              Facturación al Corte (Día {billingProjection.closingDay})
            </h3>
          </div>
          <div className="text-right">
            <span className="font-headline text-base font-bold text-[#FF2D78] neon-glow-primary">
              {formatCLP(billingProjection.totalEstimated)}
            </span>
            <span className="block text-[10px] font-mono text-[#A098B0]">Total Estimado</span>
          </div>
        </div>

        {/* Desglose Compacto */}
        <div className="grid grid-cols-3 gap-2 bg-[#111118] p-2.5 rounded-lg border border-[#302840]/60">
          <div>
            <div className="text-[10px] font-mono text-[#A098B0] truncate">Compras Ciclo</div>
            <div className="font-headline text-xs font-bold text-[#E8E0F0] mt-0.5">
              {formatCLP(billingProjection.cyclePurchases)}
            </div>
            <span className="text-[9px] font-mono text-[#00FFCC]">
              {billingProjection.cycleItemsCount} ítems
            </span>
          </div>
          <div className="border-l border-[#302840]/60 pl-2">
            <div className="text-[10px] font-mono text-[#A098B0] truncate">Cuotas Mes</div>
            <div className="font-headline text-xs font-bold text-[#E8E0F0] mt-0.5">
              {formatCLP(billingProjection.activeInstallments)}
            </div>
            <span className="text-[9px] font-mono text-[#FFE04A]">
              {billingProjection.activeInstallmentsCount} activas
            </span>
          </div>
          <div className="border-l border-[#302840]/60 pl-2">
            <div className="text-[10px] font-mono text-[#A098B0] truncate">Suscripciones</div>
            <div className="font-headline text-xs font-bold text-[#E8E0F0] mt-0.5">
              {formatCLP(billingProjection.activeSubs)}
            </div>
            <span className="text-[9px] font-mono text-[#A098B0]">
              {billingProjection.activeSubsCount} fijas
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBillingModal}
          className="w-full py-2.5 px-3 bg-[#28283e] hover:bg-[#FF2D78]/20 border-glow-primary text-[#FF2D78] hover:text-white rounded-lg font-mono text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
        >
          <Zap className="w-4 h-4" />
          <span>Simular y Gestionar Facturación</span>
        </button>
      </section>

      {/* 5. Resumen de Presupuestos del Mes */}
      {budgetItems.length > 0 && (
        <section className="bg-[#141422] border border-[#302840] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenBudgets}
              className="flex items-center gap-1.5 text-left group"
            >
              <PieChart className="w-4 h-4 text-[#00FFCC]" />
              <h2 className="font-headline text-sm font-bold text-[#E8E0F0] tracking-tight group-hover:text-[#00FFCC] transition">
                Presupuesto del Mes
              </h2>
            </button>
            <span className="font-mono text-xs text-[#A098B0]">
              {formatShortCLP(netRealExpense)} / {formatShortCLP(totalBudgetLimit)}
            </span>
          </div>

          <div className="space-y-2.5">
            {budgetItems.map(({ budget, spent, pct }) => {
              const isDanger = pct >= 100;
              const isWarn = pct >= 85 && pct < 100;
              const barColor = isDanger
                ? 'bg-[#FF2D78]'
                : isWarn
                ? 'bg-[#FFE04A]'
                : 'bg-[#00FFCC]';
              const textColor = isDanger
                ? 'text-[#FF2D78] neon-glow-primary'
                : isWarn
                ? 'text-[#FFE04A] neon-glow-tertiary'
                : 'text-[#00FFCC]';

              return (
                <div key={budget.id} onClick={onOpenBudgets} className="cursor-pointer">
                  <div className="flex justify-between text-xs font-mono mb-1 gap-2">
                    <span className="text-[#E8E0F0] truncate">
                      {budget.name || budget.categoryName}
                    </span>
                    <span className="text-[#A098B0] shrink-0">
                      {formatShortCLP(spent)} / {formatShortCLP(budget.monthlyLimit)}{' '}
                      <strong className={`ml-1 ${textColor}`}>{pct}%</strong>
                    </span>
                  </div>
                  <div className="w-full bg-[#28283e] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Últimos Movimientos (Feed Móvil) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[#FF2D78]" />
            <h2 className="font-headline text-sm font-bold text-[#E8E0F0] tracking-tight">
              Últimos Movimientos
            </h2>
          </div>
          <span className="font-mono text-[11px] text-[#A098B0]">
            {filteredTransactions.length} registro(s)
          </span>
        </div>

        <div className="bg-[#141422] border border-[#302840] rounded-xl divide-y divide-[#302840]/40 overflow-hidden">
          {recentMovements.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#A098B0] font-mono">
              No hay movimientos en el período seleccionado.
            </div>
          ) : (
            recentMovements.map((tx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isPositive = isPaymentOrIncomeTransaction(tx);
              const isInstallment = Boolean(tx.installments && tx.installments.total > 1);

              return (
                <div
                  key={tx.id}
                  onClick={onOpenTransactions}
                  className="p-3 hover:bg-[#1e1e30] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        tx.isPotentialDuplicate
                          ? 'bg-[#1e1e30] text-[#FFE04A] border-[#FFE04A]/30'
                          : isPositive
                          ? 'bg-[#1e1e30] text-[#00FFCC] border-[#00FFCC]/30'
                          : 'bg-[#1e1e30] text-[#A098B0] border-[#302840]'
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isInstallment ? (
                        <Laptop className="w-4 h-4" />
                      ) : tx.category === 'Suscripciones' ? (
                        <Repeat className="w-4 h-4" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-headline text-xs font-bold text-[#E8E0F0] truncate">
                          {tx.description}
                        </p>
                        {tx.isPotentialDuplicate && (
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 bg-[#FFE04A]/15 text-[#FFE04A] rounded border border-[#FFE04A]/40 shrink-0">
                            Duplicado
                          </span>
                        )}
                        {!tx.isPotentialDuplicate && isInstallment && tx.installments && (
                          <span className="font-mono text-[9px] font-medium px-1.5 py-0.2 bg-[#1e1e30] text-[#E8E0F0] rounded border border-[#302840] shrink-0">
                            Cuota {tx.installments.current}/{tx.installments.total}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#A098B0] block mt-0.5 truncate">
                        {formatShortDate(tx.date)} • {acc?.name || 'Cuenta'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-headline text-xs font-bold ${
                        isPositive ? 'text-[#00FFCC] neon-glow-secondary' : 'text-[#E8E0F0]'
                      }`}
                    >
                      {isPositive ? '+' : '-'}
                      {formatCLP(Math.abs(tx.amount))}
                    </span>
                    <span className="block text-[9px] font-mono text-[#A098B0]">CLP</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onOpenTransactions}
          className="w-full py-2.5 bg-[#111118] hover:bg-[#1e1e30] border border-[#302840] rounded-xl text-center text-xs font-mono text-[#E8E0F0] hover:text-[#00FFCC] flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
        >
          <span>Ver todos los {filteredTransactions.length} movimientos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* 7. Floating Action Button (FAB) */}
      <aside className="fixed right-4 bottom-20 z-40 md:hidden">
        <button
          type="button"
          onClick={onOpenAddTransaction}
          aria-label="Nuevo Movimiento"
          className="flex items-center gap-1.5 bg-[#141422] hover:bg-[#1e1e30] border border-[#FF2D78] text-[#FF2D78] font-mono text-xs font-bold py-2.5 px-4 rounded-full fab-glow active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Movimiento</span>
        </button>
      </aside>
    </div>
  );
};
