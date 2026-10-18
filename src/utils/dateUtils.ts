/**
 * Centralized Date and Billing Period Utilities for FinanzApp.
 */

/**
 * Calculates the accounting/billing period ('YYYY-MM') for a transaction based on the account's closing day.
 * 
 * Rules:
 * - If closingDay is not defined, null, or <= 1: Returns directly 'YYYY-MM' (standard calendar month).
 * - If closingDay is defined (e.g. 24):
 *   - Adjusts for months with fewer days (e.g. Feb 28/29, Apr 30) using Math.min(closingDay, lastDayOfMonth).
 *   - If transaction day <= effectiveClosingDay: belongs to current month ('YYYY-MM').
 *   - If transaction day > effectiveClosingDay: belongs to next month's billing cycle ('YYYY-MM' + 1).
 *     (Handles year transition e.g. Dec 25 with closingDay 24 -> '2027-01').
 * 
 * @param dateStr - Date string in format 'YYYY-MM-DD'
 * @param closingDay - Optional monthly statement closing day (1 to 31)
 * @returns Billing period formatted as 'YYYY-MM'
 */
export function calculateTransactionPeriod(dateStr: string, closingDay?: number | null): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }

  // Parse YYYY-MM-DD
  const parts = dateStr.trim().split('-');
  if (parts.length < 3) {
    return dateStr.substring(0, 7);
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1 - 12
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return dateStr.substring(0, 7);
  }

  // Si closingDay no está definido, es nulo o <= 1, usar mes calendario estándar
  if (!closingDay || closingDay <= 1) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // Último día del mes actual (considerando bisiestos y meses de 30/31 días)
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const effectiveClosingDay = Math.min(closingDay, lastDayOfMonth);

  if (day <= effectiveClosingDay) {
    // Pertenece a la facturación del mismo mes
    return `${year}-${String(month).padStart(2, '0')}`;
  } else {
    // Pertenece a la facturación del mes siguiente
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  }
}

/**
 * Returns a human-readable label for an account's billing cycle.
 * e.g. "Corte: día 24 • Vence: día 5" or "Corte: día 24"
 */
export function formatBillingCycle(closingDay?: number | null, dueDay?: number | null): string | null {
  if (!closingDay && !dueDay) return null;
  const parts: string[] = [];
  if (closingDay && closingDay > 1) {
    parts.push(`Corte: día ${closingDay}`);
  }
  if (dueDay && dueDay >= 1 && dueDay <= 31) {
    parts.push(`Vence: día ${dueDay}`);
  }
  return parts.length > 0 ? parts.join(' • ') : null;
}
