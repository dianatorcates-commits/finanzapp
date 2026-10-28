import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  ComputedTransaction,
  Account,
  CategoryBudget,
  CustomChartWidget,
  Credit,
  DEFAULT_DASHBOARD_CONFIG
} from '../types';
import { formatCLP } from './MetricCards';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Calendar,
  CreditCard,
  Landmark,
  Sliders,
  Zap,
  ArrowRight,
  TrendingDown,
  Layers,
  Repeat,
  Wallet
} from 'lucide-react';
import { formatBillingCycle } from '../utils/dateUtils';
import { getBudgetSpending } from '../utils/categorizer';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';

interface ChartsDashboardProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  budgets?: CategoryBudget[];
  onOpenBudgetModal?: () => void;
  charts?: CustomChartWidget[];
  onOpenCustomizeModal?: () => void;
  credits?: Credit[];
  onSelectAccount?: (id: string) => void;
  onOpenBillingModal?: () => void;
  currentPeriod?: string;
}

const COLORS = [
  '#00FFCC', // Cyan Neón
  '#FF2D78', // Magenta Neón
  '#FFE04A', // Oro Neón
  '#38BDF8', // Sky 400
  '#A78BFA', // Violet 400
  '#34D399', // Emerald 400
  '#F472B6', // Pink 400
  '#FB923C', // Orange 400
  '#818CF8', // Indigo 400
  '#94A3B8'  // Slate 400
];

function getBankBranding(bankName: string, accountType: string) {
  const norm = (bankName || '').toLowerCase();
  if (norm.includes('falabella') || norm.includes('cmr')) {
    return {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      badge: 'CMR / Falabella',
      indicatorColor: '#00E599'
    };
  }
  if (norm.includes('santander')) {
    return {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      badge: 'Santander',
      indicatorColor: '#EC0000'
    };
  }
  if (norm.includes('chile') || norm.includes('edwards')) {
    return {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      badge: 'Banco de Chile',
      indicatorColor: '#002A66'
    };
  }
  if (norm.includes('tenpo') || norm.includes('mach')) {
    return {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      badge: 'Digital / Prepago',
      indicatorColor: '#6C5CE7'
    };
  }
  if (norm.includes('itau') || norm.includes('itaú')) {
    return {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      badge: 'Itaú',
      indicatorColor: '#EC7000'
    };
  }
  if (norm.includes('bci')) {
    return {
      bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
      badge: 'BCI',
      indicatorColor: '#00A887'
    };
  }
  if (norm.includes('scotiabank')) {
    return {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      badge: 'Scotiabank',
      indicatorColor: '#ED1111'
    };
  }
  return {
    bg: accountType === 'credit_card' ? 'bg-[#FF2D78]/10 text-[#FF2D78] border-[#FF2D78]/30' : 'bg-[#00FFCC]/10 text-[#00FFCC] border-[#00FFCC]/30',
    badge: bankName || 'Banco',
    indicatorColor: accountType === 'credit_card' ? '#FF2D78' : '#00FFCC'
  };
}

