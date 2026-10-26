import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Repeat,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Percent,
  Check
} from 'lucide-react';
import { Account, ComputedTransaction, Credit, Transaction } from '../types';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';

export interface CreditCardBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: ComputedTransaction[];
  credits: Credit[];
  currentPeriod: string;
  onGenerateBillingTransactions: (
    newTxs: Transaction[],
    paidCreditUpdates: { id: string; paidInstallments?: number; lastPaidPeriod: string }[]
  ) => Promise<void> | void;
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatPeriodLabel(period: string): string {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return period || '';
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString('es-CL', { month: 'long' });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${year}`;
}

export function getMonthDiff(fromPeriod: string, toPeriod: string): number {
  if (!fromPeriod || !toPeriod) return 0;
  const [fromY, fromM] = fromPeriod.slice(0, 7).split('-').map(Number);
  const [toY, toM] = toPeriod.slice(0, 7).split('-').map(Number);
  if (isNaN(fromY) || isNaN(fromM) || isNaN(toY) || isNaN(toM)) return 0;
  return (toY - fromY) * 12 + (toM - fromM);
}

export function addMonths(period: string, count: number): string {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  const [y, m] = period.split('-').map(Number);
  const date = new Date(y, m - 1 + count, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export const CreditCardBillingModal: React.FC<CreditCardBillingModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  credits,
  currentPeriod,
  onGenerateBillingTransactions
}) => {
  // Only Credit Card Accounts
  const creditCards = useMemo(
    () => accounts.filter((a) => a.type === 'credit_card'),
    [accounts]
  );

  // Selected Billing Period
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    currentPeriod || new Date().toISOString().slice(0, 7)
  );

  // Selected Credit Card
  const [selectedCardId, setSelectedCardId] = useState<string>(
    creditCards[0]?.id || ''
  );

  // UI accordion toggles & dropdown state
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState<boolean>(false);
  const cardDropdownRef = useRef<HTMLDivElement>(null);
  const [showTransactionsList, setShowTransactionsList] = useState<boolean>(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationSuccessMessage, setGenerationSuccessMessage] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardDropdownRef.current && !cardDropdownRef.current.contains(event.target as Node)) {
        setIsCardDropdownOpen(false);
      }
    }
    if (isCardDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCardDropdownOpen]);

  // Active card object
  const activeCard = useMemo(() => {
    return creditCards.find((c) => c.id === selectedCardId) || creditCards[0] || null;
  }, [creditCards, selectedCardId]);

  // 1. Transactions already registered for this card and period
  const cardTransactions = useMemo(() => {
    if (!activeCard) return [];
    return transactions.filter((tx) => {
      if (tx.accountId !== activeCard.id) return false;
      const txPeriod = tx.period || (tx.date ? tx.date.slice(0, 7) : '');
      if (txPeriod !== selectedPeriod) return false;
      if (isPaymentOrIncomeTransaction(tx) || tx.amount <= 0) return false;
      return true;
    });
  }, [transactions, activeCard, selectedPeriod]);

  // Total spent in registered transactions (using netAmount to consider payment allocations)
  const registeredSpendingTotal = useMemo(() => {
    return cardTransactions.reduce((sum, tx) => {
      const val = tx.netAmount !== undefined ? tx.netAmount : tx.amount;
      return sum + val;
    }, 0);
  }, [cardTransactions]);

  // 2. Installments (Cuotas TC) associated with this card
  const cardInstallments = useMemo(() => {
    if (!activeCard) return [];
    return credits.filter(
      (c) => c.type === 'cuotas_tc' && c.accountId === activeCard.id
    );
  }, [credits, activeCard]);

  // 3. Subscriptions & Other credits associated with this card
  const cardSubscriptions = useMemo(() => {
    if (!activeCard) return [];
    return credits.filter(
      (c) => c.type !== 'cuotas_tc' && c.accountId === activeCard.id
    );
  }, [credits, activeCard]);

  // Helper: check if a credit/installment is already registered in transactions for this period
  const checkIsAlreadyLoaded = (credit: Credit): boolean => {
    // Check 1: Explicit lastPaidPeriod matches
    if (credit.lastPaidPeriod === selectedPeriod) return true;

    // Check 2: Look for an exact or approximate match in cardTransactions
    const normCreditName = credit.name.trim().toLowerCase();
    const found = cardTransactions.some((tx) => {
      const normTxDesc = (tx.description || '').trim().toLowerCase();
      const normRawDesc = (tx.rawDescription || '').trim().toLowerCase();
      const nameMatches =
        normTxDesc.includes(normCreditName) ||
        normCreditName.includes(normTxDesc) ||
        normRawDesc.includes(normCreditName);

      const amountMatches =
        Math.abs(tx.amount - credit.installmentAmount) < 2 ||
        Math.abs(tx.amount - (credit.myShareAmount || 0)) < 2;

      const installmentsMatch =
        tx.installments &&
        credit.totalInstallments &&
        tx.installments.total === credit.totalInstallments;

      return nameMatches && (amountMatches || installmentsMatch);
    });

    return found;
  };

  // Available Periods for Dropdown Selector (Past 4 months to next 18 months)
  const availablePeriods = useMemo(() => {
    const base = currentPeriod || new Date().toISOString().slice(0, 7);
    const periodsSet = new Set<string>();

    for (let i = -4; i <= 0; i++) {
      periodsSet.add(addMonths(base, i));
    }
    for (let i = 1; i <= 18; i++) {
      periodsSet.add(addMonths(base, i));
    }
    if (selectedPeriod) {
      periodsSet.add(selectedPeriod);
    }

    return Array.from(periodsSet).sort();
  }, [currentPeriod, selectedPeriod]);

  const getPeriodOptionLabel = (p: string) => {
    const base = currentPeriod || new Date().toISOString().slice(0, 7);
    const label = formatPeriodLabel(p);
    if (p === base) {
      return `${label} • Actual`;
    }
    const diff = getMonthDiff(base, p);
    if (diff === 1) {
      return `${label} • Próximo Mes`;
    }
    return label;
  };

  // Detailed Analysis of Installments with Dynamic Projection for Future Months
  const installmentItems = useMemo(() => {
    const base = currentPeriod || new Date().toISOString().slice(0, 7);

    return cardInstallments
      .map((c) => {
        const isAlreadyLoaded = checkIsAlreadyLoaded(c);
        const total = c.totalInstallments || 0;
        let projectedNum = 1;
        let isStarted = true;

        if (c.startDate && /^\d{4}-\d{2}/.test(c.startDate)) {
          const startPeriod = c.startDate.slice(0, 7);
          const diff = getMonthDiff(startPeriod, selectedPeriod);
          if (diff < 0) {
            isStarted = false;
            projectedNum = 0;
          } else {
            projectedNum = diff + 1;
          }
        } else if (c.lastPaidPeriod && /^\d{4}-\d{2}/.test(c.lastPaidPeriod)) {
          const lastPeriod = c.lastPaidPeriod.slice(0, 7);
          const diff = getMonthDiff(lastPeriod, selectedPeriod);
          projectedNum = c.paidInstallments + diff;
          if (projectedNum < 1) {
            isStarted = false;
          }
        } else {
          const diff = getMonthDiff(base, selectedPeriod);
          const isBaseLoaded = c.lastPaidPeriod === base;
          const baseNum = isBaseLoaded ? c.paidInstallments : c.paidInstallments + 1;
          projectedNum = baseNum + diff;
          if (projectedNum < 1) {
            isStarted = false;
          }
        }

        // Check if finished prior to or in this period
        const isFinished = total > 0 && projectedNum > total;

        // Active in period if already loaded OR (started and not yet finished)
        const isActiveInThisPeriod = isAlreadyLoaded || (isStarted && !isFinished);

        return {
          credit: c,
          isAlreadyLoaded,
          isFinished,
          isStarted,
          isActiveInThisPeriod,
          nextInstallmentNum: projectedNum,
          amount: c.installmentAmount,
          userShare: c.myShareAmount || c.installmentAmount
        };
      })
      .filter((item) => item.isActiveInThisPeriod);
  }, [cardInstallments, cardTransactions, selectedPeriod, currentPeriod]);

  // Detailed Analysis of Subscriptions
  const subscriptionItems = useMemo(() => {
    return cardSubscriptions.map((c) => {
      const isAlreadyLoaded = checkIsAlreadyLoaded(c);
      return {
        credit: c,
        isAlreadyLoaded,
        amount: c.installmentAmount,
        userShare: c.myShareAmount || c.installmentAmount
      };
    });
  }, [cardSubscriptions, cardTransactions, selectedPeriod]);

  // Pending items that can be generated into transactions
  const pendingGeneratableItems = useMemo(() => {
    const list: Array<{
      id: string;
      credit: Credit;
      type: 'cuotas_tc' | 'suscripcion' | 'otro';
      nextInstallmentNum?: number;
      amount: number;
      userShare: number;
    }> = [];

    installmentItems.forEach((item) => {
      if (!item.isAlreadyLoaded && !item.isFinished) {
        list.push({
          id: item.credit.id,
          credit: item.credit,
          type: 'cuotas_tc',
          nextInstallmentNum: item.nextInstallmentNum,
          amount: item.amount,
          userShare: item.userShare
        });
      }
    });

    subscriptionItems.forEach((item) => {
      if (!item.isAlreadyLoaded) {
        list.push({
          id: item.credit.id,
          credit: item.credit,
          type: item.credit.type === 'suscripcion' ? 'suscripcion' : 'otro',
          amount: item.amount,
          userShare: item.userShare
        });
      }
    });

    return list;
  }, [installmentItems, subscriptionItems]);

  // Totals calculations
  const pendingInstallmentsGross = useMemo(() => {
    return installmentItems
      .filter((i) => !i.isAlreadyLoaded && !i.isFinished && selectedPendingIds[i.credit.id] !== false)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [installmentItems, selectedPendingIds]);

  const pendingInstallmentsUserShare = useMemo(() => {
    return installmentItems
      .filter((i) => !i.isAlreadyLoaded && !i.isFinished && selectedPendingIds[i.credit.id] !== false)
      .reduce((sum, i) => sum + i.userShare, 0);
  }, [installmentItems, selectedPendingIds]);

  const pendingSubscriptionsGross = useMemo(() => {
    return subscriptionItems
      .filter((i) => !i.isAlreadyLoaded && selectedPendingIds[i.credit.id] !== false)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [subscriptionItems, selectedPendingIds]);

  const pendingSubscriptionsUserShare = useMemo(() => {
    return subscriptionItems
      .filter((i) => !i.isAlreadyLoaded && selectedPendingIds[i.credit.id] !== false)
      .reduce((sum, i) => sum + i.userShare, 0);
  }, [subscriptionItems, selectedPendingIds]);

  // Grand Projected Total
  const totalProjectedGross = registeredSpendingTotal + pendingInstallmentsGross + pendingSubscriptionsGross;
  const totalProjectedUserShare = registeredSpendingTotal + pendingInstallmentsUserShare + pendingSubscriptionsUserShare;

  // Credit Limit Calculations
  const creditLimit = activeCard?.creditLimit || 0;
  const creditLimitUsagePct = creditLimit > 0 ? Math.min(100, Math.round((totalProjectedGross / creditLimit) * 100)) : 0;
  const creditAvailable = creditLimit > 0 ? Math.max(0, creditLimit - totalProjectedGross) : 0;

  // Cycle Info Calculation (days to closing)
  const cycleInfo = useMemo(() => {
    if (!activeCard || !activeCard.closingDay) {
      return {
        closingText: 'Día de corte no especificado',
        dueText: activeCard?.dueDay ? `Vence el día ${activeCard.dueDay}` : 'Día de pago no especificado',
        daysStatus: null
      };
    }

    const closingDay = activeCard.closingDay;
    const dueDay = activeCard.dueDay;

    // Check against today
    const now = new Date();
    const currentMonthStr = now.toISOString().slice(0, 7);

    let daysStatus: { text: string; badgeColor: string } | null = null;

    if (selectedPeriod === currentMonthStr) {
      const todayDay = now.getDate();
      if (todayDay < closingDay) {
        const diff = closingDay - todayDay;
        daysStatus = {
          text: `Faltan ${diff} día(s) para el corte`,
          badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        };
      } else if (todayDay === closingDay) {
        daysStatus = {
          text: '¡Hoy es el día de corte!',
          badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
        };
      } else {
        const diff = todayDay - closingDay;
        daysStatus = {
          text: `Corte cerrado hace ${diff} día(s)`,
          badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
        };
      }
    } else if (selectedPeriod < currentMonthStr) {
      daysStatus = {
        text: 'Período anterior (Cerrado)',
        badgeColor: 'text-slate-400 bg-slate-500/10 border-slate-500/30'
      };
    } else {
      daysStatus = {
        text: 'Período futuro proyectado',
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
      };
    }

    return {
      closingText: `Corte el día ${closingDay} de cada mes`,
      dueText: dueDay ? `Vence el día ${dueDay} del mes siguiente` : 'Día de pago no configurado',
      daysStatus
    };
  }, [activeCard, selectedPeriod]);

  // Handle Generate Action
  const handleGeneratePendingItems = async () => {
    if (!activeCard) return;

    // Filter items where checkbox is not explicitly false
    const itemsToGenerate = pendingGeneratableItems.filter(
      (item) => selectedPendingIds[item.id] !== false
    );

    if (itemsToGenerate.length === 0) return;

    setIsGenerating(true);
    setGenerationSuccessMessage(null);

    const [yearStr, monthStr] = selectedPeriod.split('-');
    const newTxs: Transaction[] = [];
    const paidCreditUpdates: { id: string; paidInstallments?: number; lastPaidPeriod: string }[] = [];

    itemsToGenerate.forEach((item, index) => {
      const c = item.credit;
      const targetDay = Math.min(
        28,
        Math.max(1, c.paymentDay || activeCard.closingDay || 1)
      );
      const dateStr = `${yearStr}-${monthStr}-${String(targetDay).padStart(2, '0')}`;

      const isSub = c.type === 'suscripcion';
      const isCuotas = c.type === 'cuotas_tc';

      const installmentNum = item.nextInstallmentNum || (c.paidInstallments + 1);

      const desc = isCuotas
        ? `${c.name} (Cuota ${installmentNum}/${c.totalInstallments})`
        : c.name;

      const newTx: Transaction = {
        id: `tx-billing-${Date.now()}-${index}`,
        accountId: activeCard.id,
        date: dateStr,
        period: selectedPeriod,
        description: desc,
        rawDescription: desc,
        amount: c.installmentAmount,
        originalTotalAmount: c.totalAmount || c.installmentAmount,
        transactionType: 'compra',
        category: isSub ? 'Servicios' : 'Tarjetas de Crédito',
        subcategory: isSub ? 'Suscripciones' : 'Cuotas TC',
        installments: isCuotas
          ? {
              current: installmentNum,
              total: c.totalInstallments
            }
          : undefined,
        allocations: []
      };

      newTxs.push(newTx);

      paidCreditUpdates.push({
        id: c.id,
        paidInstallments: isSub ? c.paidInstallments : Math.max(c.paidInstallments, installmentNum),
        lastPaidPeriod: selectedPeriod
      });
    });

    try {
      await onGenerateBillingTransactions(newTxs, paidCreditUpdates);
      setGenerationSuccessMessage(
        `🎉 ¡Se generaron ${newTxs.length} movimiento(s) en la cartola de ${formatPeriodLabel(selectedPeriod)}!`
      );
      // Auto-clear message after 5 seconds
      setTimeout(() => setGenerationSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error generating billing transactions:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Proyección de Facturación al Corte
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Tarjetas de Crédito
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calcula con exactitud cuánto facturará cada tarjeta sumando compras del mes, cuotas y suscripciones.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector & Card Selection Dropdown / Combo Box */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Card Selection Dropdown / Combo Box */}
          {creditCards.length === 0 ? (
            <div className="text-xs text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No tienes tarjetas de crédito registradas en tus cuentas.</span>
            </div>
          ) : (
            <div className="relative w-full sm:w-auto sm:min-w-[340px]" ref={cardDropdownRef}>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tarjeta de Crédito</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCardDropdownOpen(!isCardDropdownOpen)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950 border transition text-left shadow-sm ${
                  isCardDropdownOpen
                    ? 'border-indigo-500 ring-2 ring-indigo-500/25 bg-slate-950'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/80 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white truncate block">
                        {activeCard?.name}
                      </span>
                      {activeCard?.closingDay && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                          Corte día {activeCard.closingDay}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                      {activeCard?.bank}
                      {activeCard?.creditLimit ? ` • Cupo: ${formatCLP(activeCard.creditLimit)}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                  <span className="text-[10px] font-medium hidden sm:inline text-slate-500">
                    Cambiar
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isCardDropdownOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isCardDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 z-40 space-y-1 animate-fade-in max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 flex items-center justify-between">
                    <span>Tus Tarjetas de Crédito</span>
                    <span className="text-slate-500">{creditCards.length} disponibles</span>
                  </div>
                  {creditCards.map((card) => {
                    const isSelected = card.id === activeCard?.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setIsCardDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-500/30 border-indigo-400 text-indigo-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold truncate">
                                {card.name}
                              </span>
                              {card.closingDay && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                                  Corte día {card.closingDay}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                              {card.bank}
                              {card.creditLimit ? ` • Cupo: ${formatCLP(card.creditLimit)}` : ''}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Period Selector */}
          <div className="w-full sm:w-auto self-start sm:self-end shrink-0">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Período de Facturación</span>
              </span>
              {selectedPeriod > (currentPeriod || new Date().toISOString().slice(0, 7)) && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30">
                  Proyección Futura
                </span>
              )}
            </label>

            <div className="flex items-center gap-1.5">
              {/* Prev Month Button */}
              <button
                type="button"
                onClick={() => setSelectedPeriod((prev) => addMonths(prev, -1))}
                title="Mes anterior"
                className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Styled Select Dropdown */}
              <div className="relative flex-1 sm:w-56">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl pl-3 pr-8 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm appearance-none cursor-pointer"
                >
                  {availablePeriods.map((period) => (
                    <option key={period} value={period} className="bg-slate-900 text-white py-1">
                      {getPeriodOptionLabel(period)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Next Month Button */}
              <button
                type="button"
                onClick={() => setSelectedPeriod((prev) => addMonths(prev, 1))}
                title="Mes siguiente"
                className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {creditCards.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No se encontraron tarjetas de crédito</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Para proyectar tu facturación, ve a la sección <b>"Mis Cuentas"</b> y registra tu Tarjeta de Crédito con su día de corte y día de pago.
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
            {/* Success Toast */}
            {generationSuccessMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">{generationSuccessMessage}</span>
                </div>
                <button
                  onClick={() => setGenerationSuccessMessage(null)}
                  className="text-xs text-emerald-400 hover:underline font-bold"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* Cycle & Cupo Status Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200">
                      Ciclo de Facturación: {activeCard?.name} ({activeCard?.bank})
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {cycleInfo.closingText} • {cycleInfo.dueText}
                    </p>
                  </div>
                </div>

                {cycleInfo.daysStatus && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-center ${cycleInfo.daysStatus.badgeColor}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{cycleInfo.daysStatus.text}</span>
                  </span>
                )}
              </div>

              {/* Cupo Utilizado Bar (if creditLimit is defined) */}
              {creditLimit > 0 && (
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Cupo Total: {formatCLP(creditLimit)}</span>
                    <span className="text-indigo-300 font-bold">
                      {creditLimitUsagePct}% ocupado al corte • Disponible: {formatCLP(creditAvailable)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        creditLimitUsagePct > 85
                          ? 'bg-rose-500'
                          : creditLimitUsagePct > 60
                          ? 'bg-amber-400'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${creditLimitUsagePct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4 Grand Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Gastos del Mes */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>1. Gastos Registrados</span>
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-white tracking-tight">
                  {formatCLP(registeredSpendingTotal)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {cardTransactions.length} compra(s) ya en movimientos
                </span>
              </div>

              {/* Card 2: Cuotas por Facturar */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>2. Cuotas por Facturar</span>
                  <Layers className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-indigo-300 tracking-tight">
                  {formatCLP(pendingInstallmentsGross)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {installmentItems.filter((i) => !i.isAlreadyLoaded && !i.isFinished).length} compra(s) a plazo
                </span>
              </div>

              {/* Card 3: Suscripciones por Facturar */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>3. Suscripciones</span>
                  <Repeat className="w-4 h-4 text-pink-400" />
                </div>
                <div className="mt-2 text-xl font-bold text-pink-300 tracking-tight">
                  {formatCLP(pendingSubscriptionsGross)}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {subscriptionItems.filter((i) => !i.isAlreadyLoaded).length} cargo(s) recurrente(s)
                </span>
              </div>

              {/* Card 4: TOTAL ESTIMADO AL CORTE */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
                <div className="flex items-center justify-between text-xs text-indigo-300 font-bold uppercase tracking-wider">
                  <span>Total Facturación</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
                  {formatCLP(totalProjectedGross)}
                </div>
                <div className="text-[11px] text-indigo-300/80 mt-1 flex items-center justify-between">
                  <span>Mi parte personal:</span>
                  <b className="text-emerald-300 font-bold">{formatCLP(totalProjectedUserShare)}</b>
                </div>
              </div>
            </div>

            {/* Bloque 1: Gastos Registrados en el Mes (Accordion) */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden">
              <button
                onClick={() => setShowTransactionsList(!showTransactionsList)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/60 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>1. Gastos y Compras Registradas en este Período</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {cardTransactions.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Total acumulado hasta hoy: <b className="text-slate-200">{formatCLP(registeredSpendingTotal)}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{showTransactionsList ? 'Ocultar lista' : 'Ver detalle'}</span>
                  {showTransactionsList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showTransactionsList && (
                <div className="p-4 pt-0 border-t border-slate-800/60 space-y-2 max-h-60 overflow-y-auto">
                  {cardTransactions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-3 text-center">
                      No hay compras registradas en los movimientos de este período para esta tarjeta.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-800/60">
                      {cardTransactions.map((tx) => (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="text-white font-medium block truncate">{tx.description}</span>
                            <span className="text-[10px] text-slate-500 block">
                              {tx.date} • {tx.category} &gt; {tx.subcategory}
                              {tx.installments && (
                                <span className="text-indigo-400 ml-1.5 font-semibold">
                                  (Cuota {tx.installments.current}/{tx.installments.total})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-slate-200">
                              {formatCLP(tx.netAmount !== undefined ? tx.netAmount : tx.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bloque 2: Compras en Cuotas de la Tarjeta */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>2. Compras en Cuotas Asociadas a esta Tarjeta</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {installmentItems.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Cuotas programadas desde el módulo de Créditos y Cuotas.
                    </p>
                  </div>
                </div>
              </div>

              {installmentItems.length === 0 ? (
                cardInstallments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">
                    No tienes compras en cuotas vinculadas a esta tarjeta. Puedes asociarlas al registrar una compra en la pestaña "Compras en Cuotas".
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400/90 italic py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>🎉 No hay cuotas vigentes para facturar en este período. ¡Todas tus compras en cuotas registradas para esta tarjeta ya habrán finalizado para esta fecha!</span>
                  </p>
                )
              ) : (
                <div className="space-y-2">
                  {installmentItems.map(({ credit, isAlreadyLoaded, isFinished, nextInstallmentNum, amount, userShare }) => {
                    const isSelected = selectedPendingIds[credit.id] !== false;
                    return (
                      <div
                        key={credit.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          isAlreadyLoaded
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                            : isFinished
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {!isAlreadyLoaded && !isFinished ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedPendingIds((prev) => ({
                                  ...prev,
                                  [credit.id]: e.target.checked
                                }))
                              }
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 cursor-pointer shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className="font-bold text-white truncate">{credit.name}</h5>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-slate-400">
                              {isFinished ? (
                                <span className="text-emerald-400 font-semibold">🎉 Liquidado</span>
                              ) : isAlreadyLoaded ? (
                                <span className="text-emerald-400 font-medium">
                                  ✅ Ya cargado en movimientos (Cuota {nextInstallmentNum} de {credit.totalInstallments})
                                </span>
                              ) : (
                                <span>
                                  Cuota <b>{nextInstallmentNum}</b> de {credit.totalInstallments}
                                </span>
                              )}
                              {credit.isShared && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                                  Compartido {credit.mySharePercentage || 50}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-white text-xs block">{formatCLP(amount)}</span>
                          {credit.isShared && (
                            <span className="text-[10px] text-indigo-300 block">Mi parte: {formatCLP(userShare)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bloque 3: Suscripciones y Cargos Recurrentes */}
            <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>3. Suscripciones y Cargos Recurrentes en esta Tarjeta</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {cardSubscriptions.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Servicios vinculados que se cobran mensualmente a esta tarjeta.
                    </p>
                  </div>
                </div>
              </div>

              {subscriptionItems.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  No tienes suscripciones vinculadas a esta tarjeta. Puedes asociarlas al crear o editar una suscripción seleccionando esta tarjeta.
                </p>
              ) : (
                <div className="space-y-2">
                  {subscriptionItems.map(({ credit, isAlreadyLoaded, amount, userShare }) => {
                    const isSelected = selectedPendingIds[credit.id] !== false;
                    return (
                      <div
                        key={credit.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          isAlreadyLoaded
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {!isAlreadyLoaded ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedPendingIds((prev) => ({
                                  ...prev,
                                  [credit.id]: e.target.checked
                                }))
                              }
                              className="w-4 h-4 rounded text-pink-600 bg-slate-950 border-slate-700 focus:ring-pink-500 cursor-pointer shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className="font-bold text-white truncate">{credit.name}</h5>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-slate-400">
                              {isAlreadyLoaded ? (
                                <span className="text-emerald-400 font-medium">
                                  ✅ Cobro del mes ya registrado en movimientos
                                </span>
                              ) : (
                                <span>Cobro mensual estimado día {credit.paymentDay || 1}</span>
                              )}
                              {credit.isShared && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                                  Compartido {credit.mySharePercentage || 50}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-white text-xs block">{formatCLP(amount)}</span>
                          {credit.isShared && (
                            <span className="text-[10px] text-pink-300 block">Mi parte: {formatCLP(userShare)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bloque de Acción: Generar Cuotas y Suscripciones en Movimientos */}
            {pendingGeneratableItems.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Cargar Cargos Proyectados en Movimientos del Mes</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                    Inserta automáticamente en tu tabla de movimientos las {pendingGeneratableItems.length} cuota(s) y suscripción(es) seleccionadas para este período y tarjeta.
                  </p>
                </div>

                <button
                  onClick={handleGeneratePendingItems}
                  disabled={isGenerating || pendingGeneratableItems.filter((i) => selectedPendingIds[i.id] !== false).length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {isGenerating
                      ? 'Cargando movimientos...'
                      : `⚡ Generar ${
                          pendingGeneratableItems.filter((i) => selectedPendingIds[i.id] !== false).length
                        } Cargos en Movimientos`}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Período seleccionado: <b className="text-white">{formatPeriodLabel(selectedPeriod)}</b>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
