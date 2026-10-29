import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Percent,
  Clock,
  Sparkles,
  Link2,
  Receipt,
  Info
} from 'lucide-react';
import { Account, Transaction, Credit } from '../types';
import { getBillingCycleSummary } from '../utils/billingCycleUtils';
import {
  isPaymentOrIncomeTransaction,
  isCreditCardPaymentTransaction,
  computeTransactions
} from '../utils/paymentAllocation';

export interface ConfirmBillingPaymentData {
  sourceAccountId: string;
  cardId: string;
  amount: number;
  paymentType: 'total' | 'min' | 'custom';
  date: string;
  period: string;
}

export interface LinkExistingPaymentData {
  paymentTransactionId: string;
  cardId: string;
  period: string;
  amount: number;
}

export interface PayCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Account;
  accounts: Account[];
  transactions: Transaction[];
  credits?: Credit[];
  initialPeriod?: string;
  onConfirmPayment: (data: ConfirmBillingPaymentData) => Promise<void> | void;
  onLinkExistingPayment?: (data: LinkExistingPaymentData) => Promise<void> | void;
}

function formatCLP(val: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(val);
}

export const PayCreditCardModal: React.FC<PayCreditCardModalProps> = ({
  isOpen,
  onClose,
  card,
  accounts,
  transactions,
  credits = [],
  initialPeriod,
  onConfirmPayment,
  onLinkExistingPayment
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Main flow tab: 'new' (Create new movement) vs 'link' (Link existing from cartola)
  const [activeTab, setActiveTab] = useState<'new' | 'link'>('new');

  // Filter bank/cash accounts that can be used to pay
  const sourceAccountCandidates = useMemo(() => {
    return accounts.filter((a) => a.id !== card.id && a.type !== 'credit_card');
  }, [accounts, card.id]);

  const defaultSourceId = sourceAccountCandidates[0]?.id || '';

  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    initialPeriod || todayStr.slice(0, 7)
  );
  const [sourceAccountId, setSourceAccountId] = useState<string>(defaultSourceId);
  const [paymentOption, setPaymentOption] = useState<'total' | 'min' | 'custom'>('total');
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // -------------------------------------------------------------
  // TAB 2: LINK EXISTING PAYMENT FROM CARTOLA (Issue #48)
  // -------------------------------------------------------------
  const computedAllTransactions = useMemo(() => {
    return computeTransactions(transactions);
  }, [transactions]);

  // Find candidate existing payments / abonos with unallocated balance
  const candidatePayments = useMemo(() => {
    return computedAllTransactions
      .filter((tx) => {
        // Must have available unallocated capacity
        const unallocated = tx.unallocatedPaymentBalance ?? Math.abs(tx.amount);
        if (unallocated <= 0) return false;

        // Is it classified as payment / abono?
        if (
          isCreditCardPaymentTransaction(tx) ||
          isPaymentOrIncomeTransaction(tx) ||
          tx.transactionType === 'pago_tc'
        ) {
          return true;
        }

        // Positive movement directly in this card
        if (tx.accountId === card.id && tx.amount > 0) return true;

        // Category or subcategory matches
        const cat = (tx.category || '').toLowerCase();
        const sub = (tx.subcategory || '').toLowerCase();
        if (cat.includes('abono') || cat.includes('pago') || sub.includes('pago') || sub.includes('abono')) {
          return true;
        }

        // Description matches card payment or transfer
        const desc = (tx.description || '').toLowerCase();
        const rawDesc = (tx.rawDescription || '').toLowerCase();
        const isDescPayment =
          (desc.includes('pago') || desc.includes('abono') || desc.includes('transf') || desc.includes('cartola')) &&
          (desc.includes('tc') || desc.includes('tarjeta') || desc.includes('credito') || desc.includes(card.name.toLowerCase()) || rawDesc.includes('pago'));

        return isDescPayment;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [computedAllTransactions, card]);

  const [selectedLinkedPaymentId, setSelectedLinkedPaymentId] = useState<string>(
    candidatePayments[0]?.id || ''
  );
  const [linkAmountStr, setLinkAmountStr] = useState<string>('');

  useEffect(() => {
    if (candidatePayments.length > 0 && !candidatePayments.some((p) => p.id === selectedLinkedPaymentId)) {
      setSelectedLinkedPaymentId(candidatePayments[0].id);
    }
  }, [candidatePayments, selectedLinkedPaymentId]);

  const selectedLinkedPayment = useMemo(() => {
    return candidatePayments.find((p) => p.id === selectedLinkedPaymentId) || candidatePayments[0];
  }, [candidatePayments, selectedLinkedPaymentId]);

  // Calculate billing summary for the card in selected period
  const billingSummary = useMemo(() => {
    return getBillingCycleSummary(card, transactions, credits, selectedPeriod);
  }, [card, transactions, credits, selectedPeriod]);

  // Calculate balances of candidate accounts
  const sourceAccountBalances = useMemo(() => {
    const map = new Map<string, number>();
    sourceAccountCandidates.forEach((acc) => {
      const accTxs = transactions.filter((t) => t.accountId === acc.id);
      let income = 0;
      let expense = 0;
      accTxs.forEach((t) => {
        const isIncomeOrPay = isPaymentOrIncomeTransaction(t);
        const amt = Math.abs(t.amount);
        if (isIncomeOrPay) income += amt;
        else expense += amt;
      });
      const balance = (acc.initialBalance || 0) + income - expense;
      map.set(acc.id, balance);
    });
    return map;
  }, [sourceAccountCandidates, transactions]);

  const selectedSourceAccount = useMemo(() => {
    return accounts.find((a) => a.id === sourceAccountId);
  }, [accounts, sourceAccountId]);

  const sourceCurrentBalance = useMemo(() => {
    return sourceAccountBalances.get(sourceAccountId) || 0;
  }, [sourceAccountBalances, sourceAccountId]);

  // Target amounts
  const totalFacturado = billingSummary?.totalBilled || 0;
  const totalPaid = billingSummary?.totalPaid || 0;
  const pendingBalance = billingSummary?.pendingBalance || 0;
  const rawMin = billingSummary?.minPayment || 0;
  const minPending = Math.max(0, Math.min(pendingBalance, rawMin - totalPaid));
  const suggestedMin = minPending > 0 ? minPending : Math.min(pendingBalance, rawMin);

  // Determine effective amount for NEW payment
  const effectiveAmount = useMemo(() => {
    if (paymentOption === 'total') {
      return pendingBalance;
    }
    if (paymentOption === 'min') {
      return suggestedMin;
    }
    const parsed = parseFloat(customAmountStr.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [paymentOption, pendingBalance, suggestedMin, customAmountStr]);

  const sourceAfterBalance = sourceCurrentBalance - effectiveAmount;
  const pendingAfterPayment = Math.max(0, pendingBalance - effectiveAmount);
  const revolvingAfterPayment = pendingAfterPayment;
  const willCoverTotal = pendingAfterPayment === 0 && effectiveAmount > 0;
  const willCoverMin = (totalPaid + effectiveAmount) >= rawMin && !willCoverTotal;

  // Determine effective amount for LINKED payment
  const maxLinkAvailable = selectedLinkedPayment?.unallocatedPaymentBalance ?? 0;
  const defaultLinkAmount = Math.min(pendingBalance, maxLinkAvailable);

  const effectiveLinkAmount = useMemo(() => {
    if (!selectedLinkedPayment) return 0;
    if (linkAmountStr === '') return defaultLinkAmount;
    const parsed = parseFloat(linkAmountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, maxLinkAvailable);
  }, [linkAmountStr, defaultLinkAmount, maxLinkAvailable, selectedLinkedPayment]);

  const pendingAfterLink = Math.max(0, pendingBalance - effectiveLinkAmount);
  const willCoverTotalWithLink = pendingAfterLink === 0 && effectiveLinkAmount > 0;

  // Form submit for NEW payment
  const handleConfirmNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!sourceAccountId) {
      setErrorMessage('Selecciona una cuenta de origen desde donde saldrá el pago.');
      return;
    }

    if (effectiveAmount <= 0) {
      setErrorMessage('Ingresa un monto de pago mayor a 0 CLP.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmPayment({
        sourceAccountId,
        cardId: card.id,
        amount: Math.round(effectiveAmount),
        paymentType: paymentOption,
        date: paymentDate,
        period: selectedPeriod
      });
      onClose();
    } catch (err: any) {
      console.error('Error procesando pago de facturación:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al registrar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit for LINKING existing payment
  const handleConfirmLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedLinkedPaymentId || !selectedLinkedPayment) {
      setErrorMessage('Selecciona una transacción de pago o abono existente para vincular.');
      return;
    }

    if (effectiveLinkAmount <= 0) {
      setErrorMessage('Ingresa un monto a vincular mayor a 0 CLP.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (onLinkExistingPayment) {
        await onLinkExistingPayment({
          paymentTransactionId: selectedLinkedPayment.id,
          cardId: card.id,
          period: selectedPeriod,
          amount: Math.round(effectiveLinkAmount)
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Error vinculando pago existente:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al vincular la transacción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#111118] border-b border-[#302840] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 shadow-inner shrink-0">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-headline font-black text-white">
                  Pagar Facturación • {card.name}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1A1A2E] text-[#00FFCC] border border-[#00FFCC]/30 font-bold">
                  {card.currency || 'CLP'}
                </span>
              </div>
              <p className="text-xs text-[#A098B0] font-sans mt-0.5">
                Liquida el estado de cuenta mensual de tu tarjeta o vincula abonos de tu cartola.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition border border-transparent hover:border-[#302840]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Cycle & Status Selector Card */}
          <div className="p-4 rounded-2xl bg-[#0E0E18] border border-[#302840] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00FFCC]" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Período de Facturación:
                </span>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-[#141422] border border-[#302840] rounded-xl px-2.5 py-1 text-xs font-mono text-[#00FFCC] font-bold focus:outline-none focus:border-[#00FFCC]"
                />
              </div>

              {/* Status Pill */}
              {billingSummary && (
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${billingSummary.statusBadgeColor}`}>
                  {billingSummary.statusLabel}
                </span>
              )}
            </div>

            {/* KPI Summary of the Statement */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#302840]/60">
              <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]/60 text-center">
                <span className="text-[10px] font-mono text-[#A098B0] block">Total Facturado</span>
                <span className="text-sm font-headline font-black text-white">
                  {formatCLP(totalFacturado)}
                </span>
              </div>
              <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]/60 text-center">
                <span className="text-[10px] font-mono text-[#A098B0] block">Abonos Aplicados</span>
                <span className="text-sm font-headline font-black text-[#00FFCC]">
                  {formatCLP(totalPaid)}
                </span>
              </div>
              <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]/60 text-center">
                <span className="text-[10px] font-mono text-[#A098B0] block">Saldo Pendiente</span>
                <span className="text-sm font-headline font-black text-rose-400">
                  {formatCLP(pendingBalance)}
                </span>
              </div>
              <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]/60 text-center">
                <span className="text-[10px] font-mono text-[#A098B0] block">Pago Mínimo</span>
                <span className="text-sm font-headline font-black text-[#FFE04A]">
                  {formatCLP(rawMin)}
                </span>
              </div>
            </div>
          </div>

          {/* TAB NAVIGATION SWITCHER (Issue #48) */}
          <div className="flex items-center gap-2 p-1.5 bg-[#0E0E18] rounded-2xl border border-[#302840]">
            <button
              type="button"
              onClick={() => setActiveTab('new')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-headline font-bold transition ${
                activeTab === 'new'
                  ? 'bg-[#00FFCC] text-[#05070E] shadow-md shadow-[#00FFCC]/20'
                  : 'text-[#A098B0] hover:text-white hover:bg-[#1A1A2E]'
              }`}
            >
              <CreditCard className="w-4 h-4 stroke-[2.2]" />
              <span>Registrar Nuevo Pago</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-headline font-bold transition ${
                activeTab === 'link'
                  ? 'bg-[#00FFCC] text-[#05070E] shadow-md shadow-[#00FFCC]/20'
                  : 'text-[#A098B0] hover:text-white hover:bg-[#1A1A2E]'
              }`}
            >
              <Link2 className="w-4 h-4 stroke-[2.2]" />
              <span>Vincular Pago Existente (Cartola)</span>
              {candidatePayments.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${activeTab === 'link' ? 'bg-[#05070E] text-[#00FFCC]' : 'bg-[#00FFCC]/20 text-[#00FFCC]'}`}>
                  {candidatePayments.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: FORM FOR CREATING NEW PAYMENT */}
          {activeTab === 'new' && (
            <form onSubmit={handleConfirmNew} className="space-y-5">
              
              {/* Payment Amount Selection (3 Radio Cards) */}
              <div className="space-y-2.5">
                <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider">
                  1. Modalidad de Pago
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Option 1: Pagar Total Facturado */}
                  <div
                    onClick={() => setPaymentOption('total')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      paymentOption === 'total'
                        ? 'bg-[#00FFCC]/10 border-[#00FFCC] shadow-lg shadow-[#00FFCC]/10'
                        : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-headline font-bold text-white uppercase tracking-wider">
                          Total Facturado
                        </span>
                        {paymentOption === 'total' && (
                          <div className="w-2 h-2 rounded-full bg-[#00FFCC] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#A098B0] font-sans">
                        Cubre el 100% de la facturación y evita intereses.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#302840]/60">
                      <span className="text-sm sm:text-base font-headline font-black text-white">
                        {formatCLP(pendingBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Option 2: Pago Mínimo */}
                  <div
                    onClick={() => setPaymentOption('min')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      paymentOption === 'min'
                        ? 'bg-[#FFE04A]/10 border-[#FFE04A] shadow-lg shadow-[#FFE04A]/10'
                        : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-headline font-bold text-white uppercase tracking-wider flex items-center gap-1">
                          <span>Pago Mínimo</span>
                          <Percent className="w-3 h-3 text-[#FFE04A]" />
                        </span>
                        {paymentOption === 'min' && (
                          <div className="w-2 h-2 rounded-full bg-[#FFE04A] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#A098B0] font-sans">
                        Mantiene tu tarjeta al día pero genera intereses rotativos.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#302840]/60">
                      <span className="text-sm sm:text-base font-headline font-black text-[#FFE04A]">
                        {formatCLP(suggestedMin)}
                      </span>
                    </div>
                  </div>

                  {/* Option 3: Monto Personalizado */}
                  <div
                    onClick={() => setPaymentOption('custom')}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                      paymentOption === 'custom'
                        ? 'bg-[#7928CA]/10 border-[#7928CA] shadow-lg shadow-[#7928CA]/10'
                        : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-headline font-bold text-white uppercase tracking-wider">
                          Otro Monto
                        </span>
                        {paymentOption === 'custom' && (
                          <div className="w-2 h-2 rounded-full bg-[#7928CA] animate-pulse" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#A098B0] font-sans">
                        Ingresa una cantidad personalizada para abonar.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#302840]/60">
                      {paymentOption === 'custom' ? (
                        <input
                          type="number"
                          autoFocus
                          placeholder="Ej: 50000"
                          value={customAmountStr}
                          onChange={(e) => setCustomAmountStr(e.target.value)}
                          className="w-full bg-[#141422] border border-[#7928CA] text-white px-2 py-1 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#7928CA]"
                        />
                      ) : (
                        <span className="text-xs font-mono text-[#A098B0]">Personalizado...</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Source Account & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Source Bank Account */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#00FFCC]" />
                    <span>2. Cuenta de Origen</span>
                  </label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full bg-[#0E0E18] border border-[#302840] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#00FFCC]"
                  >
                    {sourceAccountCandidates.map((acc) => {
                      const balance = sourceAccountBalances.get(acc.id) || 0;
                      return (
                        <option key={acc.id} value={acc.id} className="bg-[#141422] text-white">
                          {acc.name} — Saldo: {formatCLP(balance)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Payment Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00FFCC]" />
                    <span>3. Fecha del Pago</span>
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#0E0E18] border border-[#302840] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#00FFCC]"
                  />
                </div>

              </div>

              {/* Live Financial Impact Preview Box */}
              <div className="p-4 rounded-2xl bg-[#0E0E18] border border-[#302840] space-y-3">
                <span className="text-xs font-headline font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00FFCC]" />
                  Impacto del Pago en Tiempo Real
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  
                  <div className="p-2.5 rounded-xl bg-[#141422] border border-[#302840]">
                    <span className="text-[#A098B0] text-[10px] block">Cuenta Origen ({selectedSourceAccount?.name || 'Banco'}):</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-400 line-through">{formatCLP(sourceCurrentBalance)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className={`font-bold ${sourceAfterBalance >= 0 ? 'text-[#00FFCC]' : 'text-rose-400'}`}>
                        {formatCLP(sourceAfterBalance)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#141422] border border-[#302840]">
                    <span className="text-[#A098B0] text-[10px] block">Deuda Pendiente ({card.name}):</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-400 line-through">{formatCLP(pendingBalance)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className={`font-bold ${pendingAfterPayment === 0 ? 'text-[#00FFCC]' : 'text-[#FFE04A]'}`}>
                        {formatCLP(pendingAfterPayment)}
                      </span>
                    </div>
                  </div>

                </div>

                {revolvingAfterPayment > 0 && effectiveAmount > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Saldo rotativo diferido:</span>
                      <span>
                        Quedarán <b className="font-mono">{formatCLP(revolvingAfterPayment)}</b> sin cubrir. Este monto pasará al próximo ciclo y devengará intereses rotativos bancarios.
                      </span>
                    </div>
                  </div>
                )}

                {willCoverTotal && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>¡Excelente! Tu estado de cuenta quedará pagado al 100% y al día.</span>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#302840]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-headline font-bold text-[#A098B0] hover:text-white bg-[#0E0E18] hover:bg-[#1A1A2E] border border-[#302840] transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || effectiveAmount <= 0}
                  className="flex items-center gap-2 bg-[#00FFCC] hover:bg-[#00e6b8] disabled:opacity-50 disabled:cursor-not-allowed text-[#05070E] font-headline font-black text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-[#00FFCC]/20 transition transform hover:scale-[1.02] active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Procesando pago...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar Pago de {formatCLP(effectiveAmount)}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: LINK EXISTING PAYMENT FROM CARTOLA (Issue #48) */}
          {activeTab === 'link' && (
            <form onSubmit={handleConfirmLink} className="space-y-5">
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#00FFCC]" />
                    <span>Selecciona el Pago / Abono de Cartola</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#A098B0]">
                    {candidatePayments.length} movimiento(s) disponible(s)
                  </span>
                </div>

                {candidatePayments.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#0E0E18] border border-[#302840] text-center space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-white font-headline font-bold">
                      No se encontraron abonos o pagos disponibles en tus cuentas
                    </p>
                    <p className="text-[11px] text-[#A098B0] font-sans max-w-md mx-auto">
                      Importa primero tu cartola bancaria donde figure la transferencia o pago de la tarjeta, o utiliza la pestaña <b>"Registrar Nuevo Pago"</b>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {candidatePayments.map((p) => {
                      const originAcc = accounts.find((a) => a.id === p.accountId);
                      const isSelected = p.id === selectedLinkedPaymentId;
                      const avail = p.unallocatedPaymentBalance ?? Math.abs(p.amount);

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedLinkedPaymentId(p.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#00FFCC]/10 border-[#00FFCC] shadow-md shadow-[#00FFCC]/10'
                              : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#00FFCC] bg-[#00FFCC]' : 'border-slate-500'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-headline font-bold text-white">
                                  {p.description}
                                </span>
                                {originAcc && (
                                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#1A1A2E] text-[#A098B0] border border-[#302840]">
                                    {originAcc.name}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#A098B0] font-mono block">
                                {p.date} • Monto original: {formatCLP(Math.abs(p.amount))}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-[#00FFCC] block">
                              Disp: {formatCLP(avail)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {isSelected ? 'Seleccionado' : 'Click para elegir'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Amount to allocate input */}
              {selectedLinkedPayment && (
                <div className="space-y-2 p-4 rounded-2xl bg-[#0E0E18] border border-[#302840]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-headline font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#00FFCC]" />
                      <span>Monto a Imputar a esta Facturación</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLinkAmountStr(String(defaultLinkAmount))}
                        className="text-[11px] font-mono text-[#00FFCC] hover:underline"
                      >
                        Sugerido ({formatCLP(defaultLinkAmount)})
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setLinkAmountStr(String(maxLinkAvailable))}
                        className="text-[11px] font-mono text-[#A098B0] hover:text-white"
                      >
                        Todo el Abono ({formatCLP(maxLinkAvailable)})
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    placeholder={`Ej: ${defaultLinkAmount}`}
                    value={linkAmountStr === '' ? defaultLinkAmount : linkAmountStr}
                    onChange={(e) => setLinkAmountStr(e.target.value)}
                    max={maxLinkAvailable}
                    min={1}
                    className="w-full bg-[#141422] border border-[#302840] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#00FFCC]"
                  />

                  <p className="text-[11px] text-[#A098B0] font-sans">
                    Capacidad máxima disponible en este movimiento: <b className="font-mono text-white">{formatCLP(maxLinkAvailable)}</b>
                  </p>
                </div>
              )}

              {/* Real-time Impact for Linking */}
              <div className="p-4 rounded-2xl bg-[#0E0E18] border border-[#302840] space-y-3">
                <span className="text-xs font-headline font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#00FFCC]" />
                  Impacto de la Conciliación
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#141422] border border-[#302840]">
                    <span className="text-[#A098B0] text-[10px] block">Deuda Pendiente ({card.name}):</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-400 line-through">{formatCLP(pendingBalance)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className={`font-bold ${pendingAfterLink === 0 ? 'text-[#00FFCC]' : 'text-[#FFE04A]'}`}>
                        {formatCLP(pendingAfterLink)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#141422] border border-[#302840]">
                    <span className="text-[#A098B0] text-[10px] block">Capacidad Restante del Abono:</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-slate-400 line-through">{formatCLP(maxLinkAvailable)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-[#00FFCC]">
                        {formatCLP(Math.max(0, maxLinkAvailable - effectiveLinkAmount))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <b>Cero transacciones duplicadas:</b> Se vinculará el movimiento real de tu cartola a las compras pendientes del ciclo sin crear egresos adicionales.
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#302840]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-headline font-bold text-[#A098B0] hover:text-white bg-[#0E0E18] hover:bg-[#1A1A2E] border border-[#302840] transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || candidatePayments.length === 0 || effectiveLinkAmount <= 0}
                  className="flex items-center gap-2 bg-[#00FFCC] hover:bg-[#00e6b8] disabled:opacity-50 disabled:cursor-not-allowed text-[#05070E] font-headline font-black text-xs py-2.5 px-5 rounded-xl shadow-lg shadow-[#00FFCC]/20 transition transform hover:scale-[1.02] active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Vinculando pago...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Vincular {formatCLP(effectiveLinkAmount)} a esta Facturación</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
