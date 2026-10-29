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
import { getBillingCycleSummary } from '../utils/billingCycleUtils';
import { getBankBranding } from './AccountsManagementView';

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
  onOpenPayBillingModal?: (card: Account, period?: string) => void;
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

/**
 * Normaliza cadenas para comparación de texto inteligente:
 * minúsculas, remoción de acentos/diacríticos y caracteres especiales.
 */
export function normalizeSearchText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Stopwords comunes en glosas bancarias y financieras en español */
export const FINANCE_STOPWORDS = new Set([
  'compra', 'compras',
  'cuota', 'cuotas', 'cta', 'ctas',
  'en', 'de', 'del', 'la', 'las', 'el', 'los', 'al', 'por', 'para', 'con', 'sin', 'un', 'una',
  'tc', 'td', 'tarjeta', 'credito', 'debito', 'visa', 'mastercard', 'amex',
  'pago', 'pagos', 'abono', 'cargo', 'int', 'interes', 'tasa',
  'transbank', 'redcompra',
  'sa', 'spa', 'ltda', 'limitada', 'eirl', 'cl', 'com', 'chile', 'santiago'
]);

/**
 * Extrae tokens significativos eliminando stopwords y palabras muy cortas
 */
export function extractSignificantTokens(name: string): string[] {
  const normalized = normalizeSearchText(name);
  if (!normalized) return [];
  const words = normalized.split(' ').filter((w) => w.length >= 2);
  const filtered = words.filter((w) => !FINANCE_STOPWORDS.has(w) && w.length >= 3);
  if (filtered.length > 0) {
    return filtered;
  }
  return words;
}

/**
 * Extrae número de cuota actual y total de una glosa bancaria si están presentes
 * Ej: "(Cuota 4/24)", "Cuota 04/24", "Cta 4 de 24", "(4/24)"
 */
export function parseInstallmentsFromText(text: string): { current: number; total: number } | null {
  if (!text) return null;
  const match1 = text.match(/(?:cuota|cta|cuotas)\s*(\d{1,2})\s*(?:\/|de)\s*(\d{1,2})/i);
  if (match1) {
    const current = parseInt(match1[1], 10);
    const total = parseInt(match1[2], 10);
    if (!isNaN(current) && !isNaN(total) && total > 0) {
      return { current, total };
    }
  }
  const match2 = text.match(/\((\d{1,2})\s*\/\s*(\d{1,2})\)/);
  if (match2) {
    const current = parseInt(match2[1], 10);
    const total = parseInt(match2[2], 10);
    if (!isNaN(current) && !isNaN(total) && total > 0 && total <= 72) {
      return { current, total };
    }
  }
  return null;
}

/**
 * Evalúa afinidad de texto entre el nombre de un crédito y la glosa de la transacción
 */
export function evaluateTextMatch(
  creditName: string,
  txDescription: string,
  txRawDescription?: string
): { matches: boolean; score: number } {
  const normName = normalizeSearchText(creditName);
  const fullTxText = normalizeSearchText(`${txDescription} ${txRawDescription || ''}`);
  if (!normName || !fullTxText) {
    return { matches: false, score: 0 };
  }

  // Coincidencia exacta o inclusión de cadena completa si tiene al menos 3 caracteres
  if (normName.length >= 3 && fullTxText.includes(normName)) {
    return { matches: true, score: 70 };
  }

  const tokens = extractSignificantTokens(creditName);
  if (tokens.length === 0) {
    return { matches: false, score: 0 };
  }

  const txWords = fullTxText.split(' ').filter((w) => w.length >= 2);
  let matchedTokens = 0;

  for (const token of tokens) {
    // Si alguna palabra de la transacción es igual o comienza con el token (ej: "mac" -> "maconline")
    const hasWordMatch = txWords.some((tw) => {
      if (tw === token) return true;
      if (token.length >= 3 && tw.startsWith(token)) return true;
      if (token.length >= 4 && tw.includes(token)) return true;
      if (tw.length >= 4 && token.includes(tw)) return true;
      return false;
    });

    if (hasWordMatch || (token.length >= 4 && fullTxText.includes(token))) {
      matchedTokens++;
    }
  }

  if (matchedTokens > 0) {
    const score = matchedTokens >= 2 ? 60 : 50;
    return { matches: true, score };
  }

  return { matches: false, score: 0 };
}

