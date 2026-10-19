import React, { useState } from 'react';
import {
  Link2,
  Trash2,
  Plus,
  CheckCircle,
  CreditCard,
  Building2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { ComputedTransaction, Account, CategoryMapping, TransactionType } from '../types';
import { getParentCategory, TRANSACTION_TYPES } from '../utils/categorizer';
import { calculateTransactionPeriod } from '../utils/dateUtils';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';
import { formatCLP } from './MetricCards';

interface TransactionTableProps {
  transactions: ComputedTransaction[];
  accounts: Account[];
  categoryMappings: CategoryMapping[];
  onOpenPaymentModal: (purchase: ComputedTransaction) => void;
  onUpdateTransaction: (id: string, updates: Partial<ComputedTransaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteTransactionsBatch?: (ids: string[]) => void;
  onAddTransaction: (newTx: any) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  accounts,
  categoryMappings,
  onOpenPaymentModal,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteTransactionsBatch,
  onAddTransaction
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id || '');
  const [newPeriod, setNewPeriod] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const acc = accounts[0];
    return calculateTransactionPeriod(today, acc?.closingDay);
  });
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newSubcategory, setNewSubcategory] = useState<string>(
    categoryMappings[0]?.subcategories[0] || 'Restaurantes y Bares'
  );
  const [newType, setNewType] = useState<TransactionType>('compra');

  // Selection & Bulk Modal State
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    idsToDelete: string[];
    title: string;
    message: string;
  }>({
    isOpen: false,
    idsToDelete: [],
    title: '',
    message: ''
  });

  const allVisibleIds = React.useMemo(() => transactions.map((t) => t.id), [transactions]);
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedTxIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(allVisibleIds);
    }
  };

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Open single delete confirmation modal
  const openSingleDeleteModal = (tx: ComputedTransaction) => {
    setDeleteConfirmModal({
      isOpen: true,
      idsToDelete: [tx.id],
      title: '¿Eliminar Movimiento?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el registro "${tx.description}" por ${formatCLP(tx.amount)}?`
    });
  };

  // Delete confirmation execution (handles single or batch)
  const handleConfirmDelete = () => {
    const { idsToDelete } = deleteConfirmModal;
    if (idsToDelete.length === 0) return;

    if (idsToDelete.length === 1) {
      onDeleteTransaction(idsToDelete[0]);
    } else if (onDeleteTransactionsBatch) {
      onDeleteTransactionsBatch(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteTransaction(id));
    }

    setSelectedTxIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    setDeleteConfirmModal({ isOpen: false, idsToDelete: [], title: '', message: '' });
  };

  const openBulkDeleteSelectedModal = () => {
    if (selectedTxIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      idsToDelete: selectedTxIds,
      title: `¿Eliminar ${selectedTxIds.length} Movimientos Seleccionados?`,
      message: `Vas a eliminar ${selectedTxIds.length} transacciones de forma masiva. Se borrarán inmediatamente de tu cuenta y base de datos.`
    });
  };

  const openClearAllVisibleModal = () => {
    if (allVisibleIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      idsToDelete: allVisibleIds,
      title: `¿Vaciar los ${allVisibleIds.length} Movimientos Visibles?`,
      message: `Vas a eliminar todos los ${allVisibleIds.length} registros mostrados en esta vista. Se borrarán permanentemente.`
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount) return;

    const numAmount = parseFloat(newAmount);
    const parentCategory = getParentCategory(newSubcategory, categoryMappings);
    const targetAcc = accounts.find((a) => a.id === newAccountId);
    const finalPeriod = newPeriod || calculateTransactionPeriod(newDate, targetAcc?.closingDay);

    onAddTransaction({
      id: `tx-man-${Date.now()}`,
      accountId: newAccountId,
      date: newDate,
      period: finalPeriod,
      description: newDesc.trim(),
      rawDescription: newDesc.trim(),
      amount: Math.abs(numAmount),
      transactionType: newType,
      category: parentCategory,
      subcategory: newSubcategory,
      allocations: []
    });

    setNewDesc('');
    setNewAmount('');
    setShowAddForm(false);
  };

  const handleSubcategoryChange = (txId: string, newSub: string) => {
    const parentCategory = getParentCategory(newSub, categoryMappings);
    onUpdateTransaction(txId, {
      subcategory: newSub,
      category: parentCategory
    });
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-slate-800/80 overflow-hidden mb-8">
      
      {/* Header Bar */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Movimientos y Cartolas Cargadas</span>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-semibold px-2 py-0.5 rounded-full">
              {transactions.length} registros
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Asocia pagos a compras de TC o administra y borra movimientos masivamente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk Delete Selected Button */}
          {selectedTxIds.length > 0 && (
            <button
              onClick={openBulkDeleteSelectedModal}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-lg shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Seleccionados ({selectedTxIds.length})</span>
            </button>
          )}

          {/* Clear All Visible Transactions Button */}
          {transactions.length > 0 && selectedTxIds.length === 0 && (
            <button
              onClick={openClearAllVisibleModal}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl transition border border-slate-700 hover:border-rose-500/40"
              title="Borrar todas las transacciones mostradas en la tabla"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Vaciar Todo ({transactions.length})</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm border border-slate-700"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>{showAddForm ? 'Cancelar' : 'Agregar Movimiento Manual'}</span>
          </button>
        </div>
      </div>

      {/* Manual Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-slate-950/90 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha Compra</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => {
                const d = e.target.value;
                setNewDate(d);
                const acc = accounts.find((a) => a.id === newAccountId);
                setNewPeriod(calculateTransactionPeriod(d, acc?.closingDay));
              }}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Mes-Período</label>
            <input
              type="month"
              required
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Cuenta/Tarjeta</label>
            <select
              value={newAccountId}
              onChange={(e) => {
                const accId = e.target.value;
                setNewAccountId(accId);
                const acc = accounts.find((a) => a.id === accId);
                setNewPeriod(calculateTransactionPeriod(newDate, acc?.closingDay));
              }}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                  {a.name} {a.closingDay ? `(Corte día ${a.closingDay})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Descripción</label>
            <input
              type="text"
              required
              placeholder="Ej: Almuerzo Restaurante"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Monto (CLP)</label>
            <input
              type="number"
              required
              placeholder="100000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subcategoría</label>
            <select
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-sky-500 font-medium"
            >
              {categoryMappings.map((c) => (
                <optgroup key={c.id} label={c.name} className="bg-slate-900 text-slate-300">
                  {c.subcategories.map((sub) => (
                    <option key={sub} value={sub} className="bg-slate-900 text-white">{sub}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-md"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Main Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded text-sky-500 focus:ring-sky-500 border-slate-700 bg-slate-950 cursor-pointer w-4 h-4"
                  title="Seleccionar Todos / Deseleccionar Todos"
                />
              </th>
              <th className="py-3 px-4">Fecha / Período</th>
              <th className="py-3 px-4">Cuenta / Tarjeta</th>
              <th className="py-3 px-4">Detalle / Comercio</th>
              <th className="py-3 px-4">Categoría / Subcategoría</th>
              <th className="py-3 px-4 text-right">Monto Cuota / Período</th>
              <th className="py-3 px-4 text-right">Abonos / Pagos</th>
              <th className="py-3 px-4 text-right">Monto Real Utilizado</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId);
                const isCreditCard = account?.type === 'credit_card';
                const isPaymentOrIncome = isPaymentOrIncomeTransaction(tx);
                const isPurchase = !isPaymentOrIncome && tx.amount > 0;
                const isSelected = selectedTxIds.includes(tx.id);

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-800/50 transition ${
                      isSelected ? 'bg-sky-500/15' : tx.isFullyPaid ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    {/* Checkbox row selection */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTx(tx.id)}
                        className="rounded text-sky-500 focus:ring-sky-500 border-slate-700 bg-slate-950 cursor-pointer w-4 h-4"
                      />
                    </td>

                    {/* Date & Editable Assigned Period */}
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      <div className="font-semibold text-white">{tx.date}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-sans">Mes:</span>
                        <input
                          type="month"
                          value={tx.period || tx.date.slice(0, 7)}
                          onChange={(e) => onUpdateTransaction(tx.id, { period: e.target.value })}
                          className="text-[10px] font-mono py-0.5 px-1 bg-sky-950/70 hover:bg-sky-900/90 border border-sky-500/40 text-sky-300 font-bold rounded focus:outline-none cursor-pointer"
                          title="Haz clic para modificar el Mes-Período de facturación de esta cuota/compra"
                        />
                      </div>
                    </td>

                    {/* Account */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {isCreditCard ? (
                          <CreditCard className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        )}
                        <span className="truncate max-w-[130px]">{account?.name || 'Cuenta'}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-white truncate" title={tx.description}>
                        {tx.description}
                      </div>
                      {tx.installments && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Cuota {tx.installments.current} de {tx.installments.total}
                          </span>
                          {tx.originalTotalAmount && (
                            <span className="text-[10px] text-slate-400">
                              (Total compra: {formatCLP(tx.originalTotalAmount)})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Category & Subcategory Selector */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          📁 {tx.category || 'General'}
                        </span>
                        <div>
                          <select
                            value={tx.subcategory || tx.category}
                            onChange={(e) => handleSubcategoryChange(tx.id, e.target.value)}
                            className="text-[11px] py-0.5 px-2 bg-slate-950 border border-slate-700/80 rounded-md text-slate-200 font-medium cursor-pointer hover:border-slate-600 focus:outline-none"
                          >
                            {categoryMappings.map((c) => (
                              <optgroup key={c.id} label={c.name} className="bg-slate-900 text-slate-400">
                                {c.subcategories.map((sub) => (
                                  <option key={sub} value={sub} className="bg-slate-900 text-white">
                                    {sub}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>

                    {/* Monto Facturado (Cuota) */}
                    <td
                      className={`py-3 px-4 text-right whitespace-nowrap ${
                        isPaymentOrIncome ? 'text-emerald-400 font-semibold' : 'text-white'
                      }`}
                    >
                      <div className="font-bold">
                        {isPaymentOrIncome ? `- ${formatCLP(Math.abs(tx.amount))}` : formatCLP(tx.amount)}
                      </div>
                      {tx.installments && tx.originalTotalAmount && (
                        <div className="text-[10px] text-slate-500 font-normal">
                          Monto Cuota
                        </div>
                      )}
                    </td>

                    {/* Payments Allocated / Abonos */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isCreditCard && isPurchase ? (
                        tx.totalAllocated > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            {formatCLP(tx.totalAllocated)}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">$0</span>
                        )
                      ) : isPaymentOrIncome ? (
                        <span className="text-emerald-400 font-semibold text-[11px]">
                          Abono Disponible ({formatCLP(tx.unallocatedPaymentBalance || 0)})
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Monto Real Utilizado */}
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      {isPaymentOrIncome ? (
                        <span className="text-slate-500 font-normal">$0</span>
                      ) : tx.isFullyPaid ? (
                        <span
                          className="text-emerald-400 line-through opacity-70"
                          title="Totalmente pagada por abonos / pagos"
                        >
                          {formatCLP(tx.amount)}
                        </span>
                      ) : (
                        <span className="text-sky-300 bg-sky-950/70 border border-sky-500/40 px-2 py-0.5 rounded-lg shadow-sm">
                          {formatCLP(tx.netAmount)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {isCreditCard && isPurchase && (
                          <button
                            onClick={() => onOpenPaymentModal(tx)}
                            className="flex items-center gap-1 text-[11px] bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold px-2.5 py-1 rounded-lg transition shadow-sm"
                            title="Asociar pagos a esta compra para deducir monto abonado"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Asociar Pago</span>
                          </button>
                        )}
                        <button
                          onClick={() => openSingleDeleteModal(tx)}
                          className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded-lg transition"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  No hay movimientos cargados que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700/80 overflow-hidden p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{deleteConfirmModal.title}</h3>
                <p className="text-xs text-slate-400">
                  {deleteConfirmModal.idsToDelete.length === 1 ? 'Confirmación de eliminación' : 'Confirmación de borrado masivo'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              {deleteConfirmModal.message}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, idsToDelete: [], title: '', message: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteConfirmModal.idsToDelete.length === 1 ? 'Sí, Eliminar' : 'Confirmar Borrado Masivo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

