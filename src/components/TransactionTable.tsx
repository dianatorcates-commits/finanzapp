import React, { useState } from 'react';
import {
  Link2,
  Trash2,
  Plus,
  CheckCircle,
  CreditCard,
  Building2
} from 'lucide-react';
import { ComputedTransaction, Account, CategoryMapping, TransactionType } from '../types';
import { getParentCategory, TRANSACTION_TYPES } from '../utils/categorizer';
import { formatCLP } from './MetricCards';

interface TransactionTableProps {
  transactions: ComputedTransaction[];
  accounts: Account[];
  categoryMappings: CategoryMapping[];
  onOpenPaymentModal: (purchase: ComputedTransaction) => void;
  onUpdateTransaction: (id: string, updates: Partial<ComputedTransaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransaction: (newTx: any) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  accounts,
  categoryMappings,
  onOpenPaymentModal,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPeriod, setNewPeriod] = useState(new Date().toISOString().split('T')[0].slice(0, 7));
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id || '');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newSubcategory, setNewSubcategory] = useState<string>(
    categoryMappings[0]?.subcategories[0] || 'Restaurantes & Bares'
  );
  const [newType, setNewType] = useState<TransactionType>('compra');

  // Flatten all available subcategories for dropdowns
  const allSubcategories = React.useMemo(() => {
    const subs: { name: string; categoryName: string }[] = [];
    categoryMappings.forEach((c) => {
      c.subcategories.forEach((sub) => {
        subs.push({ name: sub, categoryName: c.name });
      });
    });
    return subs;
  }, [categoryMappings]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount) return;

    const numAmount = parseFloat(newAmount);
    const parentCategory = getParentCategory(newSubcategory, categoryMappings);

    onAddTransaction({
      id: `tx-man-${Date.now()}`,
      accountId: newAccountId,
      date: newDate,
      period: newPeriod || newDate.slice(0, 7),
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
      
      {/* Header Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Movimientos & Cartolas Cargadas</span>
            <span className="bg-sky-100 text-sky-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {transactions.length} registros
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Asocia pagos a compras de TC para obtener el Monto Real Utilizado restante.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancelar' : 'Agregar Movimiento Manual'}</span>
        </button>
      </div>

      {/* Manual Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-sky-50/60 border-b border-sky-200 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Fecha Compra</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewPeriod(e.target.value.slice(0, 7));
              }}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mes-Período</label>
            <input
              type="month"
              required
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cuenta/Tarjeta</label>
            <select
              value={newAccountId}
              onChange={(e) => setNewAccountId(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Descripción</label>
            <input
              type="text"
              required
              placeholder="Ej: Almuerzo Restaurante"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Monto (CLP)</label>
            <input
              type="number"
              required
              placeholder="100000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subcategoría</label>
            <select
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              className="w-full text-xs py-1.5 px-2 bg-white border border-slate-300 rounded-lg focus:outline-none font-medium"
            >
              {categoryMappings.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {c.subcategories.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition shadow-sm"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* Main Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
            <tr>
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
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.length > 0 ? (
              transactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId);
                const isCreditCard = account?.type === 'credit_card';
                const isPurchase = tx.transactionType === 'compra' || tx.amount > 0;
                const isPaymentOrIncome = tx.transactionType === 'pago_tc' || tx.transactionType === 'ingreso_venta' || tx.transactionType === 'transferencia_recibida';

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/80 transition ${
                      tx.isFullyPaid ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    {/* Date & Editable Assigned Period */}
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{tx.date}</div>
                      <div className="mt-1 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-sans">Mes:</span>
                        <input
                          type="month"
                          value={tx.period || tx.date.slice(0, 7)}
                          onChange={(e) => onUpdateTransaction(tx.id, { period: e.target.value })}
                          className="text-[10px] font-mono py-0.5 px-1 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 font-bold rounded focus:outline-none cursor-pointer"
                          title="Haz clic para modificar el Mes-Período de facturación de esta cuota/compra"
                        />
                      </div>
                    </td>

                    {/* Account */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        {isCreditCard ? (
                          <CreditCard className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        )}
                        <span className="truncate max-w-[130px]">{account?.name || 'Cuenta'}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={tx.description}>
                        {tx.description}
                      </div>
                      {tx.installments && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Cuota {tx.installments.current} de {tx.installments.total}
                          </span>
                          {tx.originalTotalAmount && (
                            <span className="text-[10px] text-slate-500">
                              (Total compra: {formatCLP(tx.originalTotalAmount)})
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Category & Subcategory Selector */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          📁 {tx.category || 'General'}
                        </span>
                        <div>
                          <select
                            value={tx.subcategory || tx.category}
                            onChange={(e) => handleSubcategoryChange(tx.id, e.target.value)}
                            className="text-[11px] py-0.5 px-2 bg-white border border-slate-300 rounded-md text-slate-800 font-medium cursor-pointer hover:bg-slate-50 focus:outline-none"
                          >
                            {categoryMappings.map((c) => (
                              <optgroup key={c.id} label={c.name}>
                                {c.subcategories.map((sub) => (
                                  <option key={sub} value={sub}>
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
                        isPaymentOrIncome ? 'text-emerald-600 font-semibold' : 'text-slate-900'
                      }`}
                    >
                      <div className="font-bold">
                        {isPaymentOrIncome ? `- ${formatCLP(tx.amount)}` : formatCLP(tx.amount)}
                      </div>
                      {tx.installments && tx.originalTotalAmount && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          Monto Cuota
                        </div>
                      )}
                    </td>

                    {/* Payments Allocated / Abonos */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isCreditCard && isPurchase ? (
                        tx.totalAllocated > 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            {formatCLP(tx.totalAllocated)}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">$0</span>
                        )
                      ) : isPaymentOrIncome ? (
                        <span className="text-emerald-600 font-semibold text-[11px]">
                          Abono Disponible ({formatCLP(tx.unallocatedPaymentBalance || 0)})
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Monto Real Utilizado */}
                    <td className="py-3 px-4 text-right font-bold whitespace-nowrap">
                      {isCreditCard && isPurchase ? (
                        <span
                          className={`${
                            tx.isFullyPaid
                              ? 'text-emerald-600 line-through opacity-70'
                              : 'text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200'
                          }`}
                        >
                          {formatCLP(tx.netAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-700">{formatCLP(tx.amount)}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {isCreditCard && isPurchase && (
                          <button
                            onClick={() => onOpenPaymentModal(tx)}
                            className="flex items-center gap-1 text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-semibold px-2.5 py-1 rounded-lg transition shadow-sm"
                            title="Asociar pagos a esta compra para deducir monto abonado"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Asociar Pago</span>
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition"
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
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  No hay movimientos cargados que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
