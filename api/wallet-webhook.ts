import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION & SUPABASE ADMIN CLIENT
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

function getSupabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Variables SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY faltantes en el entorno.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// ============================================================
// HELPER UTILS
// ============================================================

// Chile Current Date YYYY-MM-DD
function getChileCurrentDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Normalize strings for comparison (removes accents, lowercase, trimmed)
function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Format Chilean Peso (CLP)
function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Calculate accounting period based on account's closing day
function calculateTransactionPeriod(dateStr: string, closingDay?: number | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const parts = dateStr.trim().split('-');
  if (parts.length < 3) return dateStr.substring(0, 7);
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr.substring(0, 7);

  if (!closingDay || closingDay <= 1) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const effectiveClosingDay = Math.min(closingDay, lastDayOfMonth);

  if (day <= effectiveClosingDay) {
    return `${year}-${String(month).padStart(2, '0')}`;
  } else {
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
  }
}

// Send instant Telegram confirmation message
async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
) {
  if (!TELEGRAM_BOT_TOKEN) return;

  const endpoint = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    if (!res.ok) {
      // Fallback a texto plano sin formato especial si Telegram rechazó algún caracter
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      });
    }
  } catch (err) {
    console.error('Error de red al enviar mensaje a Telegram:', err);
  }
}

// ============================================================
// NOTIFICATION PARSERS (AMOUNT, MERCHANT, CARD)
// ============================================================

/**
 * Extract amount in CLP from notification text.
 * Handles formats like: $14.500, 14.500 CLP, por $14.500, $ 14.500, 14500
 * Ignores card numbers (e.g. "terminada en 4892").
 */
function extractAmount(text: string): number | null {
  if (!text) return null;

  // 1. Prioritize number explicitly preceded by '$' or currency keywords
  // Ex: "$14.500", "por $14.500", "$ 14.500", "CLP 14.500", "14.500 pesos"
  const currencyMatch = text.match(/(?:por\s*\$|de\s*\$|monto\s*\$|total\s*\$|\$|CLP)\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{3,8})(?:[,\.][0-9]{1,2})?(?:\s*CLP|\s*pesos)?/i);
  if (currencyMatch && currencyMatch[1]) {
    const num = parseFloat(currencyMatch[1].replace(/\./g, ''));
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Chilean formatted thousands: e.g. "14.500" or "120.000" (segment of 3 digits after dot)
  const thousandsMatches = Array.from(text.matchAll(/(?:^|\s)([0-9]{1,3}(?:\.[0-9]{3})+)(?:\s|$|\.|\,)/g));
  for (const m of thousandsMatches) {
    if (m[1]) {
      const num = parseFloat(m[1].replace(/\./g, ''));
      if (!isNaN(num) && num > 0) return num;
    }
  }

  // 3. Fallback: Standalone number that is NOT preceded by card identifiers
  const numberMatches = Array.from(text.matchAll(/(?:^|\s)([0-9]{4,8})(?:\s|$|\.|\,)/g));
  for (const m of numberMatches) {
    const rawNum = m[1];
    // Check if preceded by card indicators
    const index = m.index || 0;
    const precedingSlice = text.substring(Math.max(0, index - 25), index).toLowerCase();
    if (
      precedingSlice.includes('terminada') ||
      precedingSlice.includes('tarjeta') ||
      precedingSlice.includes('cuenta') ||
      precedingSlice.includes('tc') ||
      precedingSlice.includes('*')
    ) {
      continue;
    }
    const num = parseFloat(rawNum);
    if (!isNaN(num) && num >= 100) return num;
  }

  return null;
}

// ============================================================
// GENERIC PHRASES BLACKLIST
// ============================================================
const GENERIC_BLACKLIST = [
  'tu dinero ya esta disponible',
  'tu dinero esta disponible',
  'tu saldo esta listo',
  'tu saldo ya esta listo',
  'saldo disponible',
  'aviso de compra',
  'alerta de seguridad',
  'alerta de compra',
  'comprobante',
  'comprobante de pago',
  'comprobante de transferencia',
  'operacion exitosa',
  'notificacion',
  'notificaciones',
  'pago exitoso',
  'pago realizado',
  'compra aprobada',
  'compra exitosa',
  'compra realizada',
  'transferencia realizada',
  'transferencia exitosa',
  'transferencia enviada',
  'transferencia recibida',
  'pago aprobado',
  'movimiento aprobado',
  'billetera de google',
  'google wallet',
  'billetera',
  'wallet',
  'google pay',
];

