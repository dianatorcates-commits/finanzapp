import React, { useState, useMemo, useEffect } from 'react';
import {
  Home,
  Car,
  CreditCard,
  Landmark,
  Coins,
  Layers,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Calendar,
  Sparkles,
  TrendingDown,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Repeat,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Percent,
  Play,
  Pause,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { Credit, CreditType, Account, ComputedTransaction } from '../types';
import { getBankBranding } from './AccountsManagementView';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';

export interface CreditsManagementViewProps {
  credits: Credit[];
  accounts: Account[];
  transactions?: ComputedTransaction[];
  currentPeriod: string; // ej. '2026-10'
  onSaveCredit: (credit: Credit) => void | Promise<void>;
  onDeleteCredit: (creditId: string) => void | Promise<void>;
  onPayInstallment: (creditId: string, period: string) => void | Promise<void>;
  onOpenBillingModal?: () => void;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatPeriodLabel(period: string): string {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) return period || '';
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const date = new Date(year, month - 1, 1);
  const monthName = date.toLocaleDateString('es-CL', { month: 'long' });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${year}`;
}

export function calculateEstimatedPayoff(
  remainingInstallments: number,
  basePeriod: string,
  startDate?: string,
  totalInstallments?: number,
  isPaidThisPeriod: boolean = false
): string {
  if (remainingInstallments <= 0) return '🎉 ¡Totalmente Liquidado!';

  let date: Date;

  // Prioridad 1: Si se cuenta con Mes de Inicio y Total de Cuotas, calcular la fecha natural de término:
  if (startDate && totalInstallments && /^\d{4}-\d{2}$/.test(startDate)) {
    const [y, m] = startDate.split('-').map(Number);
    date = new Date(y, m - 1, 1);
    date.setMonth(date.getMonth() + (totalInstallments - 1));
  } else {
    // Prioridad 2: Calcular a partir del período activo (basePeriod):
    const [y, m] = (basePeriod && /^\d{4}-\d{2}$/.test(basePeriod)
      ? basePeriod
      : new Date().toISOString().substring(0, 7)
    ).split('-').map(Number);
    date = new Date(y, m - 1, 1);

    const monthsToAdd = isPaidThisPeriod
      ? remainingInstallments
      : Math.max(0, remainingInstallments - 1);
    date.setMonth(date.getMonth() + monthsToAdd);
  }

  const monthName = date.toLocaleDateString('es-CL', { month: 'long' });
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} de ${date.getFullYear()}`;
}

const CHILEAN_BANKS = [
  'Banco Santander',
  'Banco de Chile',
  'BCI',
  'Banco Falabella',
  'BancoEstado',
  'Scotiabank',
  'Itaú',
  'Banco BICE',
  'Banco Security',
  'Tenpo',
  'Mercado Pago',
  'Mach',
  'Coopeuch',
  'Caja Los Andes',
  'Otro'
];

const COMMON_SUBSCRIPTION_PROVIDERS = [
  'Netflix',
  'Spotify',
  'OpenAI (ChatGPT)',
  'Apple (iCloud / Music)',
  'Google (One / YouTube)',
  'Amazon Prime',
  'Disney+',
  'Max (HBO)',
  'Mercado Libre (Meli+)',
  'Gimnasio / Deporte',
  'Microsoft 365',
  'Otro'
];

interface CreditTypeOption {
  type: CreditType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const CREDIT_TYPE_OPTIONS: CreditTypeOption[] = [
  { type: 'hipotecario', label: 'Hipotecario', icon: Home, color: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { type: 'consumo', label: 'Consumo', icon: Landmark, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
  { type: 'avance_tc', label: 'Avance TC', icon: CreditCard, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { type: 'cuotas_tc', label: 'Cuotas TC', icon: Layers, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { type: 'automotriz', label: 'Automotriz', icon: Car, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { type: 'suscripcion', label: 'Suscripción', icon: Repeat, color: 'text-pink-400 bg-pink-500/10 border-pink-500/30' },
  { type: 'otro', label: 'Otro Préstamo', icon: Coins, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
];

export type CreditTab = 'credits' | 'installments' | 'subscriptions';

export const CreditsManagementView: React.FC<CreditsManagementViewProps> = ({
  credits,
  accounts = [],
  transactions = [],
  currentPeriod,
  onSaveCredit,
  onDeleteCredit,
  onPayInstallment,
  onOpenBillingModal
}) => {
  // Normalize current period
  const activePeriod = currentPeriod || new Date().toISOString().slice(0, 7);

  // Active Tab: Credits | Installments | Subscriptions
  const [activeTab, setActiveTab] = useState<CreditTab>('credits');

  // Credit Cards available
  const creditCards = useMemo(
    () => accounts.filter((a) => a.type === 'credit_card'),
    [accounts]
  );

  // Active Credit Card for Hero Billing Card
  const [selectedCardId, setSelectedCardId] = useState<string>(creditCards[0]?.id || '');

  // Keep selected card valid
  useEffect(() => {
    if (creditCards.length > 0 && !creditCards.some((c) => c.id === selectedCardId)) {
      setSelectedCardId(creditCards[0].id);
    }
  }, [creditCards, selectedCardId]);

  const activeCard = useMemo(
    () => creditCards.find((c) => c.id === selectedCardId) || creditCards[0] || null,
    [creditCards, selectedCardId]
  );

  // Segregate lists by category
  const tabCredits = useMemo(
    () => credits.filter((c) => c.type !== 'cuotas_tc' && c.type !== 'suscripcion'),
    [credits]
  );
  const tabInstallments = useMemo(
    () => credits.filter((c) => c.type === 'cuotas_tc'),
    [credits]
  );
  const tabSubscriptions = useMemo(
    () => credits.filter((c) => c.type === 'suscripcion'),
    [credits]
  );

  const activeTabItems = useMemo(() => {
    switch (activeTab) {
      case 'installments':
        return tabInstallments;
      case 'subscriptions':
        return tabSubscriptions;
      case 'credits':
      default:
        return tabCredits;
    }
  }, [activeTab, tabCredits, tabInstallments, tabSubscriptions]);

  // Master-Detail selection
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(
    tabCredits[0]?.id || credits[0]?.id || null
  );
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<CreditType>('consumo');
  const [bank, setBank] = useState<string>(CHILEAN_BANKS[0]);
  const [customBank, setCustomBank] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [totalInstallments, setTotalInstallments] = useState<string>('36');
  const [paidInstallments, setPaidInstallments] = useState<string>('0');
  const [installmentAmount, setInstallmentAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [isActiveSub, setIsActiveSub] = useState<boolean>(true);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [mySharePercentage, setMySharePercentage] = useState<string>('50');
  const [myShareAmount, setMyShareAmount] = useState<string>('');
  const [paymentDay, setPaymentDay] = useState<string>('5');
  const [startDate, setStartDate] = useState<string>(activePeriod);
  const [lastPaidPeriod, setLastPaidPeriod] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPayingNow, setIsPayingNow] = useState<boolean>(false);

  // Currently selected credit object
  const selectedCredit = useMemo(() => {
    return credits.find((c) => c.id === selectedCreditId) || null;
  }, [credits, selectedCreditId]);

  // Keep selection synchronized when items change
  useEffect(() => {
    if (!isCreatingNew) {
      if (selectedCreditId && !credits.some((c) => c.id === selectedCreditId)) {
        setSelectedCreditId(activeTabItems[0]?.id || null);
      } else if (!selectedCreditId && activeTabItems.length > 0) {
        setSelectedCreditId(activeTabItems[0].id);
      }
    }
  }, [credits, selectedCreditId, isCreatingNew, activeTabItems]);

  // Handle Tab Switch
  const handleTabChange = (newTab: CreditTab) => {
    setActiveTab(newTab);
    setIsCreatingNew(false);
    let itemsForTab: Credit[];
    if (newTab === 'installments') itemsForTab = tabInstallments;
    else if (newTab === 'subscriptions') itemsForTab = tabSubscriptions;
    else itemsForTab = tabCredits;
    setSelectedCreditId(itemsForTab[0]?.id || null);
  };

  // Synchronize Form with selectedCredit
  useEffect(() => {
    if (!isCreatingNew && selectedCredit) {
      setName(selectedCredit.name);
      setType(selectedCredit.type);
      const isSub = selectedCredit.type === 'suscripcion';
      const providerList = isSub ? COMMON_SUBSCRIPTION_PROVIDERS : CHILEAN_BANKS;

      if (providerList.includes(selectedCredit.bank)) {
        setBank(selectedCredit.bank);
        setCustomBank('');
      } else {
        setBank('Otro');
        setCustomBank(selectedCredit.bank);
      }
      setTotalAmount(selectedCredit.totalAmount.toString());
      setTotalInstallments(selectedCredit.totalInstallments.toString());
      setPaidInstallments(selectedCredit.paidInstallments.toString());
      setInstallmentAmount(selectedCredit.installmentAmount.toString());
      setInterestRate(selectedCredit.interestRate !== undefined ? selectedCredit.interestRate.toString() : '');
      setIsActiveSub(selectedCredit.isActive !== false);
      setIsShared(Boolean(selectedCredit.isShared));
      setMySharePercentage(
        selectedCredit.mySharePercentage ? selectedCredit.mySharePercentage.toString() : '50'
      );
      setMyShareAmount(selectedCredit.myShareAmount.toString());
      setPaymentDay(selectedCredit.paymentDay ? selectedCredit.paymentDay.toString() : '5');
      setStartDate(selectedCredit.startDate || activePeriod);
      setLastPaidPeriod(selectedCredit.lastPaidPeriod || '');
      setAccountId(selectedCredit.accountId || '');
      setFormError(null);
    }
  }, [selectedCredit, isCreatingNew, activePeriod]);

  // Auto-calculate myShareAmount when installmentAmount, isShared, or mySharePercentage changes
  const handleInstallmentAmountChange = (val: string) => {
    setInstallmentAmount(val);
    const num = parseFloat(val) || 0;
    if (isShared) {
      const pct = parseFloat(mySharePercentage) || 50;
      setMyShareAmount(Math.round(num * (pct / 100)).toString());
    } else {
      setMyShareAmount(num.toString());
    }
  };

  const handleSharedToggle = (checked: boolean) => {
    setIsShared(checked);
    const num = parseFloat(installmentAmount) || 0;
    if (checked) {
      const pct = parseFloat(mySharePercentage) || 50;
      setMyShareAmount(Math.round(num * (pct / 100)).toString());
    } else {
      setMyShareAmount(num.toString());
    }
  };

  const handleSharePercentageChange = (val: string) => {
    setMySharePercentage(val);
    const pct = parseFloat(val) || 0;
    const num = parseFloat(installmentAmount) || 0;
    if (isShared) {
      setMyShareAmount(Math.round(num * (pct / 100)).toString());
    }
  };

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedCreditId(null);
    setName('');
    if (activeTab === 'subscriptions') {
      setType('suscripcion');
      setBank(COMMON_SUBSCRIPTION_PROVIDERS[0]);
      setTotalInstallments('0');
      setPaidInstallments('0');
    } else if (activeTab === 'installments') {
      setType('cuotas_tc');
      setBank(CHILEAN_BANKS[0]);
      const firstTc = accounts.find((a) => a.type === 'credit_card');
      if (firstTc) setAccountId(firstTc.id);
      setTotalInstallments('12');
      setPaidInstallments('0');
    } else {
      setType('consumo');
      setBank(CHILEAN_BANKS[0]);
      setTotalInstallments('36');
      setPaidInstallments('0');
    }
    setCustomBank('');
    if (activeTab !== 'installments') setAccountId('');
    setTotalAmount('');
    setInstallmentAmount('');
    setInterestRate('');
    setIsActiveSub(true);
    setIsShared(false);
    setMySharePercentage('50');
    setMyShareAmount('');
    setPaymentDay('5');
    setStartDate(activePeriod);
    setLastPaidPeriod('');
    setFormError(null);
  };

  const handleCancelForm = () => {
    setIsCreatingNew(false);
    setSelectedCreditId(activeTabItems[0]?.id || null);
    setFormError(null);
  };

  // Toggle subscription active / paused
  const handleToggleSubscriptionActive = async (credit: Credit, e: React.MouseEvent) => {
    e.stopPropagation();
    const newActive = credit.isActive === false ? true : false;
    await onSaveCredit({ ...credit, isActive: newActive });
  };

  // =========================================================================
  // 1. Calculations for "Próxima Facturación al Corte" (Hero Card)
  // =========================================================================
  const { cardDirectPurchases, cardCycleInstallments, cardCycleSubscriptions, totalProjectedAtClosing, directPurchasesCount } = useMemo(() => {
    if (!activeCard) {
      return { cardDirectPurchases: 0, cardCycleInstallments: 0, cardCycleSubscriptions: 0, totalProjectedAtClosing: 0, directPurchasesCount: 0 };
    }

    // Direct purchases registered on this card in active period
    const directTxs = transactions.filter(
      (tx) =>
        tx.accountId === activeCard.id &&
        (tx.period === activePeriod || tx.date?.startsWith(activePeriod)) &&
        !isPaymentOrIncomeTransaction(tx) &&
        tx.amount > 0
    );
    const directTotal = directTxs.reduce((sum, tx) => sum + tx.amount, 0);

    // Active installments mapped to this card (or all active if single card)
    const activeInsts = tabInstallments.filter((inst) => {
      const isCardMatch = inst.accountId ? inst.accountId === activeCard.id : creditCards.length <= 1;
      const isPending = inst.totalInstallments > inst.paidInstallments;
      return isCardMatch && isPending;
    });
    const installmentsTotal = activeInsts.reduce((sum, inst) => sum + (inst.myShareAmount || 0), 0);

    // Active subscriptions mapped to this card (or all active if single card)
    const activeSubs = tabSubscriptions.filter((sub) => {
      if (sub.isActive === false) return false;
      const isCardMatch = sub.accountId ? sub.accountId === activeCard.id : creditCards.length <= 1;
      return isCardMatch;
    });
    const subsTotal = activeSubs.reduce((sum, sub) => sum + (sub.myShareAmount || 0), 0);

    return {
      cardDirectPurchases: directTotal,
      cardCycleInstallments: installmentsTotal,
      cardCycleSubscriptions: subsTotal,
      totalProjectedAtClosing: directTotal + installmentsTotal + subsTotal,
      directPurchasesCount: directTxs.length
    };
  }, [activeCard, transactions, activePeriod, tabInstallments, tabSubscriptions, creditCards]);

  // =========================================================================
  // 2. Calculations for 4 Consolidated KPIs
  // =========================================================================
  const consolidatedMetrics = useMemo(() => {
    // 1. Deuda Total Restante (Mi parte en créditos + compras en cuotas)
    let totalDebtRemaining = 0;
    for (const item of [...tabCredits, ...tabInstallments]) {
      const remainingInstallments = Math.max(0, item.totalInstallments - item.paidInstallments);
      const userMonthly = item.myShareAmount || 0;
      totalDebtRemaining += remainingInstallments * userMonthly;
    }

    // 2. Cuotas Activas
    const activeInstallments = tabInstallments.filter((c) => c.totalInstallments > c.paidInstallments);
    const activeInstallmentsMonthlyTotal = activeInstallments.reduce((sum, c) => sum + (c.myShareAmount || 0), 0);

    // 3. Suscripciones Mensuales
    const activeSubsList = tabSubscriptions.filter((s) => s.isActive !== false);
    const totalSubsMonthly = activeSubsList.reduce((sum, s) => sum + (s.myShareAmount || 0), 0);

    // 4. Monto de Gastos Compartidos (Mi aporte vs Aporte de otros)
    const sharedItems = credits.filter((c) => c.isShared);
    let totalSharedOthersPortion = 0;
    for (const c of sharedItems) {
      const fullInst = c.installmentAmount || 0;
      const myPart = c.myShareAmount || 0;
      totalSharedOthersPortion += Math.max(0, fullInst - myPart);
    }

    return {
      totalDebtRemaining,
      activeInstallmentsCount: activeInstallments.length,
      activeInstallmentsMonthlyTotal,
      totalSubsMonthly,
      activeSubsCount: activeSubsList.length,
      sharedItemsCount: sharedItems.length,
      totalSharedOthersPortion
    };
  }, [credits, tabCredits, tabInstallments, tabSubscriptions]);

  // Form submission handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError(
        type === 'suscripcion'
          ? 'Por favor ingresa un nombre para la suscripción o servicio.'
          : type === 'cuotas_tc'
          ? 'Por favor ingresa un nombre para la compra en cuotas.'
          : 'Por favor ingresa un nombre para el crédito.'
      );
      return;
    }

    const isSubscription = type === 'suscripcion';
    const finalBank = bank === 'Otro' ? customBank.trim() || 'Otro' : bank;
    const instAmount = parseFloat(installmentAmount) || 0;
    const shareAmt = parseFloat(myShareAmount) || instAmount;

    let tInstallments = parseInt(totalInstallments, 10);
    let pInstallments = parseInt(paidInstallments, 10);
    let totAmt = parseFloat(totalAmount);

    if (isSubscription) {
      tInstallments = 0;
      pInstallments = 0;
      totAmt = instAmount;
    } else {
      if (isNaN(tInstallments) || tInstallments <= 0) {
        setFormError('El número de cuotas totales debe ser mayor a 0.');
        return;
      }
      if (isNaN(pInstallments) || pInstallments < 0) {
        pInstallments = 0;
      }
      if (isNaN(totAmt) || totAmt <= 0) {
        totAmt = instAmount * tInstallments;
      }
    }

    if (instAmount <= 0) {
      setFormError('El monto mensual debe ser mayor a $0.');
      return;
    }

    const creditData: Credit = {
      id: isCreatingNew ? (crypto.randomUUID ? crypto.randomUUID() : `cred_${Date.now()}`) : selectedCredit!.id,
      name: name.trim(),
      type,
      bank: finalBank,
      totalAmount: totAmt,
      totalInstallments: tInstallments,
      paidInstallments: pInstallments,
      installmentAmount: instAmount,
      isShared,
      mySharePercentage: isShared ? (parseFloat(mySharePercentage) || 50) : 100,
      myShareAmount: shareAmt,
      paymentDay: paymentDay ? parseInt(paymentDay, 10) : undefined,
      startDate: startDate || undefined,
      lastPaidPeriod: lastPaidPeriod || undefined,
      accountId: accountId.trim() ? accountId.trim() : undefined,
      interestRate: interestRate.trim() ? parseFloat(interestRate) : undefined,
      isActive: isSubscription ? isActiveSub : true
    };

    try {
      await onSaveCredit(creditData);
      setIsCreatingNew(false);
      setSelectedCreditId(creditData.id);
      setFormError(null);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar.');
    }
  };

  // Quick Action: Pay Current Period Installment / Subscription
  const handleQuickPayCurrentPeriod = async () => {
    if (!selectedCredit) return;
    setIsPayingNow(true);
    try {
      await onPayInstallment(selectedCredit.id, activePeriod);
      if (selectedCredit.type !== 'suscripcion') {
        setPaidInstallments((prev) => (parseInt(prev, 10) + 1).toString());
      }
      setLastPaidPeriod(activePeriod);
    } catch (err) {
      console.error('Error paying installment/subscription:', err);
    } finally {
      setIsPayingNow(false);
    }
  };

  // Helper icon for credit type
  const getTypeIcon = (cType: CreditType) => {
    const opt = CREDIT_TYPE_OPTIONS.find((o) => o.type === cType);
    if (!opt) return <Coins className="w-5 h-5 text-slate-400" />;
    const Icon = opt.icon;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeStyle = (cType: CreditType) => {
    const opt = CREDIT_TYPE_OPTIONS.find((o) => o.type === cType);
    return opt?.color || 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  const activeCardBranding = activeCard ? getBankBranding(activeCard.bank, activeCard.name) : null;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Header & Actions */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Créditos & Facturación TC</span>
            </h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 tracking-widest shadow-[0_0_10px_rgba(0,255,204,0.2)]">
              STITCH v4
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simula la facturación de tus tarjetas de crédito, amortización de compras en cuotas, préstamos y suscripciones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenBillingModal && (
            <button
              onClick={onOpenBillingModal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[#141422] hover:bg-[#1C1C30] text-[#00FFCC] border border-[#302840] hover:border-[#00FFCC]/40 text-xs font-bold transition shadow-sm"
              title="Abrir Simulador de Facturación TC y Cierre"
            >
              <CreditCard className="w-4 h-4 text-[#00FFCC]" />
              <span className="hidden sm:inline">Simulador Facturación TC</span>
              <span className="sm:hidden">Facturación TC</span>
            </button>
          )}

          <button
            onClick={handleStartCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg transition transform hover:-translate-y-0.5 text-[#0A0A12] bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] hover:shadow-[0_0_20px_rgba(0,255,204,0.4)]"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'subscriptions'
                ? 'Nueva Suscripción'
                : activeTab === 'installments'
                ? 'Nueva Compra en Cuotas'
                : 'Nuevo Crédito'}
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Resumen Superior: Próxima Facturación al Corte (Hero Card) */}
      {/* ======================================================== */}
      <div className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#00FFCC]/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-[#FF2D78]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Title Badge + Active Credit Card Selector + 1-Click Action */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-[#302840]/80">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/30 text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,204,0.2)]">
                <Zap className="w-3.5 h-3.5 animate-pulse text-[#00FFCC]" />
                Próxima Facturación al Corte
              </span>

              {/* Card Selector combo */}
              {creditCards.length > 0 ? (
                <div className="flex items-center gap-2 bg-[#0A0A12] border border-[#302840] rounded-xl px-2.5 py-1 text-xs">
                  <CreditCard className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <select
                    value={activeCard?.id || ''}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-2"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#141422] text-white">
                        {c.name} ({c.bank})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  (Sin tarjetas de crédito registradas en Cuentas)
                </span>
              )}

              {activeCard && activeCardBranding && (
                <span
                  className="text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider"
                  style={{
                    backgroundColor: activeCardBranding.badgeBg,
                    borderColor: activeCardBranding.badgeBorder,
                    color: activeCardBranding.badgeText
                  }}
                >
                  {activeCardBranding.name}
                </span>
              )}
            </div>

            {/* 1-Click Generation Button */}
            {onOpenBillingModal && (
              <button
                onClick={onOpenBillingModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] text-[#0A0A12] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:shadow-[0_0_25px_rgba(0,255,204,0.5)] transition transform hover:-translate-y-0.5 shrink-0"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Generar cargos al corte (1 clic)</span>
              </button>
            )}
          </div>

          {/* Main Hero Metrics: Big Total + 3-part breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Projected Total */}
            <div className="lg:col-span-5 space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Monto Proyectado a Liquidar
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00FFCC] to-[#38bdf8] tracking-tight">
                  {formatCLP(totalProjectedAtClosing)}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5 text-[#00FFCC]" />
                <span>
                  Fecha de corte estimada:{' '}
                  <strong className="text-white font-bold">
                    Día {activeCard?.closingDay || 15} de {formatPeriodLabel(activePeriod)}
                  </strong>
                </span>
              </p>
            </div>

            {/* 3 Desgloses */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Desglose 1: Compras directas */}
              <div className="p-3.5 rounded-2xl bg-[#0A0A12]/80 border border-[#302840] hover:border-[#38bdf8]/40 transition space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
                  <span>Compras Mes</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-[#38bdf8]" />
                </div>
                <div className="text-base sm:text-lg font-black text-white">
                  {formatCLP(cardDirectPurchases)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {directPurchasesCount} compra(s) registradas
                </div>
              </div>

              {/* Desglose 2: Cuotas imputables */}
              <div className="p-3.5 rounded-2xl bg-[#0A0A12]/80 border border-[#302840] hover:border-[#00FFCC]/40 transition space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
                  <span>Cuotas TC</span>
                  <Layers className="w-3.5 h-3.5 text-[#00FFCC]" />
                </div>
                <div className="text-base sm:text-lg font-black text-[#00FFCC]">
                  {formatCLP(cardCycleInstallments)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {tabInstallments.filter((c) => c.totalInstallments > c.paidInstallments).length} cuota(s) vigentes
                </div>
              </div>

              {/* Desglose 3: Suscripciones */}
              <div className="p-3.5 rounded-2xl bg-[#0A0A12]/80 border border-[#302840] hover:border-[#FF2D78]/40 transition space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
                  <span>Suscripciones</span>
                  <Repeat className="w-3.5 h-3.5 text-[#FF2D78]" />
                </div>
                <div className="text-base sm:text-lg font-black text-[#FF2D78]">
                  {formatCLP(cardCycleSubscriptions)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {tabSubscriptions.filter((s) => s.isActive !== false).length} activa(s) recurrentes
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. 4 Indicadores Consolidados (KPIs) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Deuda Total Restante */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#00FFCC]/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Deuda Total Restante
            </span>
            <div className="p-2.5 rounded-xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">
              {formatCLP(consolidatedMetrics.totalDebtRemaining)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFCC]" />
            <span>Mi parte por amortizar</span>
          </p>
        </div>

        {/* KPI 2: Cuotas Activas */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#38bdf8]/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cuotas Activas
            </span>
            <div className="p-2.5 rounded-xl bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[#38bdf8] tracking-tight">
              {consolidatedMetrics.activeInstallmentsCount} Compras
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
            <span>{formatCLP(consolidatedMetrics.activeInstallmentsMonthlyTotal)}/mes</span>
          </p>
        </div>

        {/* KPI 3: Suscripciones Mensuales */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#FF2D78]/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Suscripciones Mensuales
            </span>
            <div className="p-2.5 rounded-xl bg-[#FF2D78]/10 text-[#FF2D78] border border-[#FF2D78]/20">
              <Repeat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[#FF2D78] tracking-tight">
              {formatCLP(consolidatedMetrics.totalSubsMonthly)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D78]" />
            <span>{consolidatedMetrics.activeSubsCount} servicios activos</span>
          </p>
        </div>

        {/* KPI 4: Monto Gastos Compartidos */}
        <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-[#FFE04A]/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Gastos Compartidos
            </span>
            <div className="p-2.5 rounded-xl bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[#FFE04A] tracking-tight">
              {formatCLP(consolidatedMetrics.totalSharedOthersPortion)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFE04A]" />
            <span>Aporte ajeno en {consolidatedMetrics.sharedItemsCount} ítem(s)</span>
          </p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. Pestañas Especializadas: 🏦 Créditos | 🛍️ Compras en Cuotas | 🔄 Suscripciones */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-[#141422] border border-[#302840] panel-rim rounded-2xl overflow-x-auto">
        <button
          onClick={() => handleTabChange('credits')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            activeTab === 'credits'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#1C1C30]'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>🏦 Créditos</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'credits'
                ? 'bg-white/20 text-white'
                : 'bg-[#0A0A12] text-slate-400 border border-[#302840]'
            }`}
          >
            {tabCredits.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('installments')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            activeTab === 'installments'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#1C1C30]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>🛍️ Compras en Cuotas</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'installments'
                ? 'bg-white/20 text-white'
                : 'bg-[#0A0A12] text-slate-400 border border-[#302840]'
            }`}
          >
            {tabInstallments.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('subscriptions')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition shrink-0 ${
            activeTab === 'subscriptions'
              ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/20'
              : 'text-slate-400 hover:text-white hover:bg-[#1C1C30]'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>🔄 Suscripciones</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'subscriptions'
                ? 'bg-white/20 text-white'
                : 'bg-[#0A0A12] text-slate-400 border border-[#302840]'
            }`}
          >
            {tabSubscriptions.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 5. Master-Detail 2-Column Grid */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* COLUMNA 1: Lista de Elementos de la Pestaña Activa (lg:col-span-5) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>
                {activeTab === 'subscriptions'
                  ? 'Suscripciones Registradas'
                  : activeTab === 'installments'
                  ? 'Compras a Plazos'
                  : 'Préstamos y Créditos'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141422] text-[#00FFCC] border border-[#302840] font-black">
                {activeTabItems.length}
              </span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Período: <strong className="text-white">{formatPeriodLabel(activePeriod)}</strong>
            </span>
          </div>

          {activeTabItems.length === 0 ? (
            <div className="bg-[#141422] border border-dashed border-[#302840] rounded-3xl p-8 text-center space-y-4">
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                  activeTab === 'subscriptions'
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                    : activeTab === 'installments'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                }`}
              >
                {activeTab === 'subscriptions' ? (
                  <Repeat className="w-7 h-7" />
                ) : activeTab === 'installments' ? (
                  <ShoppingBag className="w-7 h-7" />
                ) : (
                  <Landmark className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeTab === 'subscriptions'
                    ? 'No tienes suscripciones registradas'
                    : activeTab === 'installments'
                    ? 'No tienes compras en cuotas registradas'
                    : 'No tienes créditos registrados'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {activeTab === 'subscriptions'
                    ? 'Registra Netflix, Spotify, ChatGPT, gimnasio y seguros para tener el costo mensual bajo control.'
                    : activeTab === 'installments'
                    ? 'Lleva el registro de tus compras a plazos con amortización, saldo y fecha estimada de término.'
                    : 'Registra créditos de consumo, hipotecarios o préstamos personales para proyectar tu libertad financiera.'}
                </p>
              </div>
              <button
                onClick={handleStartCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#00FFCC]/15 text-[#00FFCC] border border-[#00FFCC]/40 hover:bg-[#00FFCC]/25 transition"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activeTab === 'subscriptions'
                    ? '+ Registrar primera suscripción'
                    : activeTab === 'installments'
                    ? '+ Registrar primera compra en cuotas'
                    : '+ Registrar primer crédito'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTabItems.map((credit) => {
                const isSelected = !isCreatingNew && selectedCreditId === credit.id;
                const isSubscription = credit.type === 'suscripcion';
                const isPaidThisMonth = credit.lastPaidPeriod === activePeriod;
                const remaining = Math.max(0, credit.totalInstallments - credit.paidInstallments);
                const currentDueInstallment = Math.min(credit.totalInstallments, credit.paidInstallments + 1);
                const progressPct =
                  credit.totalInstallments > 0
                    ? Math.min(100, Math.round((credit.paidInstallments / credit.totalInstallments) * 100))
                    : 0;
                const isFinished = !isSubscription && remaining === 0;
                const isPaused = isSubscription && credit.isActive === false;

                const cardAccount = accounts.find((a) => a.id === credit.accountId);
                const bankBrand = getBankBranding(credit.bank, cardAccount?.name);

                return (
                  <div
                    key={credit.id}
                    onClick={() => {
                      setIsCreatingNew(false);
                      setSelectedCreditId(credit.id);
                    }}
                    className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? activeTab === 'subscriptions'
                          ? 'bg-[#181226] border-pink-400 ring-2 ring-pink-400/40 shadow-lg shadow-pink-500/10'
                          : activeTab === 'installments'
                          ? 'bg-[#0E1A2B] border-[#00FFCC] ring-2 ring-[#00FFCC]/40 shadow-lg shadow-[#00FFCC]/10'
                          : 'bg-[#0E1A2B] border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-500/10'
                        : 'bg-[#141422] border-[#302840] hover:border-slate-600 hover:bg-[#1C1C30]'
                    }`}
                  >
                    {/* Top Row: Type Icon + Name & Bank + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${getTypeStyle(credit.type)}`}>
                          {getTypeIcon(credit.type)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white truncate">
                              {credit.name}
                            </h3>
                            {isPaused && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                                Pausada
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border"
                              style={{
                                backgroundColor: bankBrand.badgeBg,
                                borderColor: bankBrand.badgeBorder,
                                color: bankBrand.badgeText
                              }}
                            >
                              {credit.bank}
                            </span>
                            {cardAccount && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1">
                                <span>{cardAccount.type === 'credit_card' ? '💳' : '🏦'}</span>
                                <span>{cardAccount.name}</span>
                              </span>
                            )}
                            {credit.isShared && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                                Compartido {credit.mySharePercentage || 50}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge / Quick Toggle */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSubscription ? (
                          <button
                            onClick={(e) => handleToggleSubscriptionActive(credit, e)}
                            className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                              credit.isActive === false
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                            title={credit.isActive === false ? 'Haz clic para activar' : 'Haz clic para pausar'}
                          >
                            {credit.isActive === false ? (
                              <Pause className="w-3 h-3" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                            <span className="text-[10px]">
                              {credit.isActive === false ? 'Pausada' : 'Activa'}
                            </span>
                          </button>
                        ) : isFinished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Liquidado
                          </span>
                        ) : isPaidThisMonth ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SPECIAL FEATURE FOR COMPRAS EN CUOTAS: What installment is due this month */}
                    {activeTab === 'installments' && !isFinished && (
                      <div className="mt-2.5 p-2 rounded-xl bg-[#0A0A12] border border-[#00FFCC]/30 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-bold flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-[#00FFCC]" />
                          <span>Toca pagar:</span>
                          <strong className="text-[#00FFCC]">
                            Cuota {currentDueInstallment} de {credit.totalInstallments}
                          </strong>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Saldo: <strong className="text-white">{formatCLP(remaining * credit.myShareAmount)}</strong>
                        </span>
                      </div>
                    )}

                    {/* Middle: Details row */}
                    <div className="mt-3 pt-2.5 border-t border-[#302840]/60 flex items-center justify-between text-xs">
                      <div className="text-slate-400">
                        {isSubscription ? (
                          <span className="text-slate-300 font-medium flex items-center gap-1">
                            <Repeat className="w-3.5 h-3.5 text-pink-400" />
                            <span>Cobro mensual</span>
                            {credit.paymentDay && <span>(Día {credit.paymentDay})</span>}
                          </span>
                        ) : (
                          <>
                            <span className="text-slate-300 font-bold">
                              {credit.paidInstallments}/{credit.totalInstallments} cuotas
                            </span>
                            <span className="text-slate-600 mx-1.5">•</span>
                            <span>{remaining > 0 ? `Quedan ${remaining}` : 'Completado'}</span>
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-black ${isSubscription ? 'text-pink-400' : 'text-[#00FFCC]'}`}>
                          {formatCLP(credit.myShareAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">/mes</span>
                      </div>
                    </div>

                    {/* Bottom: Progress Bar (Only for installment / loans) */}
                    {!isSubscription && (
                      <div className="mt-2.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Progreso de amortización</span>
                          <span className="font-bold text-slate-300">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-[#0A0A12] rounded-full h-1.5 overflow-hidden border border-[#302840]">
                          <div
                            className="bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 2: Detalle, Ficha y Formulario (lg:col-span-7) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7">
          {isCreatingNew ? (
            /* Formulary: Create New Item */
            <div className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#302840]">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-2xl border ${
                      type === 'suscripcion'
                        ? 'bg-pink-500/10 border-pink-500/30 text-pink-400'
                        : type === 'cuotas_tc'
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                        : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {type === 'suscripcion'
                        ? 'Registrar Nueva Suscripción'
                        : type === 'cuotas_tc'
                        ? 'Registrar Compra en Cuotas'
                        : 'Registrar Nuevo Crédito'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {type === 'suscripcion'
                        ? 'Ingresa tu servicio o membresía recurrente mensual para controlarlo.'
                        : type === 'cuotas_tc'
                        ? 'Registra compras a plazos de tu tarjeta de crédito para proyectar su término.'
                        : 'Ingresa los detalles de tu préstamo para trackear su amortización.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-[#1C1C30] transition"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* 1. Nombre */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    {type === 'suscripcion'
                      ? 'Nombre de la Suscripción / Servicio *'
                      : type === 'cuotas_tc'
                      ? 'Nombre de la Compra / Comercio *'
                      : 'Nombre o Motivo del Crédito *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      type === 'suscripcion'
                        ? 'Ej. Netflix, Spotify, ChatGPT Plus, SmartFit, iCloud...'
                        : type === 'cuotas_tc'
                        ? 'Ej. Pasajes LATAM, MacBook Air, Tienda Falabella...'
                        : 'Ej. Crédito Consumo BCI, Hipotecario Depto, Automotriz...'
                    }
                    className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFCC] transition"
                  />
                </div>

                {/* 2. Categoría y Entidad/Proveedor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {type === 'suscripcion' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Categoría
                      </label>
                      <div className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-pink-300 font-bold flex items-center gap-2">
                        <Repeat className="w-4 h-4 text-pink-400" />
                        <span>Suscripción Recurrente</span>
                      </div>
                    </div>
                  ) : type === 'cuotas_tc' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Categoría
                      </label>
                      <div className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-cyan-300 font-bold flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span>Compra en Cuotas TC</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Tipo de Crédito *
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as CreditType)}
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                      >
                        {CREDIT_TYPE_OPTIONS.filter((o) => o.type !== 'cuotas_tc' && o.type !== 'suscripcion').map((opt) => (
                          <option key={opt.type} value={opt.type}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {type === 'suscripcion'
                        ? 'Proveedor / Servicio *'
                        : 'Institución Financiera / Banco *'}
                    </label>
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                    >
                      {(type === 'suscripcion' ? COMMON_SUBSCRIPTION_PROVIDERS : CHILEAN_BANKS).map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {bank === 'Otro' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {type === 'suscripcion' ? 'Especificar Proveedor *' : 'Especificar Banco / Prestador *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      placeholder={type === 'suscripcion' ? 'Nombre del servicio...' : 'Nombre del banco o entidad...'}
                      className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFCC]"
                    />
                  </div>
                )}

                {/* Tarjeta o Cuenta con que se paga */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>
                      {type === 'suscripcion'
                        ? 'Tarjeta o Cuenta donde se cobra'
                        : type === 'cuotas_tc'
                        ? 'Tarjeta de Crédito Asociada'
                        : 'Tarjeta o Cuenta con que se paga'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal normal-case">
                      {type === 'cuotas_tc' ? 'Recomendado' : 'Opcional'}
                    </span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                  >
                    <option value="">Sin asociar / Cuenta externa</option>
                    {creditCards.length > 0 && (
                      <optgroup label="Tarjetas de Crédito">
                        {creditCards.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            💳 {acc.name} ({acc.bank})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {accounts.filter((a) => a.type !== 'credit_card').length > 0 && (
                      <optgroup label="Cuentas Bancarias / Vista">
                        {accounts
                          .filter((a) => a.type !== 'credit_card')
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              🏦 {acc.name} ({acc.bank})
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Cuotas Totales y Cuotas Pagadas (Oculto en Suscripciones) */}
                {type !== 'suscripcion' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Cuotas Totales *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="480"
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        placeholder={type === 'cuotas_tc' ? 'Ej. 12' : 'Ej. 36'}
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {type === 'cuotas_tc' ? 'Cuotas ya Facturadas / Pagadas' : 'Cuotas Pagadas hasta ahora'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={paidInstallments}
                        onChange={(e) => setPaidInstallments(e.target.value)}
                        placeholder="Ej. 0 o 3"
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>
                  </div>
                )}

                {/* Monto Mensual y Monto Total */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {type === 'suscripcion'
                        ? 'Valor Cobro Mensual ($CLP) *'
                        : type === 'cuotas_tc'
                        ? 'Valor Cuota Mensual ($CLP) *'
                        : 'Valor Cuota Total del Banco ($CLP) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={installmentAmount}
                      onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                      placeholder={type === 'suscripcion' ? 'Ej. 10990' : 'Ej. 45000'}
                      className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                    />
                  </div>

                  {type !== 'suscripcion' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {type === 'cuotas_tc'
                          ? 'Monto Total de la Compra ($CLP)'
                          : 'Monto Total Inicial de Deuda ($CLP)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        placeholder="Opcional (se autocalcula)"
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Día de Cobro en el Mes (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(e.target.value)}
                        placeholder="Ej. 1 o 15"
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>
                  )}
                </div>

                {/* Tasa de Interés (para préstamos y créditos) */}
                {type !== 'suscripcion' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Tasa de Interés / CAE (%)</span>
                        <span className="text-[10px] text-slate-500 normal-case">Opcional</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          placeholder="Ej. 1.25"
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Mes de Inicio (YYYY-MM)
                      </label>
                      <input
                        type="month"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>
                  </div>
                )}

                {/* Toggle Gasto Compartido */}
                <div className="p-4 rounded-2xl bg-[#0A0A12] border border-[#302840] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200">
                          {type === 'suscripcion'
                            ? '¿Compartes esta suscripción?'
                            : '¿Es un gasto o crédito compartido?'}
                        </span>
                        <p className="text-[11px] text-slate-500">
                          {type === 'suscripcion'
                            ? 'Actívalo si compartes el plan familiar de Spotify o Netflix con otros.'
                            : 'Actívalo si divides la cuota a medias o en porcentaje con otra persona.'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isShared}
                        onChange={(e) => handleSharedToggle(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[#141422] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FFCC]"></div>
                    </label>
                  </div>

                  {isShared && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#302840]/60">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Mi Porcentaje (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={mySharePercentage}
                            onChange={(e) => handleSharePercentageChange(e.target.value)}
                            className="w-full bg-[#141422] border border-[#302840] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                          />
                          <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">
                          Mi Aporte Mensual Real ($CLP)
                        </label>
                        <input
                          type="number"
                          value={myShareAmount}
                          onChange={(e) => setMyShareAmount(e.target.value)}
                          className="w-full bg-[#141422] border border-[#302840] rounded-xl px-3 py-2 text-sm text-[#00FFCC] font-black focus:outline-none focus:border-[#00FFCC]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#302840]">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-[#1C1C30] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] text-[#0A0A12] font-black text-xs shadow-lg shadow-[#00FFCC]/20 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedCredit ? (
            /* Selected Item Detail & Edit */
            <div className="space-y-6">
              {/* Header Card with Quick Pay Action */}
              <div className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#302840]">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${getTypeStyle(selectedCredit.type)}`}>
                      {getTypeIcon(selectedCredit.type)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#00FFCC]">
                        {selectedCredit.type === 'suscripcion'
                          ? 'Ficha de Suscripción'
                          : selectedCredit.type === 'cuotas_tc'
                          ? 'Ficha de Compra en Cuotas'
                          : 'Ficha de Crédito'}
                      </span>
                      <h2 className="text-xl font-black text-white tracking-tight">
                        {selectedCredit.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs text-slate-300 font-bold">{selectedCredit.bank}</span>
                        {(() => {
                          const acc = accounts.find((a) => a.id === selectedCredit.accountId);
                          if (!acc) return null;
                          return (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold flex items-center gap-1.5">
                              <span>{acc.type === 'credit_card' ? '💳 Se cobra en:' : '🏦 Se cobra en:'}</span>
                              <b className="text-white">{acc.name}</b>
                            </span>
                          );
                        })()}
                        {selectedCredit.isShared && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                            Compartido ({selectedCredit.mySharePercentage || 50}%)
                          </span>
                        )}
                        {selectedCredit.interestRate !== undefined && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span>Tasa: {selectedCredit.interestRate}%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Day indicator */}
                  {selectedCredit.paymentDay && (
                    <div className="text-right sm:border-l sm:border-[#302840] sm:pl-4">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        {selectedCredit.type === 'suscripcion' ? 'Día de Cobro' : 'Vencimiento'}
                      </span>
                      <p className="text-sm font-black text-slate-200">
                        Día {selectedCredit.paymentDay} de cada mes
                      </p>
                    </div>
                  )}
                </div>

                {/* ACCIÓN RÁPIDA: Marcar Cobro/Cuota Pagada este Mes */}
                {selectedCredit.type === 'suscripcion' ? (
                  selectedCredit.lastPaidPeriod === activePeriod ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg shadow-emerald-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-300">
                            Cobro de {formatPeriodLabel(activePeriod)} al día
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            El cobro recurrente de este período ya fue registrado.
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 self-start sm:self-center">
                        ✅ Cobro Registrado
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0A0A12] via-[#141422] to-pink-950/30 border border-pink-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-pink-400" />
                          <span className="text-xs font-bold text-white">
                            Cobro Pendiente de {formatPeriodLabel(activePeriod)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Monto a cobrar: <strong className="text-pink-400 font-bold">{formatCLP(selectedCredit.myShareAmount)}</strong>
                        </p>
                      </div>

                      <button
                        onClick={handleQuickPayCurrentPeriod}
                        disabled={isPayingNow}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {isPayingNow ? 'Registrando...' : 'Marcar Cobro del Mes Pagado'}
                        </span>
                      </button>
                    </div>
                  )
                ) : selectedCredit.paidInstallments >= selectedCredit.totalInstallments ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          🎉 ¡Totalmente Liquidado!
                        </h4>
                        <p className="text-xs text-emerald-400/80">
                          Has completado todas las {selectedCredit.totalInstallments} cuotas. Deuda saldada.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedCredit.lastPaidPeriod === activePeriod ? (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg shadow-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-emerald-300">
                          Cuota de {formatPeriodLabel(activePeriod)} al día
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Ya registraste el pago de este mes (Cuota {selectedCredit.paidInstallments} de {selectedCredit.totalInstallments}).
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 self-start sm:self-center">
                      ✅ Pagado
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0A0A12] via-[#141422] to-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">
                          Cuota Pendiente de {formatPeriodLabel(activePeriod)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Monto mensual: <strong className="text-emerald-400 font-bold">{formatCLP(selectedCredit.myShareAmount)}</strong>
                      </p>
                    </div>

                    <button
                      onClick={handleQuickPayCurrentPeriod}
                      disabled={isPayingNow}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {isPayingNow ? 'Guardando...' : `Marcar Cuota Pagada (+1 Cuota)`}
                      </span>
                    </button>
                  </div>
                )}

                {/* MOTIVADOR / PROYECCIÓN */}
                {selectedCredit.type === 'suscripcion' ? (
                  <div className="p-4 rounded-2xl bg-[#0A0A12] border border-pink-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0 mt-0.5">
                        <Repeat className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                          <span>📦 Costo Anual Proyectado de este servicio:</span>
                          <span className="text-white font-black underline decoration-pink-400 underline-offset-4">
                            {formatCLP((selectedCredit.myShareAmount || 0) * 12)} / año
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          Cobro automático estimado el día {selectedCredit.paymentDay || 1} de cada mes por {formatCLP(selectedCredit.myShareAmount)}.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  selectedCredit.paidInstallments < selectedCredit.totalInstallments && (
                    <div className="p-4 rounded-2xl bg-[#0A0A12] border border-[#00FFCC]/30 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FFCC]/5 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/20 shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-[#00FFCC] flex items-center gap-1.5">
                            <span>🎉 Al ritmo actual, terminarás de pagar en:</span>
                            <span className="text-white font-black underline decoration-[#00FFCC] underline-offset-4">
                              {calculateEstimatedPayoff(
                                selectedCredit.totalInstallments - selectedCredit.paidInstallments,
                                activePeriod,
                                selectedCredit.startDate,
                                selectedCredit.totalInstallments,
                                selectedCredit.lastPaidPeriod === activePeriod
                              )}
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400">
                            Saldo pendiente:{' '}
                            <strong className="text-slate-200">
                              {formatCLP(
                                (selectedCredit.totalInstallments - selectedCredit.paidInstallments) *
                                  selectedCredit.myShareAmount
                              )}
                            </strong>{' '}
                            • Restan {selectedCredit.totalInstallments - selectedCredit.paidInstallments} pagos mensuales de {formatCLP(selectedCredit.myShareAmount)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Formulario de Edición */}
              <div className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#302840]">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#00FFCC]" />
                    <span>
                      {selectedCredit.type === 'suscripcion'
                        ? 'Modificar Suscripción'
                        : selectedCredit.type === 'cuotas_tc'
                        ? 'Modificar Compra en Cuotas'
                        : 'Modificar Datos del Crédito'}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">ID: {selectedCredit.id.slice(0, 8)}...</span>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitForm} className="space-y-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {selectedCredit.type === 'suscripcion'
                        ? 'Nombre de la Suscripción *'
                        : selectedCredit.type === 'cuotas_tc'
                        ? 'Nombre de la Compra / Comercio *'
                        : 'Nombre del Crédito *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                    />
                  </div>

                  {/* Tipo y Banco/Proveedor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedCredit.type === 'suscripcion' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Categoría
                        </label>
                        <div className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-pink-300 font-bold flex items-center gap-2">
                          <Repeat className="w-4 h-4 text-pink-400" />
                          <span>Suscripción Recurrente</span>
                        </div>
                      </div>
                    ) : selectedCredit.type === 'cuotas_tc' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Categoría
                        </label>
                        <div className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-cyan-300 font-bold flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>Compra en Cuotas TC</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Tipo de Crédito *
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as CreditType)}
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                        >
                          {CREDIT_TYPE_OPTIONS.filter((o) => o.type !== 'cuotas_tc' && o.type !== 'suscripcion').map((opt) => (
                            <option key={opt.type} value={opt.type}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {selectedCredit.type === 'suscripcion' ? 'Proveedor / Servicio *' : 'Banco / Prestador *'}
                      </label>
                      <select
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                      >
                        {(selectedCredit.type === 'suscripcion' ? COMMON_SUBSCRIPTION_PROVIDERS : CHILEAN_BANKS).map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {bank === 'Otro' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nombre de la Institución / Servicio
                      </label>
                      <input
                        type="text"
                        value={customBank}
                        onChange={(e) => setCustomBank(e.target.value)}
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>
                  )}

                  {/* Tarjeta o Cuenta con que se paga */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>
                        {selectedCredit.type === 'suscripcion'
                          ? 'Tarjeta o Cuenta donde se cobra'
                          : selectedCredit.type === 'cuotas_tc'
                          ? 'Tarjeta de Crédito Asociada'
                          : 'Tarjeta o Cuenta con que se paga'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal normal-case">
                        {selectedCredit.type === 'cuotas_tc' ? 'Recomendado' : 'Opcional'}
                      </span>
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC] transition"
                    >
                      <option value="">Sin asociar / Cuenta externa</option>
                      {creditCards.length > 0 && (
                        <optgroup label="Tarjetas de Crédito">
                          {creditCards.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              💳 {acc.name} ({acc.bank})
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {accounts.filter((a) => a.type !== 'credit_card').length > 0 && (
                        <optgroup label="Cuentas Bancarias / Vista">
                          {accounts
                            .filter((a) => a.type !== 'credit_card')
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                🏦 {acc.name} ({acc.bank})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {/* Cuotas Totales y Cuotas Pagadas (Oculto en Suscripciones) */}
                  {selectedCredit.type !== 'suscripcion' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Cuotas Totales
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={totalInstallments}
                          onChange={(e) => setTotalInstallments(e.target.value)}
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          {selectedCredit.type === 'cuotas_tc' ? 'Cuotas ya Facturadas' : 'Cuotas Pagadas'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={paidInstallments}
                          onChange={(e) => setPaidInstallments(e.target.value)}
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cuota / Monto Mensual y Monto Total Inicial */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        {selectedCredit.type === 'suscripcion'
                          ? 'Valor Cobro Mensual ($CLP) *'
                          : selectedCredit.type === 'cuotas_tc'
                          ? 'Valor Cuota Mensual ($CLP) *'
                          : 'Valor Cuota Total del Banco ($CLP) *'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={installmentAmount}
                        onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                        className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                      />
                    </div>

                    {selectedCredit.type !== 'suscripcion' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          {selectedCredit.type === 'cuotas_tc'
                            ? 'Monto Total de la Compra ($CLP)'
                            : 'Monto Total Inicial de Deuda ($CLP)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={totalAmount}
                          onChange={(e) => setTotalAmount(e.target.value)}
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Día de Cobro en el Mes (1-31)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={paymentDay}
                          onChange={(e) => setPaymentDay(e.target.value)}
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tasa de interés (para créditos y préstamos) */}
                  {selectedCredit.type !== 'suscripcion' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Tasa de Interés / CAE (%)</span>
                          <span className="text-[10px] text-slate-500 normal-case">Opcional</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            placeholder="Ej. 1.25"
                            className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                          />
                          <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Mes de Inicio (YYYY-MM)
                        </label>
                        <input
                          type="month"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-[#0A0A12] border border-[#302840] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Toggle Gasto Compartido */}
                  <div className="p-4 rounded-2xl bg-[#0A0A12] border border-[#302840] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200">
                            {selectedCredit.type === 'suscripcion'
                              ? '¿Compartes esta suscripción?'
                              : '¿Crédito Compartido?'}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {selectedCredit.type === 'suscripcion'
                              ? 'Divide el costo mensual con quienes compartes el servicio.'
                              : 'Divide la cuota automáticamente según tu porcentaje acordado.'}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isShared}
                          onChange={(e) => handleSharedToggle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[#141422] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00FFCC]"></div>
                      </label>
                    </div>

                    {isShared && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#302840]/60">
                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">
                            Mi Porcentaje (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={mySharePercentage}
                              onChange={(e) => handleSharePercentageChange(e.target.value)}
                              className="w-full bg-[#141422] border border-[#302840] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FFCC]"
                            />
                            <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 mb-1">
                            Mi Aporte Mensual Real ($CLP)
                          </label>
                          <input
                            type="number"
                            value={myShareAmount}
                            onChange={(e) => setMyShareAmount(e.target.value)}
                            className="w-full bg-[#141422] border border-[#302840] rounded-xl px-3 py-2 text-sm text-[#00FFCC] font-black focus:outline-none focus:border-[#00FFCC]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones Guardar Cambios y Eliminar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#302840]">
                    {confirmDeleteId === selectedCredit.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-400 font-bold">¿Seguro de eliminar?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCredit(selectedCredit.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                        >
                          Sí, Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#0A0A12] text-slate-300 text-xs transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedCredit.id)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-bold transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          {selectedCredit.type === 'suscripcion'
                            ? 'Eliminar Suscripción'
                            : selectedCredit.type === 'cuotas_tc'
                            ? 'Eliminar Compra'
                            : 'Eliminar Crédito'}
                        </span>
                      </button>
                    )}

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] text-[#0A0A12] font-black text-xs shadow-lg shadow-[#00FFCC]/20 transition transform hover:-translate-y-0.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Estado Vacío cuando no hay elementos */
            <div className="bg-[#141422] border border-[#302840] panel-rim rounded-3xl p-10 text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto ${
                  activeTab === 'subscriptions'
                    ? 'bg-pink-500/10 border-pink-500/20 text-pink-400'
                    : activeTab === 'installments'
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                    : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                }`}
              >
                {activeTab === 'subscriptions' ? (
                  <Repeat className="w-8 h-8" />
                ) : activeTab === 'installments' ? (
                  <ShoppingBag className="w-8 h-8" />
                ) : (
                  <Landmark className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeTab === 'subscriptions'
                    ? 'Ninguna suscripción seleccionada'
                    : activeTab === 'installments'
                    ? 'Ninguna compra seleccionada'
                    : 'Ningún crédito seleccionado'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {activeTab === 'subscriptions'
                    ? 'Selecciona una suscripción de la lista para ver su costo anual y registrar pagos, o crea una nueva.'
                    : activeTab === 'installments'
                    ? 'Selecciona una compra en cuotas para ver cuántas cuotas restan, simular su término o registrar una nueva.'
                    : 'Selecciona un crédito de la lista para ver su ficha, registrar cuotas o crea uno nuevo.'}
                </p>
              </div>
              <button
                onClick={handleStartCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs text-[#0A0A12] bg-gradient-to-r from-[#00FFCC] to-[#38bdf8] shadow-lg shadow-[#00FFCC]/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {activeTab === 'subscriptions'
                    ? '+ Registrar Nueva Suscripción'
                    : activeTab === 'installments'
                    ? '+ Registrar Nueva Compra en Cuotas'
                    : '+ Registrar Nuevo Crédito'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
