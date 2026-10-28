import { Transaction } from '../types';

export type MascotTier = 0 | 0.5 | 1 | 2 | 3;

export interface MascotState {
  tier: MascotTier;
  stateName: string;
  txTodayCount: number;
  daysInactive: number;
  image: string;
  animationClass: string;
  message: string;
  energyPercent: number;
  moodEmoji: string;
  moodLabel: string;
  statusBadge: string;
}

/**
 * Returns current client date in YYYY-MM-DD format using local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates days elapsed between today and the latest registered transaction on or before today.
 * If no past/present transactions exist, returns 5 (triggering Tier 0 inactivity).
 */
export function calculateDaysInactive(transactions: Transaction[], todayStr: string = getTodayDateString()): number {
  if (!transactions || transactions.length === 0) {
    return 5;
  }

  // Filter transactions on or before today to measure real historical activity
  const pastDates = transactions
    .map((tx) => (tx.date || '').slice(0, 10))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= todayStr);

  if (pastDates.length === 0) {
    return 5;
  }

  // If there is any transaction today, 0 days inactive
  if (pastDates.includes(todayStr)) {
    return 0;
  }

  // Sort descending to find the latest transaction date
  pastDates.sort((a, b) => b.localeCompare(a));
  const latestDateStr = pastDates[0];

  const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
  const [lYear, lMonth, lDay] = latestDateStr.split('-').map(Number);

  const todayMidnight = new Date(tYear, tMonth - 1, tDay).getTime();
  const latestMidnight = new Date(lYear, lMonth - 1, lDay).getTime();

  const diffMs = todayMidnight - latestMidnight;
  const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  return diffDays;
}

/**
 * Counts transactions registered on today's date.
 */
export function calculateTodayTxCount(transactions: Transaction[], todayStr: string = getTodayDateString()): number {
  if (!transactions || transactions.length === 0) return 0;
  return transactions.filter((tx) => (tx.date || '').slice(0, 10) === todayStr).length;
}

/**
 * Determines the mascot tier from txTodayCount and daysInactive.
 */
export function computeMascotTier(txTodayCount: number, daysInactive: number): MascotTier {
  if (txTodayCount >= 5) return 3;
  if (txTodayCount === 3 || txTodayCount === 4) return 2;
  if (txTodayCount === 1 || txTodayCount === 2) return 1;
  if (daysInactive >= 5 && txTodayCount === 0) return 0;
  return 0.5;
}

/**
 * Core engine: evaluates current transactions and returns full mascot status,
 * animation, message, and mood attributes according to Issue #29 specs.
 */
export function getMascotState(
  transactions: Transaction[] = [],
  explicitToday?: string
): MascotState {
  const todayStr = explicitToday || getTodayDateString();
  const txTodayCount = calculateTodayTxCount(transactions, todayStr);
  const daysInactive = txTodayCount > 0 ? 0 : calculateDaysInactive(transactions, todayStr);
  const tier = computeMascotTier(txTodayCount, daysInactive);

  switch (tier) {
    case 0:
      return {
        tier: 0,
        stateName: 'Sueño Profundo (Inactiva)',
        txTodayCount,
        daysInactive,
        image: '/images/wallet_mascot_sleeping_128x128.png',
        animationClass: 'mascot-breathe',
        message: 'Zzz... 5 días inactiva... Anota un gasto para despertarme 💤',
        energyPercent: 10,
        moodEmoji: '💤',
        moodLabel: 'Inactiva',
        statusBadge: `${daysInactive >= 5 ? daysInactive : 5}d sin registros`,
      };

    case 0.5:
      return {
        tier: 0.5,
        stateName: 'Espera Matutina',
        txTodayCount,
        daysInactive,
        image: '/images/wallet_mascot_sleepy_128x128.png',
        animationClass: 'mascot-breathe',
        message: '☀️ ¡Buenos días! Esperando tu primer movimiento de hoy.',
        energyPercent: 35,
        moodEmoji: '☀️',
        moodLabel: 'Esperando',
        statusBadge: 'Primer gasto pendiente',
      };

    case 1:
      return {
        tier: 1,
        stateName: 'Desperezándose',
        txTodayCount,
        daysInactive,
        image: '/images/wallet_mascot_sleepy_128x128.png',
        animationClass: 'mascot-yawn',
        message: '🥱 ¡Buaah! Frotándome los ojitos... Ya casi me levanto.',
        energyPercent: 60,
        moodEmoji: '🥱',
        moodLabel: 'Despertando',
        statusBadge: `${txTodayCount} de 5 hoy`,
      };

    case 2:
      return {
        tier: 2,
        stateName: 'Despierta & Atenta',
        txTodayCount,
        daysInactive,
        image: '/images/wallet_mascot_neutral_128x128.png',
        animationClass: 'mascot-steady',
        message: '😐 Listo, ya abrí los ojos. Atento a todos tus movimientos.',
        energyPercent: 80,
        moodEmoji: '😐',
        moodLabel: 'Atenta',
        statusBadge: `${txTodayCount} de 5 hoy`,
      };

    case 3:
    default:
      return {
        tier: 3,
        stateName: 'Plenamente Activa & Feliz',
        txTodayCount,
        daysInactive,
        image: '/images/wallet_mascot_logo_128x128.png',
        animationClass: 'mascot-happy-bounce',
        message: '😄🎉 ¡Siiii! ¡Al fin totalmente activa y con las finanzas al día!',
        energyPercent: 100,
        moodEmoji: '🎉',
        moodLabel: 'Eufórica',
        statusBadge: '¡Finanzas al día!',
      };
  }
}
