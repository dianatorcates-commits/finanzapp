import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  CreditCard,
  Landmark,
  Building2,
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  DollarSign,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Pencil,
  X,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Percent
} from 'lucide-react';
import { Account, AccountType, Transaction, Credit } from '../types';
import { isPaymentOrIncomeTransaction, isCreditCardPaymentTransaction } from '../utils/paymentAllocation';
import { calculateTransactionPeriod } from '../utils/dateUtils';
import { getBillingCycleSummary } from '../utils/billingCycleUtils';
import { formatCLP } from './MetricCards';

export type TCCAuditData = {
  isTC: true;
  directPurchases: number;
  installmentCharges: number;
  subscriptions: number;
  allocatedPayments: number;
  totalUsed: number;
  creditLimit: number;
  availableCredit: number;
  percentUsed: number;
  closingDay?: number;
  dueDay?: number;
  txCount: number;
};

export type DebitAuditData = {
  isTC: false;
  initialBalance: number;
  validatedIncomes: number;
  consumptionExpenses: number;
  tcPayments: number;
  estimatedBalance: number;
  netVariation: number;
  percentVariation: number;
  txCount: number;
};

export type AuditData = TCCAuditData | DebitAuditData;

interface AccountsManagementViewProps {
  accounts: Account[];
  transactions: Transaction[];
  credits?: Credit[];
  currentPeriod?: string;
  onAddAccount: (newAcc: Account) => void | Promise<void>;
  onUpdateAccount?: (updatedAcc: Account) => void | Promise<void>;
  onDeleteAccount: (accountId: string) => void | Promise<void>;
  onOpenImportModal?: () => void;
  onOpenBillingModal?: () => void;
  onOpenPayBillingModal?: (card: Account) => void;
}

export const CHILEAN_BANKS = [
  'Banco Santander',
  'Banco de Chile',
  'Banco Falabella',
  'BCI',
  'BancoEstado',
  'Scotiabank',
  'Itaú',
  'Banco BICE',
  'Banco Security',
  'Tenpo',
  'Mercado Pago',
  'Mach',
  'Coopeuch',
  'Efectivo / Caja'
];

export function getBankBranding(bankName?: string, accountName?: string) {
  const text = `${bankName || ''} ${accountName || ''}`.toLowerCase();

  if (text.includes('falabella') || text.includes('cmr')) {
    return {
      name: 'Banco Falabella',
      tag: 'CMR',
      color: 'emerald',
      accentColor: '#10B981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      badgeBg: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-400'
    };
  }
  if (text.includes('santander')) {
    return {
      name: 'Santander',
      tag: 'SAN',
      color: 'rose',
      accentColor: '#F43F5E',
      bgGlow: 'rgba(244, 63, 94, 0.15)',
      badgeBg: 'bg-rose-500/15',
      badgeBorder: 'border-rose-500/30',
      badgeText: 'text-rose-400'
    };
  }
  if (text.includes('chile') || text.includes('edwards')) {
    return {
      name: 'Banco de Chile',
      tag: 'BCH',
      color: 'blue',
      accentColor: '#3B82F6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      badgeBg: 'bg-blue-500/15',
      badgeBorder: 'border-blue-500/30',
      badgeText: 'text-blue-400'
    };
  }
  if (text.includes('bci')) {
    return {
      name: 'BCI',
      tag: 'BCI',
      color: 'amber',
      accentColor: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      badgeBg: 'bg-amber-500/15',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400'
    };
  }
  if (text.includes('tenpo')) {
    return {
      name: 'Tenpo',
      tag: 'TEN',
      color: 'cyan',
      accentColor: '#00FFCC',
      bgGlow: 'rgba(0, 255, 204, 0.15)',
      badgeBg: 'bg-[#00FFCC]/15',
      badgeBorder: 'border-[#00FFCC]/30',
      badgeText: 'text-[#00FFCC]'
    };
  }
  if (text.includes('estado') || text.includes('rut')) {
    return {
      name: 'BancoEstado',
      tag: 'BE',
      color: 'orange',
      accentColor: '#F97316',
      bgGlow: 'rgba(249, 115, 22, 0.15)',
      badgeBg: 'bg-orange-500/15',
      badgeBorder: 'border-orange-500/30',
      badgeText: 'text-orange-400'
    };
  }
  if (text.includes('scotia')) {
    return {
      name: 'Scotiabank',
      tag: 'SCO',
      color: 'red',
      accentColor: '#EF4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      badgeBg: 'bg-red-500/15',
      badgeBorder: 'border-red-500/30',
      badgeText: 'text-red-400'
    };
  }
  if (text.includes('itau') || text.includes('itaú')) {
    return {
      name: 'Itaú',
      tag: 'ITA',
      color: 'orange',
      accentColor: '#FB923C',
      bgGlow: 'rgba(251, 146, 60, 0.15)',
      badgeBg: 'bg-orange-500/15',
      badgeBorder: 'border-orange-500/30',
      badgeText: 'text-orange-400'
    };
  }
  if (text.includes('mercado') || text.includes('pago')) {
    return {
      name: 'Mercado Pago',
      tag: 'MP',
      color: 'sky',
      accentColor: '#38BDF8',
      bgGlow: 'rgba(56, 189, 248, 0.15)',
      badgeBg: 'bg-sky-500/15',
      badgeBorder: 'border-sky-500/30',
      badgeText: 'text-sky-400'
    };
  }
  if (text.includes('mach')) {
    return {
      name: 'Mach',
      tag: 'MACH',
      color: 'purple',
      accentColor: '#A855F7',
      bgGlow: 'rgba(168, 85, 247, 0.15)',
      badgeBg: 'bg-purple-500/15',
      badgeBorder: 'border-purple-500/30',
      badgeText: 'text-purple-400'
    };
  }

  return {
    name: bankName || 'Banco',
    tag: (bankName || 'B').slice(0, 3).toUpperCase(),
    color: 'indigo',
    accentColor: '#818CF8',
    bgGlow: 'rgba(129, 140, 248, 0.15)',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-400'
  };
}