export const ChartsDashboard: React.FC<ChartsDashboardProps> = ({
  computedTransactions,
  accounts,
  budgets = [],
  onOpenBudgetModal,
  charts = DEFAULT_DASHBOARD_CONFIG.charts,
  onOpenCustomizeModal,
  credits = [],
  onSelectAccount,
  onOpenBillingModal,
  currentPeriod
}) => {
  const [pieViewMode, setPieViewMode] = useState<'category' | 'subcategory'>('category');

  const activeCharts = charts || DEFAULT_DASHBOARD_CONFIG.charts;
  const showBudgets = activeCharts.some((c) => c.chartType === 'budgets_progress' && c.enabled);
  const showPie = activeCharts.some((c) => c.chartType === 'category_pie' && c.enabled);
  const showTrend = activeCharts.some((c) => c.chartType === 'monthly_trend' && c.enabled);
  const showAccounts = activeCharts.some((c) => c.chartType === 'account_breakdown' && c.enabled);
  const accountSpecificCharts = activeCharts.filter((c) => c.chartType === 'account_specific' && c.enabled && c.targetAccountId);

  const visibleCount = [showBudgets, showPie, showTrend, showAccounts, accountSpecificCharts.length > 0].filter(Boolean).length;

  // 1. Prepare Category / Subcategory Data for Pie Chart
  const categoryMap = new Map<string, number>();
  computedTransactions
    .filter((tx) => tx.amount > 0 && tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta')
    .forEach((tx) => {
      const key = pieViewMode === 'category' ? (tx.category || 'Sin Categoría') : (tx.subcategory || tx.category || 'Sin Subcategoría');
      const current = categoryMap.get(key) || 0;
      categoryMap.set(key, current + (tx.netAmount !== undefined ? tx.netAmount : tx.amount));
    });

  const categoryData = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // 2. Prepare Monthly Trend Data for Bar Chart
  const monthMap = new Map<string, { month: string; gastosBrutos: number; montoRealUtilizado: number; abonos: number }>();
  
  computedTransactions.forEach((tx) => {
    const monthKey = tx.period || (tx.date ? tx.date.substring(0, 7) : 'Sin Mes');
    const current = monthMap.get(monthKey) || { month: monthKey, gastosBrutos: 0, montoRealUtilizado: 0, abonos: 0 };
    
    if (tx.amount > 0 && tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta') {
      current.gastosBrutos += tx.amount;
      current.montoRealUtilizado += (tx.netAmount !== undefined ? tx.netAmount : tx.amount);
    } else if (tx.transactionType === 'pago_tc' || tx.amount < 0) {
      current.abonos += Math.abs(tx.amount);
    }
    
    monthMap.set(monthKey, current);
  });

  const monthlyData = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // 3. Prepare Account Breakdown Data
  const accountData = accounts.map((acc) => {
    const accTxs = computedTransactions.filter((tx) => tx.accountId === acc.id);
    const gross = accTxs
      .filter((tx) => tx.amount > 0 && tx.transactionType !== 'pago_tc')
      .reduce((sum, t) => sum + t.amount, 0);
    const net = accTxs
      .filter((tx) => tx.amount > 0 && tx.transactionType !== 'pago_tc')
      .reduce((sum, t) => sum + (t.netAmount !== undefined ? t.netAmount : t.amount), 0);
    const payments = accTxs
      .filter((tx) => tx.transactionType === 'pago_tc' || (tx.amount < 0 && (tx.category === 'Abonos y Pagos' || tx.subcategory === 'Pagos de Tarjeta')))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      name: acc.name,
      GastosOriginales: gross,
      MontoRealUtilizado: net,
      PagosRealizados: payments
    };
  });

  // 4. Pending Billing Stats for 1-Click Widget
  const pendingBillingStats = useMemo(() => {
    const tcCards = accounts.filter((a) => a.type === 'credit_card');
    const tcCredits = credits.filter((c) => tcCards.some((tc) => tc.id === c.accountId));
    const installments = tcCredits.filter((c) => c.type === 'cuotas_tc');
    const subscriptions = tcCredits.filter((c) => c.type === 'suscripcion');
    const totalPendingAmount = tcCredits.reduce((sum, c) => sum + (c.myShareAmount || c.installmentAmount), 0);

    return {
      installmentsCount: installments.length,
      subsCount: subscriptions.length,
      totalPendingAmount,
      totalCards: tcCards.length
    };
  }, [accounts, credits]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0A0A12] text-[#E8E0F0] text-xs p-3 rounded-xl shadow-2xl border border-[#302840] panel-rim">
          <p className="font-headline font-semibold text-white border-b border-[#302840] pb-1 mb-1">
            {payload[0].name || payload[0].payload.name || payload[0].payload.month}
          </p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="flex justify-between gap-4 py-0.5 font-mono text-xs" style={{ color: p.color || '#00FFCC' }}>
              <span>{p.name}:</span>
              <span className="font-bold">{formatCLP(p.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-6 font-sans">

      {/* Widget Destacado de Facturación al Corte en 1 Clic */}
      <div className="bg-gradient-to-r from-[#141422] via-[#111118] to-[#141422] border border-[#302840] panel-rim rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30 shrink-0 shadow-sm animate-pulse">
            <Zap className="w-5 h-5 text-[#FFE04A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-headline font-bold text-white">
                Simulador y Generador de Facturación al Corte
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFE04A]/20 text-[#FFE04A] border border-[#FFE04A]/30">
                1 Clic
              </span>
            </div>
            <p className="text-xs text-[#A098B0] mt-0.5 font-sans">
              Proyecta con exactitud el corte de tus tarjetas sumando compras del ciclo, {pendingBillingStats.installmentsCount} cuotas vigentes y {pendingBillingStats.subsCount} suscripciones.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
          {onOpenBillingModal && (
            <button
              onClick={onOpenBillingModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-headline font-bold bg-[#FFE04A] hover:bg-[#ffe66d] text-black shadow-lg shadow-[#FFE04A]/20 transition transform hover:scale-[1.02] active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>⚡ Generar cargos pendientes (1 clic)</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Interactivo de Cuentas y Tarjetas de Crédito */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#00FFCC]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0]">
              // Cuentas y Tarjetas de Crédito ({accounts.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#A098B0] font-sans">
            Haz clic en cualquier tarjeta para filtrar el dashboard
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {accounts.map((acc) => {
            const accTxs = computedTransactions.filter((tx) => tx.accountId === acc.id);
            const cycle = formatBillingCycle(acc.closingDay, acc.dueDay);
            const branding = getBankBranding(acc.bank, acc.type);

            if (acc.type === 'credit_card') {
              const spent = accTxs
                .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
                .reduce((sum, tx) => sum + (tx.netAmount !== undefined ? tx.netAmount : tx.amount), 0);
              const limit = acc.creditLimit || 0;
              const usedPct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const available = Math.max(0, limit - spent);

              return (
                <div
                  key={acc.id}
                  onClick={() => onSelectAccount && onSelectAccount(acc.id)}
                  className="bg-[#111118] border border-[#302840] panel-rim rounded-2xl p-4 flex flex-col justify-between hover:border-[#00FFCC]/50 hover:bg-[#141422] transition-all cursor-pointer group shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#302840]/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-2 rounded-xl border ${branding.bg} shrink-0`}>
                          <CreditCard className="w-4 h-4 text-[#FF2D78]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-headline font-bold text-xs text-white truncate group-hover:text-[#00FFCC] transition-colors">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-[#A098B0] font-mono truncate">{acc.bank}</p>
                        </div>
                      </div>

                      {cycle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30 px-2 py-0.5 rounded-full shrink-0">
                          {cycle}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] text-[#A098B0] uppercase font-mono tracking-wider block">
                        Saldo Utilizado
                      </span>
                      <p className="text-xl font-mono font-bold text-white mt-0.5">
                        {formatCLP(spent)}
                      </p>

                      {/* Barra de Cupo Cian */}
                      {limit > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="w-full bg-[#0A0A12] h-1.5 rounded-full overflow-hidden border border-[#302840]/50">
                            <div
                              className="h-full bg-[#00FFCC] rounded-full transition-all duration-500 shadow-sm shadow-[#00FFCC]/50"
                              style={{ width: `${usedPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-[#A098B0]">
                            <span>{usedPct}% cupo</span>
                            <span className="text-[#00FFCC] font-bold">Disp: {formatCLP(available)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                    <span>Cupo: {formatCLP(limit)}</span>
                    <span className="text-[#00FFCC] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Filtrar →
                    </span>
                  </div>
                </div>
              );
            }

            // Cuentas Vista / Corriente / Ahorro / Efectivo
            const base = acc.initialBalance || 0;
            const income = accTxs
              .filter((tx) => isPaymentOrIncomeTransaction(tx) || tx.amount < 0)
              .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
            const expenses = accTxs
              .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
              .reduce((sum, tx) => sum + tx.amount, 0);
            const currentBalance = base + income - expenses;

            return (
              <div
                key={acc.id}
                onClick={() => onSelectAccount && onSelectAccount(acc.id)}
                className="bg-[#111118] border border-[#302840] panel-rim rounded-2xl p-4 flex flex-col justify-between hover:border-[#00FFCC]/50 hover:bg-[#141422] transition-all cursor-pointer group shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#302840]/60">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl border ${branding.bg} shrink-0`}>
                        <Landmark className="w-4 h-4 text-[#00FFCC]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-headline font-bold text-xs text-white truncate group-hover:text-[#00FFCC] transition-colors">
                          {acc.name}
                        </p>
                        <p className="text-[10px] text-[#A098B0] font-mono truncate">{acc.bank}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-[#00FFCC] font-mono bg-[#00FFCC]/10 border border-[#00FFCC]/30 px-2 py-0.5 rounded-full shrink-0">
                      Vista/Cte
                    </span>
                  </div>

                  <div className="mt-3">
                    <span className="text-[10px] text-[#A098B0] uppercase font-mono tracking-wider block">
                      Saldo Actual Estimado
                    </span>
                    <p className="text-xl font-mono font-bold text-white mt-0.5">
                      {formatCLP(currentBalance)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">+{formatCLP(income)}</span>
                      <span className="text-[#A098B0]">|</span>
                      <span className="text-rose-400 font-bold">-{formatCLP(expenses)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-[#302840]/60 flex items-center justify-between text-[10px] font-mono text-[#A098B0]">
                  <span>Base: {formatCLP(base)}</span>
                  <span className="text-[#00FFCC] font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Filtrar →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Control de Presupuestos Mensuales (Stitch Progress Bars) */}
      {showBudgets && (
        <div className="bg-[#111118] border border-[#302840] panel-rim p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#302840]/60">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-[#00FFCC]/10 text-[#00FFCC] rounded-xl border border-[#00FFCC]/20 shadow-sm">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-headline font-bold text-white">Control de Presupuestos Mensuales</h3>
                <p className="text-xs text-[#A098B0]">Límites de consumo fijados para el período consultado</p>
              </div>
            </div>
            {onOpenBudgetModal && (
              <button
                onClick={onOpenBudgetModal}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141422] hover:bg-[#1C1C2E] text-[#00FFCC] text-xs font-headline font-bold rounded-xl border border-[#00FFCC]/30 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Gestionar Presupuestos</span>
              </button>
            )}
          </div>

          {budgets.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-[#A098B0] mb-3">No has definido presupuestos mensuales aún.</p>
              {onOpenBudgetModal && (
                <button
                  onClick={onOpenBudgetModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FF2D78] hover:bg-[#ff1a6c] text-white text-xs font-headline font-bold rounded-xl shadow-lg transition"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Crear tu primer presupuesto</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgets.map((b) => {
                const { spent } = getBudgetSpending(b, computedTransactions);
                const limit = b.monthlyLimit;
                const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                const isOver = spent > limit;
                const isWarning = pct >= 80 && !isOver;

                const barColor = isOver ? 'bg-rose-500' : isWarning ? 'bg-[#FFE04A]' : 'bg-[#00FFCC]';
                const badgeColor = isOver
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isWarning
                  ? 'bg-[#FFE04A]/15 text-[#FFE04A] border-[#FFE04A]/30'
                  : 'bg-[#00FFCC]/15 text-[#00FFCC] border-[#00FFCC]/30';

                return (
                  <div key={b.id} className="p-3.5 bg-[#141422] border border-[#302840] panel-rim rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-bold text-white truncate">{b.name || b.categoryName}</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {pct}% {isOver ? 'Excedido' : isWarning ? 'Alerta' : 'Ok'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#0A0A12] h-2 rounded-full overflow-hidden border border-[#302840]/40">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-[#A098B0]">
                      <span className="text-white font-bold">{formatCLP(spent)}</span>
                      <span>Tope: {formatCLP(limit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Gráficos Principales (Distribución y Tendencia) */}
      {(showPie || showTrend) && (
        <div className={`grid grid-cols-1 ${showPie && showTrend ? 'lg:grid-cols-2' : ''} gap-6`}>
          
          {/* Gráfico Circular de Gastos */}
          {showPie && (
            <div className="bg-[#111118] border border-[#302840] panel-rim p-5 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="border-b border-[#302840]/60 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-headline font-bold text-white">
                    Gastos Netos por {pieViewMode === 'category' ? 'Categoría' : 'Subcategoría'}
                  </h3>
                  <p className="text-xs text-[#A098B0]">Distribución del Monto Real Utilizado</p>
                </div>
                
                <div className="flex bg-[#0A0A12] p-1 rounded-xl border border-[#302840] text-xs self-start sm:self-auto font-headline font-semibold">
                  <button
                    type="button"
                    onClick={() => setPieViewMode('category')}
                    className={`px-3 py-1 rounded-lg transition ${
                      pieViewMode === 'category'
                        ? 'bg-[#141422] text-[#00FFCC] border border-[#00FFCC]/30 shadow-sm'
                        : 'text-[#A098B0] hover:text-white'
                    }`}
                  >
                    Categoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setPieViewMode('subcategory')}
                    className={`px-3 py-1 rounded-lg transition ${
                      pieViewMode === 'subcategory'
                        ? 'bg-[#141422] text-[#00FFCC] border border-[#00FFCC]/30 shadow-sm'
                        : 'text-[#A098B0] hover:text-white'
                    }`}
                  >
                    Subcategoría
                  </button>
                </div>
              </div>

              {categoryData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-2 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {categoryData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-[#E8E0F0] bg-[#141422] px-2 py-0.5 rounded-md border border-[#302840]">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px] font-sans">{entry.name}</span>
                        <span className="font-mono font-bold text-white">({formatCLP(entry.value)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No hay movimientos de gasto para mostrar en los filtros activos
                </div>
              )}
            </div>
          )}

          {/* Gráfico de Evolución Mensual */}
          {showTrend && (
            <div className="bg-[#111118] border border-[#302840] panel-rim p-5 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="border-b border-[#302840]/60 pb-3 mb-4">
                <h3 className="text-sm font-headline font-bold text-white">Evolución Mensual: Gastos vs Monto Real Utilizado</h3>
                <p className="text-xs text-[#A098B0]">Comparativa de compras brutas y uso real por período</p>
              </div>
              {monthlyData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#302840" />
                      <XAxis dataKey="month" tick={{ fill: '#A098B0', fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fill: '#A098B0', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#E8E0F0' }} />
                      <Bar dataKey="gastosBrutos" name="Gastos Brutos" fill="#FF2D78" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="montoRealUtilizado" name="Monto Real Utilizado" fill="#00FFCC" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="abonos" name="Abonos Realizados" fill="#FFE04A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No hay movimientos por período para mostrar
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
