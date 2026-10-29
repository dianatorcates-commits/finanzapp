import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Calendar,
  CreditCard,
  DollarSign,
  Tag,
  FileText,
  Layers,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Account, Transaction, TransactionType, CategoryMapping } from '../types';
import { calculateTransactionPeriod } from '../utils/dateUtils';
import { getParentCategory } from '../utils/categorizer';
import { formatCLP } from './MetricCards';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categoryMappings: CategoryMapping[];
  onAddTransaction: (newTx: Transaction) => Promise<void> | void;
  initialAccountId?: string;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categoryMappings,
  onAddTransaction,
  initialAccountId
}) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState(() => {
    if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
      return initialAccountId;
    }
    return accounts[0]?.id || '';
  });

  const selectedAccount = accounts.find((a) => a.id === accountId) || accounts[0];

  const [period, setPeriod] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return calculateTransactionPeriod(today, selectedAccount?.closingDay);
  });

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('compra');

  // Categories & Subcategories
  const [category, setCategory] = useState<string>(() => categoryMappings[0]?.name || 'Alimentación');
  const [subcategory, setSubcategory] = useState<string>(
    () => categoryMappings[0]?.subcategories[0] || 'Supermercado'
  );

  // Installments
  const [hasInstallments, setHasInstallments] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState('1');
  const [totalInstallments, setTotalInstallments] = useState('3');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sincronizar cuenta inicial si cambia
  useEffect(() => {
    if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
      setAccountId(initialAccountId);
    }
  }, [initialAccountId, accounts]);

  // Sincronizar subcategorías al cambiar de categoría
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const catGroup = categoryMappings.find((c) => c.name === newCat);
    if (catGroup && catGroup.subcategories.length > 0) {
      setSubcategory(catGroup.subcategories[0]);
    } else {
      setSubcategory(newCat);
    }
  };

  // Recalcular período cuando cambia fecha o cuenta
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const targetAcc = accounts.find((a) => a.id === accountId);
    setPeriod(calculateTransactionPeriod(newDate, targetAcc?.closingDay));
  };

  const handleAccountChange = (newAccId: string) => {
    setAccountId(newAccId);
    const targetAcc = accounts.find((a) => a.id === newAccId);
    setPeriod(calculateTransactionPeriod(date, targetAcc?.closingDay));
    
    // Si la nueva cuenta es de débito/efectivo y el tipo era pago_tc, ajustar a ingreso_venta
    if (targetAcc?.type !== 'credit_card' && transactionType === 'pago_tc') {
      setTransactionType('ingreso_venta');
    }
  };

  // Al seleccionar pago_tc, auto-configurar categoría de abonos
  const handleTypeChange = (newType: TransactionType) => {
    setTransactionType(newType);
    if (newType === 'pago_tc') {
      const abonoGroup = categoryMappings.find(
        (c) => c.name.toLowerCase().includes('abono') || c.name.toLowerCase().includes('pago')
      );
      if (abonoGroup) {
        setCategory(abonoGroup.name);
        if (abonoGroup.subcategories.length > 0) {
          setSubcategory(abonoGroup.subcategories[0]);
        }
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!description.trim()) {
      setErrorMessage('Ingresa una descripción o comercio para el movimiento.');
      return;
    }

    const numAmount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Ingresa un monto válido mayor a 0 CLP.');
      return;
    }

    const targetAcc = accounts.find((a) => a.id === accountId) || accounts[0];
    const finalPeriod = period.trim() || calculateTransactionPeriod(date, targetAcc?.closingDay);

    let finalParent = category;
    let finalSub = subcategory;

    if (!finalParent) {
      finalParent = getParentCategory(finalSub, categoryMappings);
    }

    let installmentsData;
    if (hasInstallments) {
      const cur = parseInt(currentInstallment, 10) || 1;
      const tot = parseInt(totalInstallments, 10) || 1;
      if (tot > 1) {
        installmentsData = { current: cur, total: tot };
      }
    }

    const newTx: Transaction = {
      id: `tx-man-${Date.now()}`,
      accountId,
      date,
      period: finalPeriod,
      description: description.trim(),
      rawDescription: description.trim(),
      amount: Math.abs(numAmount),
      transactionType,
      category: finalParent,
      subcategory: finalSub,
      installments: installmentsData,
      allocations: [],
      created_at: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      await onAddTransaction(newTx);
      onClose();
      // Reset form
      setDescription('');
      setAmount('');
      setHasInstallments(false);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar el movimiento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCatGroup = categoryMappings.find((c) => c.name === category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0A12]/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#111118] border border-[#302840] panel-rim text-[#E8E0F0] rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 font-sans">
        
        {/* Header */}
        <div className="bg-[#141422] p-4 sm:p-5 border-b border-[#302840] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#FF2D78]/15 text-[#FF2D78] rounded-xl border border-[#FF2D78]/30 glow-primary shadow-sm">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-[#E8E0F0] flex items-center gap-2">
                <span>Cargar Movimiento</span>
                <span className="text-[10px] font-mono font-bold bg-[#FF2D78]/15 text-[#FF2D78] border border-[#FF2D78]/30 px-2 py-0.5 rounded-full uppercase">
                  Manual
                </span>
              </h3>
              <p className="text-xs text-[#A098B0]">
                Registra un gasto, ingreso o abono individual en tu terminal financiero
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A098B0] hover:text-white p-1.5 rounded-xl hover:bg-[#1C1C2E] transition border border-transparent hover:border-[#302840]"
            aria-label="Cerrar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span> {errorMessage}
            </div>
          )}

          {/* Row 1: Cuenta Destino & Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cuenta */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
                Cuenta o Tarjeta Destino
              </label>
              <div className="relative">
                <select
                  value={accountId}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="w-full py-2.5 pl-3 pr-8 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#E8E0F0] font-headline font-semibold focus:outline-none focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78] transition"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-[#0F0F1A] text-[#E8E0F0]">
                      {acc.type === 'credit_card' ? '💳 TC: ' : '🏦 '} {acc.name} ({acc.bank})
                    </option>
                  ))}
                </select>
              </div>
              {selectedAccount?.closingDay && (
                <p className="text-[10px] text-[#00FFCC] mt-1 font-mono flex items-center gap-1">
                  <span>Corte: día {selectedAccount.closingDay} de cada mes</span>
                </p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
                Fecha del Movimiento
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#E8E0F0] font-mono focus:outline-none focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78] transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 2: Período de Facturación Imputado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider">
                Período de Facturación (Mes de Cobro)
              </label>
              <span className="text-[10px] text-[#00FFCC] font-mono">
                {selectedAccount?.closingDay ? 'Auto-calculado por ciclo' : 'Mes calendario'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#00FFCC] font-mono font-bold focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition"
                  title="Mes al que se imputa el gasto según la fecha de corte de la tarjeta"
                />
              </div>
              <button
                type="button"
                onClick={() => setPeriod(calculateTransactionPeriod(date, selectedAccount?.closingDay))}
                className="px-3 py-2.5 bg-[#1C1C2E] hover:bg-[#25253C] text-xs text-[#E8E0F0] border border-[#302840] rounded-xl font-mono transition"
                title="Restablecer período automático según día de corte"
              >
                Auto
              </button>
            </div>
            <p className="text-[10px] text-[#A098B0] mt-1 font-sans">
              Define en qué mes de tu presupuesto se contabilizará este movimiento.
            </p>
          </div>

          {/* Row 3: Descripción & Monto CLP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
                Descripción / Glosa / Comercio
              </label>
              <input
                type="text"
                placeholder="Ej: SUPERMERCADO LIDER, SPOTIFY, CAFE..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full py-2.5 px-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#E8E0F0] placeholder-[#A098B0]/50 focus:outline-none focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78] transition"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
                Monto (CLP)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A098B0] font-mono text-xs">
                  $
                </span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full py-2.5 pl-7 pr-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#FFE04A] font-mono font-bold focus:outline-none focus:border-[#FFE04A] focus:ring-1 focus:ring-[#FFE04A] transition"
                  required
                />
              </div>
            </div>
          </div>

          {/* Row 4: Tipo de Movimiento (Chips Interactivos) */}
          <div>
            <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('compra')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-headline font-semibold transition ${
                  transactionType === 'compra'
                    ? 'bg-[#FF2D78]/15 border-[#FF2D78] text-white shadow-sm glow-primary'
                    : 'bg-[#141422] border-[#302840] text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#1A1A2A]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-[#FF2D78]" />
                <span>Compra / Gasto</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('pago_tc')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-headline font-semibold transition ${
                  transactionType === 'pago_tc'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-[#141422] border-[#302840] text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#1A1A2A]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pago / Abono TC</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('ingreso_venta')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-headline font-semibold transition ${
                  transactionType === 'ingreso_venta'
                    ? 'bg-[#00FFCC]/15 border-[#00FFCC] text-[#00FFCC] shadow-sm'
                    : 'bg-[#141422] border-[#302840] text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#1A1A2A]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-[#00FFCC]" />
                <span>Ingreso / Sueldo</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('transferencia_enviada')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-headline font-semibold transition ${
                  transactionType === 'transferencia_enviada'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[#141422] border-[#302840] text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#1A1A2A]'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Transf. Enviada</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('transferencia_recibida')}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-headline font-semibold transition ${
                  transactionType === 'transferencia_recibida'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                    : 'bg-[#141422] border-[#302840] text-[#A098B0] hover:text-[#E8E0F0] hover:bg-[#1A1A2A]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
                <span>Transf. Recibida</span>
              </button>
            </div>
          </div>

          {/* Row 5: Categoría & Subcategoría Sincronizadas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
                Categoría Principal
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full py-2.5 px-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#E8E0F0] font-headline font-semibold focus:outline-none focus:border-[#FF2D78] focus:ring-1 focus:ring-[#FF2D78] transition"
              >
                {categoryMappings.map((c) => (
                  <option key={c.name} value={c.name} className="bg-[#0F0F1A] text-[#E8E0F0]">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-[#A098B0] uppercase tracking-wider mb-1.5">
                Subcategoría
              </label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full py-2.5 px-3 text-xs bg-[#141422] border border-[#302840] panel-rim rounded-xl text-[#00FFCC] font-headline font-semibold focus:outline-none focus:border-[#00FFCC] focus:ring-1 focus:ring-[#00FFCC] transition"
              >
                {currentCatGroup?.subcategories.map((sub) => (
                  <option key={sub} value={sub} className="bg-[#0F0F1A] text-[#E8E0F0]">
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Cuotas Opcionales */}
          <div className="p-3.5 bg-[#141422] border border-[#302840] panel-rim rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasInstallments}
                  onChange={(e) => setHasInstallments(e.target.checked)}
                  className="rounded border-[#302840] text-[#FF2D78] focus:ring-[#FF2D78] bg-[#0A0A12]"
                />
                <span className="text-xs font-headline font-bold text-[#E8E0F0]">
                  ¿Es una compra en cuotas?
                </span>
              </label>
              {hasInstallments && (
                <span className="text-[10px] font-mono text-[#FFE04A] bg-[#FFE04A]/10 border border-[#FFE04A]/30 px-2 py-0.5 rounded-full">
                  Cuota {currentInstallment} de {totalInstallments}
                </span>
              )}
            </div>

            {hasInstallments && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#302840]/60 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[10px] font-mono text-[#A098B0] mb-1">
                    N° Cuota Actual
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="48"
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-[#0A0A12] border border-[#302840] rounded-xl text-[#E8E0F0] font-mono focus:outline-none focus:border-[#FFE04A]"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-[#A098B0] mb-1">
                    Total de Cuotas
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="48"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full py-2 px-3 text-xs bg-[#0A0A12] border border-[#302840] rounded-xl text-[#E8E0F0] font-mono focus:outline-none focus:border-[#FFE04A]"
                    placeholder="6"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer inside form */}
          <div className="pt-3 border-t border-[#302840] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-[#1C1C2E] hover:bg-[#25253C] text-xs font-headline font-semibold text-[#A098B0] hover:text-white border border-[#302840] rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#FF2D78] to-[#f43f5e] hover:from-[#ff1a6c] hover:to-[#e11d48] text-white font-headline font-bold text-xs rounded-xl shadow-lg glow-primary transition flex items-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Cargar Movimiento</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