function isGenericPhrase(str: string): boolean {
  if (!str) return true;
  const norm = normalizeText(str);
  if (norm.length <= 2) return true;
  return GENERIC_BLACKLIST.some((phrase) => norm === phrase || norm.startsWith(phrase) || phrase.startsWith(norm));
}

function cleanMerchantString(str: string): string {
  let cleaned = (str || '').trim();
  // Remove common trailing words
  cleaned = cleaned.replace(/\s+(?:con|por|de|en|tu|su|tarjeta|tc|google|pay).*$/i, '');
  // Remove special symbols at start or end
  cleaned = cleaned.replace(/^[\s\.\-_,:;'"#]+|[\s\.\-_,:;'"#]+$/g, '');
  return cleaned;
}

export interface ExtractedDetails {
  concept: string;
  transactionType: 'compra' | 'transferencia_enviada' | 'transferencia_recibida';
}

/**
 * Extract clean concept/merchant and classify transaction type (compra, transferencia_enviada, transferencia_recibida).
 */
export function extractConceptAndType(text: string, title?: string, app?: string): ExtractedDetails {
  const normText = normalizeText(text);
  const normTitle = normalizeText(title || '');
  const cleanApp = cleanMerchantString(app || '');

  // 1. TRANSFERENCIA RECIBIDA / DINERO RECIBIDO / ABONO
  // Ex: "Recibiste $15.000 de Carlos Muñoz"
  // Ex: "Te transfirieron $20.000 de Andrea Silva"
  const matchRecibisteDe = text.match(/(?:recibiste|te\s+transfirieron|te\s+enviaron|abono\s+recibido|transferencia\s+recibida)(?:\s+(?:por\s+)?\$?[0-9\.]+)?(?:\s+(?:de|desde)\s+)([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_'"]+?)(?:\s+(?:a|en|por|con|para)|\.|\,|$|\n)/i);
  if (matchRecibisteDe && matchRecibisteDe[1]) {
    const sender = cleanMerchantString(matchRecibisteDe[1]);
    if (sender && !isGenericPhrase(sender)) {
      return {
        concept: `Transferencia de ${sender}`,
        transactionType: 'transferencia_recibida',
      };
    }
  }

  // Generic transfer received indicators
  if (
    /recibiste|te\s+transfirieron|dinero\s+recibido|abono\s+recibido|transferencia\s+recibida/i.test(normText) ||
    /recibiste|transferencia\s+recibida/i.test(normTitle)
  ) {
    return {
      concept: 'Transferencia Recibida',
      transactionType: 'transferencia_recibida',
    };
  }

  // 2. TRANSFERENCIA ENVIADA / CARGA DE FONDOS / ENVÍO DE DINERO
  // Ex: "Transferiste $50.000 desde tu cuenta Scotiabank" -> Carga de fondos Scotiabank
  const matchCargaFondos = text.match(/transferiste\s+(?:por\s+)?\$?[0-9\.]+\s+desde\s+tu\s+cuenta\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_'"]+?)(?:\s+(?:a|por|para)|\.|\,|$|\n)/i);
  if (matchCargaFondos && matchCargaFondos[1]) {
    const bankName = cleanMerchantString(matchCargaFondos[1]);
    if (bankName && !isGenericPhrase(bankName)) {
      return {
        concept: `Carga de fondos ${bankName}`,
        transactionType: 'transferencia_enviada',
      };
    }
  }

  // Ex: "Transferiste $12.000 a Juan Pérez" or "Enviaste $12.000 a Juan Pérez"
  const matchTransfA = text.match(/(?:transferiste|enviaste|transferencia\s+a)\s+(?:por\s+)?\$?[0-9\.]*\s*(?:a\s+)([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_'"]+?)(?:\s+(?:desde|con|por|el|la|cuenta)|\.|\,|$|\n)/i);
  if (matchTransfA && matchTransfA[1]) {
    const recipient = cleanMerchantString(matchTransfA[1]);
    if (recipient && !isGenericPhrase(recipient)) {
      return {
        concept: `Transferencia a ${recipient}`,
        transactionType: 'transferencia_enviada',
      };
    }
  }

  // Generic transfer sent indicators
  if (
    /transferiste|enviaste\s+dinero|transferencia\s+enviada|transferencia\s+exitosa/i.test(normText) ||
    /transferencia\s+exitosa|transferencia\s+enviada/i.test(normTitle)
  ) {
    return {
      concept: 'Transferencia Enviada',
      transactionType: 'transferencia_enviada',
    };
  }

  // 3. COMPRAS TRADICIONALES
  // Pattern 1: "... en <Comercio> con/por/tu/el..."
  // Ex: "Compra aprobada por $14.500 en Jumbo con tu tarjeta..."
  // Ex: "Pagaste $14.500 en Starbucks con Google Pay"
  const matchEn = text.match(/\ben\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_&'"]+?)(?:\s+(?:con|por|el|la|tu|fecha|usando|mediante|para|desde)|\.|\,|$|\n)/i);
  if (matchEn && matchEn[1]) {
    const candidate = cleanMerchantString(matchEn[1]);
    if (candidate && candidate.length >= 2 && candidate.length <= 60 && !isGenericPhrase(candidate)) {
      return {
        concept: candidate,
        transactionType: 'compra',
      };
    }
  }

  // Pattern 2: "Compra en <Comercio> aprobada..."
  const matchCompraEn = text.match(/\bcompra en\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_&'"]+?)(?:\s+(?:aprobada|por|con|desde)|\.|\,|$|\n)/i);
  if (matchCompraEn && matchCompraEn[1]) {
    const candidate = cleanMerchantString(matchCompraEn[1]);
    if (candidate && candidate.length >= 2 && candidate.length <= 60 && !isGenericPhrase(candidate)) {
      return {
        concept: candidate,
        transactionType: 'compra',
      };
    }
  }

  // Pattern 3: Store/Merchant name in title if not generic
  if (title) {
    const cleanTitle = cleanMerchantString(title);
    if (cleanTitle && cleanTitle.length >= 2 && !isGenericPhrase(cleanTitle)) {
      return {
        concept: cleanTitle,
        transactionType: 'compra',
      };
    }
  }

  // 4. CLEAN FALLBACK:
  // Use app name if not generic, rather than generic alert title
  if (cleanApp && !isGenericPhrase(cleanApp)) {
    return {
      concept: cleanApp,
      transactionType: 'compra',
    };
  }

  return {
    concept: 'Compra con Wallet',
    transactionType: 'compra',
  };
}

/**
 * Backward compatibility alias for extractMerchant
 */
export function extractMerchant(text: string, title?: string, app?: string): string {
  return extractConceptAndType(text, title, app).concept;
}

/**
 * Find matching user account based on card numbers (last 4 digits), contextual bank phrases, app name, or account name.
 */
export function findMatchingAccount(
  accounts: any[],
  text: string,
  title?: string,
  app?: string,
  transactionType?: string
) {
  if (!accounts || accounts.length === 0) return null;
  const combined = `${title || ''} ${text || ''} ${app || ''}`.toLowerCase();
  const cleanApp = cleanMerchantString(app || '');
  const normApp = normalizeText(cleanApp);

  // 1. MATCH BY LAST 4 DIGITS OF CARD OR ACCOUNT (Highest Precision)
  const cardDigitsMatch = combined.match(/(?:terminad[ao] en|tarjeta|tc|\*)\s*(\d{4})/i);
  if (cardDigitsMatch && cardDigitsMatch[1]) {
    const last4 = cardDigitsMatch[1];
    const matchedByDigits = accounts.find((a) => {
      const accNum = (a.account_number || a.accountNumber || '').toString();
      const accName = (a.name || '').toString();
      return accNum.endsWith(last4) || accName.includes(last4);
    });
    if (matchedByDigits) return matchedByDigits;
  }

  // 2. CONTEXTUAL PHRASES IN TEXT:
  // "desde tu cuenta [Banco]" ➔ Match account of that Bank (prefer checking / debit)
  const matchDesdeCuenta = text.match(/desde\s+tu\s+cuenta\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ]+?)(?:\s+(?:a|por|para|con)|\.|\,|$|\n)/i);
  if (matchDesdeCuenta && matchDesdeCuenta[1]) {
    const candidateBank = normalizeText(cleanMerchantString(matchDesdeCuenta[1]));
    if (candidateBank.length >= 3 && !isGenericPhrase(candidateBank)) {
      const matched = accounts.find((a) => {
        const b = normalizeText(a.bank || '');
        const n = normalizeText(a.name || '');
        return (b && (b.includes(candidateBank) || candidateBank.includes(b))) ||
               (n && (n.includes(candidateBank) || candidateBank.includes(n)));
      });
      if (matched) return matched;
    }
  }

  // "con tu tarjeta [Banco]" ➔ Match card of that Bank (prefer credit card)
  const matchConTarjeta = text.match(/con\s+tu\s+tarjeta\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ]+?)(?:\s+(?:a|por|para|en|de)|\.|\,|$|\n)/i);
  if (matchConTarjeta && matchConTarjeta[1]) {
    const candidateBank = normalizeText(cleanMerchantString(matchConTarjeta[1]));
    if (candidateBank.length >= 3 && !isGenericPhrase(candidateBank)) {
      const matchedCard = accounts.find((a) => {
        const b = normalizeText(a.bank || '');
        const n = normalizeText(a.name || '');
        const matches = (b && (b.includes(candidateBank) || candidateBank.includes(b))) ||
                        (n && (n.includes(candidateBank) || candidateBank.includes(n)));
        return matches && a.type === 'credit_card';
      }) || accounts.find((a) => {
        const b = normalizeText(a.bank || '');
        const n = normalizeText(a.name || '');
        return (b && (b.includes(candidateBank) || candidateBank.includes(b))) ||
               (n && (n.includes(candidateBank) || candidateBank.includes(n)));
      });
      if (matchedCard) return matchedCard;
    }
  }

  // "a tu cuenta [Banco]" ➔ Match destination account
  const matchATuCuenta = text.match(/a\s+tu\s+cuenta\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ]+?)(?:\s+(?:desde|de|por|para|con)|\.|\,|$|\n)/i);
  if (matchATuCuenta && matchATuCuenta[1]) {
    const candidateBank = normalizeText(cleanMerchantString(matchATuCuenta[1]));
    if (candidateBank.length >= 3 && !isGenericPhrase(candidateBank)) {
      const matched = accounts.find((a) => {
        const b = normalizeText(a.bank || '');
        const n = normalizeText(a.name || '');
        return (b && (b.includes(candidateBank) || candidateBank.includes(b))) ||
               (n && (n.includes(candidateBank) || candidateBank.includes(n)));
      });
      if (matched) return matched;
    }
  }

  // 3. MATCH BY APP OF ORIGIN (`app`):
  // If app is a banking / fintech app (e.g. Mercado Pago, Scotia, Santander, Falabella, BCI, etc.)
  if (normApp && !normApp.includes('google') && !normApp.includes('wallet') && !normApp.includes('pay') && normApp.length >= 3) {
    const matchedByApp = accounts.find((a) => {
      const b = normalizeText(a.bank || '');
      const n = normalizeText(a.name || '');
      return (b && (b.includes(normApp) || normApp.includes(b))) ||
             (n && (n.includes(normApp) || normApp.includes(n)));
    });
    if (matchedByApp) return matchedByApp;
  }

  // 4. MATCH BY BANK NAME MENTIONED IN TEXT OR TITLE
  const matchedByBankInText = accounts.find((a) => {
    if (!a.bank) return false;
    const bNorm = normalizeText(a.bank);
    return bNorm.length >= 3 && normalizeText(combined).includes(bNorm);
  });
  if (matchedByBankInText) return matchedByBankInText;

  // 5. MATCH BY ACCOUNT NAME IN TEXT OR TITLE
  const matchedByNameInText = accounts.find((a) => {
    if (!a.name) return false;
    const nNorm = normalizeText(a.name);
    return nNorm.length >= 3 && normalizeText(combined).includes(nNorm);
  });
  if (matchedByNameInText) return matchedByNameInText;

  // 6. FALLBACK BASED ON TRANSACTION TYPE
  if (transactionType === 'transferencia_enviada' || transactionType === 'transferencia_recibida') {
    const checkingAcc = accounts.find((a) => a.type === 'checking' || a.type === 'savings' || a.type === 'other');
    if (checkingAcc) return checkingAcc;
  }

  const creditCardAcc = accounts.find((a) => a.type === 'credit_card');
  return creditCardAcc || accounts[0];
}

/**
 * Intelligent categorization based on user rules, transaction type, or default Chilean commerce keywords.
 */
export function autoCategorizePurchase(
  concept: string,
  fullText: string,
  userRules: any[],
  transactionType: 'compra' | 'transferencia_enviada' | 'transferencia_recibida' = 'compra'
): { category: string; subcategory: string } {
  // If transactionType is transfer, assign appropriate category
  if (transactionType === 'transferencia_recibida') {
    return { category: 'Ingresos y Transferencias', subcategory: 'Transferencias' };
  }
  if (transactionType === 'transferencia_enviada') {
    return { category: 'Ingresos y Transferencias', subcategory: 'Transferencias' };
  }

  const normConcept = normalizeText(concept);
  const normText = normalizeText(fullText);

  // 1. Check user defined auto rules
  if (userRules && userRules.length > 0) {
    for (const rule of userRules) {
      const keyword = normalizeText(rule.pattern || rule.keyword || '');
      if (keyword && (normConcept.includes(keyword) || normText.includes(keyword))) {
        return {
          category: rule.category || rule.category_name || rule.categoryName || 'Compras y Estilo de Vida',
          subcategory: rule.subcategory || rule.subcategory_name || rule.subcategoryName || 'Compras Generales',
        };
      }
    }
  }

  // 2. Default Chilean Commerce Taxonomies
  // Supermercados & Almacenes
  if (/jumbo|lider|tottus|santa isabel|unimarc|alvi|erbi|mayorista|acuenta|oxxo|spacio 1|pronto|liquimax/i.test(normConcept)) {
    return { category: 'Alimentación y Gastronomía', subcategory: 'Supermercados' };
  }

  // Restaurantes & Delivery
  if (/uber eats|pedidosya|rappi|starbucks|mcdonald|burger|dunkin|kfc|pizza|sushi|restaurant|cafe|bar|bavaria|wendy|papa john/i.test(normConcept)) {
    return { category: 'Alimentación y Gastronomía', subcategory: 'Restaurantes y Bares' };
  }

  // Combustible & Transporte
  if (/copec|shell|petrobras|enex|uber|cabify|didi|metro|bip|autopista|costanera|vespucio|estacionamiento/i.test(normConcept)) {
    return { category: 'Transporte y Movilidad', subcategory: 'Combustible y Peajes' };
  }

  // Farmacias & Salud
  if (/cruz verde|salcobrand|ahumada|farmacia|redsalud|integramedica|banmedica|clinica|dental|optica/i.test(normConcept)) {
    return { category: 'Salud y Bienestar', subcategory: 'Farmacia y Medicamentos' };
  }

  // Streaming & Apps
  if (/spotify|netflix|disney|apple|google|prime|youtube|steam|playstation|crunchyroll|openai|chatgpt/i.test(normConcept)) {
    return { category: 'Suscripciones y Servicios', subcategory: 'Streaming y Apps' };
  }

  // Retail & Tiendas
  if (/falabella|ripley|paris|zara|h&m|decathlon|sodimac|easy|ikea|mercadolibre|amazon|aliexpress|shein/i.test(normConcept)) {
    return { category: 'Compras y Estilo de Vida', subcategory: 'Tiendas y Comercio' };
  }

  return { category: 'Compras y Estilo de Vida', subcategory: 'Compras Generales' };
}

// ============================================================
// MAIN VERCEL SERVERLESS HANDLER
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration for webhook
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Quick verification/health check for GET
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'FinanzApp Android / Google Wallet Webhook',
      instructions: 'Send HTTP POST with ?token=<TOKEN> or Authorization: Bearer <TOKEN> and JSON body { text: "...", title: "..." }',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // ------------------------------------------------------------
    // 1. EXTRACT & VALIDATE TOKEN
    // ------------------------------------------------------------
    let token = '';

    if (req.query.token && typeof req.query.token === 'string') {
      token = req.query.token.trim();
    } else if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else {
        token = authHeader.trim();
      }
    } else if (req.body && typeof req.body === 'object' && req.body.token) {
      token = String(req.body.token).trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorización faltante. Proporciona ?token=... o header Authorization: Bearer <TOKEN>.',
      });
    }

    // ------------------------------------------------------------
    // 2. IDENTIFY USER VIA SUPABASE
    // ------------------------------------------------------------
    let userId: string | null = null;
    let telegramChatId: number | string | null = null;

    // Check telegram_profiles where webhook_token matches
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('telegram_profiles')
      .select('user_id, telegram_chat_id, webhook_token')
      .eq('webhook_token', token)
      .maybeSingle();

    if (profile && profile.user_id) {
      userId = profile.user_id;
      telegramChatId = profile.telegram_chat_id;
    } else {
      // Fallback: check user_api_tokens if table exists
      try {
        const { data: apiTokenRow } = await supabaseAdmin
          .from('user_api_tokens')
          .select('user_id')
          .eq('token', token)
          .maybeSingle();

        if (apiTokenRow && apiTokenRow.user_id) {
          userId = apiTokenRow.user_id;
        }
      } catch (e) {
        // user_api_tokens not present, ignore
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Token no reconocido o revocado. Verifica tu URL de Webhook en FinanzApp.',
      });
    }

    // ------------------------------------------------------------
    // 3. PARSE NOTIFICATION BODY
    // ------------------------------------------------------------
    let rawText = '';
    let rawTitle = '';
    let rawApp = '';

    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        rawText = parsed.text || parsed.message || parsed.body || parsed.content || '';
        rawTitle = parsed.title || parsed.sender || '';
        rawApp = parsed.app || parsed.appName || parsed.app_name || '';
      } catch {
        rawText = req.body;
      }
    } else if (req.body && typeof req.body === 'object') {
      rawText = req.body.text || req.body.message || req.body.body || req.body.content || '';
      rawTitle = req.body.title || req.body.sender || '';
      rawApp = req.body.app || req.body.appName || req.body.app_name || '';
    }

    if (!rawText && !rawTitle && !rawApp) {
      return res.status(400).json({
        success: false,
        error: 'Cuerpo de notificación vacío. Se requiere el campo "text" con el contenido de la compra o movimiento.',
      });
    }

    // ------------------------------------------------------------
    // 4. EXTRACT AMOUNT, CONCEPT & TRANSACTION TYPE
    // ------------------------------------------------------------
    const fullContent = `${rawTitle ? rawTitle + ': ' : ''}${rawText}`;
    const parsedAmount = extractAmount(fullContent);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo identificar el monto en la notificación. Verifica el formato del texto.',
        receivedText: fullContent,
      });
    }

    const { concept, transactionType } = extractConceptAndType(rawText, rawTitle, rawApp);

    // ------------------------------------------------------------
    // 5. IDENTIFY ACCOUNT / CARD
    // ------------------------------------------------------------
    const { data: userAccounts, error: accErr } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (accErr) {
      console.error('Error consultando cuentas en Supabase:', accErr);
      return res.status(500).json({
        success: false,
        error: `Error al consultar cuentas en la base de datos: ${accErr.message}`,
        details: accErr,
      });
    }

    if (!userAccounts || userAccounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El usuario no tiene cuentas o tarjetas registradas en FinanzApp. Crea una cuenta en la aplicación web primero.',
        userId,
      });
    }

    const matchedAccount = findMatchingAccount(userAccounts, rawText, rawTitle, rawApp, transactionType);
    if (!matchedAccount) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo asociar la transacción a ninguna cuenta bancaria del usuario.',
      });
    }

    // ------------------------------------------------------------
    // 6. AUTO-CATEGORIZATION & ACCOUNTING PERIOD
    // ------------------------------------------------------------
    const { data: userRules } = await supabaseAdmin
      .from('auto_rules')
      .select('*')
      .eq('user_id', userId);

    const { category, subcategory } = autoCategorizePurchase(
      concept,
      fullContent,
      userRules || [],
      transactionType
    );

    const todayDate = getChileCurrentDate();
    const period = calculateTransactionPeriod(todayDate, matchedAccount.closing_day);

    // ------------------------------------------------------------
    // 6.5 DEDUPLICATION CHECK (Prevents duplicate entries on retries)
    // ------------------------------------------------------------
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existingDuplicate } = await supabaseAdmin
      .from('transactions')
      .select('id, description, amount, created_at')
      .eq('user_id', userId)
      .eq('account_id', matchedAccount.id)
      .eq('date', todayDate)
      .eq('amount', parsedAmount)
      .eq('description', concept)
      .gte('created_at', thirtyMinutesAgo)
      .limit(1);

    if (existingDuplicate && existingDuplicate.length > 0) {
      console.log('Transacción idéntica ya registrada recientemente, ignorando reintento duplicado:', existingDuplicate[0]);
      return res.status(200).json({
        success: true,
        duplicated: true,
        message: `Transacción ya registrada previamente: ${concept} por ${formatCLP(parsedAmount)}`,
        transaction: existingDuplicate[0],
      });
    }

    // ------------------------------------------------------------
    // 7. INSERT TRANSACTION INTO SUPABASE
    // ------------------------------------------------------------
    const transactionId = crypto.randomUUID();
    const insertPayload = {
      id: transactionId,
      user_id: userId,
      account_id: matchedAccount.id,
      date: todayDate,
      period: period,
      description: concept,
      raw_description: rawText.substring(0, 255),
      amount: parsedAmount,
      transaction_type: transactionType,
      category: category,
      subcategory: subcategory,
      allocations: [],
    };

    let { error: insertErr } = await supabaseAdmin
      .from('transactions')
      .insert(insertPayload);

    if (insertErr) {
      console.warn('Primer intento de insert falló, reintentando sin allocations:', insertErr.message);
      const { allocations, ...fallbackPayload } = insertPayload;
      const { error: fallbackErr } = await supabaseAdmin
        .from('transactions')
        .insert(fallbackPayload);

      if (fallbackErr) {
        console.error('Error insertando transacción desde Webhook:', fallbackErr);
        return res.status(500).json({
          success: false,
          error: `Error al registrar la transacción en la base de datos: ${fallbackErr.message}`,
          details: fallbackErr,
        });
      }
    }

    // ------------------------------------------------------------
    // 8. OPTIONAL TELEGRAM NOTIFICATION
    // ------------------------------------------------------------
    if (telegramChatId) {
      const formattedAmount = formatCLP(parsedAmount);
      let emoji = '🛍️';
      let typeLabel = 'Compra';
      if (transactionType === 'transferencia_enviada') {
        emoji = '↗️';
        typeLabel = 'Transferencia Enviada';
      } else if (transactionType === 'transferencia_recibida') {
        emoji = '↙️';
        typeLabel = 'Transferencia Recibida';
      }

      const telegramMessage =
        `${emoji} *${typeLabel} Detectada*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💵 *Monto:* ${formattedAmount}\n` +
        `📝 *Concepto:* ${concept}\n` +
        `💳 *Cuenta:* ${matchedAccount.name}\n` +
        `📁 *Categoría:* ${category} (${subcategory})`;

      await sendTelegramMessage(telegramChatId, telegramMessage);
    }

    // ------------------------------------------------------------
    // 9. SUCCESSFUL RESPONSE
    // ------------------------------------------------------------
    return res.status(200).json({
      success: true,
      message: 'Transacción capturada y registrada exitosamente.',
      transaction: {
        id: transactionId,
        amount: parsedAmount,
        concept: concept,
        merchant: concept,
        transactionType: transactionType,
        account: matchedAccount.name,
        category: category,
        subcategory: subcategory,
        period: period,
        date: todayDate,
      },
    });
  } catch (err: any) {
    console.error('Error inesperado en wallet-webhook:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Error interno del servidor en wallet-webhook.',
    });
  }
}
