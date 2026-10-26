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
  Percent,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { Credit, CreditType, Account } from '../types';

export interface CreditsManagementViewProps {
  credits: Credit[];
  accounts: Account[];
  currentPeriod: string; // ej. '2026-10'
  onSaveCredit: (credit: Credit) => void | Promise<void>;
  onDeleteCredit: (creditId: string) => void | Promise<void>;
  onPayInstallment: (creditId: string, period: string) => void | Promise<void>;
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
    // Ejemplo: Agosto (cuota 1) + (3 - 1) cuotas = Octubre (cuota 3)
    date.setMonth(date.getMonth() + (totalInstallments - 1));
  } else {
    // Prioridad 2: Calcular a partir del período activo (basePeriod):
    const [y, m] = (basePeriod && /^\d{4}-\d{2}$/.test(basePeriod)
      ? basePeriod
      : new Date().toISOString().substring(0, 7)
    ).split('-').map(Number);
    date = new Date(y, m - 1, 1);

    // Si la cuota de este período ya fue pagada, las restantes empiezan el próximo mes (+remaining)
    // Si la cuota de este período está pendiente, la última termina en (remaining - 1)
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
  { type: 'cuotas_tc', label: 'Cuotas TC', icon: Layers, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' },
  { type: 'automotriz', label: 'Automotriz', icon: Car, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { type: 'otro', label: 'Otro Préstamo', icon: Coins, color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' }
];

export const CreditsManagementView: React.FC<CreditsManagementViewProps> = ({
  credits,
  accounts = [],
  currentPeriod,
  onSaveCredit,
  onDeleteCredit,
  onPayInstallment
}) => {
  // Normalize current period
  const activePeriod = currentPeriod || new Date().toISOString().slice(0, 7);

  // Master-Detail selection
  const [selectedCreditId, setSelectedCreditId] = useState<string | null>(
    credits[0]?.id || null
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

  // If selected credit was deleted, reset to first available
  useEffect(() => {
    if (!isCreatingNew) {
      if (selectedCreditId && !credits.some((c) => c.id === selectedCreditId)) {
        setSelectedCreditId(credits[0]?.id || null);
      } else if (!selectedCreditId && credits.length > 0) {
        setSelectedCreditId(credits[0].id);
      }
    }
  }, [credits, selectedCreditId, isCreatingNew]);

  // Synchronize Form with selectedCredit
  useEffect(() => {
    if (!isCreatingNew && selectedCredit) {
      setName(selectedCredit.name);
      setType(selectedCredit.type);
      if (CHILEAN_BANKS.includes(selectedCredit.bank)) {
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
    setType('consumo');
    setBank(CHILEAN_BANKS[0]);
    setCustomBank('');
    setAccountId('');
    setTotalAmount('');
    setTotalInstallments('36');
    setPaidInstallments('0');
    setInstallmentAmount('');
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
    setSelectedCreditId(credits[0]?.id || null);
    setFormError(null);
  };

  // 1. Consolidated Metrics Calculations
  const metrics = useMemo(() => {
    let totalRemainingDebt = 0;
    let monthlyCommitment = 0;
    let totalPaidShare = 0;
    let totalInitialShare = 0;

    for (const credit of credits) {
      const remainingInstallments = Math.max(0, credit.totalInstallments - credit.paidInstallments);
      const userShare = credit.myShareAmount || 0;

      // Deuda Restante de este usuario
      totalRemainingDebt += remainingInstallments * userShare;

      // Compromiso Mensual si está activo
      if (remainingInstallments > 0) {
        monthlyCommitment += userShare;
      }

      // Para el progreso global
      totalPaidShare += credit.paidInstallments * userShare;
      totalInitialShare += credit.totalInstallments * userShare;
    }

    const globalProgressPercentage =
      totalInitialShare > 0
        ? Math.min(100, Math.round((totalPaidShare / totalInitialShare) * 1000) / 10)
        : 0;

    return {
      totalRemainingDebt,
      monthlyCommitment,
      totalPaidShare,
      globalProgressPercentage,
      activeCreditsCount: credits.filter((c) => c.totalInstallments > c.paidInstallments).length,
      paidOffCreditsCount: credits.filter((c) => c.paidInstallments >= c.totalInstallments).length
    };
  }, [credits]);

  // Form submission handler
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Por favor ingresa un nombre para el crédito.');
      return;
    }

    const finalBank = bank === 'Otro' ? customBank.trim() || 'Otro' : bank;
    const tInstallments = parseInt(totalInstallments, 10);
    const pInstallments = parseInt(paidInstallments, 10);
    const instAmount = parseFloat(installmentAmount) || 0;
    const shareAmt = parseFloat(myShareAmount) || instAmount;
    const totAmt = parseFloat(totalAmount) || (tInstallments * instAmount);

    if (isNaN(tInstallments) || tInstallments <= 0) {
      setFormError('El número de cuotas totales debe ser mayor a 0.');
      return;
    }

    if (isNaN(pInstallments) || pInstallments < 0) {
      setFormError('Las cuotas pagadas no pueden ser negativas.');
      return;
    }

    if (pInstallments > tInstallments) {
      setFormError('Las cuotas pagadas no pueden superar las cuotas totales.');
      return;
    }

    if (instAmount <= 0) {
      setFormError('El valor de la cuota del banco debe ser mayor a $0.');
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
      accountId: accountId.trim() ? accountId.trim() : undefined
    };

    try {
      await onSaveCredit(creditData);
      setIsCreatingNew(false);
      setSelectedCreditId(creditData.id);
      setFormError(null);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar el crédito.');
    }
  };

  // Quick Action: Pay Current Period Installment
  const handleQuickPayCurrentPeriod = async () => {
    if (!selectedCredit) return;
    setIsPayingNow(true);
    try {
      await onPayInstallment(selectedCredit.id, activePeriod);
      // Synchronize internal state
      setPaidInstallments((prev) => (parseInt(prev, 10) + 1).toString());
      setLastPaidPeriod(activePeriod);
    } catch (err) {
      console.error('Error paying installment:', err);
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

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. Header & Consolidated Global Metrics */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>🏦 Créditos y Plan de Desendeudamiento</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 uppercase tracking-wider">
              Finanzas Claras
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitorea tus préstamos, cuotas restantes, créditos compartidos y fechas estimadas de término.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Crédito</span>
          </button>
        </div>
      </div>

      {/* 3 Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Deuda Total Restante */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Deuda Total Restante (Mi Parte)
            </span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              {formatCLP(metrics.totalRemainingDebt)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            {metrics.activeCreditsCount} crédito(s) activo(s) en curso
          </p>
        </div>

        {/* Card 2: Compromiso Mensual Real */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Compromiso Mensual Real
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl lg:text-3xl font-extrabold text-amber-300 tracking-tight">
              {formatCLP(metrics.monthlyCommitment)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Lo que realmente sale de tu bolsillo cada mes
          </p>
        </div>

        {/* Card 3: Progreso Global de Desendeudamiento */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700/80 transition">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Progreso de Desendeudamiento
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl lg:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {metrics.globalProgressPercentage}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              {formatCLP(metrics.totalPaidShare)} amortizados
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 via-emerald-400 to-teal-300 h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${metrics.globalProgressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Master-Detail 2-Column Grid */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* COLUMNA 1: Lista de Créditos Activos (lg:col-span-5) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Tus Créditos</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                {credits.length}
              </span>
            </h2>
            <span className="text-xs text-slate-500">
              Período: <strong className="text-slate-400">{formatPeriodLabel(activePeriod)}</strong>
            </span>
          </div>

          {credits.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <Landmark className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No tienes créditos registrados</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Comienza registrando tu primer crédito de consumo, hipotecario, automotriz o deudas en cuotas para proyectar tu libertad financiera.
                </p>
              </div>
              <button
                onClick={handleStartCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-semibold text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar mi primer crédito</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {credits.map((credit) => {
                const isSelected = !isCreatingNew && selectedCreditId === credit.id;
                const isPaidThisMonth = credit.lastPaidPeriod === activePeriod;
                const remaining = Math.max(0, credit.totalInstallments - credit.paidInstallments);
                const progressPct = credit.totalInstallments > 0
                  ? Math.min(100, Math.round((credit.paidInstallments / credit.totalInstallments) * 100))
                  : 0;
                const isFinished = remaining === 0;

                return (
                  <div
                    key={credit.id}
                    onClick={() => {
                      setIsCreatingNew(false);
                      setSelectedCreditId(credit.id);
                    }}
                    className={`relative p-4 rounded-2xl cursor-pointer transition-all duration-200 border ${
                      isSelected
                        ? 'bg-slate-900/95 border-sky-400 ring-2 ring-sky-400/50 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Top row: Type Icon + Name & Bank + Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${getTypeStyle(credit.type)}`}>
                          {getTypeIcon(credit.type)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate">
                            {credit.name}
                          </h3>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span>{credit.bank}</span>
                            {(() => {
                              const acc = accounts.find((a) => a.id === credit.accountId);
                              if (!acc) return null;
                              return (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1">
                                  <span>{acc.type === 'credit_card' ? '💳' : '🏦'}</span>
                                  <span>{acc.name}</span>
                                </span>
                              );
                            })()}
                            {credit.isShared && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                                Compartido {credit.mySharePercentage || 50}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badge estado cuota este mes */}
                      <div className="shrink-0">
                        {isFinished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Liquidado
                          </span>
                        ) : isPaidThisMonth ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3.5 h-3.5" />
                            Cuota Pagada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Installments count and User monthly share */}
                    <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="text-slate-400">
                        <span className="text-slate-200 font-semibold">
                          Cuota {credit.paidInstallments} de {credit.totalInstallments}
                        </span>
                        <span className="text-slate-500 mx-1.5">•</span>
                        <span>{remaining > 0 ? `Quedan ${remaining}` : 'Finalizado'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-sky-400">
                          {formatCLP(credit.myShareAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">/mes</span>
                      </div>
                    </div>

                    {/* Bottom: Progress Bar */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>Progreso</span>
                        <span className="font-semibold text-slate-400">{progressPct}% amortizado</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-sky-400 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* COLUMNA 2: Detalle, Simulador y Formulario (lg:col-span-7) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7">
          {isCreatingNew ? (
            /* Formulary: Create New Credit */
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Registrar Nuevo Crédito</h2>
                    <p className="text-xs text-slate-400">
                      Ingresa los detalles de tu préstamo o crédito para comenzar a trackearlo.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition"
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
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombre o Motivo del Crédito *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Crédito Consumo BCI, Hipotecario Depto, Tarjeta Ripley..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  />
                </div>

                {/* 2. Tipo de Crédito y Banco */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Tipo de Crédito *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => {
                        const newType = e.target.value as CreditType;
                        setType(newType);
                        if ((newType === 'cuotas_tc' || newType === 'avance_tc') && !accountId) {
                          const firstTc = accounts.find((a) => a.type === 'credit_card');
                          if (firstTc) setAccountId(firstTc.id);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    >
                      {CREDIT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.type} value={opt.type}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Institución Financiera / Banco *
                    </label>
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    >
                      {CHILEAN_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {bank === 'Otro' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Especificar Banco / Prestador *
                    </label>
                    <input
                      type="text"
                      required
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      placeholder="Nombre del banco o entidad..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                {/* Tarjeta o Cuenta con que se paga */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Tarjeta o Cuenta con que se paga</span>
                    <span className="text-[10px] text-slate-500 font-normal normal-case">Opcional</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                  >
                    <option value="">Sin asociar / Otra cuenta o externa</option>
                    {accounts.filter((a) => a.type === 'credit_card').length > 0 && (
                      <optgroup label="Tarjetas de Crédito">
                        {accounts
                          .filter((a) => a.type === 'credit_card')
                          .map((acc) => (
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
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Permite identificar en qué estado de cuenta o tarjeta se cobra la cuota mensual.
                  </span>
                </div>

                {/* 3. Cuotas Totales y Cuotas Pagadas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cuotas Totales *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="480"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      placeholder="Ej. 36 o 240"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Cuotas Pagadas hasta ahora
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={paidInstallments}
                      onChange={(e) => setPaidInstallments(e.target.value)}
                      placeholder="Ej. 12"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* 4. Valor Cuota del Banco y Monto Total Inicial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Valor Cuota Total del Banco ($CLP) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={installmentAmount}
                      onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                      placeholder="Ej. 240000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Monto Total Inicial de Deuda ($CLP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="Opcional (se autocalcula)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* 5. Toggle Crédito Compartido */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-200">¿Es un crédito compartido?</span>
                        <p className="text-[11px] text-slate-500">
                          Actívalo si pagas este crédito a medias con tu pareja, hermano o socio.
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
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {isShared && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Mi Porcentaje (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={mySharePercentage}
                            onChange={(e) => handleSharePercentageChange(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">
                          Mi Aporte Mensual Real ($CLP)
                        </label>
                        <input
                          type="number"
                          value={myShareAmount}
                          onChange={(e) => setMyShareAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 6. Día de pago y Fecha inicio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Día del Mes en que Vence (1-31)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      placeholder="Ej. 5 o 28"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Mes de Inicio (YYYY-MM)
                    </label>
                    <input
                      type="month"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/25 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Crédito</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedCredit ? (
            /* Selected Credit Detail & Edit */
            <div className="space-y-6">
              {/* Header Card with Quick Pay Action & Motivator Box */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl border ${getTypeStyle(selectedCredit.type)}`}>
                      {getTypeIcon(selectedCredit.type)}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                        Ficha de Crédito
                      </span>
                      <h2 className="text-xl font-extrabold text-white tracking-tight">
                        {selectedCredit.name}
                      </h2>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs text-slate-400">{selectedCredit.bank}</span>
                        {(() => {
                          const acc = accounts.find((a) => a.id === selectedCredit.accountId);
                          if (!acc) return null;
                          return (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 font-medium flex items-center gap-1.5">
                              <span>{acc.type === 'credit_card' ? '💳 Se paga con:' : '🏦 Se paga con:'}</span>
                              <b className="text-white">{acc.name}</b>
                            </span>
                          );
                        })()}
                        {selectedCredit.isShared && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                            Compartido ({selectedCredit.mySharePercentage || 50}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Day indicator */}
                  {selectedCredit.paymentDay && (
                    <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Vencimiento</span>
                      <p className="text-sm font-bold text-slate-200">
                        Día {selectedCredit.paymentDay} de cada mes
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTÓN DE ACCIÓN RÁPIDA: Marcar Cuota Pagada de [Mes Actual] */}
                {selectedCredit.paidInstallments >= selectedCredit.totalInstallments ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">
                          🎉 ¡Crédito 100% Pagado y Liquidado!
                        </h4>
                        <p className="text-xs text-emerald-400/80">
                          Has completado todas las {selectedCredit.totalInstallments} cuotas. Felicitaciones por este logro financiero.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : selectedCredit.lastPaidPeriod === activePeriod ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg shadow-emerald-500/5">
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
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 self-start sm:self-center">
                      ✅ Pagado
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
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
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400/50 hover:shadow-emerald-500/40 transition transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {isPayingNow ? 'Guardando...' : `Marcar Cuota Pagada (+1 Cuota)`}
                      </span>
                    </button>
                  </div>
                )}

                {/* CÁLCULO DE TÉRMINO ESTIMADO Y MENSAJE MOTIVADOR */}
                {selectedCredit.paidInstallments < selectedCredit.totalInstallments && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                          <span>🎉 Al ritmo actual, terminarás de pagar este crédito en:</span>
                          <span className="text-white font-extrabold underline decoration-sky-400 underline-offset-4">
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
                          Deuda pendiente:{' '}
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
                )}
              </div>

              {/* Formulario de Edición Completo */}
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <span>Modificar Datos del Crédito</span>
                  </h3>
                  <span className="text-xs text-slate-500">ID: {selectedCredit.id.slice(0, 8)}...</span>
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
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nombre del Crédito *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                    />
                  </div>

                  {/* Tipo y Banco */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Tipo de Crédito *
                      </label>
                      <select
                        value={type}
                        onChange={(e) => {
                          const newType = e.target.value as CreditType;
                          setType(newType);
                          if ((newType === 'cuotas_tc' || newType === 'avance_tc') && !accountId) {
                            const firstTc = accounts.find((a) => a.type === 'credit_card');
                            if (firstTc) setAccountId(firstTc.id);
                          }
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                      >
                        {CREDIT_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.type} value={opt.type}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Banco / Prestador *
                      </label>
                      <select
                        value={bank}
                        onChange={(e) => setBank(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
                      >
                        {CHILEAN_BANKS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {bank === 'Otro' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Nombre de la Institución
                      </label>
                      <input
                        type="text"
                        value={customBank}
                        onChange={(e) => setCustomBank(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}

                  {/* Tarjeta o Cuenta con que se paga */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Tarjeta o Cuenta con que se paga</span>
                      <span className="text-[10px] text-slate-500 font-normal normal-case">Opcional</span>
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                    >
                      <option value="">Sin asociar / Otra cuenta o externa</option>
                      {accounts.filter((a) => a.type === 'credit_card').length > 0 && (
                        <optgroup label="Tarjetas de Crédito">
                          {accounts
                            .filter((a) => a.type === 'credit_card')
                            .map((acc) => (
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
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Permite identificar en qué estado de cuenta o tarjeta se cobra la cuota mensual.
                    </span>
                  </div>

                  {/* Cuotas Totales y Cuotas Pagadas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Cuotas Totales
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Cuotas Pagadas
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={paidInstallments}
                        onChange={(e) => setPaidInstallments(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Cuota Banco y Monto Total Inicial */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Valor Cuota Total del Banco ($CLP) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={installmentAmount}
                        onChange={(e) => handleInstallmentAmountChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Monto Total Inicial de Deuda ($CLP)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Toggle Crédito Compartido */}
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200">¿Crédito Compartido?</span>
                          <p className="text-[11px] text-slate-500">
                            Divide la cuota automáticamente según tu porcentaje acordado.
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
                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {isShared && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Mi Porcentaje (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={mySharePercentage}
                              onChange={(e) => handleSharePercentageChange(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-1">
                            Mi Aporte Mensual Real ($CLP)
                          </label>
                          <input
                            type="number"
                            value={myShareAmount}
                            onChange={(e) => setMyShareAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Día de pago y Mes de inicio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Día del Mes en que Vence (1-31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={paymentDay}
                        onChange={(e) => setPaymentDay(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Mes de Inicio (YYYY-MM)
                      </label>
                      <input
                        type="month"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Botones Guardar Cambios y Eliminar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    {/* Delete button or confirmation */}
                    {confirmDeleteId === selectedCredit.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-rose-400 font-semibold">¿Seguro de eliminar?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteCredit(selectedCredit.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition"
                        >
                          Sí, Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedCredit.id)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Crédito</span>
                      </button>
                    )}

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition transform hover:-translate-y-0.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* Estado Vacío cuando no hay créditos o nada seleccionado */
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto text-sky-400">
                <Landmark className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ningún crédito seleccionado</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Selecciona un crédito de la lista izquierda para ver su ficha técnica, marcar cuotas pagadas o ajustar sus condiciones, o crea uno nuevo.
                </p>
              </div>
              <button
                onClick={handleStartCreateNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Nuevo Crédito</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