export interface CreditMatchResult {
  isLoaded: boolean;
  matchedTx: ComputedTransaction | null;
  installmentInfo?: { current: number; total: number };
}

/**
 * Motor Multi-Factor para asociar créditos/cuotas/suscripciones con movimientos existentes en la cartola
 */
export function findCreditMatch(
  credit: Credit,
  transactions: ComputedTransaction[],
  selectedPeriod: string,
  claimedTxIds: Set<string>
): CreditMatchResult {
  // Check 1: Explicit lastPaidPeriod matches
  if (credit.lastPaidPeriod === selectedPeriod) {
    return { isLoaded: true, matchedTx: null };
  }

  let bestTx: ComputedTransaction | null = null;
  let bestScore = -1;
  let bestInstallmentInfo: { current: number; total: number } | undefined = undefined;

  for (const tx of transactions) {
    if (claimedTxIds.has(tx.id)) continue;

    // Multi-factor 1: Amount match (within 2 CLP margin)
    const diffNominal = Math.abs(tx.amount - credit.installmentAmount);
    const diffShare = credit.myShareAmount ? Math.abs(tx.amount - credit.myShareAmount) : Infinity;
    const amountMatches = diffNominal <= 2 || diffShare <= 2;
    if (!amountMatches) continue;

    let score = 20; // Base score for exact/close amount

    // Multi-factor 2: Installments match/conflict
    const txInstallments =
      tx.installments ||
      parseInstallmentsFromText(tx.description || '') ||
      parseInstallmentsFromText(tx.rawDescription || '');

    if (credit.type === 'cuotas_tc') {
      if (txInstallments && credit.totalInstallments) {
        if (txInstallments.total === credit.totalInstallments) {
          score += 40; // Coincidencia exacta del total de cuotas
        } else {
          score -= 50; // Conflicto: el total de cuotas no coincide (ej: 3 vs 24)
        }
      }
    }

    // Multi-factor 3: Text match
    const textMatch = evaluateTextMatch(credit.name, tx.description || '', tx.rawDescription);
    if (textMatch.matches) {
      score += textMatch.score;
    }

    // Threshold: Un match debe tener al menos 60 puntos.
    // Esto garantiza que:
    // - Monto (20) + Texto (50+) = 70 >= 60 (Match válido)
    // - Monto (20) + Cuotas (40) + Texto (50) = 110 >= 60 (Match excelente)
    // - Solo Monto (20) sin texto ni cuotas = 20 < 60 (Rechazado: previene falsos positivos del Escenario 3)
    // - Monto (20) + Texto (50) pero conflicto de cuotas (-50) = 20 < 60 (Rechazado por conflicto)
    if (score >= 60 && score > bestScore) {
      bestScore = score;
      bestTx = tx;
      bestInstallmentInfo = txInstallments || undefined;
    }
  }

  if (bestTx) {
    claimedTxIds.add(bestTx.id);
    return {
      isLoaded: true,
      matchedTx: bestTx,
      installmentInfo: bestInstallmentInfo
    };
  }

  return { isLoaded: false, matchedTx: null };
}

