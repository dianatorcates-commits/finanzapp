import React, { useState } from 'react';
import {
  Tag,
  Folder,
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  ChevronRight,
  Layers,
  Sparkles,
  AlertCircle,
  CreditCard,
  RefreshCw,
  Filter,
  ArrowRight
} from 'lucide-react';
import { CategoryMapping, AutoCategoryRule, TransactionType } from '../types';
import { getParentCategory } from '../utils/categorizer';

interface CategoryManagementViewProps {
  categoryMappings: CategoryMapping[];
  autoRules?: AutoCategoryRule[];
  onAddCategory: (categoryName: string) => void | Promise<void>;
  onAddSubcategory: (parentCategoryName: string, subcategoryName: string) => void | Promise<void>;
  onDeleteCategory: (categoryId: string) => void | Promise<void>;
  onDeleteSubcategory: (parentCategoryName: string, subcategoryName: string) => void | Promise<void>;
  onEditCategory?: (categoryId: string, oldName: string, newName: string) => void | Promise<void>;
  onEditSubcategory?: (parentCategoryName: string, oldSubName: string, newSubName: string) => void | Promise<void>;
  onAddRule?: (newRule: AutoCategoryRule) => void | Promise<void>;
  onDeleteRule?: (ruleId: string) => void | Promise<void>;
  onApplyRulesToExisting?: () => void | Promise<void>;
}

