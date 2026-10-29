import { Account, Transaction, Credit } from '../types';
import { isPaymentOrIncomeTransaction } from './paymentAllocation';
import { calculateTransactionPeriod } from './dateUtils';

export type BillingCycleStatus =
  | 'paid'          // 🟢 Facturación Pagada (100%)
  | 'min_paid'      // 🟡 Pago Mínimo Cubierto (Parcial)
  | 'pending'       // 🔴 Facturación Pendiente de Pago
  | 'overdue'       // 🔴 Vencida sin cubrir mínimo
  | 'in_progress'   // ⚪ Ciclo en Curso (No Facturado)
  | 'zero_balance'; // ⚪ Sin saldo ni compras en el ciclo

export interface BillingCycleSummary {
  cardId: string;
  cardName: string;
  period: string;             // e.g. '2026-10'
  closingDay: number;
  dueDay?: number;
  closingDateStr: string;     // 'YYYY-MM-DD'
  dueDateStr?: string;        // 'YYYY-MM-DD'
  isClosed: boolean;          // true if reference date > closing date
  daysUntilClosing: number;   // days remaining until statement close
  daysUntilDue?: number;      // days remaining until payment due (negative if overdue)
  isOverdue: boolean;
  
  // Amounts
  totalBilled: number;        // total gross charges in this billing period
  totalPaid: number;          // total payments/abonos in this billing period
  minPayment: number;         // minimum required payment (10% or min 10000)
  pendingBalance: number;     // max(0, totalBilled - totalPaid)
  revolvingBalance: number;   // pending balance that carries over to next cycle
  
  // Status and UI Badges
  status: BillingCycleStatus;
  statusLabel: string;
  statusBadgeColor: string;
  statusDescription: string;
}

function formatCLP(val: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(val);
}

/**
 * Calculates the complete billing cycle summary, amounts, and traffic light status
 * for a credit card in a given period.
 */
