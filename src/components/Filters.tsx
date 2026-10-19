import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar, Tag, CreditCard, Layers, XCircle, ChevronDown, Folder } from 'lucide-react';
import { Account, FilterState, CategoryMapping } from '../types';
import { TRANSACTION_TYPES } from '../utils/categorizer';

interface FiltersProps {
  filters: FilterState;
  accounts: Account[];
  categoryMappings: CategoryMapping[];
  availableMonths: string[];
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  accounts,
  categoryMappings,
  availableMonths,
  onChange,
  onReset
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const subcategoryDropdownRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof FilterState, value: any) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (subcategoryDropdownRef.current && !subcategoryDropdownRef.current.contains(event.target as Node)) {
        setIsSubcategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute subcategories available for selection based on active General Categories
  const availableSubcategories = useMemo(() => {
    const selectedCats = filters.categories || [];
    if (selectedCats.length > 0) {
      const filteredSubs = new Set<string>();
      categoryMappings.forEach((c) => {
        if (selectedCats.includes(c.name)) {
          c.subcategories.forEach((sub) => filteredSubs.add(sub));
        }
      });
      return Array.from(filteredSubs);
    }
    // Flatten all subcategories across all categories
    const allSubs = new Set<string>();
    categoryMappings.forEach((c) => c.subcategories.forEach((sub) => allSubs.add(sub)));
    return Array.from(allSubs);
  }, [filters.categories, categoryMappings]);

  // Toggle Category multi-select
  const toggleCategory = (catName: string) => {
    const currentCats = filters.categories || [];
    let updatedCats: string[];
    if (currentCats.includes(catName)) {
      updatedCats = currentCats.filter((c) => c !== catName);
    } else {
      updatedCats = [...currentCats, catName];
    }

    // Prune subcategories if they no longer belong to selected categories
    let updatedSubcats = filters.subcategories || [];
    if (updatedCats.length > 0) {
      const validSubSet = new Set<string>();
      categoryMappings.forEach((c) => {
        if (updatedCats.includes(c.name)) {
          c.subcategories.forEach((s) => validSubSet.add(s));
        }
      });
      updatedSubcats = updatedSubcats.filter((s) => validSubSet.has(s));
    }

    onChange({
      ...filters,
      categories: updatedCats,
      subcategories: updatedSubcats
    });
  };

  const handleSelectAllCategories = () => {
    onChange({
      ...filters,
      categories: [],
      subcategories: []
    });
  };

  // Toggle Subcategory multi-select
  const toggleSubcategory = (sub: string) => {
    const current = filters.subcategories || [];
    let updated: string[];
    if (current.includes(sub)) {
      updated = current.filter((s) => s !== sub);
    } else {
      updated = [...current, sub];
    }
    onChange({
      ...filters,
      subcategories: updated
    });
  };

  const handleSelectAllSubcategories = () => {
    onChange({
      ...filters,
      subcategories: []
    });
  };

  const selectedCategoryCount = (filters.categories || []).length;
  const selectedSubcategoryCount = (filters.subcategories || []).length;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-800/80 p-5 mb-6">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Filter className="w-4 h-4 text-sky-400" />
          <span>Filtros y Búsqueda</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium transition"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Limpiar Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Search Input */}
        <div className="relative lg:col-span-1">
          <label className="block text-xs font-semibold text-slate-400 mb-1">Buscar Detalle</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Uber, Jumbo, Pago..."
              value={filters.searchQuery}
              onChange={(e) => handleInputChange('searchQuery', e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Month Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            <span>Mes / Período</span>
          </label>
          <select
            value={filters.month}
            onChange={(e) => handleInputChange('month', e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer font-medium"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos los Meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Account / Card Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-slate-500" />
            <span>Cuenta / Tarjeta</span>
          </label>
          <select
            value={filters.accountId}
            onChange={(e) => handleInputChange('accountId', e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer font-medium"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todas las Cuentas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                {acc.name} {acc.closingDay ? `(Corte día ${acc.closingDay})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Multi-Select General Categories Dropdown */}
        <div className="relative" ref={categoryDropdownRef}>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Folder className="w-3 h-3 text-slate-500" />
            <span>Categorías (Multi)</span>
          </label>

          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="w-full py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-left flex items-center justify-between font-medium text-slate-200 hover:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <span className="truncate">
              {selectedCategoryCount === 0
                ? 'Todas las Categorías'
                : selectedCategoryCount === 1
                ? filters.categories[0]
                : `${selectedCategoryCount} seleccionadas`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-1" />
          </button>

          {isCategoryOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 z-50 p-2.5 text-xs backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                  Categorías Generales
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllCategories}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                >
                  Ver Todas
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {categoryMappings.map((cat) => {
                  const isChecked = selectedCategoryCount > 0 && filters.categories.includes(cat.name);
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition select-none ${
                        isChecked ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat.name)}
                          className="w-3.5 h-3.5 text-sky-500 rounded border-slate-700 bg-slate-950 focus:ring-sky-500"
                        />
                        <span className="truncate text-xs">{cat.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full font-medium ml-1 flex-shrink-0">
                        {cat.subcategories.length} subs
                      </span>
                    </label>
                  );
                })}
              </div>

              {selectedCategoryCount > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">{selectedCategoryCount} seleccionadas</span>
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="font-semibold text-sky-400 hover:text-sky-300"
                  >
                    Mostrar Todas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Multi-Select Subcategory Dropdown */}
        <div className="relative" ref={subcategoryDropdownRef}>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-500" />
            <span>Subcategorías (Multi)</span>
          </label>
          
          <button
            type="button"
            onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
            className="w-full py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-left flex items-center justify-between font-medium text-slate-200 hover:border-slate-700 transition focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <span className="truncate">
              {selectedSubcategoryCount === 0
                ? 'Todas las Subcategorías'
                : selectedSubcategoryCount === 1
                ? filters.subcategories[0]
                : `${selectedSubcategoryCount} seleccionadas`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 ml-1" />
          </button>

          {isSubcategoryOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/80 z-50 p-2.5 text-xs backdrop-blur-xl">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 px-1">
                <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                  Subcategorías
                </span>
                <button
                  type="button"
                  onClick={handleSelectAllSubcategories}
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                >
                  Ver Todas
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {availableSubcategories.map((sub) => {
                  const isChecked = selectedSubcategoryCount > 0 && filters.subcategories.includes(sub);
                  return (
                    <label
                      key={sub}
                      className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition select-none ${
                        isChecked ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSubcategory(sub)}
                        className="w-3.5 h-3.5 text-sky-500 rounded border-slate-700 bg-slate-950 focus:ring-sky-500"
                      />
                      <span className="truncate text-xs">{sub}</span>
                    </label>
                  );
                })}
              </div>

              {selectedSubcategoryCount > 0 && (
                <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">{selectedSubcategoryCount} seleccionadas</span>
                  <button
                    type="button"
                    onClick={handleSelectAllSubcategories}
                    className="font-semibold text-sky-400 hover:text-sky-300"
                  >
                    Mostrar Todas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-500" />
            <span>Tipo Transacción</span>
          </label>
          <select
            value={filters.transactionType}
            onChange={(e) => handleInputChange('transactionType', e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer font-medium"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos los Tipos</option>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                {t.label}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Credit Card Pending Filter Switch */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={filters.onlyPendingTC}
            onChange={(e) => handleInputChange('onlyPendingTC', e.target.checked)}
            className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-700 bg-slate-950"
          />
          <span>Mostrar solo compras de Tarjeta de Crédito con saldo pendiente (Monto Real Utilizado &gt; 0)</span>
        </label>
      </div>

    </div>
  );
};