export const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({
  categoryMappings,
  autoRules = [],
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory,
  onEditCategory,
  onEditSubcategory,
  onAddRule,
  onDeleteRule,
  onApplyRulesToExisting
}) => {
  // Master Category selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categoryMappings[0]?.id || ''
  );

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Add new general category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  // Inline edit category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // Add new subcategory state
  const [newSubcatName, setNewSubcatName] = useState('');
  const [subcatError, setSubcatError] = useState<string | null>(null);

  // Inline edit subcategory state
  const [editingSubcatName, setEditingSubcatName] = useState<string | null>(null);
  const [editingSubcatVal, setEditingSubcatVal] = useState('');

  // Confirmation state for deleting
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null);
  const [confirmDeleteSubcat, setConfirmDeleteSubcat] = useState<string | null>(null);

  // Section Navigation (Categorías vs Reglas)
  const [activeSection, setActiveSection] = useState<'categories' | 'rules'>('categories');

  // Rules form & filter state
  const [rulePattern, setRulePattern] = useState('');
  const [ruleTransactionType, setRuleTransactionType] = useState<TransactionType | 'auto'>('auto');
  const [ruleSubcategory, setRuleSubcategory] = useState<string>(
    categoryMappings[0]?.subcategories[0] || 'Alimentación y Supermercados'
  );
  const [rulesFilter, setRulesFilter] = useState<'ALL' | 'pago_tc' | 'compra' | 'ingreso'>('ALL');
  const [ruleSearch, setRuleSearch] = useState('');
  const [appliedFeedback, setAppliedFeedback] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const pattern = rulePattern.trim().toUpperCase();
    if (!pattern) {
      setRuleError('Ingresa una palabra clave o patrón.');
      return;
    }
    if (!onAddRule) return;

    const parentCat = getParentCategory(ruleSubcategory, categoryMappings);
    const newRule: AutoCategoryRule = {
      id: `rule-${Date.now()}`,
      pattern,
      category: parentCat,
      subcategory: ruleSubcategory,
      transactionType: ruleTransactionType !== 'auto' ? ruleTransactionType : undefined
    };

    await onAddRule(newRule);
    setRulePattern('');
    setRuleError(null);
  };

  const handleApplyRules = async () => {
    if (!onApplyRulesToExisting) return;
    await onApplyRulesToExisting();
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 3000);
  };

  const filteredRules = (autoRules || []).filter((r) => {
    if (rulesFilter === 'pago_tc' && r.transactionType !== 'pago_tc') return false;
    if (rulesFilter === 'compra' && r.transactionType !== 'compra') return false;
    if (
      rulesFilter === 'ingreso' &&
      r.transactionType !== 'ingreso_venta' &&
      r.transactionType !== 'transferencia_recibida'
    ) {
      return false;
    }
    if (ruleSearch.trim()) {
      const q = ruleSearch.toLowerCase();
      const matchPat = r.pattern.toLowerCase().includes(q);
      const matchSub = r.subcategory.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      return matchPat || matchSub || matchCat;
    }
    return true;
  });

  const getRuleTypeBadge = (type?: TransactionType) => {
    switch (type) {
      case 'pago_tc':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CreditCard className="w-3 h-3" />
            <span>Pago TC / Abono</span>
          </span>
        );
      case 'compra':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span>🛍️ Compra / Gasto</span>
          </span>
        );
      case 'ingreso_venta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <span>💰 Ingreso / Sueldo</span>
          </span>
        );
      case 'transferencia_enviada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span>↗️ Transf. Enviada</span>
          </span>
        );
      case 'transferencia_recibida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <span>↙️ Transf. Recibida</span>
          </span>
        );
      case 'comision_interes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <span>🏦 Comisión / Interés</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <span>⚙️ Auto según categoría</span>
          </span>
        );
    }
  };

  // Ensure selected category exists, or fallback
  const activeCategory =
    categoryMappings.find((c) => c.id === selectedCategoryId) ||
    categoryMappings[0] ||
    null;

  // Filter categories by search term
  const filteredCategories = categoryMappings.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSubcategories = categoryMappings.reduce(
    (sum, c) => sum + (c.subcategories?.length || 0),
    0
  );

  // Handlers for General Categories
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (
      categoryMappings.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setCatError('Ya existe una categoría con este nombre.');
      return;
    }

    setCatError(null);
    await onAddCategory(trimmed);
    setNewCatName('');
    setIsAddingCategory(false);

    // Find and select the newly added category once rendered or select by name
    const addedCat = categoryMappings.find(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (addedCat) {
      setSelectedCategoryId(addedCat.id);
    }
  };

  const handleStartEditCategory = (cat: CategoryMapping, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleSaveEditCategory = async (cat: CategoryMapping, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      setEditingCatId(null);
      return;
    }

    if (
      trimmed.toLowerCase() !== cat.name.toLowerCase() &&
      categoryMappings.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      alert('Ya existe una categoría con este nombre.');
      return;
    }

    if (onEditCategory && trimmed !== cat.name) {
      await onEditCategory(cat.id, cat.name, trimmed);
    }
    setEditingCatId(null);
  };

  const handleDeleteCategoryConfirm = async (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (categoryMappings.length <= 1) {
      alert('Debes mantener al menos una categoría en el sistema.');
      setConfirmDeleteCatId(null);
      return;
    }

    await onDeleteCategory(catId);
    setConfirmDeleteCatId(null);

    // If active was deleted, choose another
    if (selectedCategoryId === catId) {
      const remaining = categoryMappings.filter((c) => c.id !== catId);
      if (remaining.length > 0) {
        setSelectedCategoryId(remaining[0].id);
      }
    }
  };

  // Handlers for Subcategories
  const handleCreateSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCategory) return;

    const trimmed = newSubcatName.trim();
    if (!trimmed) return;

    if (
      activeCategory.subcategories.some(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setSubcatError('Esta subcategoría ya existe en esta categoría.');
      return;
    }

    setSubcatError(null);
    await onAddSubcategory(activeCategory.name, trimmed);
    setNewSubcatName('');
  };

  const handleStartEditSubcategory = (sub: string) => {
    setEditingSubcatName(sub);
    setEditingSubcatVal(sub);
  };

  const handleSaveEditSubcategory = async (oldSub: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeCategory) return;

    const trimmed = editingSubcatVal.trim();
    if (!trimmed) {
      setEditingSubcatName(null);
      return;
    }

    if (
      trimmed.toLowerCase() !== oldSub.toLowerCase() &&
      activeCategory.subcategories.some(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      alert('Ya existe una subcategoría con este nombre.');
      return;
    }

    if (onEditSubcategory && trimmed !== oldSub) {
      await onEditSubcategory(activeCategory.name, oldSub, trimmed);
    }
    setEditingSubcatName(null);
  };

  const handleDeleteSubcategoryConfirm = async (sub: string) => {
    if (!activeCategory) return;
    await onDeleteSubcategory(activeCategory.name, sub);
    setConfirmDeleteSubcat(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header Superior */}
      <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 rounded-2xl border border-sky-400/30 shadow-inner flex-shrink-0">
            {activeSection === 'categories' ? <Tag className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-sky-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {activeSection === 'categories' ? 'Categorías y Subcategorías' : 'Reglas Automáticas y Pagos TC'}
              </h2>
              <span className="bg-sky-500/20 text-sky-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
                {activeSection === 'categories' ? 'Taxonomía' : 'Automatización'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {activeSection === 'categories'
                ? 'Administra la taxonomía de tus finanzas. Estas categorías alimentan tus presupuestos y las reglas automáticas de clasificación.'
                : 'Define palabras clave y patrones para clasificar automáticamente gastos y detectar pagos de tarjetas de crédito (pago_tc).'}
            </p>
          </div>
        </div>

        {/* Quick Taxonomy / Rules Badges */}
        <div className="flex items-center gap-3 self-start md:self-center">
          {activeSection === 'categories' ? (
            <>
              <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Categorías</span>
                <span className="text-base font-black text-white">{categoryMappings.length}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Subcategorías</span>
                <span className="text-base font-black text-sky-400">{totalSubcategories}</span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Reglas Activas</span>
                <span className="text-base font-black text-white">{autoRules.length}</span>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Pagos TC</span>
                <span className="text-base font-black text-emerald-400">
                  {autoRules.filter((r) => r.transactionType === 'pago_tc').length}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selector de Pestañas: Categorías vs Reglas Automáticas */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSection('categories')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeSection === 'categories'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>🏷️ Categorías y Subcategorías</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition ${
            activeSection === 'rules'
              ? 'bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
              : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-300" />
          <span>⚡ Reglas Automáticas y Pagos ({autoRules.length})</span>
        </button>
      </div>

      {/* Estructura Master-Detail en 2 Columnas (Categorías) */}
      {activeSection === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================= */}
        {/* COLUMNA A (Izquierda): Categorías Generales (5 columnas) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-auto min-h-[500px] lg:h-[720px]">
          
          {/* Header de Columna & Botón Agregar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm text-white">Categorías Generales</h3>
              <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                {categoryMappings.length}
              </span>
            </div>

            <button
              onClick={() => {
                setIsAddingCategory(!isAddingCategory);
                setCatError(null);
              }}
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-lg shadow-sky-500/20 transition transform hover:scale-[1.02]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Categoría</span>
            </button>
          </div>

          {/* Formulario Expandible de Nueva Categoría */}
          {isAddingCategory && (
            <form onSubmit={handleCreateCategory} className="mt-3 p-3 bg-slate-950/80 border border-sky-500/30 rounded-xl space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Ej: Inversiones, Mascotas..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 text-xs py-1.5 px-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-400 text-white p-1.5 rounded-lg text-xs font-bold transition"
                  title="Guardar Categoría"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCatName('');
                    setCatError(null);
                  }}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg text-xs transition"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {catError && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{catError}</span>
                </p>
              )}
            </form>
          )}

          {/* Barra de Búsqueda Rápida */}
          <div className="mt-3 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950/70 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:border-sky-500/50 placeholder-slate-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lista de Categorías con Scroll */}
          <div className="mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p>No se encontraron categorías con "{searchTerm}"</p>
              </div>
            ) : (
              filteredCategories.map((cat) => {
                const isSelected = activeCategory?.id === cat.id;
                const isEditing = editingCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedCategoryId(cat.id);
                        setConfirmDeleteCatId(null);
                      }
                    }}
                    className={`group w-full text-left p-3 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500/50 text-white font-bold shadow-md shadow-sky-500/10'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {/* Left: Icon & Name or Inline Edit */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div
                        className={`p-1.5 rounded-lg flex-shrink-0 ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-400'
                            : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        <Folder className="w-4 h-4" />
                      </div>

                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEditCategory(cat);
                              if (e.key === 'Escape') setEditingCatId(null);
                            }}
                            className="w-full text-xs py-1 px-2 bg-slate-900 border border-sky-500 rounded text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditCategory(cat)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCatId(null)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-semibold truncate block">
                            {cat.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Counter badge & Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isEditing && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {cat.subcategories?.length || 0} sub
                        </span>
                      )}

                      {/* Edit button */}
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={(e) => handleStartEditCategory(cat, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-sky-300 p-1 rounded hover:bg-slate-800 transition"
                          title="Editar nombre de categoría"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Delete button or confirmation */}
                      {!isEditing && (
                        confirmDeleteCatId === cat.id ? (
                          <div
                            className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 p-1 rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-rose-300 font-bold px-1">¿Eliminar?</span>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCategoryConfirm(cat.id, e)}
                              className="text-rose-400 hover:text-white p-0.5 hover:bg-rose-600 rounded text-xs font-bold"
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteCatId(null);
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded text-xs"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteCatId(cat.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )
                      )}

                      {/* Active Arrow indicator */}
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-sky-400 animate-pulse ml-0.5" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA B (Derecha): Subcategorías de la Categoría Activa */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-auto min-h-[500px] lg:h-[720px]">
          
          {activeCategory ? (
            <>
              {/* Header de la Subcategoría Activa */}
              <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      Subcategorías de:
                    </span>
                    <span className="text-sm sm:text-base font-black text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
                      📁 {activeCategory.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Crea y edita las clasificaciones específicas que aplican a las transacciones de {activeCategory.name}.
                  </p>
                </div>

                <span className="self-start sm:self-center bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-xl">
                  {activeCategory.subcategories?.length || 0} registradas
                </span>
              </div>

              {/* Formulario Superior: Agregar Subcategoría */}
              <form onSubmit={handleCreateSubcategory} className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder={`Nombre de nueva subcategoría en ${activeCategory.name}...`}
                      value={newSubcatName}
                      onChange={(e) => setNewSubcatName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-emerald-500 placeholder-slate-500 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition transform hover:scale-[1.02] flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
                {subcatError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 pl-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>{subcatError}</span>
                  </p>
                )}
              </form>

              {/* Lista de Subcategorías con Scroll */}
              <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {activeCategory.subcategories?.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                      <Tag className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-400">
                        No hay subcategorías asociadas
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Agrega la primera subcategoría para {activeCategory.name} usando el formulario superior.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeCategory.subcategories.map((sub) => {
                    const isEditing = editingSubcatName === sub;

                    return (
                      <div
                        key={sub}
                        className="group bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 flex items-center justify-between transition"
                      >
                        {/* Subcategory Name or Inline Edit */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                          
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingSubcatVal}
                                onChange={(e) => setEditingSubcatVal(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditSubcategory(sub);
                                  if (e.key === 'Escape') setEditingSubcatName(null);
                                }}
                                className="w-full text-xs py-1 px-2.5 bg-slate-900 border border-emerald-500 rounded-lg text-white focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditSubcategory(sub)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubcatName(null)}
                                className="p-1 text-slate-400 hover:text-slate-200"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                              {sub}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {!isEditing && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {/* Edit inline */}
                            <button
                              type="button"
                              onClick={() => handleStartEditSubcategory(sub)}
                              className="text-slate-400 hover:text-sky-300 p-1.5 rounded-lg hover:bg-slate-900 transition"
                              title="Editar nombre"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete or Confirm */}
                            {confirmDeleteSubcat === sub ? (
                              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 p-1 rounded-lg">
                                <span className="text-[10px] text-rose-300 font-bold px-1">¿Eliminar?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategoryConfirm(sub)}
                                  className="text-rose-400 hover:text-white p-0.5 hover:bg-rose-600 rounded text-xs font-bold"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteSubcat(null)}
                                  className="text-slate-400 hover:text-white p-0.5 rounded text-xs"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteSubcat(sub)}
                                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900 transition"
                                title="Eliminar subcategoría"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Empty State si no hay categoría seleccionada */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400/50 shadow-inner">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-bold text-slate-300 text-sm sm:text-base">
                  Ninguna categoría seleccionada
                </h4>
                <p className="text-xs text-slate-500">
                  Selecciona una categoría de la izquierda para ver y gestionar sus subcategorías.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    )}

    {/* ========================================================= */}
    {/* SECCIÓN REGLAS AUTOMÁTICAS Y CONFIGURACIÓN DE PAGOS TC */}
    {/* ========================================================= */}
    {activeSection === 'rules' && (
      <div className="space-y-6">
        {/* Banner de feedback al aplicar reglas */}
        {appliedFeedback && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-md animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold">¡Reglas aplicadas con éxito!</p>
                <p className="text-xs text-emerald-400/80">
                  Se actualizaron las categorías y tipos de movimiento en todos los registros existentes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setAppliedFeedback(false)}
              className="text-emerald-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Acciones Superiores de Reglas */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Motor de Clasificación y Detección de Pagos TC
            </h4>
            <p className="text-xs text-slate-400">
              Las reglas se aplican en orden para asignar automáticamente categoría, subcategoría y tipo de movimiento.
            </p>
          </div>

          <button
            type="button"
            onClick={handleApplyRules}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Aplicar a Movimientos Actuales</span>
          </button>
        </div>

        {/* Grid de 2 Columnas para Reglas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* COLUMNA IZQUIERDA: Formulario Nueva Regla (5 cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                Nueva Regla de Clasificación
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa una palabra o frase clave que aparezca en el texto del movimiento bancario.
              </p>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4">
              {/* Palabra clave o patrón */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Patrón o Palabra Clave <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={rulePattern}
                  onChange={(e) => {
                    setRulePattern(e.target.value);
                    if (ruleError) setRuleError(null);
                  }}
                  placeholder="Ej: PAGO TARJETA, AMEX, STARBUCKS, UBER"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition font-mono uppercase"
                />
                <span className="text-[11px] text-slate-500 block">
                  Búsqueda insensible a mayúsculas/minúsculas en el detalle de la transacción.
                </span>
              </div>

              {/* Tipo de Movimiento (pago_tc, compra, etc.) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tipo de Movimiento Asignado
                </label>
                <select
                  value={ruleTransactionType}
                  onChange={(e) => setRuleTransactionType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 transition"
                >
                  <option value="auto">Automático / Mantener tipo original</option>
                  <option value="pago_tc">💳 Pago de Tarjeta de Crédito (pago_tc)</option>
                  <option value="compra">🛍️ Compra / Gasto Corriente (compra)</option>
                  <option value="ingreso_venta">💰 Ingreso / Sueldo (ingreso_venta)</option>
                  <option value="transferencia_enviada">↗️ Transferencia Enviada</option>
                  <option value="transferencia_recibida">↙️ Transferencia Recibida</option>
                  <option value="comision_interes">🏦 Comisión / Interés</option>
                </select>

                {ruleTransactionType === 'pago_tc' && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-300 flex items-start gap-2.5 mt-2">
                    <CreditCard className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Detección de Pagos TC:</strong> Los movimientos que coincidan con este patrón se clasificarán como pagos y aparecerán disponibles en el modal <em>"Asociar Pago"</em>.
                    </p>
                  </div>
                )}
              </div>

              {/* Subcategoría Destino */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Subcategoría Destino <span className="text-rose-400">*</span>
                </label>
                <select
                  value={ruleSubcategory}
                  onChange={(e) => setRuleSubcategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-500 transition"
                >
                  {categoryMappings.map((cat) => (
                    <optgroup key={cat.id} label={`📁 ${cat.name}`}>
                      {cat.subcategories.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {/* Categoría General Detectada */}
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                  <span>Categoría General:</span>
                  <span className="bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Folder className="w-3 h-3" />
                    {getParentCategory(ruleSubcategory, categoryMappings)}
                  </span>
                </div>
              </div>

              {ruleError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{ruleError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!rulePattern.trim()}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/20 transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Regla de Clasificación</span>
              </button>
            </form>
          </div>

          {/* ========================================================= */}
          {/* COLUMNA DERECHA: Lista de Reglas Activas (7 cols) */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col min-h-[500px]">
            
            {/* Header Columna Derecha */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-sm text-white">Reglas Activas</h3>
                <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                  {filteredRules.length} de {autoRules.length}
                </span>
              </div>

              {/* Búsqueda de reglas */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ruleSearch}
                  onChange={(e) => setRuleSearch(e.target.value)}
                  placeholder="Buscar patrón o subcat..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>
            </div>

            {/* Filtros rápidos por tipo */}
            <div className="flex items-center gap-1.5 py-3 border-b border-slate-800/80 overflow-x-auto text-xs">
              <button
                type="button"
                onClick={() => setRulesFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                  rulesFilter === 'ALL'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                Todas ({autoRules.length})
              </button>

              <button
                type="button"
                onClick={() => setRulesFilter('pago_tc')}
                className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                  rulesFilter === 'pago_tc'
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>Pagos TC ({autoRules.filter((r) => r.transactionType === 'pago_tc').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setRulesFilter('compra')}
                className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                  rulesFilter === 'compra'
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                Compras ({autoRules.filter((r) => r.transactionType === 'compra').length})
              </button>

              <button
                type="button"
                onClick={() => setRulesFilter('ingreso')}
                className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                  rulesFilter === 'ingreso'
                    ? 'bg-teal-500 text-white'
                    : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-800'
                }`}
              >
                Ingresos ({autoRules.filter((r) => ['ingreso_venta', 'transferencia_recibida'].includes(r.transactionType || '')).length})
              </button>
            </div>

            {/* Lista de Reglas */}
            <div className="flex-1 overflow-y-auto max-h-[580px] space-y-2.5 pt-3 pr-1">
              {filteredRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400/40">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">No se encontraron reglas</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      {ruleSearch || rulesFilter !== 'ALL'
                        ? 'Prueba cambiando los filtros de búsqueda.'
                        : 'Crea tu primera regla usando el formulario de la izquierda.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl transition flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-sky-300 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-md">
                          "{rule.pattern}"
                        </span>

                        {getRuleTypeBadge(rule.transactionType)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                        <span className="text-slate-500">Asigna:</span>
                        <span className="font-semibold text-slate-300">{rule.category}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="font-medium text-white truncate">{rule.subcategory}</span>
                      </div>
                    </div>

                    {onDeleteRule && (
                      <button
                        type="button"
                        onClick={() => onDeleteRule(rule.id)}
                        className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-900 transition shrink-0"
                        title="Eliminar regla"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>
      </div>
    )}

  </div>
);
};
