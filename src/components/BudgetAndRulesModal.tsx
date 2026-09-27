import React, { useState } from 'react';
import { X, Sparkles, Target, Plus, Trash2, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { CategoryMapping, AutoCategoryRule, CategoryBudget } from '../types';
import { getParentCategory } from '../utils/categorizer';

interface BudgetAndRulesModalProps {
  categoryMappings: CategoryMapping[];
  autoRules: AutoCategoryRule[];
  budgets: CategoryBudget[];
  onClose: () => void;
  onAddRule: (newRule: AutoCategoryRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onApplyRulesToExisting: () => void;
  onSaveBudget: (categoryName: string, monthlyLimit: number) => void;
  onDeleteBudget: (budgetId: string) => void;
}

export const BudgetAndRulesModal: React.FC<BudgetAndRulesModalProps> = ({
  categoryMappings,
  autoRules,
  budgets,
  onClose,
  onAddRule,
  onDeleteRule,
  onApplyRulesToExisting,
  onSaveBudget,
  onDeleteBudget
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'budgets'>('rules');

  // New Rule Form State
  const [newPattern, setNewPattern] = useState('');
  const [newSubcategory, setNewSubcategory] = useState(
    categoryMappings[1]?.subcategories[0] || 'Alimentación & Supermercados'
  );
  const [appliedFeedback, setAppliedFeedback] = useState(false);

  // New Budget Form State
  const [selectedCategoryForBudget, setSelectedCategoryForBudget] = useState(
    categoryMappings[1]?.name || 'Alimentación & Gastronomía'
  );
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // All available subcategories list with parent info
  const allSubcategoriesWithParent = React.useMemo(() => {
    const list: { subcategory: string; parentCategory: string }[] = [];
    categoryMappings.forEach((c) => {
      c.subcategories.forEach((sub) => {
        list.push({ subcategory: sub, parentCategory: c.name });
      });
    });
    return list;
  }, [categoryMappings]);

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;

    const parentCategory = getParentCategory(newSubcategory, categoryMappings);
    const rule: AutoCategoryRule = {
      id: `rule-${Date.now()}`,
      pattern: newPattern.trim().toUpperCase(),
      category: parentCategory,
      subcategory: newSubcategory
    };

    onAddRule(rule);
    setNewPattern('');
  };

  const handleApplyRules = () => {
    onApplyRulesToExisting();
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 3000);
  };

  const handleCreateOrUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(newBudgetLimit.replace(/\./g, '').replace(/,/g, ''));
    if (isNaN(limitNum) || limitNum <= 0) return;

    onSaveBudget(selectedCategoryForBudget, limitNum);
    setNewBudgetLimit('');
  };

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">Inteligencia de Reglas & Presupuestos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition ${
              activeTab === 'rules'
                ? 'bg-white text-sky-600 border-slate-200 shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Reglas de Auto-Categorización ({autoRules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition ${
              activeTab === 'budgets'
                ? 'bg-white text-sky-600 border-slate-200 shadow-sm'
                : 'text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Presupuestos Mensuales ({budgets.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: AUTO-CATEGORIZATION RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              
              {/* Info Banner & Re-run Action */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-sky-600 flex-shrink-0" />
                  <div className="text-xs text-sky-900">
                    <p className="font-bold">Auto-Categorización por Coincidencia de Texto</p>
                    <p className="text-sky-700 font-medium">
                      Cuando cargues una cartola, las descripciones que contengan estas palabras clave se categorizarán automáticamente.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyRules}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  {appliedFeedback ? <Check className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                  <span>{appliedFeedback ? '¡Reglas Aplicadas!' : 'Ejecutar en Transacciones Actuales'}</span>
                </button>
              </div>

              {/* Form to Add New Rule */}
              <form onSubmit={handleCreateRule} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Agregar Nueva Regla de Coincidencia
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Palabra Clave (Texto en Cartola)</label>
                    <input
                      type="text"
                      placeholder="Ej. UBER, JUMBO, COPEC"
                      value={newPattern}
                      onChange={(e) => setNewPattern(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 uppercase font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Asignar a Subcategoría</label>
                    <select
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer font-medium"
                    >
                      {allSubcategoriesWithParent.map((item) => (
                        <option key={item.subcategory} value={item.subcategory}>
                          {item.parentCategory} &gt; {item.subcategory}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!newPattern.trim()}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Guardar Regla</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Active Rules List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reglas Activas ({autoRules.length})
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {autoRules.map((rule) => (
                    <div key={rule.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 bg-slate-100 font-mono text-xs font-bold text-slate-800 rounded-md border border-slate-200">
                          {rule.pattern}
                        </span>
                        <span className="text-xs text-slate-400">➔</span>
                        <div className="text-xs">
                          <span className="font-semibold text-slate-700">{rule.category}</span>
                          <span className="text-slate-400 mx-1 border-b border-slate-300">/</span>
                          <span className="text-sky-600 font-bold">{rule.subcategory}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Eliminar Regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CATEGORY BUDGETS */}
          {activeTab === 'budgets' && (
            <div className="space-y-6">

              {/* Info Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-xs text-emerald-900">
                <Target className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Límites de Presupuesto Mensual</p>
                  <p className="text-emerald-700 font-medium">
                    Define topes de gasto deseados por Categoría General. Los gráficos del Dashboard te alertarán con barras de progreso según el porcentaje consumido en el mes.
                  </p>
                </div>
              </div>

              {/* Form to Add / Update Budget */}
              <form onSubmit={handleCreateOrUpdateBudget} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Definir o Actualizar Presupuesto por Categoría
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría General</label>
                    <select
                      value={selectedCategoryForBudget}
                      onChange={(e) => setSelectedCategoryForBudget(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer font-semibold text-slate-800"
                    >
                      {categoryMappings
                        .filter((c) => c.name !== 'Abonos y Pagos' && c.name !== 'Ingresos & Transferencias')
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Límite Mensual ($ CLP)</label>
                    <input
                      type="number"
                      placeholder="Ej. 250000"
                      value={newBudgetLimit}
                      onChange={(e) => setNewBudgetLimit(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-semibold"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!newBudgetLimit}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow transition disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Guardar Presupuesto</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Active Budgets List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Presupuestos Configurados ({budgets.length})
                </h3>
                {budgets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border text-center">
                    No has configurado límites de presupuesto aún.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {budgets.map((b) => (
                      <div key={b.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{b.categoryName}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Límite Máximo Mensual: <span className="font-bold text-emerald-700">{formatCLP(b.monthlyLimit)}</span>
                          </p>
                        </div>

                        <button
                          onClick={() => onDeleteBudget(b.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Eliminar Presupuesto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
