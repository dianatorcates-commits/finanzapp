import React, { useState, useEffect } from 'react';
import { X, Link2, Trash2, CheckCircle2, AlertCircle, ArrowRight, Building2, CreditCard } from 'lucide-react';
import { ComputedTransaction, Account } from '../types';
import { isCreditCardPaymentTransaction } from '../utils/paymentAllocation';
import { formatCLP } from './MetricCards';

interface PaymentModalProps {
  purchase: ComputedTransaction;
  allTransactions: ComputedTransaction[];
  account?: Account;
  accounts?: Account[];
  onClose: () => void;
  onAddAllocation: (purchaseId: string, paymentId: string, amount: number) => void;
  onRemoveAllocation: (purchaseId: string, allocationId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  purchase,
  allTransactions,
  account,
  accounts = [],
  onClose,
  onAddAllocation,
  onRemoveAllocation
}) => {
  // Cross-account filter toggle (defaults to false to only show payments on this card by default)
  const [showAllAccounts, setShowAllAccounts] = useState<boolean>(false);

  // Helper to determine if a transaction qualifies as a payment / abono
  const isEligiblePayment = (tx: ComputedTransaction): boolean => {
    // Cannot associate a purchase to itself
    if (tx.id === purchase.id) return false;

    // Must have available balance to allocate
    if ((tx.unallocatedPaymentBalance || 0) <= 0) return false;

    // 1. Explicit transaction type from user rules or manual classification
    if (tx.transactionType === 'pago_tc') return true;

    // 2. Explicit category or subcategory of credit card debt payment/abono
    const cat = (tx.category || '').toLowerCase();
    const subcat = (tx.subcategory || '').toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const rawDesc = (tx.rawDescription || '').toLowerCase();

    const isExplicitPaymentCategory =
      cat === 'abonos y pagos' ||
      cat === 'pagos de tarjeta' ||
      cat === 'pago tarjeta' ||
      cat === 'abono tarjeta' ||
      subcat.includes('pago tarjeta') ||
      subcat.includes('pagos de tarjeta') ||
      subcat.includes('pago de tarjeta') ||
      subcat.includes('pago tc') ||
      subcat.includes('abono de tarjeta') ||
      subcat.includes('abono tarjeta') ||
      subcat.includes('abono tc') ||
      subcat.includes('abono deuda') ||
      subcat.includes('pago deuda');

    if (isExplicitPaymentCategory) return true;

    // 3. Clear text / merchant / description patterns of credit card payments
    const isPaymentDescriptionPattern =
      desc.includes('pago tarjeta') ||
      desc.includes('abono tarjeta') ||
      desc.includes('pago tc') ||
      desc.includes('abono tc') ||
      desc.includes('pago de tarjeta') ||
      desc.includes('abono a tarjeta') ||
      desc.includes('abono deuda') ||
      desc.includes('pago deuda') ||
      rawDesc.includes('pago tarjeta') ||
      rawDesc.includes('abono tarjeta') ||
      rawDesc.includes('pago tc') ||
      rawDesc.includes('abono tc');

    if (isPaymentDescriptionPattern) return true;

    // 4. Negative amount directly on the same credit card account (represents a refund / credit note / abono)
    if (tx.amount < 0 && tx.accountId === purchase.accountId) {
      return true;
    }

    return false;
  };

  // Filter available payments based on eligibility and selected account scope
  const availablePayments = allTransactions.filter((tx) => {
    if (!isEligiblePayment(tx)) return false;
    if (!showAllAccounts && tx.accountId !== purchase.accountId) return false;
    return true;
  });

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    availablePayments[0]?.id || ''
  );
  const [allocationAmount, setAllocationAmount] = useState<string>('');

  // Auto-sync selected payment if list changes
  useEffect(() => {
    if (availablePayments.length > 0 && !availablePayments.some((p) => p.id === selectedPaymentId)) {
      setSelectedPaymentId(availablePayments[0].id);
    }
  }, [availablePayments, selectedPaymentId]);

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
              <h3 className="font-bold text-base text-white">Asociar Pago o Abono a Compra</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                <span>{account?.name || 'Tarjeta de Crédito'}</span>
              </p>
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
              <p className="text-xs text-slate-500">{purchase.date} • {purchase.category} &gt; {purchase.subcategory}</p>
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
        <div className="p-4 overflow-y-auto space-y-5">
          
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
                  const originAcc = accounts.find((a) => a.id === paymentTx?.accountId);
                  return (
                    <div
                      key={alloc.id}
                      className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 p-2.5 rounded-xl text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          {originAcc && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-200/60 text-emerald-900">
                              {originAcc.name}
                            </span>
                          )}
                          <p className="font-semibold text-emerald-900">
                            {paymentTx ? paymentTx.description : 'Pago / Abono'}
                          </p>
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Fecha: {paymentTx?.date || 'N/A'} • {paymentTx?.category}
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
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <ArrowRight className="w-4 h-4 text-sky-600" />
                  <span>Asociar Nuevo Pago Disponible</span>
                </h5>
                <span className="text-[11px] text-slate-400">
                  {availablePayments.length} abono(s) disponible(s)
                </span>
              </div>

              {/* Cross-Account Filter Switch */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">
                      {showAllAccounts ? 'Mostrando pagos de todas las cuentas' : `Solo pagos de ${account?.name || 'esta tarjeta'}`}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {showAllAccounts
                        ? 'Permite vincular pagos o transferencias desde tu Cuenta Corriente'
                        : 'Filtrando únicamente abonos registrados en esta tarjeta'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllAccounts(!showAllAccounts)}
                  className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    showAllAccounts ? 'bg-sky-600' : 'bg-slate-300'
                  }`}
                  role="switch"
                  aria-checked={showAllAccounts}
                  title="Alternar entre ver pagos de todas las cuentas o solo de esta tarjeta"
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showAllAccounts ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {availablePayments.length > 0 ? (
                <form onSubmit={handleApply} className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Seleccionar Abono / Pago Disponible
                    </label>
                    <select
                      value={selectedPaymentId}
                      onChange={(e) => setSelectedPaymentId(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-medium"
                    >
                      {availablePayments.map((p) => {
                        const originAcc = accounts.find((a) => a.id === p.accountId);
                        const accTag = originAcc ? `[${originAcc.name}] ` : '';
                        return (
                          <option key={p.id} value={p.id}>
                            {accTag}{p.date} - {p.description} (Disp: {formatCLP(p.unallocatedPaymentBalance || 0)})
                          </option>
                        );
                      })}
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
                        Asignar Máximo Posible ({formatCLP(Math.min(purchase.netAmount, selectedPayment?.unallocatedPaymentBalance || 0))})
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder={`Ej: ${Math.min(purchase.netAmount, selectedPayment?.unallocatedPaymentBalance || 0)}`}
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 font-mono"
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
                  <div>
                    <p className="font-bold">No hay pagos con saldo disponible para asociar.</p>
                    <p className="text-amber-700 mt-0.5">
                      {!showAllAccounts
                        ? 'Activa el interruptor superior para buscar pagos o transferencias en tu Cuenta Corriente u otras cuentas.'
                        : 'Puedes registrar un abono manualmente con monto negativo o cargar una cartola con el pago de tu tarjeta.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center text-emerald-800 text-xs font-semibold">
              🎉 ¡Esta compra ha sido totalmente pagada/cubierta por abonos! Monto Real Utilizado restante = $0.
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
