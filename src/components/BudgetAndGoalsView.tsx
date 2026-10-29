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
  ChevronDown,
  DollarSign,
  PiggyBank,
  CheckCircle2,
  Clock,
  ArrowRight,
  Flame,
  PieChart as PieChartIcon,
  Folder,
  Tag,
  Microscope,
  CreditCard,
  Search,
  Eye,
  EyeOff,
  Coins
} from 'lucide-react';
import {
  CategoryBudget,
  ComputedTransaction,
  CategoryMapping,
  SavingsGoal,
  Account
} from '../types';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';
import { getBudgetSpending } from '../utils/categorizer';
import { getBankBranding } from './AccountsManagementView';

export interface BudgetAndGoalsViewProps {
  budgets: CategoryBudget[];
  computedTransactions: ComputedTransaction[];
  selectedMonth: string;
  categoryMappings: CategoryMapping[];
  onSaveBudget: (budgetData: any, monthlyLimit?: number) => void | Promise<void>;
  onDeleteBudget: (budgetId: string) => void | Promise<void>;
  savingsGoals: SavingsGoal[];
  onAddSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void | Promise<void>;
  onUpdateSavingsGoal: (goal: SavingsGoal) => void | Promise<void>;
  onDeleteSavingsGoal: (goalId: string) => void | Promise<void>;
  onContributeToGoal: (goalId: string, amount: number) => void | Promise<void>;
  accounts?: Account[];
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

// Compact formatter for large numbers (e.g. $280K / $350K)
export function formatCompactCLP(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    const val = (amount / 1000000).toFixed(1).replace('.0', '');
    return `$${val}M`;
  }
  if (Math.abs(amount) >= 1000) {
    const val = Math.round(amount / 1000);
    return `$${val}K`;
  }
  return `$${amount}`;
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
  onContributeToGoal,
  accounts = []
}) => {
  // 1. Calculate Spending for Each Budget via getBudgetSpending
  const budgetSpendings = useMemo(() => {
    const map = new Map<string, { spent: number; matchingTransactions: ComputedTransaction[] }>();
    budgets.forEach((b) => {
      map.set(b.id, getBudgetSpending(b, computedTransactions));
    });
    return map;
  }, [budgets, computedTransactions]);

  // Selected Budget for Live Radiography
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(
    budgets[0]?.id || null
  );

  // Expanded inline radiography panels (set of budget IDs)
  const [expandedRadiographyIds, setExpandedRadiographyIds] = useState<Set<string>>(
    new Set(budgets[0]?.id ? [budgets[0].id] : [])
  );

  const toggleRadiography = (budgetId: string) => {
    setExpandedRadiographyIds((prev) => {
      const next = new Set(prev);
      if (next.has(budgetId)) {
        next.delete(budgetId);
      } else {
        next.add(budgetId);
      }
      return next;
    });
    setSelectedBudgetId(budgetId);
  };

  const activeBudget = useMemo(() => {
    if (selectedBudgetId) {
      const found = budgets.find((b) => b.id === selectedBudgetId);
      if (found) return found;
    }
    return budgets[0] || null;
  }, [budgets, selectedBudgetId]);

  // Tab Filtering: 'all' | 'budgets' | 'goals'
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'budgets' | 'goals'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form / Modal State for Budget
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [formBudgetName, setFormBudgetName] = useState<string>('');
  const [formLimit, setFormLimit] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Category / Subcategory selector mode inside form
  const [addMode, setAddMode] = useState<'none' | 'category' | 'subcategory'>('none');
  const [tempCategoryToAdd, setTempCategoryToAdd] = useState<string>(
    categoryMappings[0]?.name || 'Alimentación y Gastronomía'
  );
  const [tempSubcategoryToAdd, setTempSubcategoryToAdd] = useState<string>(
    categoryMappings[0]?.subcategories[0] || 'Alimentación y Supermercados'
  );

  // Form / Modal State for Savings Goal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalInitial, setGoalInitial] = useState<string>('');
  const [goalDate, setGoalDate] = useState<string>('');
  const [goalIcon, setGoalIcon] = useState<string>('🛡️');

  // Quick Contribute Popover State (1-touch contribute)
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState<string>('');
  const [contributeSuccessMsg, setContributeSuccessMsg] = useState<{ id: string; amount: number } | null>(null);

  // Confirmations
  const [confirmDeleteBudgetId, setConfirmDeleteBudgetId] = useState<string | null>(null);
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  // 1. Resumen Superior de Presupuestos (4 Indicadores Stitch)
  // Indicator 1: Presupuesto Total Consolidado
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);

  // Indicator 2: Gasto Ejecutado y Porcentaje
  const totalSpentInBudgeted = budgets.reduce(
    (sum, b) => sum + (budgetSpendings.get(b.id)?.spent || 0),
    0
  );
  const globalRemaining = totalBudgeted - totalSpentInBudgeted;
  const globalHealthPct =
    totalBudgeted > 0 ? Math.round((totalSpentInBudgeted / totalBudgeted) * 100) : 0;

  // Indicator 3: Ahorro en Metas (Total acumulado en metas activas)
  const totalSavingsCurrent = savingsGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalTargetSavings = savingsGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);

  // Indicator 4: Aporte Programado del Mes (ritmo objetivo mensual consolidado)
  const monthlySavingsPace = useMemo(() => {
    let totalPace = 0;
    const now = new Date();
    savingsGoals.forEach((g) => {
      const missing = Math.max(0, g.targetAmount - g.currentAmount);
      if (missing > 0) {
        if (g.targetDate) {
          const targetDateObj = new Date(g.targetDate);
          const diffMonths =
            (targetDateObj.getFullYear() - now.getFullYear()) * 12 +
            (targetDateObj.getMonth() - now.getMonth());
          const months = Math.max(1, diffMonths);
          totalPace += Math.ceil(missing / months);
        } else {
          totalPace += Math.ceil(missing / 12);
        }
      }
    });
    return totalPace;
  }, [savingsGoals]);

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
      const [y, m] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      return { daysLeft: daysInMonth, daysInMonth, isPast: false, isCurrent: false };
    } else {
      return { daysLeft: 0, daysInMonth: 30, isPast: true, isCurrent: false };
    }
  }, [selectedMonth]);

  // Active Spending and Radiography for Selected Budget
  const activeSpending = useMemo(() => {
    if (!activeBudget) return { spent: 0, matchingTransactions: [] };
    return budgetSpendings.get(activeBudget.id) || getBudgetSpending(activeBudget, computedTransactions);
  }, [activeBudget, budgetSpendings, computedTransactions]);

  const activeSpent = activeSpending.spent;
  const activeRemaining = activeBudget ? activeBudget.monthlyLimit - activeSpent : 0;
  const activeDailyBudget =
    activeRemaining > 0 && daysInfo.daysLeft > 0
      ? Math.round(activeRemaining / daysInfo.daysLeft)
      : 0;

  // Filtered Budgets
  const filteredBudgets = useMemo(() => {
    if (!searchQuery.trim()) return budgets;
    const q = searchQuery.toLowerCase().trim();
    return budgets.filter((b) => {
      const name = (b.name || b.categoryName || '').toLowerCase();
      const cats = (b.categories || []).some((c) => c.toLowerCase().includes(q));
      const subs = (b.subcategories || []).some((s) => s.toLowerCase().includes(q));
      return name.includes(q) || cats || subs;
    });
  }, [budgets, searchQuery]);

  // Filtered Savings Goals
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return savingsGoals;
    const q = searchQuery.toLowerCase().trim();
    return savingsGoals.filter((g) => g.name.toLowerCase().includes(q));
  }, [savingsGoals, searchQuery]);

  // Account map for fast lookup in radiography
  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  // Handlers for Budget Form
  const handleOpenCreateBudgetModal = () => {
    setEditingBudgetId(null);
    setFormBudgetName('');
    setFormLimit('');
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setAddMode('none');
    setFormError(null);
    setIsBudgetModalOpen(true);
  };

  const handleStartEditBudget = (b: CategoryBudget) => {
    setEditingBudgetId(b.id);
    setFormBudgetName(b.name || b.categoryName);
    setFormLimit(b.monthlyLimit.toString());
    const cats =
      b.categories && b.categories.length > 0
        ? b.categories
        : b.categoryName && (!b.subcategories || b.subcategories.length === 0)
        ? [b.categoryName]
        : [];
    setSelectedCategories(cats);
    setSelectedSubcategories(b.subcategories || []);
    setAddMode('none');
    setFormError(null);
    setIsBudgetModalOpen(true);
  };

  const handleAddCategoryConfirm = () => {
    if (!tempCategoryToAdd) return;
    if (!selectedCategories.includes(tempCategoryToAdd)) {
      setSelectedCategories((prev) => [...prev, tempCategoryToAdd]);
      if (!formBudgetName.trim()) {
        setFormBudgetName(tempCategoryToAdd);
      }
    }
    setAddMode('none');
    setFormError(null);
  };

  const handleAddSubcategoryConfirm = () => {
    if (!tempSubcategoryToAdd) return;
    if (!selectedSubcategories.includes(tempSubcategoryToAdd)) {
      setSelectedSubcategories((prev) => [...prev, tempSubcategoryToAdd]);
      if (!formBudgetName.trim()) {
        setFormBudgetName(tempSubcategoryToAdd);
      }
    }
    setAddMode('none');
    setFormError(null);
  };

  const handleRemoveCategory = (catName: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== catName));
  };

  const handleRemoveSubcategory = (subName: string) => {
    setSelectedSubcategories((prev) => prev.filter((s) => s !== subName));
  };

  const handleSaveBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formBudgetName.trim();
    if (!name) {
      setFormError('Ingresa un nombre para el presupuesto.');
      return;
    }

    const cleaned = formLimit.replace(/\D/g, '');
    const num = parseInt(cleaned, 10);
    if (isNaN(num) || num <= 0) {
      setFormError('Ingresa un tope mensual válido en CLP.');
      return;
    }

    let finalCats = [...selectedCategories];
    let finalSubs = [...selectedSubcategories];

    if (finalCats.length === 0 && finalSubs.length === 0) {
      const matchingCat = categoryMappings.find(
        (c) => c.name.toLowerCase() === name.toLowerCase()
      );
      if (matchingCat) {
        finalCats = [matchingCat.name];
      } else {
        setFormError('Agrega al menos una categoría o subcategoría con el selector.');
        return;
      }
    }

    const budgetPayload = {
      id: editingBudgetId || `b-${Date.now()}`,
      name,
      categoryName: name,
      monthlyLimit: num,
      categories: finalCats,
      subcategories: finalSubs
    };

    await onSaveBudget(budgetPayload);
    setIsBudgetModalOpen(false);
    setSelectedBudgetId(budgetPayload.id);
    setExpandedRadiographyIds((prev) => new Set([...prev, budgetPayload.id]));
  };

  // Handlers for Savings Goals
  const handleOpenCreateGoalModal = () => {
    setEditingGoalId(null);
    setGoalName('');
    setGoalTarget('');
    setGoalInitial('');
    setGoalDate('');
    setGoalIcon('🛡️');
    setIsGoalModalOpen(true);
  };

  const handleStartEditGoal = (goal: SavingsGoal) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalInitial(goal.currentAmount.toString());
    setGoalDate(goal.targetDate || '');
    setGoalIcon(goal.categoryIcon || '🛡️');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClean = goalTarget.replace(/\D/g, '');
    const initClean = goalInitial.replace(/\D/g, '');
    const targetNum = parseInt(targetClean, 10);
    const initNum = initClean ? parseInt(initClean, 10) : 0;

    if (!goalName.trim() || isNaN(targetNum) || targetNum <= 0) return;

    if (editingGoalId) {
      await onUpdateSavingsGoal({
        id: editingGoalId,
        name: goalName.trim(),
        targetAmount: targetNum,
        currentAmount: isNaN(initNum) ? 0 : initNum,
        targetDate: goalDate || undefined,
        categoryIcon: goalIcon || '🛡️'
      });
    } else {
      await onAddSavingsGoal({
        name: goalName.trim(),
        targetAmount: targetNum,
        currentAmount: isNaN(initNum) ? 0 : initNum,
        targetDate: goalDate || undefined,
        categoryIcon: goalIcon || '🛡️'
      });
    }

    setIsGoalModalOpen(false);
  };

  const handleQuickContribute = async (goalId: string, amount: number) => {
    if (isNaN(amount) || amount <= 0) return;
    await onContributeToGoal(goalId, amount);
    setContributeSuccessMsg({ id: goalId, amount });
    setTimeout(() => {
      setContributeSuccessMsg((prev) => (prev?.id === goalId ? null : prev));
    }, 2500);
    setContributeGoalId(null);
    setContributeAmount('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-14">
      
      {/* 1. Header Stitch Spec */}
      <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-[#00FFCC]/20 via-[#38bdf8]/20 to-[#FF2D78]/20 text-[#00FFCC] rounded-2xl border border-[#00FFCC]/30 shadow-inner shrink-0">
            <Target className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-headline font-black text-white tracking-tight">
                Presupuestos & Metas de Ahorro
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#A098B0] mt-1 max-w-2xl font-sans">
              Monitoreo multi-categoría agrupable con radiografía en vivo línea por línea y fondos de ahorro programados.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <button
            onClick={handleOpenCreateBudgetModal}
            className="flex items-center gap-2 bg-[#00FFCC] hover:bg-[#00e6b8] text-black font-headline font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-[#00FFCC]/20 transition transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Presupuesto</span>
          </button>
          <button
            onClick={handleOpenCreateGoalModal}
            className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#25253E] border border-[#302840] hover:border-[#FF2D78]/50 text-white font-headline font-bold text-xs py-2.5 px-4 rounded-xl transition shadow transform hover:scale-[1.02] active:scale-95"
          >
            <PiggyBank className="w-4 h-4 text-[#FF2D78]" />
            <span>Nueva Meta</span>
          </button>
        </div>
      </div>

      {/* 2. Resumen Superior: 4 Tarjetas de Indicadores (Pantalla6.html Spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Presupuesto Total Consolidado */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 relative overflow-hidden transition-all hover:border-[#00FFCC]/40 hover:shadow-lg hover:shadow-[#00FFCC]/5 group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FFCC]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0]">
              Presupuesto Total
            </span>
            <div className="p-2 bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-headline font-black text-white tracking-tight">
            {formatCLP(totalBudgeted)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#A098B0]">
            <span>Límite mensual consolidado</span>
            <span className="font-mono text-white font-bold">{budgets.length} topes</span>
          </div>
        </div>

        {/* Card 2: Gasto Ejecutado */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 relative overflow-hidden transition-all hover:border-[#38bdf8]/40 hover:shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0]">
              Gasto Ejecutado
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                globalHealthPct >= 100
                  ? 'bg-[#FF2D78]/20 text-[#FF2D78] border-[#FF2D78]/40 animate-pulse'
                  : globalHealthPct >= 80
                  ? 'bg-[#FFE04A]/20 text-[#FFE04A] border-[#FFE04A]/40'
                  : 'bg-[#00FFCC]/20 text-[#00FFCC] border-[#00FFCC]/40'
              }`}
            >
              {globalHealthPct >= 100
                ? `${globalHealthPct}% excedido`
                : globalHealthPct >= 80
                ? `${globalHealthPct}% atención`
                : `${globalHealthPct}% en rango`}
            </span>
          </div>
          <p className="text-2xl font-headline font-black text-white tracking-tight">
            {formatCLP(totalSpentInBudgeted)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#A098B0]">
            <span>
              {globalRemaining >= 0 ? 'Margen restante:' : 'Exceso consolidado:'}
            </span>
            <span
              className={`font-mono font-bold ${
                globalRemaining >= 0 ? 'text-[#00FFCC]' : 'text-[#FF2D78]'
              }`}
            >
              {formatCLP(Math.abs(globalRemaining))}
            </span>
          </div>
        </div>

        {/* Card 3: Ahorro en Metas */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 relative overflow-hidden transition-all hover:border-emerald-500/40 hover:shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0]">
              Ahorro en Metas
            </span>
            <div className="p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-headline font-black text-[#00FFCC] tracking-tight">
            {formatCLP(totalSavingsCurrent)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#A098B0]">
            <span>Total acumulado en fondos</span>
            <span className="font-mono text-emerald-400 font-bold">{savingsGoals.length} activas</span>
          </div>
        </div>

        {/* Card 4: Aporte Programado del Mes */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 relative overflow-hidden transition-all hover:border-[#FF2D78]/40 hover:shadow-lg group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF2D78]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0]">
              Aporte Programado
            </span>
            <div className="p-2 bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-headline font-black text-white tracking-tight">
            {formatCLP(monthlySavingsPace)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-[#A098B0]">
            <span>Meta total acumulada:</span>
            <span className="font-mono text-white font-bold">{formatCompactCLP(totalTargetSavings)}</span>
          </div>
        </div>

      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111118] border border-[#302840] p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-headline font-bold transition whitespace-nowrap ${
              activeTabFilter === 'all'
                ? 'bg-[#00FFCC] text-black shadow-md shadow-[#00FFCC]/20'
                : 'text-[#A098B0] hover:text-white hover:bg-[#1A1A2E]'
            }`}
          >
            Vista Unificada ({budgets.length + savingsGoals.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('budgets')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-headline font-bold transition whitespace-nowrap ${
              activeTabFilter === 'budgets'
                ? 'bg-[#00FFCC] text-black shadow-md shadow-[#00FFCC]/20'
                : 'text-[#A098B0] hover:text-white hover:bg-[#1A1A2E]'
            }`}
          >
            Presupuestos ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('goals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-headline font-bold transition whitespace-nowrap ${
              activeTabFilter === 'goals'
                ? 'bg-[#00FFCC] text-black shadow-md shadow-[#00FFCC]/20'
                : 'text-[#A098B0] hover:text-white hover:bg-[#1A1A2E]'
            }`}
          >
            Metas de Ahorro ({savingsGoals.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A098B0]" />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141422] border border-[#302840] text-xs text-white pl-9 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-[#00FFCC] transition placeholder-[#A098B0]/60 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A098B0] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ========================================================================= */}
        {/* COLUMNA 1: Presupuestos Agrupables Multi-Categoría (Pantalla6.html)       */}
        {/* ========================================================================= */}
        {(activeTabFilter === 'all' || activeTabFilter === 'budgets') && (
          <div className={`${activeTabFilter === 'budgets' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-4`}>
            
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00FFCC]" />
                <h3 className="font-headline font-bold text-white text-base">
                  Presupuestos Agrupables Multi-Categoría
                </h3>
                <span className="text-xs font-mono font-bold bg-[#141422] border border-[#302840] text-[#00FFCC] px-2 py-0.5 rounded-full">
                  {filteredBudgets.length}
                </span>
              </div>
              <button
                onClick={handleOpenCreateBudgetModal}
                className="text-xs font-mono font-bold text-[#00FFCC] hover:text-[#00e6b8] flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Presupuesto</span>
              </button>
            </div>

            {filteredBudgets.length === 0 ? (
              <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-10 text-center space-y-3">
                <Target className="w-10 h-10 mx-auto text-[#00FFCC]/40" />
                <p className="text-sm font-headline font-bold text-white">
                  No hay presupuestos para mostrar
                </p>
                <p className="text-xs text-[#A098B0] max-w-sm mx-auto">
                  Configura topes mensuales combinando categorías (📁) y subcategorías (🏷️) para controlar tus gastos con precisión.
                </p>
                <button
                  onClick={handleOpenCreateBudgetModal}
                  className="inline-flex items-center gap-2 bg-[#00FFCC] text-black font-headline font-bold text-xs py-2 px-4 rounded-xl shadow transition mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Primer Presupuesto</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBudgets.map((b) => {
                  const spending =
                    budgetSpendings.get(b.id) ||
                    getBudgetSpending(b, computedTransactions);
                  const spent = spending.spent;
                  const limit = b.monthlyLimit;
                  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  const remaining = limit - spent;
                  const isExpanded = expandedRadiographyIds.has(b.id);
                  const isSelected = activeBudget?.id === b.id;

                  // Dynamic color according to Stitch spec:
                  // verde/cian (<80%), amarillo (80-99%), magenta/rojo (>=100%)
                  const progressColorClass =
                    pct >= 100
                      ? 'bg-gradient-to-r from-[#FF2D78] to-rose-600 animate-pulse'
                      : pct >= 80
                      ? 'bg-gradient-to-r from-amber-400 to-[#FFE04A]'
                      : 'bg-gradient-to-r from-[#00FFCC] to-emerald-400';

                  const badgeColorClass =
                    pct >= 100
                      ? 'bg-[#FF2D78]/20 text-[#FF2D78] border-[#FF2D78]/40 animate-pulse'
                      : pct >= 80
                      ? 'bg-[#FFE04A]/20 text-[#FFE04A] border-[#FFE04A]/40'
                      : 'bg-[#00FFCC]/20 text-[#00FFCC] border-[#00FFCC]/40';

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBudgetId(b.id)}
                      className={`bg-[#141422] border panel-rim rounded-2xl p-5 transition-all shadow-xl ${
                        isSelected
                          ? 'border-[#00FFCC] bg-[#00FFCC]/5 glow-secondary'
                          : 'border-[#302840] hover:border-[#38bdf8]/40'
                      }`}
                    >
                      {/* Top Header of Budget Card */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                pct >= 100
                                  ? 'bg-[#FF2D78] animate-pulse'
                                  : pct >= 80
                                  ? 'bg-[#FFE04A]'
                                  : 'bg-[#00FFCC]'
                              }`}
                            />
                            <h4 className="text-base font-headline font-black text-white truncate">
                              {b.name || b.categoryName}
                            </h4>
                          </div>

                          {/* Chips Agrupables Multi-Categoría (Pantalla6.html Spec) */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {b.categories && b.categories.length > 0
                              ? b.categories.map((cat) => (
                                  <span
                                    key={cat}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 font-sans"
                                  >
                                    <Folder className="w-3 h-3 text-[#00FFCC]" />
                                    <span>{cat}</span>
                                  </span>
                                ))
                              : null}

                            {b.subcategories && b.subcategories.length > 0
                              ? b.subcategories.map((sub) => (
                                  <span
                                    key={sub}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30 font-sans"
                                  >
                                    <Tag className="w-3 h-3 text-[#FF2D78]" />
                                    <span>{sub}</span>
                                  </span>
                                ))
                              : null}

                            {(!b.categories || b.categories.length === 0) &&
                              (!b.subcategories || b.subcategories.length === 0) && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                                  <Folder className="w-3 h-3 text-slate-400" />
                                  <span>{b.categoryName}</span>
                                </span>
                              )}
                          </div>
                        </div>

                        {/* Right: Percent Badge & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${badgeColorClass}`}
                          >
                            {pct}%
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditBudget(b);
                            }}
                            className="p-1.5 rounded-lg text-[#A098B0] hover:text-[#00FFCC] hover:bg-[#1A1A2E] transition"
                            title="Editar presupuesto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                              className="p-1.5 rounded-lg text-[#A098B0] hover:text-[#FF2D78] hover:bg-[#1A1A2E] transition"
                              title="Eliminar presupuesto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Monto Gastado vs Límite Asignado ($280K / $350K) */}
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-headline font-black text-white">
                            {formatCLP(spent)}
                          </span>
                          <span className="text-xs text-[#A098B0] font-sans">
                            / {formatCLP(limit)} CLP
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold ${
                            remaining >= 0 ? 'text-[#00FFCC]' : 'text-[#FF2D78]'
                          }`}
                        >
                          {remaining >= 0
                            ? `Quedan ${formatCLP(remaining)}`
                            : `Excedido por ${formatCLP(Math.abs(remaining))}`}
                        </span>
                      </div>

                      {/* Barra de Progreso con Cambio Dinámico de Color Stitch */}
                      <div className="w-full bg-[#0A0A12] h-2.5 rounded-full overflow-hidden border border-[#302840] mb-3">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${progressColorClass}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      {/* Footer Actions: Ver Radiografía en Vivo Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#302840]/60">
                        <span className="text-[11px] text-[#A098B0] font-sans">
                          {spending.matchingTransactions.length} movimiento(s) imputado(s)
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRadiography(b.id);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-headline font-bold px-3 py-1.5 rounded-xl border transition ${
                            isExpanded
                              ? 'bg-[#00FFCC]/15 text-[#00FFCC] border-[#00FFCC]/40'
                              : 'bg-[#1A1A2E] text-white border-[#302840] hover:border-[#00FFCC]/40 hover:text-[#00FFCC]'
                          }`}
                        >
                          <Microscope className="w-3.5 h-3.5 text-[#00FFCC]" />
                          <span>{isExpanded ? 'Ocultar Radiografía' : 'Ver Radiografía en Vivo'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 transition-transform" />
                          )}
                        </button>
                      </div>

                      {/* Panel Desplegable "Radiografía en Vivo (RF-21)" Inline */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-[#302840] space-y-3 animate-fadeIn">
                          <div className="flex items-center justify-between bg-[#0E0E18] p-3 rounded-xl border border-[#302840]">
                            <div className="flex items-center gap-2">
                              <Microscope className="w-4 h-4 text-[#00FFCC]" />
                              <span className="text-xs font-headline font-bold text-white">
                                Radiografía en Vivo
                              </span>
                            </div>
                            {remaining > 0 && daysInfo.daysLeft > 0 && !daysInfo.isPast && (
                              <span className="text-xs font-mono font-bold text-[#00FFCC] bg-[#00FFCC]/10 border border-[#00FFCC]/20 px-2 py-0.5 rounded-lg">
                                Sugerido: {formatCLP(Math.round(remaining / daysInfo.daysLeft))} / día
                              </span>
                            )}
                          </div>

                          {spending.matchingTransactions.length === 0 ? (
                            <div className="text-center py-6 text-xs text-[#A098B0] italic bg-[#0A0A12] rounded-xl border border-[#302840]/60">
                              No hay compras o gastos registrados para este presupuesto en el período seleccionado.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                              {spending.matchingTransactions.map((tx) => {
                                const acc = accountMap.get(tx.accountId);
                                const branding = getBankBranding(acc?.bank, acc?.name);
                                const txAmount =
                                  tx.netAmount !== undefined ? tx.netAmount : tx.amount;

                                return (
                                  <div
                                    key={tx.id}
                                    className="bg-[#0A0A12] border border-[#302840] hover:border-[#38bdf8]/40 p-2.5 rounded-xl flex items-center justify-between text-xs transition gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[10px] font-mono font-bold text-[#A098B0]">
                                          {tx.date}
                                        </span>
                                        {acc && (
                                          <span
                                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${branding.badgeBg} ${branding.badgeBorder} ${branding.badgeText}`}
                                          >
                                            {branding.name}
                                          </span>
                                        )}
                                        {tx.installments && tx.installments.total > 1 && (
                                          <span className="text-[9px] font-mono font-bold bg-[#FFE04A]/15 text-[#FFE04A] border border-[#FFE04A]/30 px-1.5 py-0.5 rounded">
                                            Cuota {tx.installments.current}/{tx.installments.total}
                                          </span>
                                        )}
                                      </div>
                                      <p className="font-semibold text-white truncate mt-0.5">
                                        {tx.description}
                                      </p>
                                      <span className="text-[10px] text-[#A098B0]">
                                        {tx.category} • {tx.subcategory}
                                      </span>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="font-mono font-bold text-white text-xs block">
                                        {formatCLP(txAmount)}
                                      </span>
                                      {tx.netAmount !== undefined && tx.netAmount < tx.amount && (
                                        <span className="text-[9px] text-[#00FFCC] block">
                                          (Abonado)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* COLUMNA 2: Metas de Ahorro & Fondos Programados (Pantalla6.html / Mobile7) */}
        {/* ========================================================================= */}
        {(activeTabFilter === 'all' || activeTabFilter === 'goals') && (
          <div className={`${activeTabFilter === 'goals' ? 'lg:col-span-12' : 'lg:col-span-5'} space-y-4`}>
            
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#FFE04A]" />
                <h3 className="font-headline font-bold text-white text-base">
                  Metas de Ahorro & Fondos
                </h3>
                <span className="text-xs font-mono font-bold bg-[#141422] border border-[#302840] text-[#00FFCC] px-2 py-0.5 rounded-full">
                  {filteredGoals.length}
                </span>
              </div>
              <button
                onClick={handleOpenCreateGoalModal}
                className="text-xs font-mono font-bold text-[#FF2D78] hover:text-[#ff478b] flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Meta</span>
              </button>
            </div>

            {filteredGoals.length === 0 ? (
              <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-10 text-center space-y-3">
                <PiggyBank className="w-10 h-10 mx-auto text-[#FFE04A]/40" />
                <p className="text-sm font-headline font-bold text-white">
                  No hay metas de ahorro configuradas
                </p>
                <p className="text-xs text-[#A098B0] max-w-sm mx-auto">
                  Fija objetivos como Fondo de Emergencia, Vacaciones o Renovación de Auto para realizar aportes con 1 toque.
                </p>
                <button
                  onClick={handleOpenCreateGoalModal}
                  className="inline-flex items-center gap-2 bg-[#FF2D78] text-white font-headline font-bold text-xs py-2 px-4 rounded-xl shadow transition mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Primera Meta</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGoals.map((goal) => {
                  const pct = Math.min(
                    100,
                    goal.targetAmount > 0
                      ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                      : 0
                  );
                  const isCompleted = goal.currentAmount >= goal.targetAmount;
                  const missing = Math.max(0, goal.targetAmount - goal.currentAmount);
                  const isContributeOpen = contributeGoalId === goal.id;
                  const successForThis = contributeSuccessMsg?.id === goal.id;

                  return (
                    <div
                      key={goal.id}
                      className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 transition-all shadow-xl hover:border-[#FFE04A]/40 group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-[#1A1A2E] border border-[#302840] flex items-center justify-center text-xl shrink-0 shadow">
                            {goal.categoryIcon || '🛡️'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm sm:text-base font-headline font-black text-white truncate">
                              {goal.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[#A098B0] mt-0.5">
                              {goal.targetDate ? (
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3 text-[#A098B0]" />
                                  <span>{goal.targetDate}</span>
                                </span>
                              ) : (
                                <span>Sin fecha límite</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-[#00FFCC]/15 text-[#00FFCC] border-[#00FFCC]/30'
                            }`}
                          >
                            {isCompleted ? '¡Completada! 🎉' : `${pct}%`}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleStartEditGoal(goal)}
                            className="p-1.5 rounded-lg text-[#A098B0] hover:text-[#00FFCC] hover:bg-[#1A1A2E] transition"
                            title="Editar meta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

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
                              className="p-1.5 rounded-lg text-[#A098B0] hover:text-[#FF2D78] hover:bg-[#1A1A2E] transition"
                              title="Eliminar meta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Montos y Faltante */}
                      <div className="flex items-baseline justify-between mt-3 mb-1.5">
                        <span className="text-xs text-[#A098B0]">
                          Acumulado:{' '}
                          <strong className="text-white font-mono font-bold">
                            {formatCLP(goal.currentAmount)}
                          </strong>{' '}
                          de {formatCLP(goal.targetAmount)}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isCompleted ? 'text-emerald-400' : 'text-[#A098B0]'
                          }`}
                        >
                          {isCompleted ? 'Objetivo Cumplido' : `Faltan ${formatCLP(missing)}`}
                        </span>
                      </div>

                      {/* Barra de Progreso Porcentual Stitch */}
                      <div className="w-full bg-[#0A0A12] h-2.5 rounded-full overflow-hidden border border-[#302840] mb-3">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Quick 1-Touch Contribute Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#302840]/60">
                        {successForThis ? (
                          <span className="text-xs font-mono font-bold text-[#00FFCC] flex items-center gap-1.5 animate-fadeIn">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ¡Aporte de {formatCLP(contributeSuccessMsg?.amount || 0)} registrado!
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#A098B0]">
                            Aporte rápido con 1 toque:
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setContributeGoalId(isContributeOpen ? null : goal.id)}
                          className="flex items-center gap-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-headline font-bold px-3 py-1 rounded-xl transition"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                          <span>Aportar Fondos</span>
                        </button>
                      </div>

                      {/* 1-Touch Popover / Inline Box */}
                      {isContributeOpen && (
                        <div className="mt-3 p-3 bg-[#0A0A12] border border-emerald-500/30 rounded-xl space-y-2.5 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-headline font-bold text-emerald-400 flex items-center gap-1.5">
                              <Coins className="w-3.5 h-3.5" />
                              Aportar a {goal.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => setContributeGoalId(null)}
                              className="text-[#A098B0] hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 1-Touch Chips */}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickContribute(goal.id, 10000)}
                              className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-emerald-500/20 text-white hover:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-[#302840] transition"
                            >
                              +$10.000
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickContribute(goal.id, 20000)}
                              className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-emerald-500/20 text-white hover:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-[#302840] transition"
                            >
                              +$20.000
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickContribute(goal.id, 50000)}
                              className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-emerald-500/20 text-white hover:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-[#302840] transition"
                            >
                              +$50.000
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickContribute(goal.id, 100000)}
                              className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-emerald-500/20 text-white hover:text-emerald-300 font-mono text-xs font-bold rounded-lg border border-[#302840] transition"
                            >
                              +$100.000
                            </button>
                          </div>

                          {/* Custom Amount Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="number"
                              placeholder="Otro monto ($ CLP)..."
                              value={contributeAmount}
                              onChange={(e) => setContributeAmount(e.target.value)}
                              className="flex-1 bg-[#141422] border border-[#302840] text-xs text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const cleaned = contributeAmount.replace(/\D/g, '');
                                const num = parseInt(cleaned, 10);
                                if (num > 0) handleQuickContribute(goal.id, num);
                              }}
                              className="bg-emerald-500 hover:bg-emerald-400 text-black font-headline font-bold text-xs px-3 py-1.5 rounded-lg transition"
                            >
                              Sumar
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Crear / Editar Presupuesto Agrupable Multi-Categoría               */}
      {/* ========================================================================= */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-[#302840] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-white text-base">
                    {editingBudgetId ? 'Editar Presupuesto' : 'Nuevo Presupuesto Agrupable'}
                  </h3>
                  <p className="text-xs text-[#A098B0]">
                    Asigna un tope mensual combinando categorías y subcategorías.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="text-[#A098B0] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveBudgetSubmit} className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                  Nombre del Presupuesto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Alimentación del Hogar, Ocio & Salidas..."
                  value={formBudgetName}
                  onChange={(e) => setFormBudgetName(e.target.value)}
                  className="w-full bg-[#0A0A12] border border-[#302840] text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FFCC] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                  Tope Mensual Asignado (CLP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-[#00FFCC] font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    placeholder="350000"
                    value={formLimit}
                    onChange={(e) => setFormLimit(e.target.value)}
                    className="w-full bg-[#0A0A12] border border-[#302840] text-sm text-white pl-8 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono font-bold"
                  />
                </div>
              </div>

              {/* Selector de Categorías y Subcategorías */}
              <div className="space-y-2 pt-2 border-t border-[#302840]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0]">
                    Etiquetas Asociadas
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddMode(addMode === 'category' ? 'none' : 'category')}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition ${
                        addMode === 'category'
                          ? 'bg-[#00FFCC]/20 text-[#00FFCC] border-[#00FFCC]/40'
                          : 'bg-[#1A1A2E] text-[#A098B0] border-[#302840] hover:text-white'
                      }`}
                    >
                      <Folder className="w-3 h-3 text-[#00FFCC]" />
                      <span>+ Categoría</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode(addMode === 'subcategory' ? 'none' : 'subcategory')}
                      className={`text-xs font-bold px-2 py-1 rounded-lg border flex items-center gap-1 transition ${
                        addMode === 'subcategory'
                          ? 'bg-[#FF2D78]/20 text-[#FF2D78] border-[#FF2D78]/40'
                          : 'bg-[#1A1A2E] text-[#A098B0] border-[#302840] hover:text-white'
                      }`}
                    >
                      <Tag className="w-3 h-3 text-[#FF2D78]" />
                      <span>+ Subcategoría</span>
                    </button>
                  </div>
                </div>

                {/* Sub-selector inline mode */}
                {addMode === 'category' && (
                  <div className="p-3 bg-[#0A0A12] border border-[#00FFCC]/30 rounded-xl space-y-2 animate-fadeIn">
                    <span className="text-xs font-bold text-[#00FFCC] flex items-center gap-1">
                      <Folder className="w-3.5 h-3.5" />
                      Seleccionar Categoría General:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={tempCategoryToAdd}
                        onChange={(e) => setTempCategoryToAdd(e.target.value)}
                        className="flex-1 bg-[#141422] border border-[#302840] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#00FFCC]"
                      >
                        {categoryMappings.map((c) => (
                          <option
                            key={c.id}
                            value={c.name}
                            disabled={selectedCategories.includes(c.name)}
                          >
                            📁 {c.name} {selectedCategories.includes(c.name) ? '(Agregada)' : ''}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddCategoryConfirm}
                        className="bg-[#00FFCC] text-black font-headline font-bold text-xs px-3 py-1.5 rounded-lg"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                )}

                {addMode === 'subcategory' && (
                  <div className="p-3 bg-[#0A0A12] border border-[#FF2D78]/30 rounded-xl space-y-2 animate-fadeIn">
                    <span className="text-xs font-bold text-[#FF2D78] flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Seleccionar Subcategoría Específica:
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={tempSubcategoryToAdd}
                        onChange={(e) => setTempSubcategoryToAdd(e.target.value)}
                        className="flex-1 bg-[#141422] border border-[#302840] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF2D78]"
                      >
                        {categoryMappings.map((c) => (
                          <optgroup key={c.id} label={`📁 ${c.name}`}>
                            {c.subcategories.map((sub) => (
                              <option
                                key={sub}
                                value={sub}
                                disabled={selectedSubcategories.includes(sub)}
                              >
                                {sub} {selectedSubcategories.includes(sub) ? '(Agregada)' : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubcategoryConfirm}
                        className="bg-[#FF2D78] text-white font-headline font-bold text-xs px-3 py-1.5 rounded-lg"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Chips */}
                <div className="min-h-[50px] p-2.5 bg-[#0A0A12] border border-[#302840] rounded-xl flex flex-wrap items-center gap-1.5">
                  {selectedCategories.length === 0 && selectedSubcategories.length === 0 ? (
                    <span className="text-xs text-[#A098B0] italic">
                      Agrega al menos una categoría (📁) o subcategoría (🏷️) usando los botones superiores.
                    </span>
                  ) : (
                    <>
                      {selectedCategories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 font-sans"
                        >
                          <Folder className="w-3 h-3 text-[#00FFCC]" />
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="text-[#00FFCC] hover:text-white transition ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}

                      {selectedSubcategories.map((sub) => (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30 font-sans"
                        >
                          <Tag className="w-3 h-3 text-[#FF2D78]" />
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubcategory(sub)}
                            className="text-[#FF2D78] hover:text-white transition ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#302840]">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-headline font-bold text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-headline font-bold bg-[#00FFCC] hover:bg-[#00e6b8] text-black shadow-lg shadow-[#00FFCC]/20 transition"
                >
                  {editingBudgetId ? 'Actualizar Presupuesto' : 'Crear Presupuesto'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Crear / Editar Meta de Ahorro                                    */}
      {/* ========================================================================= */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-[#302840] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#FFE04A]/15 text-[#FFE04A] border border-[#FFE04A]/30 rounded-xl">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-white text-base">
                    {editingGoalId ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
                  </h3>
                  <p className="text-xs text-[#A098B0]">
                    Fija un fondo financiero objetivo y realiza aportes programados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="text-[#A098B0] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveGoalSubmit} className="p-5 space-y-4">
              
              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                  Ícono de la Meta
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setGoalIcon(icon)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition border ${
                        goalIcon === icon
                          ? 'bg-[#00FFCC]/20 border-[#00FFCC] scale-110 shadow'
                          : 'bg-[#0A0A12] border-[#302840] hover:bg-[#1A1A2E]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                  Nombre de la Meta
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Fondo de Emergencia, Vacaciones Río, Renovación Auto..."
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-[#0A0A12] border border-[#302840] text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFE04A] font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                    Monto Objetivo ($ CLP)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="1500000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full bg-[#0A0A12] border border-[#302840] text-sm text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#FFE04A] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                    Monto Actual Ahorrado ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={goalInitial}
                    onChange={(e) => setGoalInitial(e.target.value)}
                    className="w-full bg-[#0A0A12] border border-[#302840] text-sm text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#FFE04A] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#A098B0] mb-1.5">
                  Fecha Límite Deseada (Opcional)
                </label>
                <input
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="w-full bg-[#0A0A12] border border-[#302840] text-sm text-white px-3.5 py-2 rounded-xl focus:outline-none focus:border-[#FFE04A] font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#302840]">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-headline font-bold text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-headline font-bold bg-[#FF2D78] hover:bg-[#ff478b] text-white shadow-lg shadow-[#FF2D78]/20 transition"
                >
                  {editingGoalId ? 'Actualizar Meta' : 'Crear Meta'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
