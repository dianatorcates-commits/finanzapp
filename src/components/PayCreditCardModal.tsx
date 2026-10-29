import React, { useState, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Account, Transaction, Credit } from '../types';
import { getBillingCycleSummary } from '../utils/billingCycleUtils';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';

export interface ConfirmBillingPaymentData {
  sourceAccountId: string;
  cardId: string;
  amount: number;
  paymentType: 'total' | 'min' | 'custom';
  date: string;
  period: string;
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
  onConfirmPayment
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter bank/cash accounts that can be used to pay
  const sourceAccountCandidates = useMemo(() => {
    return accounts.filter((a) => a.id !== card.id && a.type !== 'credit_card');
  }, [accounts, card.id]);

  // Default source account
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

  // Selected source account object and current balance
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

  // Determine effective amount based on selection
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

  // Balance impact calculations
  const sourceAfterBalance = sourceCurrentBalance - effectiveAmount;
  const pendingAfterPayment = Math.max(0, pendingBalance - effectiveAmount);
  const revolvingAfterPayment = pendingAfterPayment;
  const willCoverTotal = pendingAfterPayment === 0 && effectiveAmount > 0;
  const willCoverMin = (totalPaid + effectiveAmount) >= rawMin && !willCoverTotal;

  // Form submit
  const handleConfirm = async (e: React.FormEvent) => {
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

    if (effectiveAmount > sourceCurrentBalance) {
      // Allow overdraft warning but inform
      // or we can allow negative balances with warning
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
                <h2 className="text-lg sm:text-xl font-headline font-black text-white tracking-tight">
                  Registrar Pago de Facturación
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30">
                  {card.name}
                </span>
              </div>
              <p className="text-xs text-[#A098B0] mt-0.5 font-sans">
                Registra el pago de tu estado de cuenta con débito automático en tu cuenta bancaria y conciliación de saldo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Period and Status Banner */}
          <div className="p-4 rounded-2xl bg-[#0E0E18] border border-[#302840] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

          {/* Payment Amount Selection (3 Radio Cards) */}
          <div className="space-y-2.5">
            <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider">
              1. Selecciona la Modalidad de Pago
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Option 1: Pagar Total Facturado */}
              <div
                onClick={() => setPaymentOption('total')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  paymentOption === 'total'
                    ? 'bg-[#1C1C30] border-[#00FFCC] shadow-[0_0_15px_rgba(0,255,204,0.15)] ring-1 ring-[#00FFCC]'
                    : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#00FFCC]" />
                      Total Facturado
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30">
                      Recomendado
                    </span>
                  </div>
                  <div className="text-lg font-headline font-black text-white font-mono mt-1">
                    {formatCLP(pendingBalance)}
                  </div>
                </div>
                <p className="text-[10px] text-[#A098B0] mt-2 font-sans leading-tight">
                  Cancela el 100% de la deuda del ciclo. Cero intereses rotativos.
                </p>
              </div>

              {/* Option 2: Pagar Monto Mínimo */}
              <div
                onClick={() => setPaymentOption('min')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  paymentOption === 'min'
                    ? 'bg-[#1C1C30] border-[#FFE04A] shadow-[0_0_15px_rgba(255,224,74,0.15)] ring-1 ring-[#FFE04A]'
                    : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-[#FFE04A]" />
                      Pago Mínimo
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FFE04A]/15 text-[#FFE04A] border border-[#FFE04A]/30">
                      Evita mora
                    </span>
                  </div>
                  <div className="text-lg font-headline font-black text-[#FFE04A] font-mono mt-1">
                    {formatCLP(suggestedMin)}
                  </div>
                </div>
                <p className="text-[10px] text-[#A098B0] mt-2 font-sans leading-tight">
                  Evita cargos por mora. El saldo restante pasará a generar intereses.
                </p>
              </div>

              {/* Option 3: Monto Personalizado */}
              <div
                onClick={() => setPaymentOption('custom')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  paymentOption === 'custom'
                    ? 'bg-[#1C1C30] border-[#FF2D78] shadow-[0_0_15px_rgba(255,45,120,0.15)] ring-1 ring-[#FF2D78]'
                    : 'bg-[#0E0E18] border-[#302840] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#FF2D78]" />
                      Otro Monto
                    </span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30">
                      Libre
                    </span>
                  </div>
                  <div className="text-lg font-headline font-black text-[#FF2D78] font-mono mt-1">
                    {effectiveAmount > 0 && paymentOption === 'custom' ? formatCLP(effectiveAmount) : '$0'}
                  </div>
                </div>
                <p className="text-[10px] text-[#A098B0] mt-2 font-sans leading-tight">
                  Abona una cantidad específica según tu disponibilidad actual.
                </p>
              </div>

            </div>

            {/* Custom Amount Numeric Input */}
            {paymentOption === 'custom' && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-mono text-[#A098B0] mb-1">
                  Ingresa el monto exacto a pagar (CLP):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="text"
                    value={customAmountStr}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      setCustomAmountStr(raw ? Number(raw).toLocaleString('es-CL') : '');
                    }}
                    placeholder="Ej. 150.000"
                    className="w-full bg-[#0E0E18] border border-[#FF2D78] text-white pl-8 pr-4 py-2.5 rounded-xl font-mono font-bold text-sm focus:outline-none shadow-sm"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          {/* Source Account & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Source Account Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider">
                2. Cuenta Origen (¿De dónde sale el dinero?)
              </label>
              {sourceAccountCandidates.length === 0 ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                  No tienes cuentas corrientes, vista ni efectivo configuradas. Crea una cuenta bancaria primero.
                </div>
              ) : (
                <select
                  value={sourceAccountId}
                  onChange={(e) => setSourceAccountId(e.target.value)}
                  className="w-full bg-[#0E0E18] border border-[#302840] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#00FFCC]"
                >
                  {sourceAccountCandidates.map((acc) => {
                    const bal = sourceAccountBalances.get(acc.id) || 0;
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bank}) • Saldo: {formatCLP(bal)}
                      </option>
                    );
                  })}
                </select>
              )}
              {selectedSourceAccount && (
                <p className="text-[11px] text-[#A098B0] flex items-center justify-between font-mono px-1">
                  <span>Saldo disponible actual:</span>
                  <span className="text-[#00FFCC] font-bold">{formatCLP(sourceCurrentBalance)}</span>
                </p>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-headline font-bold text-slate-300 uppercase tracking-wider">
                3. Fecha del Pago
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-[#0E0E18] border border-[#302840] text-white px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#00FFCC]"
              />
              <p className="text-[11px] text-[#A098B0] font-sans px-1">
                Fecha contable en la que se registra el egreso y el abono.
              </p>
            </div>

          </div>

          {/* Live Financial Impact Preview Box */}
          <div className="p-4 rounded-2xl bg-[#0E0E18] border border-[#302840] space-y-3">
            <span className="text-xs font-headline font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#00FFCC]" />
              Impacto del Pago en Tiempo Real
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              
              {/* Account Balance Effect */}
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

              {/* Card Statement Effect */}
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

            {/* Revolving balance alert if partial / min */}
            {revolvingAfterPayment > 0 && effectiveAmount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Saldo rotativo diferido:</span>
                  <span>
                    Quedarán <b className="font-mono">{formatCLP(revolvingAfterPayment)}</b> sin cubrir. Este monto pasará al estado de cuenta del próximo ciclo y devengará intereses rotativos bancarios.
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

          {/* Error Message */}
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

      </div>
    </div>
  );
};
