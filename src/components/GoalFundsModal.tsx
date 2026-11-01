import React, { useState, useMemo } from 'react';
import {
  X,
  PiggyBank,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  FileText,
  Link2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  Search,
  Sparkles
} from 'lucide-react';
import { SavingsGoal, Transaction, Account, SavingsGoalContribution, GoalContributionType } from '../types';

export interface GoalFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal;
  transactions?: Transaction[];
  accounts?: Account[];
  onSaveContribution: (
    contribution: SavingsGoalContribution,
    updatedGoalAmount: number
  ) => Promise<void> | void;
}

function formatCLP(val: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(val);
}

export const GoalFundsModal: React.FC<GoalFundsModalProps> = ({
  isOpen,
  onClose,
  goal,
  transactions = [],
  accounts = [],
  onSaveContribution
}) => {
  if (!isOpen) return null;

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Mode: 'deposit' (Aporte) vs 'withdrawal' (Retiro)
  const [type, setType] = useState<GoalContributionType>('deposit');
  const [amountStr, setAmountStr] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState<string>('');
  const [selectedTxId, setSelectedTxId] = useState<string>('');
  const [txSearchTerm, setTxSearchTerm] = useState<string>('');
  const [showTxSelector, setShowTxSelector] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const parsedAmount = useMemo(() => {
    const cleaned = amountStr.replace(/\D/g, '');
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? 0 : num;
  }, [amountStr]);

  // Balance calculations
  const currentBalance = goal.currentAmount || 0;
  const targetAmount = goal.targetAmount || 0;

  const resultingBalance = useMemo(() => {
    if (type === 'deposit') {
      return currentBalance + parsedAmount;
    } else {
      return Math.max(0, currentBalance - parsedAmount);
    }
  }, [type, currentBalance, parsedAmount]);

  const resultingProgressPct = useMemo(() => {
    if (targetAmount <= 0) return 0;
    return Math.min(100, Math.round((resultingBalance / targetAmount) * 100));
  }, [resultingBalance, targetAmount]);

  const currentProgressPct = useMemo(() => {
    if (targetAmount <= 0) return 0;
    return Math.min(100, Math.round((currentBalance / targetAmount) * 100));
  }, [currentBalance, targetAmount]);

  // Quick preset chips
  const depositPresets = [10000, 25000, 50000, 100000];

  // Candidates for bank transaction linking
  const candidateTransactions = useMemo(() => {
    const term = txSearchTerm.trim().toLowerCase();
    return transactions
      .filter((t) => {
        // Must match search if entered
        if (term) {
          const matchDesc = t.description?.toLowerCase().includes(term);
          const matchAmount = t.amount.toString().includes(term);
          const matchCat = t.category?.toLowerCase().includes(term);
          if (!matchDesc && !matchAmount && !matchCat) return false;
        }
        return true;
      })
      .slice(0, 30);
  }, [transactions, txSearchTerm]);

  const selectedTransaction = useMemo(() => {
    if (!selectedTxId) return null;
    return transactions.find((t) => t.id === selectedTxId) || null;
  }, [selectedTxId, transactions]);

  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const handleApplyPreset = (value: number) => {
    setAmountStr(value.toString());
  };

  const handleSelectTransaction = (t: Transaction) => {
    setSelectedTxId(t.id);
    if (!amountStr || parsedAmount === 0) {
      setAmountStr(Math.abs(t.amount).toString());
    }
    if (t.date) {
      setDate(t.date);
    }
    if (!notes && t.description) {
      setNotes(`Vinculado a movimiento bancario: ${t.description}`);
    }
    setShowTxSelector(false);
  };

  const handleClearTransaction = () => {
    setSelectedTxId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    if (type === 'withdrawal' && parsedAmount > currentBalance) {
      // Prevent withdrawing more than available
      return;
    }

    setIsSubmitting(true);
    try {
      const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newContribution: SavingsGoalContribution = {
        id: contributionId,
        userId: '', // set in service / handler
        goalId: goal.id,
        type,
        amount: parsedAmount,
        transactionId: selectedTxId || null,
        notes: notes.trim() ? notes.trim() : null,
        date: date || todayStr
      };

      await onSaveContribution(newContribution, resultingBalance);
      onClose();
    } catch (err) {
      console.error('Error saving goal contribution:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#141422] border border-[#302840] panel-rim rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#302840] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] border border-[#302840] flex items-center justify-center text-xl shadow-inner">
              {goal.categoryIcon || '🎯'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-white text-base">
                  Gestionar Fondos de Meta
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFE04A]/10 text-[#FFE04A] border border-[#FFE04A]/30">
                  {goal.name}
                </span>
              </div>
              <p className="text-xs text-[#A098B0]">
                Registra aportes o extracciones con trazabilidad detallada.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* 1. Selector Tipo: Aporte vs Extracción */}
          <div className="grid grid-cols-2 gap-2 bg-[#0A0A12] p-1.5 rounded-xl border border-[#302840]">
            <button
              type="button"
              onClick={() => setType('deposit')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-headline font-bold transition ${
                type === 'deposit'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-[#A098B0] hover:text-white hover:bg-[#141422]'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Aportar Fondos</span>
            </button>
            <button
              type="button"
              onClick={() => setType('withdrawal')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-headline font-bold transition ${
                type === 'withdrawal'
                  ? 'bg-gradient-to-r from-rose-500 to-[#FF2D78] text-white shadow-lg shadow-rose-500/20'
                  : 'text-[#A098B0] hover:text-white hover:bg-[#141422]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Extraer Fondos</span>
            </button>
          </div>

          {/* 2. Amount Input & Quick Chips */}
          <div className="space-y-2">
            <label className="text-xs font-headline font-bold text-[#A098B0] flex items-center justify-between">
              <span>{type === 'deposit' ? 'Monto del Aporte' : 'Monto de la Extracción'}</span>
              <span className="font-mono text-[11px] text-[#A098B0]">CLP ($)</span>
            </label>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono text-[#A098B0]">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amountStr ? parseInt(amountStr.replace(/\D/g, '') || '0', 10).toLocaleString('es-CL') : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmountStr(raw);
                }}
                placeholder="0"
                className={`w-full bg-[#0A0A12] border text-white font-mono font-bold text-lg pl-8 pr-4 py-2.5 rounded-xl focus:outline-none transition ${
                  type === 'deposit'
                    ? 'border-[#302840] focus:border-emerald-500'
                    : 'border-[#302840] focus:border-rose-500'
                }`}
              />
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {type === 'deposit' ? (
                <>
                  {depositPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-emerald-500/20 text-[#A098B0] hover:text-emerald-300 font-mono text-xs font-semibold rounded-lg border border-[#302840] transition"
                    >
                      +{formatCLP(preset)}
                    </button>
                  ))}
                  {goal.targetAmount > goal.currentAmount && (
                    <button
                      type="button"
                      onClick={() => handleApplyPreset(Math.max(0, goal.targetAmount - goal.currentAmount))}
                      className="px-2.5 py-1 bg-[#FFE04A]/10 hover:bg-[#FFE04A]/20 text-[#FFE04A] font-mono text-xs font-bold rounded-lg border border-[#FFE04A]/30 transition"
                    >
                      Completar Meta ({formatCLP(Math.max(0, goal.targetAmount - goal.currentAmount))})
                    </button>
                  )}
                </>
              ) : (
                <>
                  {currentBalance > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(Math.round(currentBalance * 0.25))}
                        className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-rose-500/20 text-[#A098B0] hover:text-rose-300 font-mono text-xs font-semibold rounded-lg border border-[#302840] transition"
                      >
                        25% ({formatCLP(Math.round(currentBalance * 0.25))})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(Math.round(currentBalance * 0.5))}
                        className="px-2.5 py-1 bg-[#1A1A2E] hover:bg-rose-500/20 text-[#A098B0] hover:text-rose-300 font-mono text-xs font-semibold rounded-lg border border-[#302840] transition"
                      >
                        50% ({formatCLP(Math.round(currentBalance * 0.5))})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(currentBalance)}
                        className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-mono text-xs font-bold rounded-lg border border-rose-500/30 transition"
                      >
                        Retirar Todo ({formatCLP(currentBalance)})
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {type === 'withdrawal' && parsedAmount > currentBalance && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                El monto no puede superar el saldo acumulado ({formatCLP(currentBalance)}).
              </p>
            )}
          </div>

          {/* 3. Live Balance Preview Card */}
          <div className="bg-[#0A0A12] border border-[#302840] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-headline font-bold text-[#A098B0]">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#00FFCC]" />
                Impacto en el Saldo
              </span>
              <span className="font-mono text-[11px]">
                Meta: {formatCLP(targetAmount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#141422] p-2.5 rounded-lg border border-[#302840]">
                <div className="text-[#A098B0] text-[11px]">Saldo Actual</div>
                <div className="text-white font-mono font-bold text-sm mt-0.5">
                  {formatCLP(currentBalance)}
                </div>
                <div className="text-[10px] text-[#A098B0] font-mono mt-0.5">
                  {currentProgressPct}% alcanzado
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                type === 'deposit'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}>
                <div className={`text-[11px] font-bold ${
                  type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {type === 'deposit' ? 'Nuevo Saldo (+)' : 'Nuevo Saldo (-)'}
                </div>
                <div className="text-white font-mono font-bold text-sm mt-0.5">
                  {formatCLP(resultingBalance)}
                </div>
                <div className="text-[10px] font-mono mt-0.5 flex items-center gap-1">
                  <span className={type === 'deposit' ? 'text-emerald-300' : 'text-rose-300'}>
                    {resultingProgressPct}% alcanzado
                  </span>
                  {resultingProgressPct >= 100 && (
                    <span className="text-[10px]">🎉</span>
                  )}
                </div>
              </div>
            </div>

            {/* Micro progress bar preview */}
            <div className="w-full bg-[#141422] h-2 rounded-full overflow-hidden border border-[#302840]">
              <div
                className={`h-full transition-all duration-500 ${
                  type === 'deposit'
                    ? 'bg-gradient-to-r from-[#00FFCC] to-emerald-400'
                    : 'bg-gradient-to-r from-amber-400 to-[#FF2D78]'
                }`}
                style={{ width: `${resultingProgressPct}%` }}
              />
            </div>
          </div>

          {/* 4. Date and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-headline font-bold text-[#A098B0] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A098B0]" />
                Fecha
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0A0A12] border border-[#302840] text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-[#00FFCC] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-headline font-bold text-[#A098B0] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#A098B0]" />
                Nota / Motivo
              </label>
              <input
                type="text"
                placeholder={type === 'deposit' ? 'Ej. Ahorro de fin de mes' : 'Ej. Compra de boletos'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0A0A12] border border-[#302840] text-xs text-white px-3 py-2 rounded-xl focus:outline-none focus:border-[#00FFCC]"
              />
            </div>
          </div>

          {/* 5. Vinculación Opcional a Movimiento Bancario */}
          <div className="pt-2 border-t border-[#302840]/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-headline font-bold text-[#A098B0] flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#00FFCC]" />
                Vincular a Transacción Bancaria (Opcional)
              </label>
              {selectedTxId ? (
                <button
                  type="button"
                  onClick={handleClearTransaction}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Desvincular
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowTxSelector(!showTxSelector)}
                  className="text-[11px] text-[#00FFCC] hover:underline"
                >
                  {showTxSelector ? 'Ocultar buscador' : 'Buscar movimiento'}
                </button>
              )}
            </div>

            {selectedTransaction ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-white truncate flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{selectedTransaction.description}</span>
                  </div>
                  <div className="text-[11px] text-[#A098B0] font-mono mt-0.5">
                    {selectedTransaction.date} • {accountMap.get(selectedTransaction.accountId) || 'Cuenta'} • {formatCLP(selectedTransaction.amount)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearTransaction}
                  className="text-[#A098B0] hover:text-white p-1 rounded-lg hover:bg-[#141422]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : showTxSelector ? (
              <div className="bg-[#0A0A12] border border-[#302840] rounded-xl p-3 space-y-2 animate-fadeIn">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A098B0]" />
                  <input
                    type="text"
                    placeholder="Filtrar por descripción o monto..."
                    value={txSearchTerm}
                    onChange={(e) => setTxSearchTerm(e.target.value)}
                    className="w-full bg-[#141422] border border-[#302840] text-xs text-white pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-[#00FFCC]"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {candidateTransactions.length === 0 ? (
                    <div className="text-center text-xs text-[#A098B0] py-4">
                      No se encontraron movimientos coincidentes.
                    </div>
                  ) : (
                    candidateTransactions.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => handleSelectTransaction(tx)}
                        className="w-full text-left p-2 rounded-lg bg-[#141422] hover:bg-[#1A1A2E] border border-transparent hover:border-[#00FFCC]/30 transition flex items-center justify-between text-xs group"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-white font-medium truncate group-hover:text-[#00FFCC]">
                            {tx.description}
                          </div>
                          <div className="text-[10px] text-[#A098B0] font-mono mt-0.5">
                            {tx.date} • {accountMap.get(tx.accountId) || 'Cuenta'}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-white shrink-0">
                          {formatCLP(tx.amount)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Submit Footer */}
          <div className="pt-2 border-t border-[#302840] flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-headline font-bold text-[#A098B0] hover:text-white hover:bg-[#1A1A2E] transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || parsedAmount <= 0 || (type === 'withdrawal' && parsedAmount > currentBalance)}
              className={`px-5 py-2.5 rounded-xl text-xs font-headline font-bold transition shadow-lg flex items-center gap-1.5 ${
                type === 'deposit'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 disabled:bg-emerald-950 disabled:text-emerald-700'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20 disabled:bg-rose-950 disabled:text-rose-700'
              } disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {type === 'deposit'
                      ? `Confirmar Aporte (${formatCLP(parsedAmount)})`
                      : `Confirmar Extracción (${formatCLP(parsedAmount)})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