export function getBillingCycleSummary(
  card: Account,
  transactions: Transaction[] = [],
  credits: Credit[] = [],
  targetPeriod?: string,
  referenceDate: Date = new Date()
): BillingCycleSummary | null {
  if (card.type !== 'credit_card') return null;

  const closingDay = card.closingDay || 1;
  const dueDay = card.dueDay;

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1; // 1-12
  const refDay = referenceDate.getDate();

  // If targetPeriod is not specified, determine active statement period:
  let period = targetPeriod;
  if (!period) {
    if (closingDay > 1 && refDay <= closingDay) {
      // Check if previous month statement has pending balance
      const prevDate = new Date(refYear, refMonth - 2, 1);
      const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
      
      const prevTxs = transactions.filter(
        (t) => t.accountId === card.id && (t.period === prevPeriod || (!t.period && calculateTransactionPeriod(t.date, closingDay) === prevPeriod))
      );
      let prevBilled = 0;
      let prevPaid = 0;
      prevTxs.forEach((t) => {
        if (isPaymentOrIncomeTransaction(t)) prevPaid += Math.abs(t.amount);
        else if (t.amount > 0) prevBilled += Math.abs(t.amount);
      });

      if (prevBilled > prevPaid && dueDay && refDay <= (dueDay + 5)) {
        period = prevPeriod;
      } else {
        period = `${refYear}-${String(refMonth).padStart(2, '0')}`;
      }
    } else {
      period = `${refYear}-${String(refMonth).padStart(2, '0')}`;
    }
  }

  // Parse period 'YYYY-MM'
  const [pYear, pMonth] = period.split('-').map(Number);
  const daysInPeriodMonth = new Date(pYear, pMonth, 0).getDate();
  const effectiveClosingDay = Math.min(closingDay, daysInPeriodMonth);
  const closingDate = new Date(pYear, pMonth - 1, effectiveClosingDay, 23, 59, 59);

  // Due date: usually dueDay of next month (or same month if dueDay > closingDay)
  let dueDate: Date | undefined = undefined;
  if (dueDay) {
    if (dueDay > closingDay) {
      const maxDay = Math.min(dueDay, daysInPeriodMonth);
      dueDate = new Date(pYear, pMonth - 1, maxDay, 23, 59, 59);
    } else {
      let nextYear = pYear;
      let nextMonth = pMonth + 1;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
      const maxDay = Math.min(dueDay, daysInNextMonth);
      dueDate = new Date(nextYear, nextMonth - 1, maxDay, 23, 59, 59);
    }
  }

  // Calculate transactions belonging to this period
  const periodTxs = transactions.filter(
    (t) => t.accountId === card.id && (t.period === period || (!t.period && calculateTransactionPeriod(t.date, closingDay) === period))
  );

  let totalBilled = 0;
  let directCardPaid = 0;
  let externalAllocatedPaid = 0;

  periodTxs.forEach((t) => {
    if (isPaymentOrIncomeTransaction(t)) {
      directCardPaid += Math.abs(t.amount);
    } else if (t.amount > 0) {
      totalBilled += Math.abs(t.amount);
      // Sum allocations from payments outside this card or period (Issue #48: linked existing cartola payments)
      (t.allocations || []).forEach((alloc) => {
        const sourceTx = transactions.find((x) => x.id === alloc.paymentTransactionId);
        if (!sourceTx || sourceTx.accountId !== card.id || sourceTx.period !== period) {
          externalAllocatedPaid += alloc.amount;
        }
      });
    }
  });

  const totalPaid = directCardPaid + externalAllocatedPaid;

  // Calculate minimum payment (10% standard rule, minimum $10.000 or total if total < 10000)
  const minPayment = totalBilled > 0 ? Math.min(totalBilled, Math.max(10000, Math.round(totalBilled * 0.10))) : 0;
  const pendingBalance = Math.max(0, totalBilled - totalPaid);
  const revolvingBalance = pendingBalance;

  const isClosed = referenceDate.getTime() > closingDate.getTime();
  const diffToClosing = Math.ceil((closingDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilClosing = Math.max(0, diffToClosing);

  let daysUntilDue: number | undefined = undefined;
  let isOverdue = false;
  if (dueDate) {
    const diffToDue = Math.ceil((dueDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    daysUntilDue = diffToDue;
    isOverdue = referenceDate.getTime() > dueDate.getTime() && pendingBalance > 0;
  }

  // Determine Status and UI labels
  let status: BillingCycleStatus = 'zero_balance';
  let statusLabel = 'Sin deuda facturada';
  let statusBadgeColor = 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  let statusDescription = 'No hay compras ni saldo registrado para este período.';

  if (totalBilled === 0) {
    status = 'zero_balance';
    statusLabel = 'Sin movimientos';
    statusBadgeColor = 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    statusDescription = 'No hay cargos facturados en este ciclo.';
  } else if (totalPaid >= totalBilled) {
    status = 'paid';
    statusLabel = 'Facturación al día (100%)';
    statusBadgeColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]';
    statusDescription = '¡Excelente! Pagaste el 100% de la facturación. Cero intereses rotativos.';
  } else if (!isClosed) {
    status = 'in_progress';
    statusLabel = `Ciclo en Curso • Corte en ${daysUntilClosing}d`;
    statusBadgeColor = 'text-sky-400 bg-sky-500/15 border-sky-500/30';
    statusDescription = `Compras acumulándose antes del corte el día ${closingDay}.`;
  } else if (totalPaid >= minPayment) {
    status = 'min_paid';
    statusLabel = 'Pago Mínimo Cubierto';
    statusBadgeColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
    statusDescription = `Pago mínimo cubierto. Saldo rotativo pendiente: ${formatCLP(pendingBalance)} pasará al próximo ciclo.`;
  } else if (isOverdue) {
    status = 'overdue';
    const daysLate = Math.abs(daysUntilDue || 0);
    statusLabel = `Vencido hace ${daysLate}d`;
    statusBadgeColor = 'text-rose-400 bg-rose-500/20 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse';
    statusDescription = `Facturación vencida sin cubrir el mínimo. Por pagar: ${formatCLP(pendingBalance)}.`;
  } else {
    status = 'pending';
    const dueTxt = daysUntilDue !== undefined ? `Vence en ${daysUntilDue}d` : 'Facturación Pendiente';
    statusLabel = `${dueTxt} • Por pagar: ${formatCLP(pendingBalance)}`;
    statusBadgeColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
    statusDescription = `Corte cerrado el día ${closingDay}. Debes pagar antes del día ${dueDay || 5}.`;
  }

  const closingDateStr = closingDate.toISOString().slice(0, 10);
  const dueDateStr = dueDate ? dueDate.toISOString().slice(0, 10) : undefined;

  return {
    cardId: card.id,
    cardName: card.name,
    period,
    closingDay,
    dueDay,
    closingDateStr,
    dueDateStr,
    isClosed,
    daysUntilClosing,
    daysUntilDue,
    isOverdue,
    totalBilled,
    totalPaid,
    minPayment,
    pendingBalance,
    revolvingBalance,
    status,
    statusLabel,
    statusBadgeColor,
    statusDescription
  };
}
