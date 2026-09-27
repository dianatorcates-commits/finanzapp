import { Transaction, ComputedTransaction, PaymentAllocation } from '../types';

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
    const totalAllocated = (tx.allocations || []).reduce((sum, a) => sum + a.amount, 0);
    const netAmount = Math.max(0, tx.amount - totalAllocated);
    const isFullyPaid = tx.amount > 0 && netAmount === 0;

    let unallocatedPaymentBalance = 0;
    if (tx.transactionType === 'pago_tc' || tx.amount < 0) {
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
      .filter((tx) => tx.accountId === accId && tx.transactionType === 'compra' && tx.amount > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get all TC payments for this account sorted by date ascending
    const payments = updatedTransactions
      .filter(
        (tx) =>
          tx.accountId === accId &&
          (tx.transactionType === 'pago_tc' || (tx.amount < 0 && tx.category === 'Pagos de Tarjeta'))
      )
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