export const CreditCardBillingModal: React.FC<CreditCardBillingModalProps> = ({
  isOpen,
  onClose,
  accounts,
  transactions,
  credits,
  currentPeriod,
  onGenerateBillingTransactions,
  onOpenPayBillingModal
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

  // Motor Inteligente de Detección Multi-Factor de Cuotas y Suscripciones ya Facturadas
  const { installmentItems, subscriptionItems } = useMemo(() => {
    const claimedTxIds = new Set<string>();
    const base = currentPeriod || new Date().toISOString().slice(0, 7);

    // 1. Detección y Análisis de Cuotas
    const instItems = cardInstallments
      .map((c) => {
        const matchResult = findCreditMatch(c, cardTransactions, selectedPeriod, claimedTxIds);
        const isAlreadyLoaded = matchResult.isLoaded;
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
          matchedTx: matchResult.matchedTx,
          installmentInfo: matchResult.installmentInfo,
          isFinished,
          isStarted,
          isActiveInThisPeriod,
          nextInstallmentNum: projectedNum,
          amount: c.installmentAmount,
          userShare: c.myShareAmount || c.installmentAmount
        };
      })
      .filter((item) => item.isActiveInThisPeriod);

    // 2. Detección y Análisis de Suscripciones
    const subItems = cardSubscriptions.map((c) => {
      const matchResult = findCreditMatch(c, cardTransactions, selectedPeriod, claimedTxIds);
      return {
        credit: c,
        isAlreadyLoaded: matchResult.isLoaded,
        matchedTx: matchResult.matchedTx,
        amount: c.installmentAmount,
        userShare: c.myShareAmount || c.installmentAmount
      };
    });

    return { installmentItems: instItems, subscriptionItems: subItems };
  }, [cardInstallments, cardSubscriptions, cardTransactions, selectedPeriod, currentPeriod]);

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

  // Billing Cycle Summary & Traffic Light Status
  const billingSummary = useMemo(() => {
    if (!activeCard) return null;
    return getBillingCycleSummary(activeCard, transactions, credits, selectedPeriod);
  }, [activeCard, transactions, credits, selectedPeriod]);

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
        allocations: [],
        created_at: new Date().toISOString()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden relative">
        {/* Header Stitch Spec */}
        <div className="p-5 sm:p-6 bg-[#111118] border-b border-[#302840] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00FFCC]/20 via-[#38bdf8]/20 to-[#FF2D78]/20 border border-[#00FFCC]/30 text-[#00FFCC] shadow-inner shrink-0">
              <CreditCard className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-headline font-black text-white tracking-tight">
                  Proyección de Facturación al Corte
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30">
                  Proyección Inteligente
                </span>
              </div>
              <p className="text-xs text-[#A098B0] mt-0.5 font-sans">
                Calcula con exactitud cuánto facturará cada tarjeta sumando compras del mes, cuotas y suscripciones.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector & Card Selection Dropdown / Combo Box */}
        <div className="p-4 sm:p-5 bg-[#0E0E18] border-b border-[#302840] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          {/* Card Selection Dropdown / Combo Box */}
          {creditCards.length === 0 ? (
            <div className="text-xs text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>No tienes tarjetas de crédito registradas en tus cuentas.</span>
            </div>
          ) : (
            <div className="relative w-full sm:w-auto sm:min-w-[360px]" ref={cardDropdownRef}>
              <label className="block text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#00FFCC]" />
                <span>Tarjeta de Crédito Activa</span>
              </label>
              {(() => {
                const activeBranding = getBankBranding(activeCard?.bank, activeCard?.name);
                return (
                  <button
                    type="button"
                    onClick={() => setIsCardDropdownOpen(!isCardDropdownOpen)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#0A0A12] border transition text-left shadow-sm ${
                      isCardDropdownOpen
                        ? 'border-[#00FFCC] ring-2 ring-[#00FFCC]/20 bg-[#0A0A12]'
                        : 'border-[#302840] hover:border-[#00FFCC]/40 bg-[#0A0A12]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center font-headline font-bold text-xs shrink-0 ${activeBranding.badgeBg} ${activeBranding.badgeBorder} ${activeBranding.badgeText}`}
                      >
                        {activeBranding.tag}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-headline font-bold text-white truncate block">
                            {activeCard?.name}
                          </span>
                          {activeCard?.closingDay && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 shrink-0">
                              Corte día {activeCard.closingDay}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#A098B0] block truncate mt-0.5 font-sans">
                          {activeCard?.bank}
                          {activeCard?.creditLimit ? ` • Cupo: ${formatCLP(activeCard.creditLimit)}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[#A098B0] shrink-0">
                      <span className="text-[10px] font-medium hidden sm:inline">
                        Cambiar
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isCardDropdownOpen ? 'rotate-180 text-[#00FFCC]' : ''
                        }`}
                      />
                    </div>
                  </button>
                );
              })()}

              {/* Dropdown Menu */}
              {isCardDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-full bg-[#141422] border border-[#302840] panel-rim rounded-2xl shadow-2xl p-1.5 z-40 space-y-1 animate-fadeIn max-h-72 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider border-b border-[#302840] flex items-center justify-between">
                    <span>Tus Tarjetas de Crédito</span>
                    <span className="text-[#00FFCC]">{creditCards.length} disponibles</span>
                  </div>
                  {creditCards.map((card) => {
                    const isSelected = card.id === activeCard?.id;
                    const branding = getBankBranding(card.bank, card.name);
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
                            ? 'bg-[#00FFCC]/15 text-white border border-[#00FFCC]/40 shadow-sm'
                            : 'hover:bg-[#1A1A2E] text-[#A098B0] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center font-headline font-bold text-xs shrink-0 ${branding.badgeBg} ${branding.badgeBorder} ${branding.badgeText}`}
                          >
                            {branding.tag}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-white truncate">
                                {card.name}
                              </span>
                              {card.closingDay && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold bg-[#141422] text-[#A098B0] border border-[#302840] shrink-0">
                                  Corte día {card.closingDay}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#A098B0] block truncate mt-0.5">
                              {card.bank}
                              {card.creditLimit ? ` • Cupo: ${formatCLP(card.creditLimit)}` : ''}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#00FFCC]/20 text-[#00FFCC] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
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
            <label className="block text-[10px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5 flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#00FFCC]" />
                <span>Período de Facturación</span>
              </span>
              {selectedPeriod > (currentPeriod || new Date().toISOString().slice(0, 7)) && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#00FFCC]/15 text-[#00FFCC] font-bold border border-[#00FFCC]/30">
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
                className="p-2.5 rounded-xl bg-[#0A0A12] border border-[#302840] hover:border-[#00FFCC]/40 text-[#A098B0] hover:text-white transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Styled Select Dropdown */}
              <div className="relative flex-1 sm:w-56">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full bg-[#0A0A12] border border-[#302840] hover:border-[#00FFCC]/40 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#00FFCC] transition shadow-sm appearance-none cursor-pointer"
                >
                  {availablePeriods.map((period) => (
                    <option key={period} value={period} className="bg-[#141422] text-white py-1">
                      {getPeriodOptionLabel(period)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#A098B0] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Next Month Button */}
              <button
                type="button"
                onClick={() => setSelectedPeriod((prev) => addMonths(prev, 1))}
                title="Mes siguiente"
                className="p-2.5 rounded-xl bg-[#0A0A12] border border-[#302840] hover:border-[#00FFCC]/40 text-[#A098B0] hover:text-white transition shadow-sm"
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
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-headline font-bold text-white">
                      Ciclo de Facturación: {activeCard?.name} ({activeCard?.bank})
                    </h3>
                    <p className="text-[11px] text-[#A098B0] mt-0.5 font-sans">
                      {cycleInfo.closingText} • {cycleInfo.dueText}
                    </p>
                  </div>
                </div>

                {cycleInfo.daysStatus && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border self-start sm:self-center ${cycleInfo.daysStatus.badgeColor}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{cycleInfo.daysStatus.text}</span>
                  </span>
                )}
              </div>

              {/* Cupo Utilizado Bar (if creditLimit is defined) */}
              {creditLimit > 0 && (
                <div className="pt-3 border-t border-[#302840] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A098B0] font-sans">Cupo Total: {formatCLP(creditLimit)}</span>
                    <span className="text-[#00FFCC] font-mono font-bold">
                      {creditLimitUsagePct}% ocupado al corte • Disponible: {formatCLP(creditAvailable)}
                    </span>
                  </div>
                  <div className="w-full bg-[#141422] rounded-full h-2 overflow-hidden border border-[#302840]">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        creditLimitUsagePct > 85
                          ? 'bg-gradient-to-r from-[#FF2D78] to-rose-600 animate-pulse'
                          : creditLimitUsagePct > 60
                          ? 'bg-gradient-to-r from-amber-400 to-[#FFE04A]'
                          : 'bg-gradient-to-r from-[#00FFCC] to-[#38bdf8]'
                      }`}
                      style={{ width: `${creditLimitUsagePct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Billing Cycle Payment Status & Action */}
              {billingSummary && (
                <div className="pt-3 border-t border-[#302840] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full animate-pulse bg-[#00FFCC]" />
                      Estado de Pago del Ciclo
                    </span>
                    <span className={`text-[10px] font-headline font-bold px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${billingSummary.statusBadgeColor}`}>
                      {billingSummary.statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]">
                      <span className="text-[10px] text-[#A098B0] block uppercase font-mono">Facturado</span>
                      <span className="text-xs font-mono font-bold text-white">{formatCLP(billingSummary.totalBilled)}</span>
                    </div>
                    <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]">
                      <span className="text-[10px] text-[#A098B0] block uppercase font-mono">Abonos / Pagos</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">+{formatCLP(billingSummary.totalPaid)}</span>
                    </div>
                    <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]">
                      <span className="text-[10px] text-[#A098B0] block uppercase font-mono">Saldo Pendiente</span>
                      <span className={`text-xs font-mono font-bold ${billingSummary.pendingBalance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCLP(billingSummary.pendingBalance)}
                      </span>
                    </div>
                    <div className="bg-[#141422] p-2.5 rounded-xl border border-[#302840]">
                      <span className="text-[10px] text-[#A098B0] block uppercase font-mono">Mínimo Sugerido</span>
                      <span className="text-xs font-mono font-bold text-[#FFE04A]">{formatCLP(billingSummary.minPayment)}</span>
                    </div>
                  </div>

                  {billingSummary.revolvingBalance > 0 && (
                    <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Deuda rotativa activa: <b>{formatCLP(billingSummary.revolvingBalance)}</b> generará intereses financieros en el próximo estado de cuenta si no se liquida antes del corte.
                      </span>
                    </div>
                  )}

                  {onOpenPayBillingModal && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onOpenPayBillingModal(activeCard, selectedPeriod)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-headline font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Registrar Pago de Facturación</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4 Grand Summary KPI Cards Stitch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Gastos del Mes */}
              <div className="p-4 rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim relative overflow-hidden group hover:border-[#38bdf8]/40 transition">
                <div className="flex items-center justify-between text-xs text-[#A098B0] font-mono font-bold">
                  <span>1. Gastos Registrados</span>
                  <ShoppingBag className="w-4 h-4 text-[#38bdf8]" />
                </div>
                <div className="mt-2 text-xl font-headline font-black text-white tracking-tight">
                  {formatCLP(registeredSpendingTotal)}
                </div>
                <span className="text-[11px] text-[#A098B0] mt-1 block font-sans">
                  {cardTransactions.length} compra(s) ya en movimientos
                </span>
              </div>

              {/* Card 2: Cuotas por Facturar */}
              <div className="p-4 rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim relative overflow-hidden group hover:border-[#00FFCC]/40 transition">
                <div className="flex items-center justify-between text-xs text-[#A098B0] font-mono font-bold">
                  <span>2. Cuotas por Facturar</span>
                  <Layers className="w-4 h-4 text-[#00FFCC]" />
                </div>
                <div className="mt-2 text-xl font-headline font-black text-white tracking-tight">
                  {formatCLP(pendingInstallmentsGross)}
                </div>
                <span className="text-[11px] text-[#A098B0] mt-1 block font-sans">
                  {installmentItems.filter((i) => !i.isAlreadyLoaded && !i.isFinished).length} compra(s) a plazo
                </span>
              </div>

              {/* Card 3: Suscripciones por Facturar */}
              <div className="p-4 rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim relative overflow-hidden group hover:border-[#FF2D78]/40 transition">
                <div className="flex items-center justify-between text-xs text-[#A098B0] font-mono font-bold">
                  <span>3. Suscripciones</span>
                  <Repeat className="w-4 h-4 text-[#FF2D78]" />
                </div>
                <div className="mt-2 text-xl font-headline font-black text-white tracking-tight">
                  {formatCLP(pendingSubscriptionsGross)}
                </div>
                <span className="text-[11px] text-[#A098B0] mt-1 block font-sans">
                  {subscriptionItems.filter((i) => !i.isAlreadyLoaded).length} cargo(s) recurrente(s)
                </span>
              </div>

              {/* Card 4: TOTAL ESTIMADO AL CORTE */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#141422] to-[#1A1A2E] border border-[#00FFCC]/40 panel-rim glow-secondary shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-[#00FFCC] font-mono font-bold uppercase tracking-wider">
                  <span>Total Facturación</span>
                  <Sparkles className="w-4 h-4 text-[#FFE04A]" />
                </div>
                <div className="mt-2 text-2xl font-headline font-black text-[#00FFCC] tracking-tight">
                  {formatCLP(totalProjectedGross)}
                </div>
                <div className="text-[11px] text-[#A098B0] mt-1 flex items-center justify-between font-sans">
                  <span>Mi parte personal:</span>
                  <b className="text-white font-mono font-bold">{formatCLP(totalProjectedUserShare)}</b>
                </div>
              </div>
            </div>

            {/* Bloque 1: Gastos Registrados en el Mes (Accordion) */}
            <div className="rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim overflow-hidden">
              <button
                onClick={() => setShowTransactionsList(!showTransactionsList)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[#141422] transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-headline font-bold text-white flex items-center gap-2">
                      <span>1. Gastos y Compras Registradas en este Período</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#141422] text-[#00FFCC] border border-[#302840]">
                        {cardTransactions.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#A098B0] font-sans">
                      Total acumulado hasta hoy: <b className="text-white font-mono">{formatCLP(registeredSpendingTotal)}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-headline font-bold text-[#A098B0]">
                  <span>{showTransactionsList ? 'Ocultar lista' : 'Ver detalle'}</span>
                  {showTransactionsList ? <ChevronUp className="w-4 h-4 text-[#00FFCC]" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showTransactionsList && (
                <div className="p-4 pt-0 border-t border-[#302840] space-y-2 max-h-60 overflow-y-auto">
                  {cardTransactions.length === 0 ? (
                    <p className="text-xs text-[#A098B0] italic py-3 text-center">
                      No hay compras registradas en los movimientos de este período para esta tarjeta.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#302840]">
                      {cardTransactions.map((tx) => (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="text-white font-medium block truncate">{tx.description}</span>
                            <span className="text-[10px] text-[#A098B0] font-mono block">
                              {tx.date} • {tx.category} &gt; {tx.subcategory}
                              {tx.installments && (
                                <span className="text-[#FFE04A] ml-1.5 font-bold font-mono">
                                  (Cuota {tx.installments.current}/{tx.installments.total})
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-white">
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
            <div className="rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#00FFCC]/15 border border-[#00FFCC]/30 text-[#00FFCC]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-headline font-bold text-white flex items-center gap-2">
                      <span>2. Compras en Cuotas Asociadas a esta Tarjeta</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#141422] text-[#00FFCC] border border-[#302840]">
                        {installmentItems.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#A098B0] font-sans">
                      Cuotas programadas desde el módulo de Créditos y Cuotas.
                    </p>
                  </div>
                </div>
              </div>

              {installmentItems.length === 0 ? (
                cardInstallments.length === 0 ? (
                  <p className="text-xs text-[#A098B0] italic py-2">
                    No tienes compras en cuotas vinculadas a esta tarjeta. Puedes asociarlas al registrar una compra en la pestaña "Compras en Cuotas".
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 italic py-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>🎉 No hay cuotas vigentes para facturar en este período. ¡Todas tus compras en cuotas registradas para esta tarjeta ya habrán finalizado para esta fecha!</span>
                  </p>
                )
              ) : (
                <div className="space-y-2">
                  {installmentItems.map(({ credit, isAlreadyLoaded, isFinished, nextInstallmentNum, amount, userShare, installmentInfo }) => {
                    const isSelected = selectedPendingIds[credit.id] !== false;
                    return (
                      <div
                        key={credit.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition ${
                          isAlreadyLoaded
                            ? 'bg-[#141422]/60 border-[#302840] opacity-80'
                            : isFinished
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-[#141422] border-[#302840] hover:border-[#00FFCC]/40'
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
                              className="w-4 h-4 rounded accent-[#00FFCC] bg-[#0A0A12] border-[#302840] cursor-pointer shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-[#00FFCC]" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className="font-headline font-bold text-white truncate">{credit.name}</h5>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-[#A098B0]">
                              {isFinished ? (
                                <span className="text-emerald-400 font-semibold">🎉 Liquidado</span>
                              ) : isAlreadyLoaded ? (
                                <span className="text-[#00FFCC] bg-[#00FFCC]/15 border border-[#00FFCC]/30 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  ✅ Ya en movimientos (Cuota {installmentInfo ? `${installmentInfo.current}/${installmentInfo.total}` : `${nextInstallmentNum}/${credit.totalInstallments}`})
                                </span>
                              ) : (
                                <span className="font-mono">
                                  Cuota <b className="text-white font-bold">{nextInstallmentNum}</b> de {credit.totalInstallments}
                                </span>
                              )}
                              {credit.isShared && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                                  Compartido {credit.mySharePercentage || 50}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-white text-xs block">{formatCLP(amount)}</span>
                          {credit.isShared && (
                            <span className="text-[10px] font-mono text-[#00FFCC] block">Mi parte: {formatCLP(userShare)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bloque 3: Suscripciones y Cargos Recurrentes */}
            <div className="rounded-2xl bg-[#0A0A12] border border-[#302840] panel-rim p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#FF2D78]/15 border border-[#FF2D78]/30 text-[#FF2D78]">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-headline font-bold text-white flex items-center gap-2">
                      <span>3. Suscripciones y Cargos Recurrentes en esta Tarjeta</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#141422] text-[#FF2D78] border border-[#302840]">
                        {cardSubscriptions.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#A098B0] font-sans">
                      Servicios vinculados que se cobran mensualmente a esta tarjeta.
                    </p>
                  </div>
                </div>
              </div>

              {subscriptionItems.length === 0 ? (
                <p className="text-xs text-[#A098B0] italic py-2">
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
                            ? 'bg-[#141422]/60 border-[#302840] opacity-80'
                            : 'bg-[#141422] border-[#302840] hover:border-[#FF2D78]/40'
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
                              className="w-4 h-4 rounded accent-[#FF2D78] bg-[#0A0A12] border-[#302840] cursor-pointer shrink-0"
                            />
                          ) : (
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-[#00FFCC]" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h5 className="font-headline font-bold text-white truncate">{credit.name}</h5>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-[11px] text-[#A098B0]">
                              {isAlreadyLoaded ? (
                                <span className="text-[#00FFCC] bg-[#00FFCC]/15 border border-[#00FFCC]/30 font-mono font-bold text-[10px] px-2 py-0.5 rounded-full">
                                  ✅ Ya en movimientos
                                </span>
                              ) : (
                                <span className="font-mono">Cobro mensual estimado día {credit.paymentDay || 1}</span>
                              )}
                              {credit.isShared && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                                  Compartido {credit.mySharePercentage || 50}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-white text-xs block">{formatCLP(amount)}</span>
                          {credit.isShared && (
                            <span className="text-[10px] font-mono text-[#FF2D78] block">Mi parte: {formatCLP(userShare)}</span>
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
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#141422] via-[#111118] to-[#1A1A2E] border border-[#00FFCC]/30 panel-rim flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
                <div>
                  <h4 className="text-sm font-headline font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FFE04A]" />
                    <span>Cargar Cargos Proyectados en Movimientos del Mes</span>
                  </h4>
                  <p className="text-xs text-[#A098B0] mt-0.5 max-w-xl font-sans">
                    Inserta automáticamente en tu tabla de movimientos las {pendingGeneratableItems.length} cuota(s) y suscripción(es) seleccionadas para este período y tarjeta.
                  </p>
                </div>

                <button
                  onClick={handleGeneratePendingItems}
                  disabled={isGenerating || pendingGeneratableItems.filter((i) => selectedPendingIds[i.id] !== false).length === 0}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00FFCC] hover:bg-[#00e6b8] text-black font-headline font-bold text-xs shadow-lg shadow-[#00FFCC]/20 transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-black" />
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
        <div className="p-4 sm:p-5 bg-[#111118] border-t border-[#302840] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-[#A098B0] font-sans">
            Período seleccionado: <b className="text-white font-mono">{formatPeriodLabel(selectedPeriod)}</b>
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {activeCard && onOpenPayBillingModal && (
              <button
                onClick={() => onOpenPayBillingModal(activeCard, selectedPeriod)}
                className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-headline font-bold transition flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pagar Facturación</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#1A1A2E] hover:bg-[#25253E] border border-[#302840] text-white text-xs font-headline font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
