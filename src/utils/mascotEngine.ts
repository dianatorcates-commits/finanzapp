import { Transaction } from '../types';

export type MascotTier = 'welcome' | 0 | 0.5 | 1 | 2 | 3;

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

export interface MascotOptions {
  explicitToday?: string;
  userCreatedAt?: string;
  accountsCount?: number;
  isWelcome?: boolean;
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
 * Extracts the effective activity date (YYYY-MM-DD) for a transaction.
 * Prioritizes the moment of registration (created_at/createdAt) in local time,
 * with fallback to the historical transaction date (date).
 */
export function getTransactionActivityDate(tx: Transaction): string {
  const rawCreation = tx.created_at || (tx as any).createdAt;
  if (rawCreation) {
    try {
      const parsed = new Date(rawCreation);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch {
      // fallback to isoSlice
    }
    const isoSlice = String(rawCreation).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoSlice)) {
      return isoSlice;
    }
  }
  return (tx.date || '').slice(0, 10);
}

/**
 * Calculates days elapsed between today and the latest registered activity on or before today.
 * If no past/present transactions exist:
 * - If user registered today, daysInactive is 0 (not 5).
 * - Otherwise returns 5 (triggering Tier 0 inactivity).
 */
export function calculateDaysInactive(
  transactions: Transaction[],
  todayStr: string = getTodayDateString(),
  userCreatedAt?: string
): number {
  if (!transactions || transactions.length === 0) {
    if (userCreatedAt) {
      const regDate = userCreatedAt.slice(0, 10);
      if (regDate === todayStr) {
        return 0;
      }
      if (/^\d{4}-\d{2}-\d{2}$/.test(regDate) && regDate <= todayStr) {
        const [tYear, tMonth, tDay] = todayStr.split('-').map(Number);
        const [rYear, rMonth, rDay] = regDate.split('-').map(Number);
        const todayMidnight = new Date(tYear, tMonth - 1, tDay).getTime();
        const regMidnight = new Date(rYear, rMonth - 1, rDay).getTime();
        const diffDays = Math.max(0, Math.round((todayMidnight - regMidnight) / (1000 * 60 * 60 * 24)));
        return diffDays;
      }
    }
    return 5;
  }

  // Filter transactions on or before today to measure real historical activity
  const pastDates: string[] = [];
  for (const tx of transactions) {
    const activityDate = getTransactionActivityDate(tx);
    const txDate = (tx.date || '').slice(0, 10);

    if (/^\d{4}-\d{2}-\d{2}$/.test(activityDate) && activityDate <= todayStr) {
      pastDates.push(activityDate);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(txDate) && txDate <= todayStr) {
      pastDates.push(txDate);
    }
  }

  if (pastDates.length === 0) {
    if (userCreatedAt && userCreatedAt.slice(0, 10) === todayStr) {
      return 0;
    }
    return 5;
  }

  // If there is any transaction today, 0 days inactive
  if (pastDates.includes(todayStr)) {
    return 0;
  }

  // Sort descending to find the latest activity date
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
 * Evaluates whether either the registration moment (created_at) or the transaction date (date)
 * matches today's date.
 */
export function calculateTodayTxCount(transactions: Transaction[], todayStr: string = getTodayDateString()): number {
  if (!transactions || transactions.length === 0) return 0;
  return transactions.filter((tx) => {
    const activityDate = getTransactionActivityDate(tx);
    const txDate = (tx.date || '').slice(0, 10);
    return activityDate === todayStr || txDate === todayStr;
  }).length;
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
 * Core engine: evaluates current transactions and user context, returning full mascot status,
 * animation, message, and mood attributes according to Issue #29 and Issue #42 specs.
 */
export function getMascotState(
  transactions: Transaction[] = [],
  optionsOrToday?: string | MascotOptions,
  legacyOptions?: { userCreatedAt?: string; accountsCount?: number }
): MascotState {
  let todayStr: string;
  let userCreatedAt: string | undefined;
  let accountsCount: number | undefined;
  let forceWelcome = false;

  if (typeof optionsOrToday === 'string') {
    todayStr = optionsOrToday;
    userCreatedAt = legacyOptions?.userCreatedAt;
    accountsCount = legacyOptions?.accountsCount;
  } else if (optionsOrToday && typeof optionsOrToday === 'object') {
    todayStr = optionsOrToday.explicitToday || getTodayDateString();
    userCreatedAt = optionsOrToday.userCreatedAt;
    accountsCount = optionsOrToday.accountsCount;
    forceWelcome = !!optionsOrToday.isWelcome;
  } else {
    todayStr = getTodayDateString();
  }

  // 1. Welcome / Onboarding Mode for New Users (Issue #42)
  // Activated if user registered today AND has no accounts AND no transactions
  const isCreatedToday = !!userCreatedAt && userCreatedAt.slice(0, 10) === todayStr;
  const hasNoData = (accountsCount === 0 || accountsCount === undefined) && transactions.length === 0;

  const shouldWelcome =
    forceWelcome ||
    (isCreatedToday && hasNoData) ||
    (accountsCount === 0 && transactions.length === 0 && userCreatedAt !== undefined);

  if (shouldWelcome) {
    return {
      tier: 'welcome',
      stateName: '¡Bienvenido/a!',
      txTodayCount: 0,
      daysInactive: 0,
      image: '/images/wallet_mascot_welcome_128x128.png',
      animationClass: 'mascot-happy-bounce',
      message: '👋 ¡Hola! Soy tu Billetera Inteligente. ¡Qué alegría tenerte aquí! Agrega tu primera cuenta bancaria o carga una cartola para comenzar a ordenar tus finanzas juntos.',
      energyPercent: 100,
      moodEmoji: '👋',
      moodLabel: '¡Bienvenido!',
      statusBadge: 'Primeros pasos',
    };
  }

  // 2. Regular Daily Lifecycle Calculation (Tiers 0, 0.5, 1, 2, 3)
  const txTodayCount = calculateTodayTxCount(transactions, todayStr);
  const daysInactive = txTodayCount > 0 ? 0 : calculateDaysInactive(transactions, todayStr, userCreatedAt);
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
        image: '/images/homologated_stage3_happy_128x128.png',
        animationClass: 'mascot-happy-bounce',
        message: '😄🎉 ¡Siiii! ¡Al fin totalmente activa y con las finanzas al día!',
        energyPercent: 100,
        moodEmoji: '🎉',
        moodLabel: 'Eufórica',
        statusBadge: '¡Finanzas al día!',
      };
  }
}
