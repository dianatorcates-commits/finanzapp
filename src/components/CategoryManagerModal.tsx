import React, { useState } from 'react';
import { X, Tag, Plus, Trash2, FolderPlus, ArrowRight } from 'lucide-react';
import { CategoryMapping } from '../types';

interface CategoryManagerModalProps {
  categoryMappings: CategoryMapping[];
  onClose: () => void;
  onAddCategory: (categoryName: string) => void;
  onAddSubcategory: (parentCategoryName: string, subcategoryName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onDeleteSubcategory: (parentCategoryName: string, subcategoryName: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  categoryMappings,
  onClose,
  onAddCategory,
  onAddSubcategory,
  onDeleteCategory,
  onDeleteSubcategory
}) => {
  const [newCatName, setNewCatName] = useState('');
  const [selectedParentCat, setSelectedParentCat] = useState<string>(categoryMappings[0]?.name || '');
  const [newSubcatName, setNewSubcatName] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categoryMappings.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('Esta categoría ya existe.');
      return;
    }

    onAddCategory(trimmed);
    setNewCatName('');
    setSelectedParentCat(trimmed);
  };

  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSub = newSubcatName.trim();
    if (!trimmedSub || !selectedParentCat) return;

    onAddSubcategory(selectedParentCat, trimmedSub);
    setNewSubcatName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Módulo de Categorías & Subcategorías</h3>
              <p className="text-xs text-slate-400">Crea categorías generales (ej. Abonos y Pagos) y asóciales subcategorías</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          
          {/* Creation Section Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Add New General Category */}
            <form onSubmit={handleCreateCategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-sky-600" />
                <span>1. Crear Categoría General</span>
              </h4>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Ej: Abonos y Pagos, Inversiones"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-sm"
              >
                Guardar Categoría General
              </button>
            </form>

            {/* 2. Add New Subcategory to Parent */}
            <form onSubmit={handleCreateSubcategory} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>2. Asociar Subcategoría</span>
              </h4>
              <div className="space-y-2">
                <select
                  value={selectedParentCat}
                  onChange={(e) => setSelectedParentCat(e.target.value)}
                  className="w-full text-xs py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none font-medium text-slate-800"
                >
                  {categoryMappings.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      📁 {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder="Ej: Abono Comida, Pago Tarjeta"
                  value={newSubcatName}
                  onChange={(e) => setNewSubcatName(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-lg text-xs transition shadow-sm"
              >
                Asociar a {selectedParentCat || 'Categoría'}
              </button>
            </form>

          </div>

          {/* Active Hierarchy Tree List */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Estructura Activa de Categorías & Subcategorías ({categoryMappings.length})
            </h4>
            <div className="space-y-3">
              {categoryMappings.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                      📁 {cat.name}
                    </span>
                    {categoryMappings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition text-xs flex items-center gap-1 font-medium"
                        title="Eliminar categoría general"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Categoría</span>
                      </button>
                    )}
                  </div>

                  {/* Subcategories Tags */}
                  <div className="flex flex-wrap gap-2 pl-4">
                    {cat.subcategories.length > 0 ? (
                      cat.subcategories.map((sub) => (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          <span>🏷️ {sub}</span>
                          <button
                            type="button"
                            onClick={() => onDeleteSubcategory(cat.name, sub)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-200 transition"
                            title="Eliminar subcategoría"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No hay subcategorías asociadas a esta categoría general.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
