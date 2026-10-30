import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Link2,
  Trash2,
  Plus,
  CheckCircle,
  CreditCard,
  Building2,
  AlertTriangle,
  Pencil,
  X,
  Calendar,
  Layers,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { ComputedTransaction, Account, CategoryMapping, TransactionType } from '../types';
import { getParentCategory, TRANSACTION_TYPES } from '../utils/categorizer';
import { calculateTransactionPeriod } from '../utils/dateUtils';
import { isPaymentOrIncomeTransaction, isCreditCardPaymentTransaction } from '../utils/paymentAllocation';
import { formatCLP } from './MetricCards';

export interface OriginBadgeInfo {
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

// 1. Helper to format date in monospace (e.g. "18 Oct 2026")
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  const day = parts[2];
  const monthNum = parseInt(parts[1], 10);
  const year = parts[0];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthName = months[monthNum - 1] || parts[1];
  return `${day} ${monthName} ${year}`;
}

// 2. Helper to determine Origin Badge (Google Wallet, Santander Transfer, Cartola Falabella, Webhook Telegram)
export function getTransactionOrigin(tx: ComputedTransaction, account?: Account): OriginBadgeInfo {
  const raw = (tx.rawDescription || tx.description || '').toLowerCase();
  const notes = (tx.notes || '').toLowerCase();
  const accName = (account?.name || '').toLowerCase();
  const bank = (account?.bank || '').toLowerCase();
  const txSource = (tx as any).source || '';

  // 1. Google Wallet / MacroDroid (ámbar neón)
  if (
    txSource === 'wallet' ||
    notes.includes('wallet') ||
    raw.includes('google pay') ||
    raw.includes('wallet') ||
    raw.includes('macrodroid')
  ) {
    return {
      label: 'Google Wallet',
      icon: '⚡',
      bgColor: 'bg-[#FFE04A]/10',
      borderColor: 'border-[#FFE04A]/30',
      textColor: 'text-[#FFE04A]'
    };
  }

  // 2. Webhook Telegram (magenta neón)
  if (
    txSource === 'telegram' ||
    notes.includes('telegram') ||
    raw.includes('telegram') ||
    notes.includes('bot')
  ) {
    return {
      label: 'Webhook Telegram',
      icon: '🤖',
      bgColor: 'bg-[#FF2D78]/10',
      borderColor: 'border-[#FF2D78]/30',
      textColor: 'text-[#FF2D78]'
    };
  }

  // 3. Santander Transfer (menta / cyan)
  if (
    (bank.includes('santander') || accName.includes('santander')) &&
    (tx.transactionType.includes('transferencia') || raw.includes('transferencia') || raw.includes('tef') || raw.includes('traspaso'))
  ) {
    return {
      label: 'Santander Transfer',
      icon: '↗️',
      bgColor: 'bg-[#00FFCC]/10',
      borderColor: 'border-[#00FFCC]/30',
      textColor: 'text-[#00FFCC]'
    };
  }

  // 4. Cartola Falabella / CMR (slate elegante)
  if (bank.includes('falabella') || accName.includes('falabella') || accName.includes('cmr')) {
    return {
      label: 'Cartola Falabella',
      icon: '💳',
      bgColor: 'bg-slate-700/30',
      borderColor: 'border-slate-600/40',
      textColor: 'text-slate-300'
    };
  }

  // 5. Transferencia de otro banco
  if (tx.transactionType.includes('transferencia') || raw.includes('transferencia') || raw.includes('tef')) {
    return {
      label: `${account?.bank || 'Banco'} Transfer`,
      icon: '↗️',
      bgColor: 'bg-[#00FFCC]/10',
      borderColor: 'border-[#00FFCC]/30',
      textColor: 'text-[#00FFCC]'
    };
  }

  // 6. Cartola bancaria general
  if (account) {
    return {
      label: `Cartola ${account.bank || account.name}`,
      icon: '🏦',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-300'
    };
  }

  // 7. Manual / Default
  return {
    label: 'App Manual',
    icon: '📝',
    bgColor: 'bg-slate-800',
    borderColor: 'border-slate-700',
    textColor: 'text-slate-400'
  };
}

// 3. Helper to determine Category Icon
export function getCategoryIcon(category?: string, subcategory?: string): string {
  const cat = (category || '').toLowerCase();
  const sub = (subcategory || '').toLowerCase();

  if (cat.includes('aliment') || sub.includes('supermercado') || sub.includes('restauran') || sub.includes('comida') || sub.includes('bar')) return '🛒';
  if (cat.includes('transporte') || sub.includes('veh') || sub.includes('uber') || sub.includes('combustible')) return '🚗';
  if (cat.includes('vivienda') || sub.includes('servicio') || sub.includes('hogar')) return '🏠';
  if (sub.includes('streaming') || sub.includes('suscrip') || sub.includes('netflix') || sub.includes('spotify')) return '📺';
  if (cat.includes('salud') || sub.includes('farmacia') || sub.includes('medic')) return '💊';
  if (sub.includes('tecnolog') || sub.includes('comput')) return '💻';
  if (cat.includes('compras') || sub.includes('ropa')) return '🛍️';
  if (cat.includes('abonos') || cat.includes('pagos') || sub.includes('pago')) return '💳';
  if (cat.includes('ingreso') || sub.includes('sueldo') || sub.includes('venta')) return '💰';
  if (sub.includes('transferencia')) return '↗️';
  if (sub.includes('educaci') || sub.includes('libro')) return '📚';
  if (sub.includes('viaje') || sub.includes('entretenimiento')) return '✈️';
  return '📁';
}

