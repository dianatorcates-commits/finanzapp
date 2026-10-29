import { Transaction, ComputedTransaction, PaymentAllocation } from '../types';
import { calculateTransactionPeriod } from './dateUtils';

/**
 * Determines whether a transaction is specifically a credit card payment or abono
 * that can be allocated to cover credit card purchases.
 * 
 * Transfers (transferencia_recibida / transferencia_enviada), incomes (sueldos, honorarios),
 * and regular bank movements are NOT credit card abonos.
 */
export function isCreditCardPaymentTransaction(tx: {
  amount: number;
  transactionType?: string;
  category?: string;
  subcategory?: string;
  description?: string;
}): boolean {
  // A transfer sent or received is NOT a credit card payment unless explicitly identified
  if (
    tx.transactionType === 'transferencia_enviada' ||
    tx.transactionType === 'transferencia_recibida'
  ) {
    const subcat = (tx.subcategory || '').toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const isExplicitTcPayment =
      subcat.includes('pago tarjeta') ||
      subcat.includes('pago tc') ||
      subcat.includes('abono tc') ||
      desc.includes('pago tarjeta') ||
      desc.includes('pago tc');
    return isExplicitTcPayment;
  }

  if (tx.transactionType === 'pago_tc') return true;

  // Negative amount on credit card or return/abono
  if (tx.amount < 0) return true;

  const cat = (tx.category || '').toLowerCase();
  const subcat = (tx.subcategory || '').toLowerCase();

  // Explicit abonos or pagos category (excluding general income/transfers)
  if (
    (cat.includes('abonos') || cat.includes('pagos')) &&
    !cat.includes('transferencias')
  ) {
    return true;
  }

  if (
    subcat.includes('pago tarjeta') ||
    subcat.includes('pagos de tarjeta') ||
    subcat.includes('pago de tarjeta') ||
    subcat.includes('pago tc') ||
    subcat.includes('abono de tarjeta') ||
    subcat.includes('abono tarjeta') ||
    subcat.includes('abono tc') ||
    subcat.includes('abono deuda') ||
    subcat.includes('pago deuda')
  ) {
    return true;
  }

  const desc = (tx.description || '').toLowerCase();
  if (
    desc.includes('pago tarjeta') ||
    desc.includes('abono tarjeta') ||
    desc.includes('pago tc') ||
    desc.includes('abono tc') ||
    desc.includes('pago de tarjeta') ||
    desc.includes('abono a tarjeta') ||
    desc.includes('abono deuda') ||
    desc.includes('pago deuda')
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether a transaction is a payment, abono, refund, return, or income,
 * which should NOT count towards used credit line or expense quota (netAmount = 0).
 */
export function isPaymentOrIncomeTransaction(tx: {
  amount: number;
  transactionType?: string;
  category?: string;
  subcategory?: string;
  description?: string;
}): boolean {
  if (tx.amount < 0) return true;

  const type = tx.transactionType;

  // A transfer sent is an outflow/egreso (expense), NEVER payment/income
  if (type === 'transferencia_enviada') {
    const subcat = (tx.subcategory || '').toLowerCase();
    const desc = (tx.description || '').toLowerCase();
    const isExplicitTcPayment =
      subcat.includes('pago tarjeta') ||
      subcat.includes('pago tc') ||
      subcat.includes('abono tc') ||
      desc.includes('pago tarjeta') ||
      desc.includes('pago tc');
    return isExplicitTcPayment;
  }

  // Explicit positive payment or income types
  if (
    type === 'pago_tc' ||
    type === 'ingreso_venta' ||
    type === 'transferencia_recibida' ||
    type === 'remuneracion'
  ) {
    return true;
  }

  // If transactionType is compra or comision_interes, it is an expense/charge
  if (type === 'compra' || type === 'comision_interes') {
    return false;
  }

  const cat = (tx.category || '').toLowerCase();
  const subcat = (tx.subcategory || '').toLowerCase();

  // If subcategory is 'transferencias' and type wasn't transferencia_recibida, it's an outflow
  if (subcat === 'transferencias') {
    return false;
  }

  // Credit card payment / abono categories
  if (
    cat.includes('abonos') ||
    cat.includes('pagos') ||
    subcat.includes('pago') ||
    subcat.includes('abono')
  ) {
    return true;
  }

  // Income categories
  if (
    (cat.includes('ingresos') && !cat.includes('transferencias')) ||
    subcat.includes('sueldo') ||
    subcat.includes('remuneraci') ||
    subcat.includes('honorarios') ||
    subcat.includes('devoluci') ||
    subcat.includes('ventas')
  ) {
    return true;
  }

  return false;
}

/**
 * Computes allocation stats, net amounts (Monto Real Utilizado), and payment balances.
 */
export function computeTransactions(transactions: Transaction[]): ComputedTransaction[] {
  // Map of payment transaction ID -> sum of allocated amount
  const paymentUsageMap = new Map<string, number>();

  // Calculate allocated sums
  transactions.forEach((tx) => {
    if (tx.allocations && tx.allocations.length > 0) {
      tx.allocations.forEach((alloc) => {
        const current = paymentUsageMap.get(alloc.paymentTransactionId) || 0;
        paymentUsageMap.set(alloc.paymentTransactionId, current + alloc.amount);
      });
    }
  });

  return transactions.map((tx) => {
    const isPaymentOrIncome = isPaymentOrIncomeTransaction(tx);
    const totalAllocated = (tx.allocations || []).reduce((sum, a) => sum + a.amount, 0);

    let netAmount = 0;
    let isFullyPaid = false;

    // netAmount > 0 must ONLY exist for real positive purchases/charges
    if (!isPaymentOrIncome && tx.amount > 0) {
      netAmount = Math.max(0, tx.amount - totalAllocated);
      isFullyPaid = netAmount === 0;
    }

    let unallocatedPaymentBalance = 0;
    // unallocatedPaymentBalance is ONLY available for genuine credit card payments/abonos
    const isEligibleCreditCardPayment = isCreditCardPaymentTransaction(tx);
    if (isEligibleCreditCardPayment) {
      const positivePaymentAmount = Math.abs(tx.amount);
      const usedAmount = paymentUsageMap.get(tx.id) || 0;
      unallocatedPaymentBalance = Math.max(0, positivePaymentAmount - usedAmount);
    }

    return {
      ...tx,
      totalAllocated,
      netAmount,
      isFullyPaid,
      unallocatedPaymentBalance
    };
  });
}

/**
 * Automatically allocates available payments to open credit card purchases using FIFO strategy.
 */
export function autoAllocatePayments(
  transactions: Transaction[],
  targetAccountId?: string
): Transaction[] {
  // Copy transactions to mutate allocations
  const updatedTransactions: Transaction[] = transactions.map((tx) => ({
    ...tx,
    allocations: [...(tx.allocations || [])]
  }));

  // Filter accounts
  const targetTcs = new Set(
    updatedTransactions
      .filter((tx) => !targetAccountId || tx.accountId === targetAccountId)
      .map((tx) => tx.accountId)
  );

  targetTcs.forEach((accId) => {
    // Get all purchases for this account sorted by date ascending
    const purchases = updatedTransactions
      .filter((tx) => tx.accountId === accId && !isPaymentOrIncomeTransaction(tx) && tx.amount > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get all TC payments/abonos for this account sorted by date ascending
    const payments = updatedTransactions
      .filter((tx) => {
        if (tx.accountId !== accId) return false;
        return isCreditCardPaymentTransaction(tx);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Reset auto-allocations or build on existing
    payments.forEach((payment) => {
      const paymentCapacity = Math.abs(payment.amount);
      let paymentUsed = (payment.id
        ? updatedTransactions.flatMap((t) => t.allocations || [])
            .filter((a) => a.paymentTransactionId === payment.id)
            .reduce((s, a) => s + a.amount, 0)
        : 0);

      let remainingPayment = paymentCapacity - paymentUsed;
      if (remainingPayment <= 0) return;

      for (const purchase of purchases) {
        if (remainingPayment <= 0) break;

        const currentAllocated = (purchase.allocations || []).reduce((s, a) => s + a.amount, 0);
        const purchaseNeeded = purchase.amount - currentAllocated;

        if (purchaseNeeded > 0) {
          const allocateAmount = Math.min(remainingPayment, purchaseNeeded);
          
          // Check if already allocated from this payment
          const existingAlloc = purchase.allocations.find(
            (a) => a.paymentTransactionId === payment.id
          );

          if (existingAlloc) {
            existingAlloc.amount += allocateAmount;
          } else {
            purchase.allocations.push({
              id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              paymentTransactionId: payment.id,
              amount: allocateAmount,
              allocatedAt: new Date().toISOString()
            });
          }

          remainingPayment -= allocateAmount;
        }
      }
    });
  });

  return updatedTransactions;
}

/**
 * Manually allocates an amount from a payment transaction to a purchase transaction.
 */
export function addPaymentAllocation(
  transactions: Transaction[],
  purchaseId: string,
  paymentId: string,
  amountToAllocate: number
): Transaction[] {
  return transactions.map((tx) => {
    if (tx.id === purchaseId) {
      const existingAllocations = tx.allocations ? [...tx.allocations] : [];
      const existingIdx = existingAllocations.findIndex(
        (a) => a.paymentTransactionId === paymentId
      );

      if (existingIdx >= 0) {
        existingAllocations[existingIdx] = {
          ...existingAllocations[existingIdx],
          amount: existingAllocations[existingIdx].amount + amountToAllocate
        };
      } else {
        existingAllocations.push({
          id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          paymentTransactionId: paymentId,
          amount: amountToAllocate,
          allocatedAt: new Date().toISOString()
        });
      }

      return {
        ...tx,
        allocations: existingAllocations
      };
    }
    return tx;
  });
}

/**
 * Removes an allocation link from a purchase.
 */
export function removePaymentAllocation(
  transactions: Transaction[],
  purchaseId: string,
  allocationId: string
): Transaction[] {
  return transactions.map((tx) => {
    if (tx.id === purchaseId && tx.allocations) {
      return {
        ...tx,
        allocations: tx.allocations.filter((a) => a.id !== allocationId)
      };
    }
    return tx;
  });
}

/**
 * Result returned by allocateExistingPaymentToCycle
 */
export interface CycleAllocationResult {
  updatedTransactions: Transaction[];
  allocatedAmount: number;
  touchedTransactionIds: string[];
}

/**
 * Directly associates and allocates an existing payment transaction to the unpaid purchases of a credit card billing cycle.
 * Allocates in FIFO order to purchases belonging to the target card and period.
 * Guarantees zero duplicate transactions in the database (Issue #48).
 */
export function allocateExistingPaymentToCycle(
  transactions: Transaction[],
  cardId: string,
  period: string,
  paymentTransactionId: string,
  amountToAllocate: number,
  cardClosingDay?: number
): CycleAllocationResult {
  if (amountToAllocate <= 0) {
    return {
      updatedTransactions: transactions,
      allocatedAmount: 0,
      touchedTransactionIds: []
    };
  }

  const touchedIds = new Set<string>();

  // 1. Deep clone transactions array with cloned allocations
  const updatedTransactions: Transaction[] = transactions.map((tx) => ({
    ...tx,
    allocations: tx.allocations ? [...tx.allocations] : []
  }));

  // 2. Find payment transaction
  const paymentTx = updatedTransactions.find((t) => t.id === paymentTransactionId);
  if (!paymentTx) {
    return {
      updatedTransactions: transactions,
      allocatedAmount: 0,
      touchedTransactionIds: []
    };
  }

  touchedIds.add(paymentTransactionId);

  // 3. Find purchases belonging to this card and billing cycle sorted by date ascending (FIFO)
  const purchases = updatedTransactions
    .filter((tx) => {
      if (tx.accountId !== cardId) return false;
      if (isPaymentOrIncomeTransaction(tx) || tx.amount <= 0) return false;
      const txPeriod = tx.period || calculateTransactionPeriod(tx.date, cardClosingDay);
      return txPeriod === period;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let remaining = amountToAllocate;
  let totalAllocated = 0;

  for (const purchase of purchases) {
    if (remaining <= 0) break;

    const currentAllocated = (purchase.allocations || []).reduce((sum, a) => sum + a.amount, 0);
    const needed = Math.max(0, purchase.amount - currentAllocated);

    if (needed > 0) {
      const allocAmount = Math.min(remaining, needed);
      if (!purchase.allocations) purchase.allocations = [];

      const existingAlloc = purchase.allocations.find(
        (a) => a.paymentTransactionId === paymentTransactionId
      );

      if (existingAlloc) {
        existingAlloc.amount += allocAmount;
      } else {
        purchase.allocations.push({
          id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          paymentTransactionId,
          amount: allocAmount,
          allocatedAt: new Date().toISOString()
        });
      }

      touchedIds.add(purchase.id);
      remaining -= allocAmount;
      totalAllocated += allocAmount;
    }
  }

  // 4. Update the payment transaction metadata
  if (paymentTx.accountId !== cardId) {
    if (!paymentTx.period) paymentTx.period = period;
    paymentTx.transactionType = 'pago_tc';
  } else {
    if (!paymentTx.period) paymentTx.period = period;
  }

  return {
    updatedTransactions,
    allocatedAmount: totalAllocated,
    touchedTransactionIds: Array.from(touchedIds)
  };
}
