import React from 'react';
import { TrendingDown, TrendingUp, CreditCard, ShieldCheck, DollarSign, Calendar, PiggyBank } from 'lucide-react';
import { ComputedTransaction, Account, DashboardMetricCardsConfig, DEFAULT_DASHBOARD_CONFIG } from '../types';
import { isPaymentOrIncomeTransaction } from '../utils/paymentAllocation';

interface MetricCardsProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  activeAccountId: string;
  config?: DashboardMetricCardsConfig;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  computedTransactions,
  accounts,
  activeAccountId,
  config = DEFAULT_DASHBOARD_CONFIG.metrics
}) => {
  // computedTransactions is already filtered by month, account, category, etc. from App.tsx
  const transactions = computedTransactions || [];

  // Separate TC purchases vs general expenses (amount > 0 and not a payment/income)
  const grossExpenses = transactions
    .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPaymentsAndIncome = transactions
    .filter((tx) => isPaymentOrIncomeTransaction(tx))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Sum of total allocated payments to purchases
  const totalAllocatedPayments = transactions
    .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
    .reduce((sum, tx) => sum + (tx.totalAllocated || 0), 0);

  // Monto Real Utilizado = Gross Expenses - Allocated Payments
  const netAmountUsed = transactions
    .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
    .reduce((sum, tx) => sum + (tx.netAmount || 0), 0);

  // Unallocated payments balance on TC
  const unallocatedTcPayments = transactions
    .filter((tx) => tx.transactionType === 'pago_tc' || (tx.category === 'Abonos y Pagos' && isPaymentOrIncomeTransaction(tx)))
    .reduce((sum, tx) => sum + (tx.unallocatedPaymentBalance || 0), 0);

  // Balance Neto / Ahorro (Ingresos - Gastos)
  const netBalance = totalPaymentsAndIncome - grossExpenses;

  const selectedAcc = accounts.find((a) => a.id === activeAccountId);
  const cycleInfo = selectedAcc?.closingDay
    ? `Ciclo de Facturación: Corte el día ${selectedAcc.closingDay}${selectedAcc.dueDay ? ` • Vencimiento el día ${selectedAcc.dueDay}` : ''}`
    : null;

  const showGrossExpenses = config.grossExpenses ?? true;
  const showTotalPayments = config.totalPaymentsAndIncome ?? true;
  const showNetAmount = config.netAmountUsed ?? true;
  const showUnallocatedTc = config.unallocatedTcPayments ?? true;
  const showNetBalance = config.netBalance ?? false;

  const visibleCardsCount = [
    showGrossExpenses,
    showTotalPayments,
    showNetAmount,
    showUnallocatedTc,
    showNetBalance
  ].filter(Boolean).length;

  if (visibleCardsCount === 0) return null;

  const getGridColsClass = () => {
    switch (visibleCardsCount) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
    }
  };

  return (
    <div className={`grid ${getGridColsClass()} gap-4 mb-6`}>
      
      {/* Active Account Billing Cycle Banner */}
      {cycleInfo && (
        <div className="col-span-full bg-sky-950/40 border border-sky-500/30 px-4 py-2.5 rounded-2xl text-xs text-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <span>
              <b className="text-white">{selectedAcc?.name}:</b> {cycleInfo}
            </span>
          </div>
          <span className="text-[11px] text-sky-300 font-medium">
            Gastos posteriores al día {selectedAcc?.closingDay} se asignan al ciclo de facturación del mes siguiente
          </span>
        </div>
      )}

      {/* 1. Gross Expenses */}
      {showGrossExpenses && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 shadow-xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos Totales (Original)</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl xl:text-[26px] font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{formatCLP(grossExpenses)}</p>
            <p className="text-xs text-slate-400 mt-1">Suma bruta de compras y cargos</p>
          </div>
        </div>
      )}

      {/* 2. Total Payments & Income */}
      {showTotalPayments && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 shadow-xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abonos, Pagos y Sueldos</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl xl:text-[26px] font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{formatCLP(totalPaymentsAndIncome)}</p>
            <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-400 mt-1 gap-1">
              <span className="truncate">Asociado a Compras:</span>
              <span className="font-bold text-emerald-400 whitespace-nowrap">{formatCLP(totalAllocatedPayments)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Monto Real Utilizado */}
      {showNetAmount && (
        <div className="border border-sky-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/60 shadow-xl shadow-sky-500/10 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 text-white flex flex-col justify-between relative overflow-hidden group hover:border-sky-400/60 transition">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">Monto Real Utilizado</span>
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xl sm:text-2xl xl:text-[26px] font-black text-sky-300 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{formatCLP(netAmountUsed)}</p>
            <p className="text-xs text-sky-200/80 mt-1">
              Gasto neto deduciendo abonos y pagos aplicados
            </p>
          </div>
        </div>
      )}

      {/* 4. Unallocated Payments or Pending Credit Debt */}
      {showUnallocatedTcPayments(showUnallocatedTc, unallocatedTcPayments)}

      {/* 5. Balance Neto / Ahorro Mensual */}
      {showNetBalance && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 shadow-xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance Neto / Ahorro</span>
            <div className={`p-2.5 rounded-xl border ${
              netBalance >= 0
                ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className={`text-xl sm:text-2xl xl:text-[26px] font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${
              netBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
            }`}>
              {formatCLP(netBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {netBalance >= 0 ? 'Superávit neto del período' : 'Déficit neto del período'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

function showUnallocatedTcPayments(show: boolean, unallocatedTcPayments: number) {
  if (!show) return null;
  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 shadow-xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Abonos TC Sin Asignar</span>
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <CreditCard className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xl sm:text-2xl xl:text-[26px] font-black text-white tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{formatCLP(unallocatedTcPayments)}</p>
        <p className="text-xs text-slate-400 mt-1">
          Pagos a TC disponibles para asociar a compras
        </p>
      </div>
    </div>
  );
}
