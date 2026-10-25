import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Landmark,
  Wallet,
  Building2,
  Plus,
  Trash2,
  Calendar,
  Check,
  AlertCircle,
  ChevronRight,
  TrendingDown,
  ReceiptText,
  DollarSign,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { Account, AccountType, Transaction } from '../types';

interface AccountsManagementViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onAddAccount: (newAcc: Account) => void | Promise<void>;
  onUpdateAccount?: (updatedAcc: Account) => void | Promise<void>;
  onDeleteAccount: (accountId: string) => void | Promise<void>;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
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
  'Efectivo / Caja'
];

export const AccountsManagementView: React.FC<AccountsManagementViewProps> = ({
  accounts,
  transactions,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}) => {
  // Selected Account state for Detail/Edit column
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    accounts[0]?.id || null
  );
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [bank, setBank] = useState<string>(CHILEAN_BANKS[0]);
  const [customBank, setCustomBank] = useState<string>('');
  const [type, setType] = useState<AccountType>('credit_card');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [creditLimit, setCreditLimit] = useState<string>('');
  const [initialBalance, setInitialBalance] = useState<string>('');
  const [closingDay, setClosingDay] = useState<string>('');
  const [dueDay, setDueDay] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Delete Confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Active Account
  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.id === selectedAccountId) || null;
  }, [accounts, selectedAccountId]);

  // Synchronize form when selected account changes
  React.useEffect(() => {
    if (!isCreatingNew && selectedAccount) {
      setName(selectedAccount.name);
      if (CHILEAN_BANKS.includes(selectedAccount.bank)) {
        setBank(selectedAccount.bank);
        setCustomBank('');
      } else {
        setBank('Otro');
        setCustomBank(selectedAccount.bank);
      }
      setType(selectedAccount.type);
      setAccountNumber(selectedAccount.accountNumber || '');
      setCreditLimit(
        selectedAccount.creditLimit !== undefined && selectedAccount.creditLimit !== null
          ? selectedAccount.creditLimit.toString()
          : ''
      );
      setInitialBalance(
        selectedAccount.initialBalance !== undefined && selectedAccount.initialBalance !== null
          ? selectedAccount.initialBalance.toString()
          : ''
      );
      setClosingDay(selectedAccount.closingDay ? selectedAccount.closingDay.toString() : '');
      setDueDay(selectedAccount.dueDay ? selectedAccount.dueDay.toString() : '');
      setErrorMessage(null);
    }
  }, [selectedAccount, isCreatingNew]);

  const handleStartCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedAccountId(null);
    setName('');
    setBank(CHILEAN_BANKS[0]);
    setCustomBank('');
    setType('credit_card');
    setAccountNumber('');
    setCreditLimit('');
    setInitialBalance('');
    setClosingDay('');
    setDueDay('');
    setErrorMessage(null);
  };

  const handleSelectAccount = (acc: Account) => {
    setIsCreatingNew(false);
    setSelectedAccountId(acc.id);
    setConfirmDeleteId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const effectiveBank = bank === 'Otro' ? customBank.trim() : bank.trim();
    if (!name.trim() || !effectiveBank) {
      setErrorMessage('Por favor ingresa el nombre de la cuenta y la entidad financiera.');
      return;
    }

    let parsedClosingDay: number | undefined = undefined;
    if (closingDay.trim()) {
      const parsed = parseInt(closingDay.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 31) {
        setErrorMessage('El día de corte debe ser un número entre 1 y 31.');
        return;
      }
      parsedClosingDay = parsed;
    }

    let parsedDueDay: number | undefined = undefined;
    if (dueDay.trim()) {
      const parsed = parseInt(dueDay.trim(), 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 31) {
        setErrorMessage('El día de vencimiento/pago debe ser un número entre 1 y 31.');
        return;
      }
      parsedDueDay = parsed;
    }

    let parsedCreditLimit: number | undefined = undefined;
    if (creditLimit.trim() !== '') {
      const parsed = parseFloat(creditLimit.trim());
      if (!isNaN(parsed)) parsedCreditLimit = parsed;
    }

    let parsedInitialBalance: number | undefined = undefined;
    if (initialBalance.trim() !== '') {
      const parsed = parseFloat(initialBalance.trim());
      if (!isNaN(parsed)) parsedInitialBalance = parsed;
    }

    if (isCreatingNew) {
      const newAcc: Account = {
        id: `acc-${Date.now()}`,
        name: name.trim(),
        bank: effectiveBank,
        type,
        accountNumber: accountNumber.trim() || undefined,
        currency: 'CLP',
        creditLimit: parsedCreditLimit,
        initialBalance: parsedInitialBalance,
        color: type === 'credit_card' ? '#e11d48' : '#0284c7',
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay
      };

      await onAddAccount(newAcc);
      setIsCreatingNew(false);
      setSelectedAccountId(newAcc.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else if (selectedAccount && onUpdateAccount) {
      const updatedAcc: Account = {
        ...selectedAccount,
        name: name.trim(),
        bank: effectiveBank,
        type,
        accountNumber: accountNumber.trim() || undefined,
        creditLimit: parsedCreditLimit,
        initialBalance: parsedInitialBalance,
        closingDay: parsedClosingDay,
        dueDay: parsedDueDay
      };

      await onUpdateAccount(updatedAcc);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDeleteAccountConfirm = async (accId: string) => {
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
      setIsCreatingNew(false);
    } else {
      setSelectedAccountId(null);
      setIsCreatingNew(true);
    }
  };

  // Stats for the currently selected account
  const accountStats = useMemo(() => {
    if (!selectedAccount) return { txCount: 0, currentMonthSpent: 0 };
    const accTxs = transactions.filter((t) => t.accountId === selectedAccount.id);
    const spent = accTxs
      .filter((t) => t.amount > 0 && t.transactionType !== 'pago_tc')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      txCount: accTxs.length,
      currentMonthSpent: spent
    };
  }, [transactions, selectedAccount]);

  const getTypeLabel = (accType: AccountType) => {
    switch (accType) {
      case 'credit_card':
        return 'Tarjeta de Crédito';
      case 'checking':
        return 'Cuenta Corriente';
      case 'sight':
        return 'Cuenta Vista / RUT';
      case 'savings':
        return 'Cuenta de Ahorro';
      case 'cash':
        return 'Efectivo / Caja';
      default:
        return 'Cuenta Bancaria';
    }
  };

  const getAccountIcon = (accType: AccountType) => {
    switch (accType) {
      case 'credit_card':
        return <CreditCard className="w-5 h-5 text-rose-400" />;
      case 'checking':
        return <Landmark className="w-5 h-5 text-sky-400" />;
      case 'sight':
      case 'savings':
        return <Building2 className="w-5 h-5 text-amber-400" />;
      case 'cash':
        return <Wallet className="w-5 h-5 text-emerald-400" />;
      default:
        return <Landmark className="w-5 h-5 text-slate-400" />;
    }
  };

  const creditCardCount = accounts.filter((a) => a.type === 'credit_card').length;
  const bankAccountCount = accounts.filter((a) => a.type !== 'credit_card').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Encabezado Superior */}
      <div className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-400 rounded-2xl border border-sky-400/30 shadow-inner flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Mis Cuentas y Tarjetas
              </h2>
              <span className="bg-sky-500/20 text-sky-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-500/30">
                Finanzas
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Administra tus cuentas bancarias, tarjetas de crédito, saldos iniciales y ciclos de facturación para un cálculo exacto de tus finanzas.
            </p>
          </div>
        </div>

        {/* Badges de Resumen */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Total Activas</span>
            <span className="text-base font-black text-white">{accounts.length}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Tarjetas de Crédito</span>
            <span className="text-base font-black text-rose-400">{creditCardCount}</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Cuentas Débito/Vista</span>
            <span className="text-base font-black text-sky-400">{bankAccountCount}</span>
          </div>
        </div>
      </div>

      {/* Estructura Master-Detail en 2 Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================================= */}
        {/* COLUMNA 1 (Izquierda): Lista de Cuentas y Tarjetas        */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-auto min-h-[500px] lg:h-[740px]">
          
          {/* Header de Columna & Botón Agregar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-sm text-white">Cuentas y Tarjetas</h3>
              <span className="text-[11px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                {accounts.length}
              </span>
            </div>

            <button
              type="button"
              onClick={handleStartCreateNew}
              className={`flex items-center gap-1.5 font-bold text-xs py-1.5 px-3 rounded-xl shadow-lg transition transform hover:scale-[1.02] ${
                isCreatingNew
                  ? 'bg-sky-400 text-slate-950 shadow-sky-400/30'
                  : 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Cuenta</span>
            </button>
          </div>

          {/* Lista con Scroll */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {accounts.map((acc) => {
              const isSelected = !isCreatingNew && selectedAccountId === acc.id;
              const hasCycle = Boolean(acc.closingDay);

              return (
                <div
                  key={acc.id}
                  onClick={() => handleSelectAccount(acc)}
                  className={`group p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/60 text-white font-bold shadow-md shadow-sky-500/10'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  {/* Top Line: Icon, Name & Chevron */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 ${
                          isSelected ? 'bg-sky-500/20' : 'bg-slate-900 border border-slate-800'
                        }`}
                      >
                        {getAccountIcon(acc.type)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {acc.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {acc.bank} {acc.accountNumber ? `• ${acc.accountNumber}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isSelected && (
                        <ChevronRight className="w-4 h-4 text-sky-400 animate-pulse" />
                      )}
                    </div>
                  </div>

                  {/* Badges & Balance Info */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
                      {getTypeLabel(acc.type)}
                    </span>

                    {/* Ciclo de Facturación / Cupo / Saldo Inicial */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {hasCycle && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/30">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          <span>Corte: día {acc.closingDay}</span>
                          {acc.dueDay && <span>• Vence: día {acc.dueDay}</span>}
                        </span>
                      )}
                      {acc.type === 'credit_card' && acc.creditLimit !== undefined && acc.creditLimit !== null && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Cupo: {formatCLP(acc.creditLimit)}
                        </span>
                      )}
                      {acc.type !== 'credit_card' && acc.initialBalance !== undefined && acc.initialBalance !== null && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Saldo Inicial: {formatCLP(acc.initialBalance)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA 2 (Derecha): Formulario de Edición / Creación      */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col h-auto min-h-[500px] lg:h-[740px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          
          {selectedAccount || isCreatingNew ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Encabezado del Formulario */}
              <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                      {isCreatingNew ? 'Creación de Cuenta' : 'Detalle y Edición:'}
                    </span>
                    <span className="text-sm sm:text-base font-black text-sky-300 bg-sky-950/60 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
                      {isCreatingNew ? '✨ Nueva Cuenta' : selectedAccount?.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {isCreatingNew
                      ? 'Registra una nueva cuenta bancaria, tarjeta de crédito o efectivo.'
                      : 'Modifica los parámetros de la cuenta, banco, tipo y ciclos de facturación.'}
                  </p>
                </div>

                {!isCreatingNew && selectedAccount && (
                  <span className="self-start sm:self-center bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold px-3 py-1 rounded-xl">
                    ID: {selectedAccount.id}
                  </span>
                )}
              </div>

              {/* Mensaje de Error */}
              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Campos Principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Nombre de la Cuenta */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Nombre Descriptivo de la Cuenta *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: TC Visa Signature Santander"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                {/* 2. Banco / Entidad */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Banco / Entidad Financiera *
                  </label>
                  <select
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
                  >
                    {CHILEAN_BANKS.map((b) => (
                      <option key={b} value={b} className="bg-slate-900 text-white">
                        {b}
                      </option>
                    ))}
                    <option value="Otro" className="bg-slate-900 text-white">Otro / Personalizado...</option>
                  </select>
                  {bank === 'Otro' && (
                    <input
                      type="text"
                      required
                      placeholder="Escribe el nombre del banco..."
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 font-medium mt-1.5"
                    />
                  )}
                </div>

                {/* 3. Tipo de Cuenta */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Tipo de Cuenta / Instrumento *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
                  >
                    <option value="credit_card" className="bg-slate-900 text-white">💳 Tarjeta de Crédito</option>
                    <option value="checking" className="bg-slate-900 text-white">🏦 Cuenta Corriente</option>
                    <option value="sight" className="bg-slate-900 text-white">🏢 Cuenta Vista / RUT</option>
                    <option value="savings" className="bg-slate-900 text-white">💰 Cuenta de Ahorro</option>
                    <option value="cash" className="bg-slate-900 text-white">💵 Efectivo / Billetera</option>
                  </select>
                </div>

                {/* 4. Número de Cuenta o Terminación */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Número o Terminación (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: **** 4892 o 00-123-98745"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                  />
                </div>

                {/* 5. Cupo o Saldo Inicial */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    {type === 'credit_card' ? 'Cupo / Línea de Crédito (CLP)' : 'Saldo Inicial (CLP)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                    <input
                      type="number"
                      placeholder="Ej: 2500000"
                      value={type === 'credit_card' ? creditLimit : initialBalance}
                      onChange={(e) =>
                        type === 'credit_card'
                          ? setCreditLimit(e.target.value)
                          : setInitialBalance(e.target.value)
                      }
                      className="w-full pl-7 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                    />
                  </div>
                </div>

              </div>

              {/* Sección Destacada: Ciclo de Facturación (Crítico para Tarjetas de Crédito) */}
              <div className="p-4 bg-slate-950/70 border border-sky-500/30 rounded-2xl space-y-3 relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    Ciclo de Facturación Mensual
                  </h4>
                  {type === 'credit_card' && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      Recomendado para TC
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Configura el día de corte para que las compras se clasifiquen automáticamente en el período contable en que serán facturadas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Día de Corte */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Día de Corte / Facturación (1 al 31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ej: 24"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                    />
                    <span className="text-[10px] text-sky-300/80 block mt-0.5">
                      Compras posteriores a este día se asignan al mes siguiente.
                    </span>
                  </div>

                  {/* Día de Vencimiento */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Día de Vencimiento / Pago (1 al 31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      placeholder="Ej: 5"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-slate-900 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-sky-500 font-semibold"
                    />
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Día límite de pago del estado de cuenta.
                    </span>
                  </div>
                </div>
              </div>

              {/* Resumen Estadístico de la Cuenta (Si está en modo edición) */}
              {!isCreatingNew && selectedAccount && (
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      Movimientos Registrados
                    </span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {accountStats.txCount} transacciones
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-500">
                      Gasto Acumulado en Esta Cuenta
                    </span>
                    <span className="text-base sm:text-lg font-black text-sky-400">
                      {formatCLP(accountStats.currentMonthSpent)}
                    </span>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-lg shadow-sky-500/25 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isCreatingNew ? 'Crear Nueva Cuenta' : 'Guardar Cambios'}</span>
                  </button>

                  {saveSuccess && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl animate-fadeIn">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>¡Cambios guardados correctamente!</span>
                    </span>
                  )}

                  {isCreatingNew && accounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setSelectedAccountId(accounts[0].id);
                      }}
                      className="text-xs text-slate-400 hover:text-white px-3 py-2"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {!isCreatingNew && selectedAccount && (
                  <div>
                    {confirmDeleteId === selectedAccount.id ? (
                      <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-500/50 p-1.5 rounded-xl animate-fadeIn">
                        <span className="text-[11px] text-rose-300 font-bold px-1">
                          ¿Borrar cuenta y sus {accountStats.txCount} movimientos?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccountConfirm(selectedAccount.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded-lg text-xs font-bold transition"
                        >
                          Sí, borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-slate-400 hover:text-white px-2 py-1 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedAccount.id)}
                        className="text-rose-400/80 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar Cuenta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </form>
          ) : (
            /* Estado Vacío */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sky-400/50 shadow-inner">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h4 className="font-bold text-slate-300 text-sm sm:text-base">
                  Ninguna cuenta seleccionada
                </h4>
                <p className="text-xs text-slate-500">
                  Selecciona una cuenta de la izquierda para ver y editar sus propiedades, o crea una nueva cuenta.
                </p>
                <button
                  type="button"
                  onClick={handleStartCreateNew}
                  className="mt-3 inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Primera Cuenta</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