interface TransactionTableProps {
  transactions: ComputedTransaction[];
  accounts: Account[];
  categoryMappings: CategoryMapping[];
  onOpenPaymentModal: (purchase: ComputedTransaction) => void;
  onUpdateTransaction: (id: string, updates: Partial<ComputedTransaction>) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteTransactionsBatch?: (ids: string[]) => void;
  onAddTransaction: (newTx: any) => void;
  onOpenBillingModal?: () => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  accounts,
  categoryMappings,
  onOpenPaymentModal,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteTransactionsBatch,
  onAddTransaction,
  onOpenBillingModal
}) => {
  // Quick Filter Chips State: 'all' | 'pending' | 'credit_card' | 'debit_transfer' | 'installments'
  const [quickFilter, setQuickFilter] = useState<'all' | 'pending' | 'credit_card' | 'debit_transfer' | 'installments'>('all');
  
  // Sorting State: 'recent' | 'amount' | 'reconciliation'
  const [sortBy, setSortBy] = useState<'recent' | 'amount' | 'reconciliation'>('recent');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAccountId, setNewAccountId] = useState(accounts[0]?.id || '');
  const [newPeriod, setNewPeriod] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    const acc = accounts[0];
    return calculateTransactionPeriod(today, acc?.closingDay);
  });
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newSubcategory, setNewSubcategory] = useState<string>(
    categoryMappings[0]?.subcategories[0] || 'Restaurantes y Bares'
  );
  const [newType, setNewType] = useState<TransactionType>('compra');

  // Edit Transaction Modal State
  const [editingTx, setEditingTx] = useState<ComputedTransaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPeriod, setEditPeriod] = useState('');
  const [editType, setEditType] = useState<TransactionType>('compra');
  const [editSubcategory, setEditSubcategory] = useState('');
  const [editInstallmentCurrent, setEditInstallmentCurrent] = useState('');
  const [editInstallmentTotal, setEditInstallmentTotal] = useState('');

  // Selection & Bulk Modal State
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    idsToDelete: string[];
    title: string;
    message: string;
  }>({
    isOpen: false,
    idsToDelete: [],
    title: '',
    message: ''
  });

  // Calculate chip counts
  const chipCounts = useMemo(() => {
    const all = transactions.length;
    const pending = transactions.filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      const isPaymentOrIncome = isPaymentOrIncomeTransaction(t);
      return acc?.type === 'credit_card' && !isPaymentOrIncome && !t.isFullyPaid && (t.netAmount > 0 || t.amount > 0);
    }).length;
    const creditCards = transactions.filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      return acc?.type === 'credit_card';
    }).length;
    const debitTransfers = transactions.filter((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      return acc?.type !== 'credit_card' || t.transactionType.includes('transferencia') || t.transactionType === 'pago_tc';
    }).length;
    const installments = transactions.filter((t) => {
      return Boolean(t.installments && (t.installments.total > 1 || t.installments.current >= 1));
    }).length;

    return { all, pending, creditCards, debitTransfers, installments };
  }, [transactions, accounts]);

  // Filter and sort transactions according to active chips & sort option
  const filteredAndSortedTransactions = useMemo(() => {
    let list = [...transactions];

    // 1. Quick Filter
    if (quickFilter === 'pending') {
      list = list.filter((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const isPaymentOrIncome = isPaymentOrIncomeTransaction(t);
        return acc?.type === 'credit_card' && !isPaymentOrIncome && !t.isFullyPaid && (t.netAmount > 0 || t.amount > 0);
      });
    } else if (quickFilter === 'credit_card') {
      list = list.filter((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        return acc?.type === 'credit_card';
      });
    } else if (quickFilter === 'debit_transfer') {
      list = list.filter((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        return acc?.type !== 'credit_card' || t.transactionType.includes('transferencia') || t.transactionType === 'pago_tc';
      });
    } else if (quickFilter === 'installments') {
      list = list.filter((t) => Boolean(t.installments && (t.installments.total > 1 || t.installments.current >= 1)));
    }

    // 2. Sorting
    if (sortBy === 'recent') {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortBy === 'amount') {
      list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    } else if (sortBy === 'reconciliation') {
      list.sort((a, b) => {
        // Potential duplicates first
        if (a.isPotentialDuplicate && !b.isPotentialDuplicate) return -1;
        if (!a.isPotentialDuplicate && b.isPotentialDuplicate) return 1;
        // Then pending credit card purchases
        const aPending = !a.isFullyPaid && a.netAmount > 0;
        const bPending = !b.isFullyPaid && b.netAmount > 0;
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    return list;
  }, [transactions, accounts, quickFilter, sortBy]);

  const allVisibleIds = useMemo(
    () => filteredAndSortedTransactions.map((t) => t.id),
    [filteredAndSortedTransactions]
  );
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedTxIds.includes(id));

  const potentialDuplicates = useMemo(
    () => transactions.filter((t) => t.isPotentialDuplicate),
    [transactions]
  );

  const handleAcceptAllDuplicates = () => {
    potentialDuplicates.forEach((tx) => {
      onUpdateTransaction(tx.id, {
        isPotentialDuplicate: false,
        duplicateOfDescription: undefined,
        duplicateOfId: undefined
      });
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(allVisibleIds);
    }
  };

  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openSingleDeleteModal = (tx: ComputedTransaction) => {
    setDeleteConfirmModal({
      isOpen: true,
      idsToDelete: [tx.id],
      title: '¿Eliminar Movimiento?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el registro "${tx.description}" por ${formatCLP(tx.amount)}?`
    });
  };

  const handleConfirmDelete = () => {
    const { idsToDelete } = deleteConfirmModal;
    if (idsToDelete.length === 0) return;

    if (idsToDelete.length === 1) {
      onDeleteTransaction(idsToDelete[0]);
    } else if (onDeleteTransactionsBatch) {
      onDeleteTransactionsBatch(idsToDelete);
    } else {
      idsToDelete.forEach((id) => onDeleteTransaction(id));
    }

    setSelectedTxIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
    setDeleteConfirmModal({ isOpen: false, idsToDelete: [], title: '', message: '' });
  };

  const openBulkDeleteSelectedModal = () => {
    if (selectedTxIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      idsToDelete: selectedTxIds,
      title: `¿Eliminar ${selectedTxIds.length} Movimientos Seleccionados?`,
      message: `Vas a eliminar ${selectedTxIds.length} transacciones de forma masiva. Se borrarán inmediatamente de tu cuenta y base de datos.`
    });
  };

  const openClearAllVisibleModal = () => {
    if (allVisibleIds.length === 0) return;
    setDeleteConfirmModal({
      isOpen: true,
      idsToDelete: allVisibleIds,
      title: `¿Vaciar los ${allVisibleIds.length} Movimientos Visibles?`,
      message: `Vas a eliminar todos los ${allVisibleIds.length} registros mostrados en esta vista. Se borrarán permanentemente.`
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmount) return;

    const numAmount = parseFloat(newAmount);
    const targetAcc = accounts.find((a) => a.id === newAccountId);
    const finalPeriod = newPeriod || calculateTransactionPeriod(newDate, targetAcc?.closingDay);

    let finalType = newType;
    let finalSub = newSubcategory;

    if (numAmount < 0) {
      if (targetAcc?.type === 'credit_card' || finalType === 'compra') {
        finalType = targetAcc?.type === 'credit_card' ? 'pago_tc' : 'ingreso_venta';
      }
    }

    let parentCategory = getParentCategory(finalSub, categoryMappings);
    if (finalType === 'pago_tc') {
      const isAbonoCat = parentCategory.toLowerCase().includes('abono') || parentCategory.toLowerCase().includes('pago');
      if (!isAbonoCat) {
        const abonoGroup = categoryMappings.find(
          (c) => c.name.toLowerCase().includes('abono') || c.name.toLowerCase().includes('pago')
        );
        if (abonoGroup && abonoGroup.subcategories.length > 0) {
          finalSub = abonoGroup.subcategories[0];
          parentCategory = abonoGroup.name;
        } else {
          parentCategory = 'Abonos y Pagos';
          finalSub = 'Pagos de Tarjeta';
        }
      }
    }

    onAddTransaction({
      id: `tx-man-${Date.now()}`,
      accountId: newAccountId,
      date: newDate,
      period: finalPeriod,
      description: newDesc.trim(),
      rawDescription: newDesc.trim(),
      amount: Math.abs(numAmount),
      transactionType: finalType,
      category: parentCategory,
      subcategory: finalSub,
      allocations: [],
      created_at: new Date().toISOString()
    });

    setNewDesc('');
    setNewAmount('');
    setNewType('compra');
    setShowAddForm(false);
  };

  const handleSubcategoryChange = (txId: string, newSub: string) => {
    const parentCategory = getParentCategory(newSub, categoryMappings);
    onUpdateTransaction(txId, {
      subcategory: newSub,
      category: parentCategory
    });
  };

  const handleStartEdit = (tx: ComputedTransaction) => {
    setEditingTx(tx);
    setEditDesc(tx.description || '');
    setEditAmount(Math.abs(tx.amount).toString());
    setEditAccountId(tx.accountId || accounts[0]?.id || '');
    setEditDate(tx.date || new Date().toISOString().split('T')[0]);
    setEditPeriod(tx.period || '');
    setEditType(tx.transactionType || 'compra');
    setEditSubcategory(tx.subcategory || categoryMappings[0]?.subcategories[0] || '');
    setEditInstallmentCurrent(tx.installments?.current ? tx.installments.current.toString() : '');
    setEditInstallmentTotal(tx.installments?.total ? tx.installments.total.toString() : '');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !editDesc.trim() || !editAmount.trim()) return;

    const numAmount = Math.abs(parseFloat(editAmount.replace(/[^\d.-]/g, '')) || 0);
    const parentCategory = getParentCategory(editSubcategory, categoryMappings);

    let installments: { current: number; total: number } | undefined = undefined;
    if (editInstallmentCurrent.trim() && editInstallmentTotal.trim()) {
      const cur = parseInt(editInstallmentCurrent, 10);
      const tot = parseInt(editInstallmentTotal, 10);
      if (!isNaN(cur) && !isNaN(tot) && tot > 0) {
        installments = { current: cur, total: tot };
      }
    }

    const targetAcc = accounts.find((a) => a.id === editAccountId);
    const finalPeriod = editPeriod.trim() || calculateTransactionPeriod(editDate, targetAcc?.closingDay);

    onUpdateTransaction(editingTx.id, {
      description: editDesc.trim(),
      amount: numAmount,
      accountId: editAccountId,
      date: editDate,
      period: finalPeriod,
      transactionType: editType,
      category: parentCategory,
      subcategory: editSubcategory,
      installments
    });

    setEditingTx(null);
  };

  return (
    <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl shadow-xl overflow-hidden mb-8">
      
      {/* 1. Header Bar */}
      <div className="p-4 sm:p-5 bg-[#0E0E18]/80 border-b border-[#302840] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-headline font-bold text-white flex items-center gap-2">
            <span>Movimientos y Cartolas Cargadas</span>
            <span className="bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
              {filteredAndSortedTransactions.length} registros
            </span>
          </h2>
          <p className="text-xs text-[#A098B0] mt-0.5 font-sans">
            Audita procedencia de webhooks, cartolas bancarias y vinculación FIFO de pagos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedTxIds.length > 0 && (
            <button
              onClick={openBulkDeleteSelectedModal}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-lg shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar ({selectedTxIds.length})</span>
            </button>
          )}

          {filteredAndSortedTransactions.length > 0 && selectedTxIds.length === 0 && (
            <button
              onClick={openClearAllVisibleModal}
              className="flex items-center gap-1.5 bg-[#0E0E18] hover:bg-rose-950/40 text-[#A098B0] hover:text-rose-300 text-xs font-semibold px-3 py-2 rounded-xl transition border border-[#302840] hover:border-rose-500/40"
              title="Borrar todas las transacciones visibles"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Vaciar Todo ({filteredAndSortedTransactions.length})</span>
              <span className="sm:hidden">Vaciar</span>
            </button>
          )}

          {onOpenBillingModal && (
            <button
              onClick={onOpenBillingModal}
              className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-headline font-semibold px-3 py-2 rounded-xl transition shadow-sm"
              title="Proyectar y generar facturación al corte de Tarjetas de Crédito"
            >
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Facturación TC</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/30 text-xs font-headline font-bold px-3.5 py-2 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancelar' : 'Nuevo Movimiento'}</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Filter Chips & Sorting Bar (Stitch Requirement) */}
      <div className="p-3 sm:p-4 bg-[#0E0E18]/60 border-b border-[#302840] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Horizontal Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Chip: Todos */}
          <button
            onClick={() => setQuickFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              quickFilter === 'all'
                ? 'bg-[#00FFCC] text-black font-bold shadow-md shadow-[#00FFCC]/20'
                : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
            }`}
          >
            <span>Todos</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${quickFilter === 'all' ? 'bg-black/20 text-black' : 'bg-[#0E0E18] text-slate-300'}`}>
              {chipCounts.all}
            </span>
          </button>

          {/* Chip: Solo Pendientes */}
          <button
            onClick={() => setQuickFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              quickFilter === 'pending'
                ? 'bg-[#FFE04A] text-black font-bold shadow-md shadow-[#FFE04A]/20'
                : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
            }`}
          >
            <span>Solo Pendientes</span>
            {chipCounts.pending > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${quickFilter === 'pending' ? 'bg-black/20 text-black' : 'bg-[#FFE04A]/20 text-[#FFE04A]'}`}>
                {chipCounts.pending}
              </span>
            )}
          </button>

          {/* Chip: Tarjetas de Crédito */}
          <button
            onClick={() => setQuickFilter('credit_card')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              quickFilter === 'credit_card'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
            }`}
          >
            <span>Tarjetas de Crédito</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${quickFilter === 'credit_card' ? 'bg-black/25 text-white' : 'bg-[#0E0E18] text-slate-300'}`}>
              {chipCounts.creditCards}
            </span>
          </button>

          {/* Chip: Débito / Transferencias */}
          <button
            onClick={() => setQuickFilter('debit_transfer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              quickFilter === 'debit_transfer'
                ? 'bg-[#00FFCC] text-black font-bold shadow-md shadow-[#00FFCC]/20'
                : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
            }`}
          >
            <span>Débito / Transferencias</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${quickFilter === 'debit_transfer' ? 'bg-black/20 text-black' : 'bg-[#0E0E18] text-slate-300'}`}>
              {chipCounts.debitTransfers}
            </span>
          </button>

          {/* Chip: Compras en Cuotas */}
          <button
            onClick={() => setQuickFilter('installments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              quickFilter === 'installments'
                ? 'bg-[#FF2D78] text-white font-bold shadow-md shadow-[#FF2D78]/20'
                : 'bg-[#141422] text-[#A098B0] hover:text-white border border-[#302840]'
            }`}
          >
            <span>Compras en Cuotas</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${quickFilter === 'installments' ? 'bg-black/25 text-white' : 'bg-[#0E0E18] text-slate-300'}`}>
              {chipCounts.installments}
            </span>
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#A098B0]" />
          <span className="text-[11px] text-[#A098B0] font-sans">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-[#E8E0F0] rounded-xl focus:outline-none focus:border-[#00FFCC] font-headline cursor-pointer"
          >
            <option value="recent">Más recientes primero</option>
            <option value="amount">Mayor monto</option>
            <option value="reconciliation">Por Estado Conciliación</option>
          </select>
        </div>
      </div>

      {/* 3. Potential Duplicates Warning Banner */}
      {potentialDuplicates.length > 0 && (
        <div className="p-3.5 bg-[#F59E0B]/10 border-b border-[#F59E0B]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[#FFE04A]">
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-[#FFE04A] shrink-0" />
            <span>
              <b>{potentialDuplicates.length}</b> {potentialDuplicates.length === 1 ? 'movimiento con posible duplicidad detectado' : 'movimientos con posible duplicidad detectados'}.
            </span>
          </div>
          <button
            onClick={handleAcceptAllDuplicates}
            className="text-xs bg-[#FFE04A] hover:bg-[#ffe66d] text-black font-headline font-bold px-3 py-1.5 rounded-xl transition shadow-sm whitespace-nowrap"
          >
            Aceptar todas como válidas
          </button>
        </div>
      )}

      {/* 4. Manual Add Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 bg-[#0E0E18] border-b border-[#302840] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-200">
          <div>
            <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">Fecha Movimiento</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => {
                const d = e.target.value;
                setNewDate(d);
                const acc = accounts.find((a) => a.id === newAccountId);
                setNewPeriod(calculateTransactionPeriod(d, acc?.closingDay));
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">Mes-Período</label>
            <input
              type="month"
              required
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">Cuenta / Tarjeta</label>
            <select
              value={newAccountId}
              onChange={(e) => {
                const accId = e.target.value;
                setNewAccountId(accId);
                const acc = accounts.find((a) => a.id === accId);
                setNewPeriod(calculateTransactionPeriod(newDate, acc?.closingDay));
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#141422] text-white">
                  {a.name} {a.closingDay ? `(Corte día ${a.closingDay})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">Tipo de Movimiento</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as TransactionType)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-medium"
            >
              <option value="compra" className="bg-[#141422]">🛍️ Compra / Gasto (compra)</option>
              <option value="pago_tc" className="bg-[#141422]">💳 Pago de Tarjeta / Abono (pago_tc)</option>
              <option value="ingreso_venta" className="bg-[#141422]">💰 Ingreso / Sueldo (ingreso_venta)</option>
              <option value="transferencia_enviada" className="bg-[#141422]">↗️ Transferencia Enviada</option>
              <option value="transferencia_recibida" className="bg-[#141422]">↙️ Transferencia Recibida</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">Descripción / Comercio</label>
            <input
              type="text"
              required
              placeholder="Ej: Supermercado Líder, Uber, Spotify..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#A098B0] mb-1">
              Monto (CLP) <span className="text-[#A098B0]/60">(- para abonos)</span>
            </label>
            <input
              type="number"
              step="any"
              required
              placeholder="Ej: 15000"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full text-xs py-1.5 px-2.5 bg-[#141422] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-[#00FFCC] hover:bg-[#00e6b8] text-black font-headline font-bold py-2 px-3 rounded-xl text-xs transition shadow-md shadow-[#00FFCC]/20"
            >
              Guardar Movimiento
            </button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 5. Desktop Table View (Pantalla7.html Stitch Spec)               */}
      {/* ============================================================== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#0E0E18] text-[#A098B0] uppercase tracking-wider text-[11px] font-headline font-semibold border-b border-[#302840]">
            <tr>
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded text-[#00FFCC] focus:ring-[#00FFCC] border-[#302840] bg-[#0E0E18] cursor-pointer w-4 h-4"
                  title="Seleccionar Todos / Deseleccionar Todos"
                />
              </th>
              <th className="py-3 px-4">Fecha & Origen</th>
              <th className="py-3 px-4">Descripción & Comercio</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4">Tipo & Cuotas</th>
              <th className="py-3 px-4 text-right">Monto Facturado / Real</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#302840]/60 text-[#E8E0F0]">
            {filteredAndSortedTransactions.length > 0 ? (
              filteredAndSortedTransactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId);
                const isCreditCard = account?.type === 'credit_card';
                const isPaymentOrIncome = isPaymentOrIncomeTransaction(tx);
                const isPurchase = !isPaymentOrIncome && tx.amount > 0;
                const isSelected = selectedTxIds.includes(tx.id);
                const origin = getTransactionOrigin(tx, account);

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-[#1a1728]/70 transition ${
                      isSelected
                        ? 'bg-[#00FFCC]/10 border-l-4 border-l-[#00FFCC]'
                        : tx.isPotentialDuplicate
                        ? 'bg-[#F59E0B]/10 border-l-4 border-l-[#F59E0B]'
                        : tx.isFullyPaid
                        ? 'bg-emerald-500/5'
                        : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTx(tx.id)}
                        className="rounded text-[#00FFCC] focus:ring-[#00FFCC] border-[#302840] bg-[#0E0E18] cursor-pointer w-4 h-4"
                      />
                    </td>

                    {/* Columna 1: Fecha & Origen */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-semibold text-white text-xs">
                        {formatDisplayDate(tx.date)}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {/* Origin Badge */}
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${origin.bgColor} ${origin.borderColor} ${origin.textColor}`}
                          title={`Canal de registro: ${origin.label}`}
                        >
                          <span>{origin.icon}</span>
                          <span>{origin.label}</span>
                        </span>
                        {/* Editable Period selector */}
                        <input
                          type="month"
                          value={tx.period || tx.date.slice(0, 7)}
                          onChange={(e) => onUpdateTransaction(tx.id, { period: e.target.value })}
                          className="text-[10px] font-mono py-0.5 px-1.5 bg-[#0E0E18] hover:bg-[#141422] border border-[#302840] hover:border-slate-600 text-[#00FFCC] font-bold rounded-lg focus:outline-none cursor-pointer"
                          title="Clic para cambiar el período/mes de facturación"
                        />
                      </div>
                    </td>

                    {/* Columna 2: Descripción & Comercio */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-headline font-bold text-white text-xs" title={tx.description}>
                          {tx.description}
                        </span>
                        {tx.isPotentialDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FFE04A] bg-[#FFE04A]/10 px-1.5 py-0.2 rounded border border-[#FFE04A]/30">
                            <AlertTriangle className="w-2.5 h-2.5 text-[#FFE04A]" />
                            Doble?
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#A098B0] mt-0.5">
                        {isCreditCard ? (
                          <CreditCard className="w-3 h-3 text-rose-400 shrink-0" />
                        ) : (
                          <Building2 className="w-3 h-3 text-[#00FFCC] shrink-0" />
                        )}
                        <span className="truncate">{account?.name || 'Cuenta General'}</span>
                      </div>
                      {tx.isPotentialDuplicate && tx.duplicateOfDescription && (
                        <div className="text-[10px] text-[#FFE04A]/90 mt-1 italic">
                          Coincide con: {tx.duplicateOfDescription}
                        </div>
                      )}
                    </td>

                    {/* Columna 3: Categoría */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E8E0F0] bg-[#0E0E18] px-2 py-0.5 rounded-lg border border-[#302840]">
                          <span>{getCategoryIcon(tx.category, tx.subcategory)}</span>
                          <span className="truncate max-w-[120px]">{tx.subcategory || tx.category}</span>
                        </span>
                        <div>
                          <select
                            value={tx.subcategory || tx.category}
                            onChange={(e) => handleSubcategoryChange(tx.id, e.target.value)}
                            className="text-[10px] py-0.5 px-1.5 bg-[#0E0E18] border border-[#302840] rounded-lg text-[#A098B0] hover:text-white cursor-pointer focus:outline-none focus:border-[#00FFCC]"
                          >
                            {categoryMappings.map((c) => (
                              <optgroup key={c.id} label={c.name} className="bg-[#141422] text-[#A098B0]">
                                {c.subcategories.map((sub) => (
                                  <option key={sub} value={sub} className="bg-[#141422] text-white">
                                    {sub}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>

                    {/* Columna 4: Tipo & Cuotas */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-semibold text-[#A098B0] bg-[#0E0E18] px-2 py-0.5 rounded-lg border border-[#302840]">
                          {tx.transactionType}
                        </span>
                        {tx.installments && (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-mono font-bold text-[#FFE04A] bg-[#FFE04A]/10 border border-[#FFE04A]/30 px-2 py-0.5 rounded-md">
                              {tx.installments.current} / {tx.installments.total} cuotas
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Columna 5: Monto Facturado / Real */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className={`font-mono text-xs font-bold ${isPaymentOrIncome ? 'text-[#00FFCC]' : 'text-white'}`}>
                        {isPaymentOrIncome ? `+ ${formatCLP(Math.abs(tx.amount))}` : `- ${formatCLP(tx.amount)}`}
                      </div>
                      {tx.totalAllocated > 0 && !isPaymentOrIncome && (
                        <div className="text-[10px] font-mono text-[#00FFCC] mt-0.5">
                          Neto Real: {formatCLP(tx.netAmount)}
                        </div>
                      )}
                      {tx.isFullyPaid && !isPaymentOrIncome && (
                        <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/30 mt-0.5">
                          Pagada 100%
                        </span>
                      )}
                    </td>

                    {/* Columna 6: Acciones */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {tx.isPotentialDuplicate && (
                          <button
                            onClick={() =>
                              onUpdateTransaction(tx.id, {
                                isPotentialDuplicate: false,
                                duplicateOfDescription: undefined,
                                duplicateOfId: undefined
                              })
                            }
                            className="p-1.5 bg-[#00FFCC]/10 hover:bg-[#00FFCC]/20 text-[#00FFCC] border border-[#00FFCC]/30 rounded-lg text-xs transition"
                            title="Aceptar como transacción válida (no es duplicada)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {isCreditCard && isPurchase && (
                          <button
                            onClick={() => onOpenPaymentModal(tx)}
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition"
                            title="Vinculación FIFO: Asociar abonos / pagos a esta compra"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(tx)}
                          className="p-1.5 text-[#A098B0] hover:text-[#00FFCC] hover:bg-[#00FFCC]/10 rounded-lg transition border border-transparent hover:border-[#00FFCC]/20"
                          title="Editar movimiento"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openSingleDeleteModal(tx)}
                          className="p-1.5 text-[#A098B0] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500/20"
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
                <td colSpan={7} className="py-12 text-center text-[#A098B0] font-sans">
                  No hay movimientos cargados que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ============================================================== */}
      {/* 6. Mobile View (Mobile2.html Stitch Feed of Tactile Cards)     */}
      {/* ============================================================== */}
      <div className="md:hidden divide-y divide-[#302840]/60 p-3 sm:p-4 space-y-3">
        {filteredAndSortedTransactions.length > 0 ? (
          filteredAndSortedTransactions.map((tx) => {
            const account = accounts.find((a) => a.id === tx.accountId);
            const isCreditCard = account?.type === 'credit_card';
            const isPaymentOrIncome = isPaymentOrIncomeTransaction(tx);
            const isPurchase = !isPaymentOrIncome && tx.amount > 0;
            const isSelected = selectedTxIds.includes(tx.id);
            const origin = getTransactionOrigin(tx, account);

            return (
              <div
                key={tx.id}
                className={`bg-[#141422] border rounded-2xl p-4 panel-rim transition shadow-md space-y-3 ${
                  isSelected
                    ? 'border-[#00FFCC] bg-[#00FFCC]/5'
                    : tx.isPotentialDuplicate
                    ? 'border-[#F59E0B] bg-[#F59E0B]/5'
                    : 'border-[#302840] hover:border-slate-700'
                }`}
              >
                {/* Card Top: Checkbox + Date Mono + Origin Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectTx(tx.id)}
                      className="rounded text-[#00FFCC] focus:ring-[#00FFCC] border-[#302840] bg-[#0E0E18] cursor-pointer w-4 h-4"
                    />
                    <span className="font-mono text-xs font-semibold text-[#E8E0F0]">
                      {formatDisplayDate(tx.date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {tx.isPotentialDuplicate && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FFE04A] bg-[#FFE04A]/10 border border-[#FFE04A]/30 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3 text-[#FFE04A]" />
                        Doble?
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${origin.bgColor} ${origin.borderColor} ${origin.textColor}`}
                    >
                      <span>{origin.icon}</span>
                      <span>{origin.label}</span>
                    </span>
                  </div>
                </div>

                {/* Card Middle: Description & Prominent Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-headline font-bold text-sm text-white truncate" title={tx.description}>
                      {tx.description}
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-[#A098B0]">
                      {isCreditCard ? (
                        <CreditCard className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-[#00FFCC] shrink-0" />
                      )}
                      <span className="truncate">{account?.name || 'Cuenta'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-mono text-base font-bold ${isPaymentOrIncome ? 'text-[#00FFCC]' : 'text-white'}`}>
                      {isPaymentOrIncome ? `+ ${formatCLP(Math.abs(tx.amount))}` : `- ${formatCLP(tx.amount)}`}
                    </div>
                    {tx.totalAllocated > 0 && !isPaymentOrIncome && (
                      <div className="text-[10px] font-mono text-[#00FFCC]">
                        Real: {formatCLP(tx.netAmount)}
                      </div>
                    )}
                    {tx.isFullyPaid && !isPaymentOrIncome && (
                      <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        Pagada 100%
                      </span>
                    )}
                  </div>
                </div>

                {/* Duplicate note if present */}
                {tx.isPotentialDuplicate && tx.duplicateOfDescription && (
                  <div className="bg-[#0E0E18] p-2.5 rounded-xl border border-[#F59E0B]/30 text-xs text-[#FFE04A]">
                    Coincide con: <span className="font-semibold italic">{tx.duplicateOfDescription}</span>
                  </div>
                )}

                {/* Card Bottom: Category + Type + Installments + Actions */}
                <div className="pt-2 border-t border-[#302840]/60 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E8E0F0] bg-[#0E0E18] px-2.5 py-1 rounded-lg border border-[#302840]">
                      <span>{getCategoryIcon(tx.category, tx.subcategory)}</span>
                      <span className="truncate max-w-[110px]">{tx.subcategory || tx.category}</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#A098B0] bg-[#0E0E18] px-2 py-0.5 rounded border border-[#302840]">
                      {tx.transactionType}
                    </span>
                    {tx.installments && (
                      <span className="text-[10px] font-mono font-bold text-[#FFE04A] bg-[#FFE04A]/10 border border-[#FFE04A]/30 px-2 py-0.5 rounded-md">
                        {tx.installments.current} / {tx.installments.total}
                      </span>
                    )}
                  </div>

                  {/* Actions for Mobile */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {tx.isPotentialDuplicate && (
                      <button
                        onClick={() =>
                          onUpdateTransaction(tx.id, {
                            isPotentialDuplicate: false,
                            duplicateOfDescription: undefined,
                            duplicateOfId: undefined
                          })
                        }
                        className="p-2 rounded-xl bg-[#00FFCC]/10 text-[#00FFCC] border border-[#00FFCC]/30 hover:bg-[#00FFCC]/20"
                        title="Aceptar"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {isCreditCard && isPurchase && (
                      <button
                        onClick={() => onOpenPaymentModal(tx)}
                        className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20"
                        title="Asociar Pago FIFO"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleStartEdit(tx)}
                      className="p-2 rounded-xl bg-[#0E0E18] text-[#A098B0] hover:text-white border border-[#302840]"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openSingleDeleteModal(tx)}
                      className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-[#A098B0] font-sans">
            No hay movimientos cargados que coincidan con los filtros aplicados.
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 7. Delete Confirmation Modal (Stitch Spec)                     */}
      {/* ============================================================== */}
      {deleteConfirmModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#141422] rounded-2xl shadow-2xl max-w-md w-full border border-[#302840] panel-rim overflow-hidden p-6 space-y-4 text-[#E8E0F0]">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-white">{deleteConfirmModal.title}</h3>
                  <p className="text-xs text-[#A098B0]">
                    {deleteConfirmModal.idsToDelete.length === 1 ? 'Confirmación de eliminación' : 'Confirmación de borrado masivo'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#E8E0F0] leading-relaxed bg-[#0E0E18] p-3.5 rounded-xl border border-[#302840]">
                {deleteConfirmModal.message}
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmModal({ isOpen: false, idsToDelete: [], title: '', message: '' })}
                  className="px-4 py-2 bg-[#0E0E18] hover:bg-slate-800 text-[#A098B0] hover:text-white text-xs font-headline font-semibold rounded-xl transition border border-[#302840]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-headline font-bold rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleteConfirmModal.idsToDelete.length === 1 ? 'Sí, Eliminar' : 'Confirmar Borrado Masivo'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ============================================================== */}
      {/* 8. Edit Transaction Modal (Stitch Spec)                        */}
      {/* ============================================================== */}
      {editingTx &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-[#141422] rounded-2xl shadow-2xl max-w-lg w-full border border-[#302840] panel-rim overflow-hidden flex flex-col max-h-[90vh] text-[#E8E0F0]">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-[#0E0E18] border-b border-[#302840] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00FFCC]/10 text-[#00FFCC] rounded-xl border border-[#00FFCC]/30">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-base text-white">Editar Movimiento</h3>
                    <p className="text-xs text-[#A098B0]">
                      Modifica los detalles, cuenta, categoría o período del registro
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="p-1.5 text-[#A098B0] hover:text-white hover:bg-slate-800 rounded-lg transition"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-bold text-white">
                    Comercio o Descripción <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Ej: Supermercado Lider, Spotify, Sueldo..."
                    className="w-full text-xs py-2.5 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Monto (CLP) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-[#A098B0] font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="Ej: 14500"
                        className="w-full pl-7 pr-3 py-2 text-xs bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Tipo de Movimiento <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as TransactionType)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] cursor-pointer"
                    >
                      {TRANSACTION_TYPES.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#141422] text-white">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Cuenta o Tarjeta <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editAccountId}
                      onChange={(e) => setEditAccountId(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] cursor-pointer"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id} className="bg-[#141422] text-white">
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Subcategoría <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={editSubcategory}
                      onChange={(e) => setEditSubcategory(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] cursor-pointer"
                    >
                      {categoryMappings.map((c) => (
                        <optgroup key={c.id} label={c.name} className="bg-[#141422] text-[#A098B0]">
                          {c.subcategories.map((sub) => (
                            <option key={sub} value={sub} className="bg-[#141422] text-white">
                              {sub}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Fecha Real <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline font-bold text-white">
                      Período de Facturación (YYYY-MM)
                    </label>
                    <input
                      type="month"
                      value={editPeriod}
                      onChange={(e) => setEditPeriod(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono"
                    />
                  </div>
                </div>

                {/* Installments in Edit */}
                <div className="pt-2 border-t border-[#302840]/60 space-y-2">
                  <label className="block text-xs font-headline font-bold text-[#FFE04A]">
                    Fracción de Cuotas (Opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="Cuota Actual (ej: 4)"
                      value={editInstallmentCurrent}
                      onChange={(e) => setEditInstallmentCurrent(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Total Cuotas (ej: 12)"
                      value={editInstallmentTotal}
                      onChange={(e) => setEditInstallmentTotal(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-[#0E0E18] border border-[#302840] text-white rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 border-t border-[#302840] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-4 py-2 bg-[#0E0E18] hover:bg-slate-800 text-[#A098B0] hover:text-white text-xs font-headline font-semibold rounded-xl transition border border-[#302840]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#00FFCC] hover:bg-[#00e6b8] text-black text-xs font-headline font-bold rounded-xl transition shadow-lg shadow-[#00FFCC]/20"
                  >
                    Guardar Cambios
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
