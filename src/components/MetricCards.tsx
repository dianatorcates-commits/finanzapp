import React from 'react';
import { TrendingDown, TrendingUp, CreditCard, ShieldCheck, DollarSign } from 'lucide-react';
import { ComputedTransaction, Account } from '../types';

interface MetricCardsProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  activeAccountId: string;
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
  activeAccountId
}) => {
  // Filter by active account if selected
  const filtered = activeAccountId === 'ALL'
    ? computedTransactions
    : computedTransactions.filter((tx) => tx.accountId === activeAccountId);

  // Separate TC purchases vs general expenses
  const grossExpenses = filtered
    .filter((tx) => tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta' && tx.transactionType !== 'transferencia_recibida' && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalPaymentsAndIncome = filtered
    .filter((tx) => tx.transactionType === 'pago_tc' || tx.transactionType === 'ingreso_venta' || tx.transactionType === 'transferencia_recibida' || tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Sum of total allocated payments to TC purchases
  const totalAllocatedPayments = filtered
    .filter((tx) => tx.transactionType === 'compra' || tx.amount > 0)
    .reduce((sum, tx) => sum + tx.totalAllocated, 0);

  // Monto Real Utilizado = Gross Expenses - Allocated Payments
  const netAmountUsed = filtered
    .filter((tx) => tx.transactionType !== 'pago_tc' && tx.transactionType !== 'ingreso_venta' && tx.transactionType !== 'transferencia_recibida' && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.netAmount, 0);

  // Unallocated payments balance on TC
  const unallocatedTcPayments = filtered
    .filter((tx) => tx.transactionType === 'pago_tc')
    .reduce((sum, tx) => sum + (tx.unallocatedPaymentBalance || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Gross Expenses */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos Totales (Original)</span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">{formatCLP(grossExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">Suma bruta de compras y cargos</p>
        </div>
      </div>

      {/* Total Payments & Income */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Abonos, Pagos & Sueldos</span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">{formatCLP(totalPaymentsAndIncome)}</p>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
            <span>Asociado a Compras:</span>
            <span className="font-semibold text-emerald-600">{formatCLP(totalAllocatedPayments)}</span>
          </div>
        </div>
      </div>

      {/* Monto Real Utilizado (Restante por Financiar/Pagar) */}
      <div className="bg-gradient-to-br from-sky-900 to-slate-900 rounded-xl p-4 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-sky-200 uppercase tracking-wider">Monto Real Utilizado</span>
          <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-sky-300">{formatCLP(netAmountUsed)}</p>
          <p className="text-xs text-sky-200/80 mt-1">
            Gasto neto deduciendo abonos y pagos aplicados
          </p>
        </div>
      </div>

      {/* Unallocated Payments or Pending Credit Debt */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Abonos TC Sin Asignar</span>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">{formatCLP(unallocatedTcPayments)}</p>
          <p className="text-xs text-slate-500 mt-1">
            Pagos a TC disponibles para asociar a compras
          </p>
        </div>
      </div>

    </div>
  );
};