export const AccountsManagementView: React.FC<AccountsManagementViewProps> = ({
  accounts,
  transactions,
  credits = [],
  currentPeriod = new Date().toISOString().slice(0, 7),
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onOpenImportModal,
  onOpenBillingModal,
  onOpenPayBillingModal
}) => {
  // Category tabs: 'all' | 'credit_card' | 'debit_checking' | 'prepaid_other'
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'credit_card' | 'debit_checking' | 'prepaid_other'>('all');

  // Selected Account for Audit Column
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ''
  );

  // Modal State for Create / Edit Account
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formBank, setFormBank] = useState(CHILEAN_BANKS[0]);
  const [formCustomBank, setFormCustomBank] = useState('');
  const [formType, setFormType] = useState<AccountType>('credit_card');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('');
  const [formInitialBalance, setFormInitialBalance] = useState('');
  const [formClosingDay, setFormClosingDay] = useState('');
  const [formDueDay, setFormDueDay] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Keep selectedAccountId valid if accounts change
  React.useEffect(() => {
    if (accounts.length > 0 && !accounts.some((a) => a.id === selectedAccountId)) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Selected Account
  const activeAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null;
  }, [accounts, selectedAccountId]);

  // Counts for tabs
  const tabCounts = useMemo(() => {
    const all = accounts.length;
    const creditCards = accounts.filter((a) => a.type === 'credit_card').length;
    const debitChecking = accounts.filter((a) => a.type === 'checking' || a.type === 'sight').length;
    const prepaidOther = accounts.filter((a) => a.type === 'savings' || a.type === 'cash').length;
    return { all, creditCards, debitChecking, prepaidOther };
  }, [accounts]);

  // Filtered accounts based on activeTabFilter
  const filteredAccounts = useMemo(() => {
    if (activeTabFilter === 'credit_card') {
      return accounts.filter((a) => a.type === 'credit_card');
    }
    if (activeTabFilter === 'debit_checking') {
      return accounts.filter((a) => a.type === 'checking' || a.type === 'sight');
    }
    if (activeTabFilter === 'prepaid_other') {
      return accounts.filter((a) => a.type === 'savings' || a.type === 'cash');
    }
    return accounts;
  }, [accounts, activeTabFilter]);

  // Mathematical Audit Calculation for the Active Account
  const auditData = useMemo<AuditData | null>(() => {
    if (!activeAccount) {
      return null;
    }

    const isTC = activeAccount.type === 'credit_card';
    const accTxs = transactions.filter((t) => t.accountId === activeAccount.id);

    if (isTC) {
      // 1. Credit Card Breakdown
      let directPurchases = 0;
      let installmentCharges = 0;
      let subscriptions = 0;
      let allocatedPayments = 0;

      accTxs.forEach((t) => {
        const isAbono = isPaymentOrIncomeTransaction(t);
        const amount = Math.abs(t.amount);

        if (isAbono) {
          allocatedPayments += amount;
        } else {
          // Check if installment
          if (t.installments && t.installments.total > 1) {
            installmentCharges += amount;
          } else {
            directPurchases += amount;
          }
        }
      });

      // Add credit subscriptions linked to this TC if any
      credits
        .filter((c) => c.accountId === activeAccount.id && c.type === 'suscripcion')
        .forEach((c) => {
          subscriptions += c.installmentAmount;
        });

      const totalUsed = Math.max(0, directPurchases + installmentCharges + subscriptions - allocatedPayments);
      const creditLimit = activeAccount.creditLimit || 0;
      const availableCredit = Math.max(0, creditLimit - totalUsed);
      const percentUsed = creditLimit > 0 ? Math.min(100, Math.round((totalUsed / creditLimit) * 100)) : 0;

      return {
        isTC: true,
        directPurchases,
        installmentCharges,
        subscriptions,
        allocatedPayments,
        totalUsed,
        creditLimit,
        availableCredit,
        percentUsed,
        closingDay: activeAccount.closingDay,
        dueDay: activeAccount.dueDay,
        txCount: accTxs.length
      };
    } else {
      // 2. Debit / Checking / Sight Account Breakdown (Exact Formula RF-14)
      const initialBalance = activeAccount.initialBalance || 0;
      let validatedIncomes = 0;
      let consumptionExpenses = 0;
      let tcPayments = 0;

      accTxs.forEach((t) => {
        const amount = Math.abs(t.amount);
        const isTcOutflow =
          t.transactionType === 'pago_tc' ||
          (t.transactionType === 'transferencia_enviada' && isCreditCardPaymentTransaction(t));

        if (isTcOutflow) {
          // Explicitly isolated TC payments to avoid double charges
          tcPayments += amount;
        } else if (isPaymentOrIncomeTransaction(t)) {
          validatedIncomes += amount;
        } else {
          consumptionExpenses += amount;
        }
      });

      const estimatedBalance = initialBalance + validatedIncomes - consumptionExpenses - tcPayments;
      const netVariation = validatedIncomes - (consumptionExpenses + tcPayments);
      const percentVariation = initialBalance > 0 ? (netVariation / initialBalance) * 100 : 0;

      return {
        isTC: false,
        initialBalance,
        validatedIncomes,
        consumptionExpenses,
        tcPayments,
        estimatedBalance,
        netVariation,
        percentVariation,
        txCount: accTxs.length
      };
    }
  }, [activeAccount, transactions, credits]);

  // Open Modal to Create New Account
  const handleOpenCreateModal = () => {
    setIsEditingExisting(false);
    setAccountToEdit(null);
    setFormName('');
    setFormBank(CHILEAN_BANKS[0]);
    setFormCustomBank('');
    setFormType('credit_card');
    setFormAccountNumber('');
    setFormCreditLimit('');
    setFormInitialBalance('');
    setFormClosingDay('');
    setFormDueDay('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Account
  const handleOpenEditModal = (acc: Account) => {
    setIsEditingExisting(true);
    setAccountToEdit(acc);
    setFormName(acc.name);
    if (CHILEAN_BANKS.includes(acc.bank)) {
      setFormBank(acc.bank);
      setFormCustomBank('');
    } else {
      setFormBank('Otro');
      setFormCustomBank(acc.bank);
    }
    setFormType(acc.type);
    setFormAccountNumber(acc.accountNumber || '');
    setFormCreditLimit(acc.creditLimit !== undefined && acc.creditLimit !== null ? acc.creditLimit.toString() : '');
    setFormInitialBalance(acc.initialBalance !== undefined && acc.initialBalance !== null ? acc.initialBalance.toString() : '');
    setFormClosingDay(acc.closingDay ? acc.closingDay.toString() : '');
    setFormDueDay(acc.dueDay ? acc.dueDay.toString() : '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const effectiveBank = formBank === 'Otro' ? formCustomBank.trim() : formBank.trim();
    if (!formName.trim() || !effectiveBank) {
      setFormError('Por favor ingresa el nombre de la cuenta y la entidad financiera.');
      return;
    }

    let parsedClosingDay: number | undefined = undefined;
    if (formClosingDay.trim()) {
      const parsed = parseInt(formClosingDay.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 31) {
        setFormError('El día de corte debe estar entre 1 y 31.');
        return;
      }
      parsedClosingDay = parsed;
    }

    let parsedDueDay: number | undefined = undefined;
    if (formDueDay.trim()) {
      const parsed = parseInt(formDueDay.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 31) {
        setFormError('El día de vencimiento debe estar entre 1 y 31.');
        return;
      }
      parsedDueDay = parsed;
    }

    let parsedCreditLimit: number | undefined = undefined;
    if (formCreditLimit.trim()) {
      const parsed = parseFloat(formCreditLimit.trim());
      if (!isNaN(parsed)) parsedCreditLimit = parsed;
    }

    let parsedInitialBalance: number | undefined = undefined;
    if (formInitialBalance.trim()) {
      const parsed = parseFloat(formInitialBalance.trim());
      if (!isNaN(parsed)) parsedInitialBalance = parsed;
    }

    if (isEditingExisting && accountToEdit && onUpdateAccount) {
      const updatedAcc: Account = {
        ...accountToEdit,
        name: formName.trim(),
        bank: effectiveBank,
        type: formType,
        accountNumber: formAccountNumber.trim() || undefined,
        creditLimit: parsedCreditLimit,
        initialBalance: parsedInitialBalance,
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay
      };
      await onUpdateAccount(updatedAcc);
    } else {
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        name: formName.trim(),
        bank: effectiveBank,
        type: formType,
        accountNumber: formAccountNumber.trim() || undefined,
        currency: 'CLP',
        creditLimit: parsedCreditLimit,
        initialBalance: parsedInitialBalance,
        color: formType === 'credit_card' ? '#e11d48' : '#0284c7',
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay
      };
      await onAddAccount(newAcc);
      setSelectedAccountId(newAcc.id);
    }

    setIsModalOpen(false);
  };

  // Delete Account
  const handleDeleteAccount = async (accId: string) => {
    if (accounts.length <= 1) {
      alert('Debes mantener al menos una cuenta activa en FinanzApp.');
      setConfirmDeleteId(null);
      return;
    }
    await onDeleteAccount(accId);
    setConfirmDeleteId(null);
    const remaining = accounts.filter((a) => a.id !== accId);
    if (remaining.length > 0) {
      setSelectedAccountId(remaining[0].id);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. Header & Summary Stats */}
      <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-[#00FFCC]/20 to-[#FF2D78]/20 text-[#00FFCC] rounded-2xl border border-[#00FFCC]/30 shadow-inner shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-headline font-bold text-white tracking-tight">
                Gestión de Cuentas & Tarjetas
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#A098B0] mt-1 max-w-2xl font-sans">
              Auditoría aritmética de saldos bancarios en tiempo real, ciclos de facturación TC y conciliación de cartolas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 bg-[#00FFCC] hover:bg-[#00e6b8] text-black font-headline font-bold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-[#00FFCC]/20 transition transform hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Cuenta / Tarjeta</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs (Pantalla2.html Spec) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTabFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTabFilter === 'all'
              ? 'bg-[#00FFCC] text-black font-bold shadow-md shadow-[#00FFCC]/20'
              : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
          }`}
        >
          <span>Todas las Cuentas</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTabFilter === 'all' ? 'bg-black/20 text-black' : 'bg-[#0E0E18] text-slate-300'}`}>
            {tabCounts.all}
          </span>
        </button>

        <button
          onClick={() => setActiveTabFilter('credit_card')}
          className={`px-3.5 py-2 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTabFilter === 'credit_card'
              ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
              : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
          }`}
        >
          <span>Tarjetas de Crédito</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTabFilter === 'credit_card' ? 'bg-black/25 text-white' : 'bg-[#0E0E18] text-slate-300'}`}>
            {tabCounts.creditCards}
          </span>
        </button>

        <button
          onClick={() => setActiveTabFilter('debit_checking')}
          className={`px-3.5 py-2 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTabFilter === 'debit_checking'
              ? 'bg-[#00FFCC] text-black font-bold shadow-md shadow-[#00FFCC]/20'
              : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
          }`}
        >
          <span>Cuentas Vista & Corrientes</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTabFilter === 'debit_checking' ? 'bg-black/20 text-black' : 'bg-[#0E0E18] text-slate-300'}`}>
            {tabCounts.debitChecking}
          </span>
        </button>

        <button
          onClick={() => setActiveTabFilter('prepaid_other')}
          className={`px-3.5 py-2 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-2 ${
            activeTabFilter === 'prepaid_other'
              ? 'bg-[#FF2D78] text-white font-bold shadow-md shadow-[#FF2D78]/20'
              : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
          }`}
        >
          <span>Prepago / Otras</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTabFilter === 'prepaid_other' ? 'bg-black/25 text-white' : 'bg-[#0E0E18] text-slate-300'}`}>
            {tabCounts.prepaidOther}
          </span>
        </button>
      </div>

      {/* 3. Main Workspace: Grid of Accounts (Left) & Real-Time Audit Column (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* COLUMNA 1 (Izquierda 7/12): Grid de Cuentas Interactivas  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-[#A098B0] uppercase tracking-wider font-headline">
              Instrumentos Financieros ({filteredAccounts.length})
            </span>
            <span className="text-[11px] text-[#A098B0] font-sans">
              Haz clic en cualquier tarjeta para auditar su fórmula matemática
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredAccounts.map((acc) => {
              const isSelected = activeAccount?.id === acc.id;
              const branding = getBankBranding(acc.bank, acc.name);
              const isTC = acc.type === 'credit_card';

              // Quick account metrics
              const accTxs = transactions.filter((t) => t.accountId === acc.id);
              let totalSpent = 0;
              let totalIncome = 0;
              accTxs.forEach((t) => {
                if (isPaymentOrIncomeTransaction(t)) totalIncome += Math.abs(t.amount);
                else totalSpent += Math.abs(t.amount);
              });

              const estimatedBalance = (acc.initialBalance || 0) + totalIncome - totalSpent;
              const usedCredit = Math.max(0, totalSpent - totalIncome);
              const creditLimit = acc.creditLimit || 0;
              const percentUsed = creditLimit > 0 ? Math.min(100, Math.round((usedCredit / creditLimit) * 100)) : 0;

              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`bg-[#141422] border rounded-2xl p-4 panel-rim transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-3.5 shadow-md ${
                    isSelected
                      ? 'border-[#00FFCC] bg-[#00FFCC]/5 ring-2 ring-[#00FFCC]/40 shadow-xl'
                      : 'border-[#302840] hover:border-slate-600 hover:bg-[#1a1728]/70'
                  }`}
                >
                  {/* Bank Brand Glow */}
                  <div
                    className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-40"
                    style={{ background: branding.accentColor }}
                  />

                  {/* Header: Bank Avatar + Name + Type */}
                  <div className="flex items-start justify-between gap-2 relative z-10">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-headline font-black text-xs shrink-0 border ${branding.badgeBg} ${branding.badgeBorder} ${branding.badgeText}`}
                      >
                        {branding.tag}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-headline font-bold text-sm text-white truncate" title={acc.name}>
                          {acc.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#A098B0]">
                          <span className="capitalize">{branding.name}</span>
                          {acc.accountNumber && (
                            <span className="font-mono text-[10px] text-[#A098B0]/80">
                              ••{acc.accountNumber.slice(-4)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        isTC ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-[#00FFCC]/10 border-[#00FFCC]/30 text-[#00FFCC]'
                      }`}
                    >
                      {isTC ? 'TC' : 'Cuenta'}
                    </span>
                  </div>

                  {/* Main Metric Section */}
                  <div className="pt-2 border-t border-[#302840]/60 relative z-10">
                    {isTC ? (
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-[#A098B0]">Deuda Utilizada:</span>
                          <span className="font-mono font-bold text-sm text-rose-400">
                            {formatCLP(usedCredit)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-[#0E0E18] rounded-full overflow-hidden border border-[#302840]">
                            <div
                              className="h-full bg-gradient-to-r from-[#00FFCC] to-rose-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentUsed}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[#A098B0] font-mono">
                            <span>Cupo: {formatCLP(creditLimit)}</span>
                            <span>{percentUsed}% ocupado</span>
                          </div>
                        </div>

                        {/* Key Dates: Closing and Due day */}
                        <div className="flex items-center justify-between pt-1 text-[10px] text-[#FFE04A] font-sans">
                          {acc.closingDay ? <span>Corte: día {acc.closingDay}</span> : <span>Sin día de corte</span>}
                          {acc.dueDay && <span>Vence: día {acc.dueDay}</span>}
                        </div>

                        {/* Billing cycle status badge */}
                        {(() => {
                          const cycle = getBillingCycleSummary(acc, transactions, credits);
                          if (!cycle) return null;
                          return (
                            <div className="pt-2 border-t border-[#302840]/60 flex items-center justify-between">
                              <span className={`text-[10px] font-headline font-semibold px-2 py-0.5 rounded-full border ${cycle.statusBadgeColor}`}>
                                {cycle.statusLabel}
                              </span>
                              {cycle.isClosed && cycle.pendingBalance > 0 && (
                                <span className="text-[10px] font-mono text-rose-300 font-bold">
                                  {formatCLP(cycle.pendingBalance)}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] text-[#A098B0]">Saldo Estimado:</span>
                          <span
                            className={`font-mono font-bold text-base ${
                              estimatedBalance >= 0 ? 'text-[#00FFCC]' : 'text-rose-400'
                            }`}
                          >
                            {formatCLP(estimatedBalance)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#A098B0] font-mono">
                          <span>Base: {formatCLP(acc.initialBalance || 0)}</span>
                          <span className={totalIncome >= totalSpent ? 'text-emerald-400' : 'text-rose-400'}>
                            {totalIncome >= totalSpent ? `+${formatCLP(totalIncome - totalSpent)}` : formatCLP(totalIncome - totalSpent)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2 border-t border-[#302840]/60 flex items-center justify-between relative z-10">
                    <span className="text-[10px] text-[#A098B0] font-mono">
                      {accTxs.length} movimientos
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isTC && onOpenPayBillingModal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPayBillingModal(acc);
                          }}
                          className="text-[11px] font-headline font-bold px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition flex items-center gap-1"
                          title="Registrar pago de facturación"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pagar</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(acc);
                        }}
                        className="p-1.5 rounded-lg bg-[#0E0E18] hover:bg-[#302840] text-[#A098B0] hover:text-white transition"
                        title="Editar cuenta"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAccountId(acc.id);
                        }}
                        className={`text-[11px] font-headline font-semibold px-2.5 py-1 rounded-lg transition ${
                          isSelected ? 'bg-[#00FFCC] text-black font-bold' : 'bg-[#0E0E18] text-[#00FFCC] hover:bg-[#00FFCC]/10'
                        }`}
                      >
                        {isSelected ? 'Auditando' : 'Auditar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA 2 (Derecha 5/12): Panel de Auditoría Matemática   */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          {activeAccount && auditData ? (
            <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-5 shadow-2xl space-y-5 animate-in fade-in duration-300">
              
              {/* Header: Active Account Identification */}
              <div className="flex items-start justify-between gap-3 border-b border-[#302840] pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-headline font-black text-sm shrink-0 border ${
                      getBankBranding(activeAccount.bank, activeAccount.name).badgeBg
                    } ${getBankBranding(activeAccount.bank, activeAccount.name).badgeBorder} ${
                      getBankBranding(activeAccount.bank, activeAccount.name).badgeText
                    }`}
                  >
                    {getBankBranding(activeAccount.bank, activeAccount.name).tag}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-mono font-bold text-[#00FFCC] tracking-wider block">
                      Auditoría & Desglose en Tiempo Real
                    </span>
                    <h3 className="font-headline font-bold text-base text-white truncate" title={activeAccount.name}>
                      {activeAccount.name}
                    </h3>
                    <p className="text-xs text-[#A098B0]">
                      {activeAccount.bank} • {activeAccount.type === 'credit_card' ? 'Tarjeta de Crédito' : 'Cuenta de Fondos'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEditModal(activeAccount)}
                  className="p-2 rounded-xl bg-[#0E0E18] hover:bg-slate-800 text-[#A098B0] hover:text-white border border-[#302840] transition shrink-0"
                  title="Editar parámetros de la cuenta"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Case A: Debit vs Case B: Credit Card */}
              {auditData.isTC ? (
                /* Case B: Credit Card Billing Breakdown (Escenario 2) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#FFE04A]" />
                      <span>Desglose de Facturación y Deuda</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                      {auditData.percentUsed}% cupo ocupado
                    </span>
                  </div>

                  {/* Step by step credit card formula */}
                  <div className="space-y-2 bg-[#0E0E18] p-4 rounded-xl border border-[#302840] font-mono text-xs">
                    {/* 1. Compras Directas del Mes */}
                    <div className="flex items-center justify-between text-rose-300">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-rose-400 font-bold">(+)</span> Compras Directas del Mes
                      </span>
                      <span className="font-bold">+{formatCLP(auditData.directPurchases)}</span>
                    </div>

                    {/* 2. Cuotas Imputadas al Período */}
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-amber-400 font-bold">(+)</span> Cuotas Imputadas al Período
                      </span>
                      <span className="font-bold">+{formatCLP(auditData.installmentCharges)}</span>
                    </div>

                    {/* 3. Suscripciones Automáticas */}
                    {auditData.subscriptions > 0 && (
                      <div className="flex items-center justify-between text-indigo-300">
                        <span className="text-[#A098B0] font-sans flex items-center gap-1">
                          <span className="text-indigo-400 font-bold">(+)</span> Suscripciones y Recurrentes
                        </span>
                        <span className="font-bold">+{formatCLP(auditData.subscriptions)}</span>
                      </div>
                    )}

                    {/* 4. Abonos y Pagos Aplicados */}
                    <div className="flex items-center justify-between text-[#00FFCC]">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-[#00FFCC] font-bold">(-)</span> Abonos y Pagos Aplicados
                      </span>
                      <span className="font-bold">-{formatCLP(auditData.allocatedPayments)}</span>
                    </div>

                    {/* Divider and Total Used */}
                    <div className="pt-3 mt-2 border-t-2 border-[#302840] flex items-baseline justify-between">
                      <span className="font-headline font-bold text-white text-xs">
                        (=) Deuda Utilizada / Facturada
                      </span>
                      <span className="text-2xl font-black text-rose-400 font-mono">
                        {formatCLP(auditData.totalUsed)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar of credit limit */}
                  <div className="space-y-1.5 bg-[#0E0E18] p-3 rounded-xl border border-[#302840]">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#A098B0]">Cupo Disponible:</span>
                      <span className="text-[#00FFCC] font-bold">{formatCLP(auditData.availableCredit)}</span>
                    </div>
                    <div className="w-full h-2 bg-[#141422] rounded-full overflow-hidden border border-[#302840]">
                      <div
                        className="h-full bg-gradient-to-r from-[#00FFCC] to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${auditData.percentUsed}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#A098B0] font-mono pt-0.5">
                      <span>Utilizado: {formatCLP(auditData.totalUsed)}</span>
                      <span>Cupo Total: {formatCLP(auditData.creditLimit)}</span>
                    </div>
                  </div>

                  {/* Key Dates Badge Box */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                      <span className="text-[10px] text-[#A098B0] uppercase block">Día de Corte</span>
                      <span className="font-headline font-bold text-white text-sm">
                        {auditData.closingDay ? `Día ${auditData.closingDay}` : 'No definido'}
                      </span>
                    </div>
                    <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#302840]">
                      <span className="text-[10px] text-[#A098B0] uppercase block">Día de Pago</span>
                      <span className="font-headline font-bold text-[#FFE04A] text-sm">
                        {auditData.dueDay ? `Día ${auditData.dueDay}` : 'No definido'}
                      </span>
                    </div>
                  </div>

                  {/* Billing Cycle Status & Guided Payment */}
                  {(() => {
                    const cycle = getBillingCycleSummary(activeAccount, transactions, credits);
                    if (!cycle) return null;
                    return (
                      <div className="bg-[#0E0E18] p-3.5 rounded-xl border border-[#302840] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full animate-pulse bg-[#00FFCC]" />
                            Estado de Facturación
                          </span>
                          <span className={`text-[10px] font-headline font-semibold px-2 py-0.5 rounded-full border ${cycle.statusBadgeColor}`}>
                            {cycle.statusLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="bg-[#141422] p-2 rounded-lg border border-[#302840]">
                            <span className="text-[10px] text-[#A098B0] block">Total Facturado</span>
                            <span className="font-bold text-white">{formatCLP(cycle.totalBilled)}</span>
                          </div>
                          <div className="bg-[#141422] p-2 rounded-lg border border-[#302840]">
                            <span className="text-[10px] text-[#A098B0] block">Pagos Realizados</span>
                            <span className="font-bold text-emerald-400">+{formatCLP(cycle.totalPaid)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-mono pt-0.5">
                          <span className="text-[#A098B0]">Saldo Pendiente:</span>
                          <span className={`font-bold ${cycle.pendingBalance === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatCLP(cycle.pendingBalance)}
                          </span>
                        </div>

                        {cycle.revolvingBalance > 0 && (
                          <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 flex items-start gap-1.5">
                            <span>⚠️</span>
                            <span>Deuda rotativa de {formatCLP(cycle.revolvingBalance)} generará intereses el próximo ciclo.</span>
                          </div>
                        )}

                        {onOpenPayBillingModal && (
                          <button
                            onClick={() => onOpenPayBillingModal(activeAccount)}
                            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-headline font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Registrar Pago de Facturación
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Case A: Debit / Checking / Sight Account Exact Arithmetic Formula (RF-14) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#00FFCC]" />
                      <span>Fórmula de Saldo Calculado</span>
                    </span>
                    {auditData.percentVariation !== 0 && (
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                          auditData.percentVariation >= 0
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {auditData.percentVariation >= 0 ? '+' : ''}
                        {auditData.percentVariation.toFixed(1)}% Neto
                      </span>
                    )}
                  </div>

                  {/* Step by step arithmetic list */}
                  <div className="space-y-2 bg-[#0E0E18] p-4 rounded-xl border border-[#302840] font-mono text-xs">
                    {/* 1. Saldo Inicial Registrado */}
                    <div className="flex items-center justify-between text-[#E8E0F0]">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-sky-400 font-bold">(+)</span> Saldo Inicial Registrado
                      </span>
                      <span className="font-bold">{formatCLP(auditData.initialBalance)}</span>
                    </div>

                    {/* 2. Ingresos Validados */}
                    <div className="flex items-center justify-between text-[#00FFCC]">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-[#00FFCC] font-bold">(+)</span> Ingresos Validados (Sueldos/Transf)
                      </span>
                      <span className="font-bold">+{formatCLP(auditData.validatedIncomes)}</span>
                    </div>

                    {/* 3. Egresos de Consumo */}
                    <div className="flex items-center justify-between text-rose-300">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-rose-400 font-bold">(-)</span> Egresos de Consumo (Débitos/Compras)
                      </span>
                      <span className="font-bold">-{formatCLP(auditData.consumptionExpenses)}</span>
                    </div>

                    {/* 4. Pagos TC Aislados */}
                    <div className="flex items-center justify-between text-amber-300">
                      <span className="text-[#A098B0] font-sans flex items-center gap-1">
                        <span className="text-amber-400 font-bold">(-)</span> Pagos TC (Regla pago_tc aislada)
                      </span>
                      <span className="font-bold">-{formatCLP(auditData.tcPayments)}</span>
                    </div>

                    {/* Divider and Final Available Balance */}
                    <div className="pt-3 mt-2 border-t-2 border-[#302840] flex items-baseline justify-between">
                      <span className="font-headline font-bold text-white text-xs">
                        (=) Saldo Estimado Disponible
                      </span>
                      <span
                        className={`text-2xl font-black ${
                          auditData.estimatedBalance >= 0 ? 'text-[#00FFCC]' : 'text-rose-400'
                        }`}
                      >
                        {formatCLP(auditData.estimatedBalance)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#A098B0] italic bg-[#141422] p-2.5 rounded-lg border border-[#302840]/60">
                    ℹ️ Los pagos a tarjetas de crédito se aíslan para garantizar que no dupliquen gastos ya computados en tus tarjetas.
                  </p>
                </div>
              )}

              {/* Action Buttons in Audit Column */}
              <div className="pt-2 border-t border-[#302840] space-y-2">
                {onOpenImportModal && (
                  <button
                    onClick={onOpenImportModal}
                    className="w-full bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/30 font-headline font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Reconciliar Saldo con Cartola Bancaria</span>
                  </button>
                )}

                {auditData.isTC && onOpenBillingModal && (
                  <button
                    onClick={onOpenBillingModal}
                    className="w-full bg-[#141422] hover:bg-slate-800 text-[#E8E0F0] hover:text-white border border-[#302840] font-headline font-semibold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-[#FFE04A]" />
                    <span>Simular Facturación al Corte</span>
                  </button>
                )}

                {/* Delete Account confirmation trigger */}
                <div className="pt-2">
                  {confirmDeleteId === activeAccount.id ? (
                    <div className="bg-rose-950/70 border border-rose-500/50 p-3 rounded-xl space-y-2">
                      <p className="text-xs text-rose-300 font-semibold text-center">
                        ¿Confirmas eliminar permanentemente esta cuenta y sus {auditData.txCount} movimientos?
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDeleteAccount(activeAccount.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Sí, Eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-slate-800 text-[#A098B0] hover:text-white text-xs px-3 py-1.5 rounded-lg transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(activeAccount.id)}
                      className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs font-semibold py-1.5 rounded-lg transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Cuenta</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl p-8 text-center text-[#A098B0] space-y-3">
              <Layers className="w-8 h-8 mx-auto text-[#00FFCC]/50" />
              <p className="text-xs">Selecciona una cuenta a la izquierda para auditar su fórmula matemática.</p>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. Modal para Crear / Editar Cuentas (Stitch Spec)        */}
      {/* ========================================================= */}
      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#141422] rounded-2xl shadow-2xl max-w-lg w-full border border-[#302840] panel-rim overflow-hidden flex flex-col max-h-[90vh] text-[#E8E0F0]">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-[#0E0E18] border-b border-[#302840] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00FFCC]/10 text-[#00FFCC] rounded-xl border border-[#00FFCC]/30">
                    {isEditingExisting ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5 stroke-[3]" />}
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-base text-white">
                      {isEditingExisting ? 'Editar Cuenta o Tarjeta' : 'Registrar Nueva Cuenta'}
                    </h3>
                    <p className="text-xs text-[#A098B0]">
                      Configura el instrumento, cupo, saldo inicial y fechas de facturación
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-[#A098B0] hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold text-white">
                    Nombre Descriptivo <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: TC Falabella Black, Cuenta Corriente Santander..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Banco / Entidad <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formBank}
                      onChange={(e) => setFormBank(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] cursor-pointer"
                    >
                      {CHILEAN_BANKS.map((b) => (
                        <option key={b} value={b} className="bg-[#141422] text-white">
                          {b}
                        </option>
                      ))}
                      <option value="Otro" className="bg-[#141422] text-white">Otro / Personalizado...</option>
                    </select>
                    {formBank === 'Otro' && (
                      <input
                        type="text"
                        required
                        placeholder="Nombre de la entidad..."
                        value={formCustomBank}
                        onChange={(e) => setFormCustomBank(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] mt-1.5"
                      />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Tipo de Instrumento <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as AccountType)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] cursor-pointer"
                    >
                      <option value="credit_card" className="bg-[#141422]">💳 Tarjeta de Crédito</option>
                      <option value="checking" className="bg-[#141422]">🏦 Cuenta Corriente</option>
                      <option value="sight" className="bg-[#141422]">🏢 Cuenta Vista / RUT</option>
                      <option value="savings" className="bg-[#141422]">💰 Cuenta de Ahorro</option>
                      <option value="cash" className="bg-[#141422]">💵 Efectivo / Billetera</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Terminación o Número
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: **** 4821"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      {formType === 'credit_card' ? 'Cupo Total de Crédito (CLP)' : 'Saldo Inicial Registrado (CLP)'}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-[#A098B0] font-bold">$</span>
                      <input
                        type="number"
                        placeholder="Ej: 2000000"
                        value={formType === 'credit_card' ? formCreditLimit : formInitialBalance}
                        onChange={(e) =>
                          formType === 'credit_card'
                            ? setFormCreditLimit(e.target.value)
                            : setFormInitialBalance(e.target.value)
                        }
                        className="w-full pl-7 pr-3 py-2 text-xs bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Ciclo de Facturación (Recomendado para Tarjetas de Crédito) */}
                <div className="p-3.5 bg-[#0E0E18] border border-[#302840] rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FFE04A]" />
                    <span className="text-xs font-headline font-bold text-white">
                      Ciclo de Facturación Mensual
                    </span>
                    {formType === 'credit_card' && (
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                        Recomendado TC
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] text-[#A098B0] font-semibold">
                        Día de Corte (1 al 31)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ej: 24"
                        value={formClosingDay}
                        onChange={(e) => setFormClosingDay(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] text-[#A098B0] font-semibold">
                        Día de Pago (1 al 31)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ej: 5"
                        value={formDueDay}
                        onChange={(e) => setFormDueDay(e.target.value)}
                        className="w-full text-xs py-2 px-3 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-4 border-t border-[#302840] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#0E0E18] hover:bg-slate-800 text-[#A098B0] hover:text-white text-xs font-headline font-semibold rounded-xl transition border border-[#302840]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#00FFCC] hover:bg-[#00e6b8] text-black text-xs font-headline font-bold rounded-xl transition shadow-lg shadow-[#00FFCC]/20"
                  >
                    {isEditingExisting ? 'Guardar Cambios' : 'Crear Cuenta'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
};
