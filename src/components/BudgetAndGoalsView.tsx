import React, { useState, useMemo } from 'react';
import {
  Target,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Sparkles,
  ChevronRight,
  DollarSign,
  PiggyBank,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  CategoryBudget,
  ComputedTransaction,
  CategoryMapping,
  SavingsGoal
} from '../types';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';

interface BudgetAndGoalsViewProps {
  budgets: CategoryBudget[];
  computedTransactions: ComputedTransaction[];
  selectedMonth: string;
  categoryMappings: CategoryMapping[];
  onSaveBudget: (categoryName: string, monthlyLimit: number) => void | Promise<void>;
  onDeleteBudget: (budgetId: string) => void | Promise<void>;
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void | Promise<void>;
  onUpdateSavingsGoal: (goal: SavingsGoal) => void | Promise<void>;
  onDeleteSavingsGoal: (goalId: string) => void | Promise<void>;
  onContributeToGoal: (goalId: string, amount: number) => void | Promise<void>;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

const PRESET_ICONS = ['🛡️', '🏖️', '🚗', '🏠', '💻', '✈️', '💍', '🎓', '🎁', '🚀', '📈', '👶'];

export const BudgetAndGoalsView: React.FC<BudgetAndGoalsViewProps> = ({
  budgets,
  computedTransactions,
  selectedMonth,
  categoryMappings,
  onSaveBudget,
  onDeleteBudget,
  savingsGoals,
  onAddSavingsGoal,
  onUpdateSavingsGoal,
  onDeleteSavingsGoal,
  onContributeToGoal
}) => {
  // 1. Calculate Spent by Category
  const spentMap = useMemo(() => {
    const map = new Map<string, number>();
    computedTransactions
      .filter((tx) => tx.amount > 0 && !isPaymentOrIncomeTransaction(tx))
      .forEach((tx) => {
        const cat = tx.category || 'Otros Gastos';
        const current = map.get(cat) || 0;
        map.set(cat, current + (tx.netAmount !== undefined ? tx.netAmount : tx.amount));
      });
    return map;
  }, [computedTransactions]);

  // Selected Category for Live Radiography (defaults to first budget or first category)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(
    budgets[0]?.categoryName || categoryMappings[0]?.name || ''
  );

  // Form State: Add/Edit Budget
  const [formCategory, setFormCategory] = useState<string>(
    categoryMappings[0]?.name || 'Alimentación & Gastronomía'
  );
  const [formLimit, setFormLimit] = useState<string>('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Form State: New Savings Goal
  const [isAddingGoal, setIsAddingGoal] = useState<boolean>(false);
  const [goalName, setGoalName] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalInitial, setGoalInitial] = useState<string>('');
  const [goalDate, setGoalDate] = useState<string>('');
  const [goalIcon, setGoalIcon] = useState<string>('🛡️');

  // Quick Contribute Popover State
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState<string>('');

  // Confirmation Delete Budget
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  // Global Health Calculations
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalSpentInBudgeted = budgets.reduce(
    (sum, b) => sum + (spentMap.get(b.categoryName) || 0),
    0
  );
  const globalRemaining = totalBudgeted - totalSpentInBudgeted;
  const globalHealthPct =
    totalBudgeted > 0 ? Math.round((totalSpentInBudgeted / totalBudgeted) * 100) : 0;

