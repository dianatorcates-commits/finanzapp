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
import { ComputedTransaction, Account, CategoryBudget, CustomChartWidget, DEFAULT_DASHBOARD_CONFIG } from '../types';
import { formatCLP } from './MetricCards';
import { Target, AlertTriangle, CheckCircle2, Plus, Calendar, CreditCard, Landmark, Sliders } from 'lucide-react';
import { formatBillingCycle } from '../utils/dateUtils';
import { getBudgetSpending } from '../utils/categorizer';

interface ChartsDashboardProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  budgets?: CategoryBudget[];
  onOpenBudgetModal?: () => void;
  charts?: CustomChartWidget[];
  onOpenCustomizeModal?: () => void;
}

const COLORS = [
  '#0284c7', // Sky 600
  '#e11d48', // Rose 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
  '#2563eb', // Blue 600
  '#475569', // Slate 600
  '#0891b2', // Cyan 600
  '#65a30d'  // Lime 600
];

export const ChartsDashboard: React.FC<ChartsDashboardProps> = ({
  computedTransactions,
  accounts,
  budgets = [],
  onOpenBudgetModal,
  charts = DEFAULT_DASHBOARD_CONFIG.charts,
  onOpenCustomizeModal
}) => {
  const [pieViewMode, setPieViewMode] = useState<'category' | 'subcategory'>('category');

  const activeCharts = charts || DEFAULT_DASHBOARD_CONFIG.charts;
  const showBudgets = activeCharts.some((c) => c.chartType === 'budgets_progress' && c.enabled);
  const showPie = activeCharts.some((c) => c.chartType === 'category_pie' && c.enabled);
  const showTrend = activeCharts.some((c) => c.chartType === 'monthly_trend' && c.enabled);
  const showAccounts = activeCharts.some((c) => c.chartType === 'account_breakdown' && c.enabled);
  const accountSpecificCharts = activeCharts.filter((c) => c.chartType === 'account_specific' && c.enabled && c.targetAccountId);

  const visibleCount = [showBudgets, showPie, showTrend, showAccounts, accountSpecificCharts.length > 0].filter(Boolean).length;

  // Calculate net spending per general category for budget progress
  const categorySpendingMap = useMemo(() => {
    const map = new Map<string, number>();
    computedTransactions
      .filter((tx) => tx.amount > 0 && tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta')
      .forEach((tx) => {
        const cat = tx.category || 'Otros Gastos';
        const cur = map.get(cat) || 0;
        map.set(cat, cur + tx.netAmount);
      });
    return map;
  }, [computedTransactions]);

  // 1. Prepare Category / Subcategory Data for Pie Chart
  const categoryMap = new Map<string, number>();
  computedTransactions
    .filter((tx) => tx.amount > 0 && tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta')
    .forEach((tx) => {
      const key = pieViewMode === 'category' ? (tx.category || 'Sin Categoría') : (tx.subcategory || tx.category || 'Sin Subcategoría');
      const current = categoryMap.get(key) || 0;
      categoryMap.set(key, current + tx.netAmount);
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
      current.montoRealUtilizado += tx.netAmount;
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
      .reduce((sum, t) => sum + t.netAmount, 0);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
          <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1">
            {payload[0].name || payload[0].payload.name || payload[0].payload.month}
          </p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="flex justify-between gap-4 py-0.5" style={{ color: p.color || '#38bdf8' }}>
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
    <div className="space-y-6 mb-6">

      {/* Dashboard Top Toolbar: Customization action */}
      {onOpenCustomizeModal && (
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Análisis y Gráficos
            </span>
          </div>
          <button
            onClick={onOpenCustomizeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 text-xs font-semibold rounded-xl border border-slate-800 hover:border-slate-700 transition shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Personalizar Dashboard</span>
          </button>
        </div>
      )}

      {visibleCount === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <p className="text-xs text-slate-400">
            Has ocultado todos los módulos del dashboard. Haz clic en "Personalizar Dashboard" para activar los gráficos que desees ver.
          </p>
          {onOpenCustomizeModal && (
            <button
              onClick={onOpenCustomizeModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Activar Gráficos</span>
            </button>
          )}
        </div>
      )}

      {/* Monthly Budget Progress Section */}
      {showBudgets && (
        <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-800/80">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Control de Presupuestos Mensuales</h3>
              <p className="text-xs text-slate-400">Monitoreo de topes de consumo por categoría general en los movimientos filtrados</p>
            </div>
          </div>
          {onOpenBudgetModal && (
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gestionar Presupuestos y Reglas</span>
            </button>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-xs text-slate-400 mb-3">No has definido presupuestos mensuales aún.</p>
            {onOpenBudgetModal && (
              <button
                onClick={onOpenBudgetModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
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

              const barColor = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
              const badgeColor = isOver
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : isWarning
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

              return (
                <div key={b.id} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{b.name || b.categoryName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {pct}% {isOver ? 'Excedido' : isWarning ? 'Cerca del Límite' : 'Ok'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span className="text-slate-200 font-semibold">{formatCLP(spent)}</span>
                    <span>Límite: {formatCLP(limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Charts Grid (Category Pie & Monthly Trend) */}
      {(showPie || showTrend) && (
        <div className={`grid grid-cols-1 ${showPie && showTrend ? 'lg:grid-cols-2' : ''} gap-6`}>
          
          {/* Category / Subcategory Expenses Pie Chart */}
          {showPie && (
            <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="border-b border-slate-800/80 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Gastos Netos por {pieViewMode === 'category' ? 'Categoría' : 'Subcategoría'}</h3>
                  <p className="text-xs text-slate-400">Distribución del Monto Real Utilizado por nivel de consumo</p>
                </div>
                
                {/* View Selector Tabs */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setPieViewMode('category')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      pieViewMode === 'category'
                        ? 'bg-slate-800 text-sky-400 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Categoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setPieViewMode('subcategory')}
                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                      pieViewMode === 'subcategory'
                        ? 'bg-slate-800 text-sky-400 shadow-sm'
                        : 'text-slate-400 hover:text-white'
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
                      <div key={entry.name} className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px]">{entry.name}</span>
                        <span className="font-bold text-white">({formatCLP(entry.value)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  No hay movimientos de gasto para mostrar
                </div>
              )}
            </div>
          )}

          {/* Monthly Trend Bar Chart */}
          {showTrend && (
            <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-800/80 flex flex-col justify-between">
              <div className="border-b border-slate-800/80 pb-3 mb-4">
                <h3 className="text-sm font-bold text-white">Evolución Mensual: Gastos vs Monto Real Utilizado</h3>
                <p className="text-xs text-slate-400">Comparativa de compras brutas y uso real por período</p>
              </div>
              {monthlyData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                      <Bar dataKey="gastosBrutos" name="Gastos Brutos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="montoRealUtilizado" name="Monto Real Utilizado" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="abonos" name="Abonos Realizados" fill="#10b981" radius={[4, 4, 0, 0]} />
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

      {/* Breakdown per Card / Account */}
      {showAccounts && (
        <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-800/80">
        <div className="border-b border-slate-800/80 pb-3 mb-4">
          <h3 className="text-sm font-bold text-white">Resumen por Tarjeta / Cuenta</h3>
          <p className="text-xs text-slate-400">Comparación de gasto bruto, abonos aplicados y monto restante por cuenta</p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accountData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis type="number" tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 11 }} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
              <Bar dataKey="GastosOriginales" name="Gasto Bruto" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              <Bar dataKey="MontoRealUtilizado" name="Monto Real Utilizado" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              <Bar dataKey="PagosRealizados" name="Abonos Realizados" fill="#34d399" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Account Cards with Billing Cycle Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          {accounts.map((acc) => {
            const accData = accountData.find((d) => d.name === acc.name);
            const cycle = formatBillingCycle(acc.closingDay, acc.dueDay);

            return (
              <div
                key={acc.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between text-xs hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      {acc.type === 'credit_card' ? (
                        <CreditCard className="w-3.5 h-3.5 text-rose-400" />
                      ) : (
                        <Landmark className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.bank}</p>
                    </div>
                  </div>
                  {cycle ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                      <Calendar className="w-2.5 h-2.5" />
                      {cycle}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                      Fin de mes
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Gasto Bruto:</span>
                    <span className="font-bold text-slate-200">
                      {formatCLP(accData?.GastosOriginales || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Monto Real Utilizado:</span>
                    <span className="font-bold text-sky-400">
                      {formatCLP(accData?.MontoRealUtilizado || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Dynamic Account-Specific Charts */}
      {accountSpecificCharts.map((chartWidget) => {
        const acc = accounts.find((a) => a.id === chartWidget.targetAccountId);
        if (!acc) return null;

        const accTxs = computedTransactions.filter((tx) => tx.accountId === acc.id);
        const accMonthMap = new Map<string, { month: string; compras: number; pagos: number; montoReal: number }>();
        
        accTxs.forEach((tx) => {
          const mKey = tx.period || (tx.date ? tx.date.substring(0, 7) : 'Sin Mes');
          const cur = accMonthMap.get(mKey) || { month: mKey, compras: 0, pagos: 0, montoReal: 0 };
          if (tx.amount > 0 && tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta') {
            cur.compras += tx.amount;
            cur.montoReal += tx.netAmount;
          } else if (tx.transactionType === 'pago_tc' || (tx.category === 'Abonos y Pagos' && tx.amount < 0)) {
            cur.pagos += Math.abs(tx.amount);
          }
          accMonthMap.set(mKey, cur);
        });

        const accMonthlyData = Array.from(accMonthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        const totalPurchases = accTxs.filter((t) => t.amount > 0 && t.transactionType !== 'pago_tc').reduce((s, t) => s + t.amount, 0);
        const totalPaid = accTxs.filter((t) => t.transactionType === 'pago_tc' || (t.category === 'Abonos y Pagos' && t.amount < 0)).reduce((s, t) => s + Math.abs(t.amount), 0);
        const totalNetUsed = accTxs.filter((t) => t.amount > 0 && t.transactionType !== 'pago_tc').reduce((s, t) => s + t.netAmount, 0);
        const cycle = formatBillingCycle(acc.closingDay, acc.dueDay);

        return (
          <div key={chartWidget.id} className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-slate-800/80">
            <div className="border-b border-slate-800/80 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {acc.type === 'credit_card' ? <CreditCard className="w-5 h-5 text-rose-400" /> : <Landmark className="w-5 h-5 text-sky-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{chartWidget.title || `Análisis Exclusivo: ${acc.name}`}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {acc.bank}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Historial de compras, abonos y monto utilizado exclusivo para esta cuenta
                  </p>
                </div>
              </div>

              {cycle && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sky-500/10 text-sky-300 px-3 py-1 rounded-full border border-sky-500/30">
                  <Calendar className="w-3 h-3" />
                  <span>{cycle}</span>
                </span>
              )}
            </div>

            {/* Quick Metrics Bar for this card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Compras Brutas</span>
                <p className="text-base font-black text-rose-400 mt-0.5">{formatCLP(totalPurchases)}</p>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Abonos Realizados</span>
                <p className="text-base font-black text-emerald-400 mt-0.5">{formatCLP(totalPaid)}</p>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Monto Real Restante</span>
                <p className="text-base font-black text-sky-400 mt-0.5">{formatCLP(totalNetUsed)}</p>
              </div>
            </div>

            {accMonthlyData.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accMonthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                    <Bar dataKey="compras" name="Compras" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="montoReal" name="Monto Real" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pagos" name="Abonos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-slate-500">
                No hay movimientos registrados para esta cuenta en los filtros actuales
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
