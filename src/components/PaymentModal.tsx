import React, { useState } from 'react';
import { X, Link2, Trash2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { ComputedTransaction, Account } from '../types';
import { formatCLP } from './MetricCards';

interface PaymentModalProps {
  purchase: ComputedTransaction;
  allTransactions: ComputedTransaction[];
  account?: Account;
  onClose: () => void;
  onAddAllocation: (purchaseId: string, paymentId: string, amount: number) => void;
  onRemoveAllocation: (purchaseId: string, allocationId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  purchase,
  allTransactions,
  account,
  onClose,
  onAddAllocation,
  onRemoveAllocation
}) => {
  // Available payments for this credit card account
  const availablePayments = allTransactions.filter(
    (tx) =>
      tx.accountId === purchase.accountId &&
      (tx.transactionType === 'pago_tc' || (tx.amount < 0 && tx.category === 'Pagos de Tarjeta')) &&
      (tx.unallocatedPaymentBalance || 0) > 0
  );

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    availablePayments[0]?.id || ''
  );
  const [allocationAmount, setAllocationAmount] = useState<string>('');

  const selectedPayment = availablePayments.find((p) => p.id === selectedPaymentId);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId) return;

    const numAmount = parseFloat(allocationAmount) || (selectedPayment ? Math.min(purchase.netAmount, selectedPayment.unallocatedPaymentBalance || 0) : 0);

    if (numAmount <= 0) return;

    onAddAllocation(purchase.id, selectedPaymentId, numAmount);
    setAllocationAmount('');
  };

  const handleFillMax = () => {
    if (!selectedPayment) return;
    const maxPoss = Math.min(purchase.netAmount, selectedPayment.unallocatedPaymentBalance || 0);
    setAllocationAmount(String(maxPoss));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-400/30">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Asociar Pago a Compra de TC</h3>
              <p className="text-xs text-slate-400">{account?.name || 'Tarjeta de Crédito'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Purchase Summary Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transacción Seleccionada</span>
              <h4 className="font-bold text-slate-800 text-base">{purchase.description}</h4>
              <p className="text-xs text-slate-500">{purchase.date} • {purchase.category}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">Monto Original:</span>
              <p className="text-sm font-bold text-slate-900">{formatCLP(purchase.amount)}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Monto Original</span>
              <span className="text-xs font-bold text-slate-800">{formatCLP(purchase.amount)}</span>
            </div>
            <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block">Pagos Asociados</span>
              <span className="text-xs font-bold text-emerald-700">{formatCLP(purchase.totalAllocated)}</span>
            </div>
            <div className="bg-sky-50 p-2 rounded-lg border border-sky-200">
              <span className="text-[11px] text-sky-800 block">Monto Real Utilizado</span>
              <span className="text-xs font-bold text-sky-700">{formatCLP(purchase.netAmount)}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-6">
          
          {/* Active Allocations List */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pagos Asociados Actualmente</span>
            </h5>
            
            {purchase.allocations.length > 0 ? (
              <div className="space-y-2">
                {purchase.allocations.map((alloc) => {
                  const paymentTx = allTransactions.find((t) => t.id === alloc.paymentTransactionId);
                  return (
                    <div
                      key={alloc.id}
                      className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-xl text-xs"
                    >
                      <div>
                        <p className="font-semibold text-emerald-900">
                          {paymentTx ? paymentTx.description : 'Pago de TC'}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          Fecha Pago: {paymentTx?.date || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-800">{formatCLP(alloc.amount)}</span>
                        <button
                          onClick={() => onRemoveAllocation(purchase.id, alloc.id)}
                          title="Eliminar asociación"
                          className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-100 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                Aún no hay abonos o pagos asociados a esta compra.
              </p>
            )}
          </div>

          {/* Add New Allocation Form */}
          {purchase.netAmount > 0 ? (
            <div className="border-t border-slate-200 pt-4">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ArrowRight className="w-4 h-4 text-sky-600" />
                <span>Asociar Nuevo Pago Disponible</span>
              </h5>

              {availablePayments.length > 0 ? (
                <form onSubmit={handleApply} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Seleccionar Abono / Pago de TC
                    </label>
                    <select
                      value={selectedPaymentId}
                      onChange={(e) => setSelectedPaymentId(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      {availablePayments.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.date} - {p.description} (Disp: {formatCLP(p.unallocatedPaymentBalance || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-slate-600">
                        Monto a Asociar (CLP)
                      </label>
                      <button
                        type="button"
                        onClick={handleFillMax}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                      >
                        Asignar Máximo Posible
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Ej: ${Math.min(purchase.netAmount, selectedPayment?.unallocatedPaymentBalance || 0)}`}
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg text-xs transition shadow-sm"
                  >
                    Confirmar Asociación de Pago
                  </button>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2 text-amber-800 text-xs">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <span>
                    No hay abonos o pagos a TC con saldo disponible. Carga una cartola con un pago a la tarjeta de crédito para asociarlo.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center text-emerald-800 text-xs font-semibold">
              🎉 ¡Esta compra ha sido totalmente pagada/cobierta por abonos! Monto Real Utilizado restante = $0.
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-3 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