  // Days calculations for Suggested Daily Budget
  const daysInfo = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthNum = today.getMonth() + 1;
    const currentYearMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    if (selectedMonth === 'ALL' || selectedMonth === currentYearMonth) {
      const daysInMonth = new Date(currentYear, currentMonthNum, 0).getDate();
      const currentDay = today.getDate();
      const daysLeft = Math.max(1, daysInMonth - currentDay + 1);
      return { daysLeft, daysInMonth, isPast: false, isCurrent: true };
    } else if (selectedMonth > currentYearMonth) {
      // Future month
      const [y, m] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      return { daysLeft: daysInMonth, daysInMonth, isPast: false, isCurrent: false };
    } else {
      // Past month
      return { daysLeft: 0, daysInMonth: 30, isPast: true, isCurrent: false };
    }
  }, [selectedMonth]);

  // Top Merchant Expenses in Selected Category
  const topCategoryExpenses = useMemo(() => {
    if (!selectedCategoryName) return [];
    return computedTransactions
      .filter(
        (tx) =>
          tx.category === selectedCategoryName &&
          tx.amount > 0 &&
          !isPaymentOrIncomeTransaction(tx)
      )
      .sort((a, b) => (b.netAmount || b.amount) - (a.netAmount || a.amount))
      .slice(0, 4);
  }, [computedTransactions, selectedCategoryName]);

  // Handlers for Budgets
  const handleSaveBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = formLimit.replace(/\D/g, '');
    const num = parseInt(cleaned, 10);
    if (!formCategory || isNaN(num) || num <= 0) return;

    await onSaveBudget(formCategory, num);
    setFormLimit('');
    setEditingBudgetId(null);
    setSelectedCategoryName(formCategory);
  };

  const handleStartEditBudget = (b: CategoryBudget) => {
    setFormCategory(b.categoryName);
    setFormLimit(b.monthlyLimit.toString());
    setEditingBudgetId(b.id);
  };

  // Handlers for Savings Goals
  const handleCreateGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClean = goalTarget.replace(/\D/g, '');
    const initClean = goalInitial.replace(/\D/g, '');
    const targetNum = parseInt(targetClean, 10);
    const initNum = initClean ? parseInt(initClean, 10) : 0;

    if (!goalName.trim() || isNaN(targetNum) || targetNum <= 0) return;

    await onAddSavingsGoal({
      name: goalName.trim(),
      targetAmount: targetNum,
      currentAmount: isNaN(initNum) ? 0 : initNum,
      targetDate: goalDate || undefined,
      categoryIcon: goalIcon || '🛡️'
    });

    setGoalName('');
    setGoalTarget('');
    setGoalInitial('');
    setGoalDate('');
    setIsAddingGoal(false);
  };

  const handleContributeSubmit = async (goalId: string, amount: number) => {
    if (isNaN(amount) || amount <= 0) return;
    await onContributeToGoal(goalId, amount);
    setContributeGoalId(null);
    setContributeAmount('');
  };

  // Selected Category Budget & Remaining
  const activeBudget = budgets.find((b) => b.categoryName === selectedCategoryName);
  const activeSpent = spentMap.get(selectedCategoryName) || 0;
  const activeRemaining = activeBudget ? activeBudget.monthlyLimit - activeSpent : 0;
  const activeDailyBudget =
    activeRemaining > 0 && daysInfo.daysLeft > 0
      ? Math.round(activeRemaining / daysInfo.daysLeft)
      : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Encabezado de la Vista */}
      <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 via-sky-500/20 to-indigo-500/20 text-sky-400 rounded-2xl border border-sky-400/30 shadow-inner flex-shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Presupuestos & Metas Financieras
              </h2>
              <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Planificación
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Monitorea tus topes de consumo mensuales y el progreso de tus fondos de ahorro para asegurar tu tranquilidad financiera.
            </p>
          </div>
        </div>

        {/* Resumen Superior */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Período</span>
            <span className="text-xs sm:text-sm font-black text-sky-400">
              {selectedMonth === 'ALL' ? 'Todos los Meses' : selectedMonth}
            </span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Topes Fijados</span>
            <span className="text-xs sm:text-sm font-black text-white">{budgets.length}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Metas Ahorro</span>
            <span className="text-xs sm:text-sm font-black text-emerald-400">{savingsGoals.length}</span>
          </div>
        </div>
      </div>

      {/* Estructura Master-Detail a 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================================= */}
        {/* COLUMNA 1: Topes de Consumo Mensual (6 Columnas)                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* 1. Tarjeta Resumen de Salud del Mes */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">Salud Presupuestaria del Mes</h3>
              </div>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  globalHealthPct >= 100
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : globalHealthPct >= 80
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {globalHealthPct >= 100
                  ? 'Excedido'
                  : globalHealthPct >= 80
                  ? 'Atención'
                  : 'Saludable'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 text-center">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Presupuestado</span>
                <span className="text-xs sm:text-sm font-black text-white">{formatCLP(totalBudgeted)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Gastado Real</span>
                <span className="text-xs sm:text-sm font-black text-slate-200">{formatCLP(totalSpentInBudgeted)}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  {globalRemaining >= 0 ? 'Disponible' : 'Excedido por'}
                </span>
                <span
                  className={`text-xs sm:text-sm font-black ${
                    globalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCLP(Math.abs(globalRemaining))}
                </span>
              </div>
            </div>

            {/* Barra de Progreso Global */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Progreso Consumo Global</span>
                <span
                  className={
                    globalHealthPct >= 100
                      ? 'text-rose-400 font-bold'
                      : globalHealthPct >= 80
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400 font-bold'
                  }
                >
                  {globalHealthPct}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    globalHealthPct >= 100
                      ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                      : globalHealthPct >= 80
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(globalHealthPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 2. Formulario Rápido de Fijar / Editar Presupuesto */}
          <form
            onSubmit={handleSaveBudgetSubmit}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h4 className="font-bold text-xs sm:text-sm text-white">
                  {editingBudgetId ? 'Editar Límite Presupuestario' : 'Fijar Nuevo Tope Mensual'}
                </h4>
              </div>
              {editingBudgetId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBudgetId(null);
                    setFormLimit('');
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6">
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  disabled={Boolean(editingBudgetId)}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 cursor-pointer disabled:opacity-60"
                >
                  {categoryMappings.map((c) => (
                    <option key={c.id} value={c.name} className="bg-slate-900 text-white">
                      📁 {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 relative">
                <span className="absolute left-3 top-2.5 text-xs text-slate-500">$</span>
                <input
                  type="number"
                  placeholder="Ej: 350000"
                  value={formLimit}
                  onChange={(e) => setFormLimit(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 placeholder-slate-600"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-md shadow-sky-500/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-1"
                >
                  <span>{editingBudgetId ? 'Guardar' : 'Fijar'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* 3. Lista Interactiva de Presupuestos por Categoría */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-sky-400" />
                <h4 className="font-bold text-sm text-white">Topes por Categoría</h4>
                <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                  {budgets.length}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Haz clic para ver radiografía</span>
            </div>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {budgets.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <Target className="w-8 h-8 mx-auto opacity-30 text-sky-400" />
                  <p className="text-xs">Aún no has fijado ningún presupuesto mensual.</p>
                  <p className="text-[11px] text-slate-600">
                    Usa el formulario superior para fijar topes de consumo para supermercado, ocio, etc.
                  </p>
                </div>
              ) : (
                budgets.map((b) => {
                  const spent = spentMap.get(b.categoryName) || 0;
                  const limit = b.monthlyLimit;
                  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  const remaining = limit - spent;
                  const isSelected = selectedCategoryName === b.categoryName;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedCategoryName(b.categoryName)}
                      className={`group p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-sky-500/10 border-sky-500/60 shadow-md shadow-sky-500/10'
                          : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Row: Category Name & Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              pct >= 100
                                ? 'bg-rose-500 animate-pulse'
                                : pct >= 80
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {b.categoryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pct >= 100
                                ? 'bg-rose-500/20 text-rose-300'
                                : pct >= 80
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {pct}%
                          </span>

                          {/* Quick Actions */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditBudget(b);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-300 p-1 rounded hover:bg-slate-800 transition"
                            title="Editar tope"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          {confirmDeleteBudgetId === b.id ? (
                            <div
                              className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 p-0.5 rounded-lg"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteBudget(b.id);
                                  setConfirmDeleteBudgetId(null);
                                }}
                                className="text-rose-400 hover:text-white px-1 text-[10px] font-bold"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteBudgetId(null)}
                                className="text-slate-400 hover:text-white px-1 text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteBudgetId(b.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                              title="Eliminar presupuesto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}

                          {isSelected && (
                            <ChevronRight className="w-4 h-4 text-sky-400 animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 100
                              ? 'bg-rose-500'
                              : pct >= 80
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      {/* Bottom Row: Values & Remaining */}
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>
                          <strong className="text-slate-200">{formatCLP(spent)}</strong> de {formatCLP(limit)}
                        </span>
                        <span
                          className={`font-semibold ${
                            remaining >= 0 ? 'text-slate-400' : 'text-rose-400 font-bold'
                          }`}
                        >
                          {remaining >= 0 ? `Quedan ${formatCLP(remaining)}` : `Excedido por ${formatCLP(Math.abs(remaining))}`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: Radiografía en Vivo & Metas de Ahorro (6 Columnas)             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          
          {/* 1. Bloque Superior: Radiografía de la Categoría Seleccionada */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
            {selectedCategoryName ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      Detalle del Mes:
                    </span>
                    <span className="text-xs sm:text-sm font-black text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
                      📁 {selectedCategoryName}
                    </span>
                  </div>

                  {activeBudget && (
                    <span className="text-xs text-slate-400">
                      Tope: <strong className="text-white">{formatCLP(activeBudget.monthlyLimit)}</strong>
                    </span>
                  )}
                </div>

                {/* Presupuesto Diario Sugerido Card */}
                {activeBudget ? (
                  <div
                    className={`p-4 rounded-xl border backdrop-blur-md ${
                      activeRemaining > 0
                        ? 'bg-sky-950/30 border-sky-500/30'
                        : 'bg-rose-950/30 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>Presupuesto Diario Sugerido</span>
                      </span>
                      {daysInfo.daysLeft > 0 && !daysInfo.isPast && (
                        <span className="text-[11px] text-sky-400 font-semibold">
                          Quedan {daysInfo.daysLeft} días
                        </span>
                      )}
                    </div>

                    {daysInfo.isPast ? (
                      <p className="text-xs text-slate-400">
                        Período cerrado. El gasto final fue de <strong>{formatCLP(activeSpent)}</strong>.
                      </p>
                    ) : activeRemaining > 0 ? (
                      <div className="mt-2 flex items-baseline justify-between">
                        <div>
                          <p className="text-2xl font-black text-emerald-400 tracking-tight">
                            {formatCLP(activeDailyBudget)}
                            <span className="text-xs font-normal text-slate-400"> / día</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Puedes gastar esto diariamente sin sobrepasar tu tope de {formatCLP(activeBudget.monthlyLimit)}.
                          </p>
                        </div>
                        <Flame className="w-6 h-6 text-emerald-400/60 flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="mt-2 flex items-baseline justify-between">
                        <div>
                          <p className="text-2xl font-black text-rose-400 tracking-tight">
                            $0
                            <span className="text-xs font-normal text-rose-300"> / día restante</span>
                          </p>
                          <p className="text-[11px] text-rose-300 mt-0.5">
                            Has excedido este presupuesto por {formatCLP(Math.abs(activeRemaining))}. Evita más cargos en esta categoría.
                          </p>
                        </div>
                        <AlertTriangle className="w-6 h-6 text-rose-400/80 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                    Esta categoría aún no tiene un tope mensual fijado. Asígnale uno en el formulario de la izquierda para calcular tu gasto diario sugerido.
                  </div>
                )}

                {/* Top Comercios / Gastos */}
                <div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Mayores Gastos en {selectedCategoryName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">Top de este mes</span>
                  </h5>

                  {topCategoryExpenses.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      No hay compras registradas en {selectedCategoryName} para este mes.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {topCategoryExpenses.map((tx) => (
                        <div
                          key={tx.id}
                          className="bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-200 truncate">{tx.description}</p>
                            <span className="text-[10px] text-slate-500">{tx.date}</span>
                          </div>
                          <span className="font-bold text-white flex-shrink-0">
                            {formatCLP(tx.netAmount !== undefined ? tx.netAmount : tx.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Target className="w-8 h-8 mx-auto opacity-30 text-sky-400" />
                <p className="text-xs">Selecciona un presupuesto de la izquierda para ver su radiografía de consumo.</p>
              </div>
            )}
          </div>

          {/* 2. Bloque Inferior: Metas de Ahorro & Bolsillos Financieros */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm text-white">Metas de Ahorro & Fondos</h4>
                <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                  {savingsGoals.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingGoal(!isAddingGoal)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-lg shadow-emerald-500/20 transition transform hover:scale-[1.02]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Meta</span>
              </button>
            </div>

            {/* Formulario Expandible de Nueva Meta */}
            {isAddingGoal && (
              <form
                onSubmit={handleCreateGoalSubmit}
                className="mt-3 p-3.5 bg-slate-950/90 border border-emerald-500/30 rounded-xl space-y-2.5 animate-fadeIn"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={goalIcon}
                      onChange={(e) => setGoalIcon(e.target.value)}
                      className="w-full text-base py-1 px-2 bg-slate-900 border border-slate-700 rounded-xl text-center cursor-pointer"
                    >
                      {PRESET_ICONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-10">
                    <input
                      type="text"
                      required
                      placeholder="Nombre de la meta (ej: Fondo de Emergencia)..."
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                      className="w-full text-xs py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <input
                    type="number"
                    required
                    placeholder="Objetivo ($)..."
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    placeholder="Monto Inicial ($)..."
                    value={goalInitial}
                    onChange={(e) => setGoalInitial(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingGoal(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs py-1 px-3.5 rounded-xl shadow-md transition"
                  >
                    Crear Meta
                  </button>
                </div>
              </form>
            )}

            {/* Lista de Tarjetas de Metas de Ahorro */}
            <div className="mt-3 flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
              {savingsGoals.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <PiggyBank className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                  <p className="text-xs">No tienes metas de ahorro configuradas aún.</p>
                  <p className="text-[11px] text-slate-600">
                    Crea una para tus próximas vacaciones, fondo de emergencia o compras especiales.
                  </p>
                </div>
              ) : (
                savingsGoals.map((goal) => {
                  const pct = Math.min(
                    100,
                    goal.targetAmount > 0
                      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                      : 0
                  );
                  const isCompleted = goal.currentAmount >= goal.targetAmount;
                  const missing = Math.max(0, goal.targetAmount - goal.currentAmount);

                  return (
                    <div
                      key={goal.id}
                      className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-xl transition space-y-2 group"
                    >
                      {/* Goal Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base select-none">{goal.categoryIcon || '🎯'}</span>
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {goal.name}
                          </span>
                          {goal.targetDate && (
                            <span className="text-[10px] text-slate-500 hidden sm:inline">
                              📅 {goal.targetDate}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            {isCompleted ? '¡Completada! 🎉' : `${pct}%`}
                          </span>

                          {/* Quick Contribute Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setContributeGoalId(contributeGoalId === goal.id ? null : goal.id)
                            }
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-lg transition"
                          >
                            + Aportar
                          </button>

                          {/* Delete Confirmation */}
                          {confirmDeleteGoalId === goal.id ? (
                            <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 p-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteSavingsGoal(goal.id);
                                  setConfirmDeleteGoalId(null);
                                }}
                                className="text-rose-400 hover:text-white px-1 text-[10px] font-bold"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteGoalId(null)}
                                className="text-slate-400 hover:text-white px-1 text-[10px]"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteGoalId(goal.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 rounded transition"
                              title="Eliminar meta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Goal Stats */}
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>
                          Llevas: <strong className="text-slate-200">{formatCLP(goal.currentAmount)}</strong> de {formatCLP(goal.targetAmount)}
                        </span>
                        <span className={isCompleted ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {isCompleted ? 'Fondo Listo' : `Faltan ${formatCLP(missing)}`}
                        </span>
                      </div>

                      {/* Popover Inline para Aportar */}
                      {contributeGoalId === goal.id && (
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 animate-fadeIn">
                          <span className="text-[11px] text-slate-400 font-semibold">Monto a sumar:</span>
                          <input
                            type="number"
                            autoFocus
                            placeholder="$ Ej: 50000"
                            value={contributeAmount}
                            onChange={(e) => setContributeAmount(e.target.value)}
                            className="w-28 text-xs py-1 px-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cleaned = contributeAmount.replace(/\D/g, '');
                              const num = parseInt(cleaned, 10);
                              if (num > 0) handleContributeSubmit(goal.id, num);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs py-1 px-2.5 rounded-lg transition"
                          >
                            Sumar
                          </button>
                          
                          {/* Quick Chips */}
                          <button
                            type="button"
                            onClick={() => handleContributeSubmit(goal.id, 10000)}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            +$10k
                          </button>
                          <button
                            type="button"
                            onClick={() => handleContributeSubmit(goal.id, 50000)}
                            className="bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            +$50k
                          </button>
                          <button
                            type="button"
                            onClick={() => setContributeGoalId(null)}
                            className="text-slate-500 hover:text-white p-1 text-xs"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
