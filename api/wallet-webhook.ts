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

/**
 * Extract merchant or store name from notification text and title.
 */
function extractMerchant(text: string, title?: string): string {
  if (!text) return title && !normalizeText(title).includes('wallet') ? title.trim() : 'Compra con Wallet';

  // Pattern 1: "... en <Comercio> con/por/tu/el..."
  // Ex: "Compra aprobada por $14.500 en Jumbo con tu tarjeta..."
  // Ex: "Pagaste $14.500 en Starbucks con Google Pay"
  const matchEn = text.match(/\ben\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_&'"]+?)(?:\s+(?:con|por|el|la|tu|fecha|usando|mediante|para)|\.|\,|$|\n)/i);
  if (matchEn && matchEn[1]) {
    const candidate = cleanMerchantString(matchEn[1]);
    if (candidate && candidate.length >= 2 && candidate.length <= 60) {
      return candidate;
    }
  }

  // Pattern 2: "Compra en <Comercio> aprobada..."
  const matchCompraEn = text.match(/\bcompra en\s+([A-Za-z0-9\sáéíóúÁÉÍÓÚñÑ\.\-_&'"]+?)(?:\s+(?:aprobada|por|con)|\.|\,|$|\n)/i);
  if (matchCompraEn && matchCompraEn[1]) {
    const candidate = cleanMerchantString(matchCompraEn[1]);
    if (candidate && candidate.length >= 2 && candidate.length <= 60) {
      return candidate;
    }
  }

  // Pattern 3: If title has a store name (e.g. "Jumbo", "Starbucks", "Uber")
  if (title) {
    const cleanTitle = cleanMerchantString(title);
    const norm = normalizeText(cleanTitle);
    if (
      norm &&
      !norm.includes('google') &&
      !norm.includes('wallet') &&
      !norm.includes('pay') &&
      !norm.includes('banco') &&
      !norm.includes('santander') &&
      !norm.includes('bci') &&
      !norm.includes('falabella') &&
      !norm.includes('notificacion')
    ) {
      return cleanTitle;
    }
  }

  return 'Compra con Wallet';
}

function cleanMerchantString(str: string): string {
  let cleaned = (str || '').trim();
  // Remove common trailing words
  cleaned = cleaned.replace(/\s+(?:con|por|de|en|tu|su|tarjeta|tc|google|pay).*$/i, '');
  // Remove special symbols at start or end
  cleaned = cleaned.replace(/^[\s\.\-_,:;'"#]+|[\s\.\-_,:;'"#]+$/g, '');
  return cleaned;
}

/**
 * Find matching user account based on card numbers (last 4 digits), bank name, or account name.
 */
function findMatchingAccount(accounts: any[], text: string, title?: string) {
  if (!accounts || accounts.length === 0) return null;
  const combined = `${title || ''} ${text || ''}`.toLowerCase();

  // 1. Match by last 4 digits of card (e.g. "terminada en 4892", "*4892", "4892")
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

  // 2. Match by bank name
  const matchedByBank = accounts.find((a) => {
    if (!a.bank) return false;
    const bNorm = normalizeText(a.bank);
    return bNorm.length >= 3 && normalizeText(combined).includes(bNorm);
  });
  if (matchedByBank) return matchedByBank;

  // 3. Match by account name inclusion
  const matchedByName = accounts.find((a) => {
    if (!a.name) return false;
    const nNorm = normalizeText(a.name);
    return nNorm.length >= 3 && normalizeText(combined).includes(nNorm);
  });
  if (matchedByName) return matchedByName;

  // 4. Fallback: First credit card account, or first account
  const creditCardAcc = accounts.find((a) => a.type === 'credit_card');
  return creditCardAcc || accounts[0];
}

/**
 * Intelligent categorization based on user rules or default Chilean commerce keywords.
 */
function autoCategorizePurchase(
  merchant: string,
  fullText: string,
  userRules: any[]
): { category: string; subcategory: string } {
  const normMerchant = normalizeText(merchant);
  const normText = normalizeText(fullText);

  // 1. Check user defined auto rules
  if (userRules && userRules.length > 0) {
    for (const rule of userRules) {
      const keyword = normalizeText(rule.keyword || '');
      if (keyword && (normMerchant.includes(keyword) || normText.includes(keyword))) {
        return {
          category: rule.category_name || rule.categoryName || 'Compras y Estilo de Vida',
          subcategory: rule.subcategory_name || rule.subcategoryName || 'Varios',
        };
      }
    }
  }

  // 2. Default Chilean Commerce Taxonomies
  // Supermercados & Almacenes
  if (/jumbo|lider|tottus|santa isabel|unimarc|alvi|erbi|mayorista|acuenta|oxxo|spacio 1|pronto|liquimax/i.test(normMerchant)) {
    return { category: 'Alimentación y Gastronomía', subcategory: 'Supermercados' };
  }

  // Restaurantes & Delivery
  if (/uber eats|pedidosya|rappi|starbucks|mcdonald|burger|dunkin|kfc|pizza|sushi|restaurant|cafe|bar|bavaria|wendy|papa john/i.test(normMerchant)) {
    return { category: 'Alimentación y Gastronomía', subcategory: 'Restaurantes y Bares' };
  }

  // Combustible & Transporte
  if (/copec|shell|petrobras|enex|uber|cabify|didi|metro|bip|autopista|costanera|vespucio|estacionamiento/i.test(normMerchant)) {
    return { category: 'Transporte y Movilidad', subcategory: 'Combustible y Peajes' };
  }

  // Farmacias & Salud
  if (/cruz verde|salcobrand|ahumada|farmacia|redsalud|integramedica|banmedica|clinica|dental|optica/i.test(normMerchant)) {
    return { category: 'Salud y Bienestar', subcategory: 'Farmacia y Medicamentos' };
  }

  // Streaming & Apps
  if (/spotify|netflix|disney|apple|google|prime|youtube|steam|playstation|crunchyroll|openai|chatgpt/i.test(normMerchant)) {
    return { category: 'Suscripciones y Servicios', subcategory: 'Streaming y Apps' };
  }

  // Retail & Tiendas
  if (/falabella|ripley|paris|zara|h&m|decathlon|sodimac|easy|ikea|mercadolibre|amazon|aliexpress|shein/i.test(normMerchant)) {
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

    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        rawText = parsed.text || parsed.message || parsed.body || parsed.content || '';
        rawTitle = parsed.title || parsed.app || parsed.sender || '';
      } catch {
        rawText = req.body;
      }
    } else if (req.body && typeof req.body === 'object') {
      rawText = req.body.text || req.body.message || req.body.body || req.body.content || '';
      rawTitle = req.body.title || req.body.app || req.body.sender || '';
    }

    if (!rawText && !rawTitle) {
      return res.status(400).json({
        success: false,
        error: 'Cuerpo de notificación vacío. Se requiere el campo "text" con el contenido de la compra.',
      });
    }

    // ------------------------------------------------------------
    // 4. EXTRACT AMOUNT & MERCHANT
    // ------------------------------------------------------------
    const fullContent = `${rawTitle ? rawTitle + ': ' : ''}${rawText}`;
    const parsedAmount = extractAmount(fullContent);

    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo identificar el monto de la compra en la notificación. Verifica el formato del texto.',
        receivedText: fullContent,
      });
    }

    const merchant = extractMerchant(rawText, rawTitle);

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

    const matchedAccount = findMatchingAccount(userAccounts, rawText, rawTitle);
    if (!matchedAccount) {
      return res.status(400).json({
        success: false,
        error: 'No se pudo asociar la compra a ninguna cuenta bancaria del usuario.',
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
      merchant,
      fullContent,
      userRules || []
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
      .eq('description', merchant)
      .gte('created_at', thirtyMinutesAgo)
      .limit(1);

    if (existingDuplicate && existingDuplicate.length > 0) {
      console.log('Transacción idéntica ya registrada recientemente, ignorando reintento duplicado:', existingDuplicate[0]);
      return res.status(200).json({
        success: true,
        duplicated: true,
        message: `Transacción ya registrada previamente: ${merchant} por ${formatCLP(parsedAmount)}`,
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
      description: merchant,
      raw_description: rawText.substring(0, 255),
      amount: parsedAmount,
      transaction_type: 'compra',
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
      const telegramMessage =
        `📲 *Compra con Wallet Detectada*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💵 *Monto:* ${formattedAmount}\n` +
        `🏪 *Comercio:* ${merchant}\n` +
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
        merchant: merchant,
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
