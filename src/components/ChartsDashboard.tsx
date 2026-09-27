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
import { ComputedTransaction, Account, CategoryBudget } from '../types';
import { formatCLP } from './MetricCards';
import { Target, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';

interface ChartsDashboardProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  budgets?: CategoryBudget[];
  onOpenBudgetModal?: () => void;
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
  onOpenBudgetModal
}) => {
  const [pieViewMode, setPieViewMode] = useState<'category' | 'subcategory'>('category');

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

      {/* Monthly Budget Progress Section */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Control de Presupuestos Mensuales</h3>
              <p className="text-xs text-slate-500">Monitoreo de topes de consumo por categoría general en los movimientos filtrados</p>
            </div>
          </div>
          {onOpenBudgetModal && (
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gestionar Presupuestos & Reglas</span>
            </button>
          )}
        </div>

        {budgets.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-500 mb-2">No has definido presupuestos mensuales aún.</p>
            {onOpenBudgetModal && (
              <button
                onClick={onOpenBudgetModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Crear tu primer presupuesto</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => {
              const spent = categorySpendingMap.get(b.categoryName) || 0;
              const limit = b.monthlyLimit;
              const pct = Math.round((spent / limit) * 100);
              const isOver = spent > limit;
              const isWarning = pct >= 80 && !isOver;

              const barColor = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';
              const badgeColor = isOver
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : isWarning
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div key={b.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{b.categoryName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {pct}% {isOver ? 'Excedido' : isWarning ? 'Cerca del Límite' : 'Ok'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-medium text-slate-500">
                    <span>{formatCLP(spent)}</span>
                    <span>Límite: {formatCLP(limit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category / Subcategory Expenses Pie Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Gastos Netos por {pieViewMode === 'category' ? 'Categoría' : 'Subcategoría'}</h3>
              <p className="text-xs text-slate-500">Distribución del Monto Real Utilizado por nivel de consumo</p>
            </div>
            
            {/* View Selector Tabs */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPieViewMode('category')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  pieViewMode === 'category'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Categoría
              </button>
              <button
                type="button"
                onClick={() => setPieViewMode('subcategory')}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  pieViewMode === 'subcategory'
                    ? 'bg-white text-sky-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
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
              <div className="flex flex-wrap justify-center gap-2 mt-2 max-h-20 overflow-y-auto">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 text-[11px] text-slate-600">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="truncate max-w-[130px]">{entry.name}</span>
                    <span className="font-semibold">({formatCLP(entry.value)})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No hay movimientos de gasto para mostrar
            </div>
          )}
        </div>

        {/* Monthly Trend Bar Chart */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 mb-3">
            <h3 className="text-sm font-bold text-slate-800">Evolución Mensual: Gastos vs Monto Real Utilizado</h3>
            <p className="text-xs text-slate-500">Comparativa de compras brutas y uso real por período</p>
          </div>
          {monthlyData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="gastosBrutos" name="Gastos Brutos" fill="#fda4af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="montoRealUtilizado" name="Monto Real Utilizado" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="abonos" name="Abonos Realizados" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No hay movimientos por período para mostrar
            </div>
          )}
        </div>

      </div>

      {/* Breakdown per Card / Account */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-sm font-bold text-slate-800">Resumen por Tarjeta / Cuenta</h3>
          <p className="text-xs text-slate-500">Comparación de gasto bruto, abonos aplicados y monto restante por cuenta</p>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={accountData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="GastosOriginales" name="Gasto Bruto" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              <Bar dataKey="MontoRealUtilizado" name="Monto Real Utilizado" fill="#0369a1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="PagosRealizados" name="Abonos Realizados" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
