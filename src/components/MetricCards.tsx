import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Calendar,
  PiggyBank,
  ShoppingCart,
  Landmark
} from 'lucide-react';
import { ComputedTransaction, Account, CustomMetricCard, DEFAULT_DASHBOARD_CONFIG } from '../types';
import { isPaymentOrIncomeTransaction, isCreditCardPaymentTransaction } from '../utils/paymentAllocation';

interface MetricCardsProps {
  computedTransactions: ComputedTransaction[];
  accounts: Account[];
  activeAccountId: string;
  metrics?: CustomMetricCard[];
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
  metrics = DEFAULT_DASHBOARD_CONFIG.metrics
}) => {
  const transactions = computedTransactions || [];

  const selectedAcc = accounts.find((a) => a.id === activeAccountId);
  const cycleInfo = selectedAcc?.closingDay
    ? `Ciclo de Facturación: Corte el día ${selectedAcc.closingDay}${selectedAcc.dueDay ? ` • Vencimiento el día ${selectedAcc.dueDay}` : ''}`
    : null;

  // Filter only enabled cards
  const enabledMetrics = (metrics || []).filter((m) => m.enabled);
  if (enabledMetrics.length === 0) return null;

  const getGridColsClass = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className={`grid ${getGridColsClass(enabledMetrics.length)} gap-4 mb-6`}>
      
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

      {/* Render Dynamic Cards */}
      {enabledMetrics.map((card) => {
        const { value, subtitle } = calculateMetricValue(card, transactions);
        const { badgeClass, borderHoverClass, textValClass } = getColorClasses(card.color, card.type === 'net_amount_used');

        return (
          <div
            key={card.id}
            className={`bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-4.5 shadow-xl border flex flex-col justify-between transition ${borderHoverClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate pr-2">
                {card.title}
              </span>
              <div className={`p-2.5 rounded-xl border ${badgeClass}`}>
                {renderIcon(card.icon)}
              </div>
            </div>

            <div className="mt-4">
              <p className={`text-xl sm:text-2xl xl:text-[26px] font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${textValClass}`}>
                {formatCLP(value)}
              </p>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {subtitle}
              </p>
            </div>
          </div>
        );
      })}

    </div>
  );
};

function calculateMetricValue(card: CustomMetricCard, transactions: ComputedTransaction[]) {
  switch (card.type) {
    case 'gross_expenses': {
      const val = transactions
        .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { value: val, subtitle: 'Suma bruta de compras y cargos' };
    }
    case 'total_payments': {
      const val = transactions
        .filter((tx) => isPaymentOrIncomeTransaction(tx))
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { value: val, subtitle: 'Total de abonos y sueldos recibidos' };
    }
    case 'net_amount_used': {
      const val = transactions
        .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
        .reduce((sum, tx) => sum + (tx.netAmount || 0), 0);
      return { value: val, subtitle: 'Gasto neto deduciendo abonos' };
    }
    case 'unallocated_tc': {
      const val = transactions
        .filter((tx) => isCreditCardPaymentTransaction(tx))
        .reduce((sum, tx) => sum + (tx.unallocatedPaymentBalance || 0), 0);
      return { value: val, subtitle: 'Pagos a TC disponibles para asociar' };
    }
    case 'net_balance': {
      const gross = transactions
        .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const inc = transactions
        .filter((tx) => isPaymentOrIncomeTransaction(tx))
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      const val = inc - gross;
      return { value: val, subtitle: val >= 0 ? 'Superávit neto del período' : 'Déficit neto del período' };
    }
    case 'compra': {
      let matching = transactions.filter((tx) => tx.transactionType === 'compra' || (!isPaymentOrIncomeTransaction(tx) && tx.amount > 0));
      if (card.filterAccountId && card.filterAccountId !== 'ALL') {
        matching = matching.filter((tx) => tx.accountId === card.filterAccountId);
      }
      const val = matching.reduce((sum, tx) => sum + tx.amount, 0);
      return { value: val, subtitle: `${matching.length} compra${matching.length === 1 ? '' : 's'} realizada${matching.length === 1 ? '' : 's'}` };
    }
    case 'pago_tc': {
      let matching = transactions.filter((tx) => tx.transactionType === 'pago_tc' || tx.category === 'Abonos y Pagos');
      if (card.filterAccountId && card.filterAccountId !== 'ALL') {
        matching = matching.filter((tx) => tx.accountId === card.filterAccountId);
      }
      const val = matching.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      return { value: val, subtitle: `${matching.length} pago${matching.length === 1 ? '' : 's'} realizado${matching.length === 1 ? '' : 's'}` };
    }
    case 'custom': {
      let filtered = transactions;
      if (card.filterAccountId && card.filterAccountId !== 'ALL') {
        filtered = filtered.filter((tx) => tx.accountId === card.filterAccountId);
      }
      if (card.filterCategory && card.filterCategory !== 'ALL') {
        filtered = filtered.filter((tx) => tx.category === card.filterCategory || tx.subcategory === card.filterCategory);
      }
      const val = filtered
        .filter((tx) => !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { value: val, subtitle: `${filtered.length} movimiento${filtered.length === 1 ? '' : 's'} coincidentes` };
    }
    default:
      return { value: 0, subtitle: '' };
  }
}

function renderIcon(iconName?: string) {
  switch (iconName) {
    case 'trending-up': return <TrendingUp className="w-5 h-5" />;
    case 'shield-check': return <ShieldCheck className="w-5 h-5" />;
    case 'credit-card': return <CreditCard className="w-5 h-5" />;
    case 'piggy-bank': return <PiggyBank className="w-5 h-5" />;
    case 'shopping-cart': return <ShoppingCart className="w-5 h-5" />;
    case 'landmark': return <Landmark className="w-5 h-5" />;
    default: return <TrendingDown className="w-5 h-5" />;
  }
}

function getColorClasses(color?: string, isHighlighted: boolean = false) {
  if (isHighlighted) {
    return {
      badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/30',
      borderHoverClass: 'border-sky-500/40 hover:border-sky-400/60 shadow-sky-500/10',
      textValClass: 'text-sky-300',
    };
  }

  switch (color) {
    case 'rose':
      return {
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-rose-500/40',
        textValClass: 'text-white',
      };
    case 'emerald':
      return {
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-emerald-500/40',
        textValClass: 'text-white',
      };
    case 'purple':
      return {
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-purple-500/40',
        textValClass: 'text-white',
      };
    case 'teal':
      return {
        badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-teal-500/40',
        textValClass: 'text-teal-400',
      };
    case 'amber':
      return {
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-amber-500/40',
        textValClass: 'text-amber-300',
      };
    case 'indigo':
      return {
        badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-indigo-500/40',
        textValClass: 'text-indigo-300',
      };
    default:
      return {
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        borderHoverClass: 'border-slate-800/80 hover:border-sky-500/40',
        textValClass: 'text-white',
      };
  }
}
