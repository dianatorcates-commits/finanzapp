import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURATION & SUPABASE ADMIN CLIENT (SERVICE ROLE)
// ============================================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
// TELEGRAM MESSAGING UTILS
// ============================================================
async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  parseMode: 'Markdown' | 'HTML' = 'Markdown'
) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN no configurado en variables de entorno.');
    return;
  }

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
      const errBody = await res.text();
      console.warn('Fallo envío Telegram con Markdown, reintentando como texto plano:', errBody);
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
// DETERMINISTIC HELPERS (NO IA, NO FUZZY NLP)
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

// Amount parser supporting Chilean formats ($14.000, 14000, 14.500.000, 1500,50)
function parseAmount(val?: string): number {
  if (!val) return NaN;
  let cleaned = val.replace(/[$€£\s]/g, '');

  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Ej: 14.500,50
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    // Si contiene puntos y segmentos de 3 digitos, tratar como separador de miles
    const parts = cleaned.split('.');
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) {
      cleaned = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 3) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(/,/g, '.');
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

// Date parser supporting 'Hoy', YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
function parseUserDate(val?: string): string | null {
  if (!val || normalizeText(val) === 'hoy') {
    return getChileCurrentDate();
  }
  const str = val.trim();

  // Formato YYYY-MM-DD o YYYY/MM/DD
  const ymd = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const m = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) {
    const d = parseInt(dmy[1], 10);
    const m = parseInt(dmy[2], 10);
    const y = parseInt(dmy[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

// Transaction Type mapping
function mapTransactionType(tipo?: string): string {
  if (!tipo) return 'compra';
  const clean = normalizeText(tipo);

  if (clean.includes('pago') || clean.includes('tc') || clean.includes('tarjeta')) {
    return 'pago_tc';
  }
  if (clean.includes('transferencia recibida') || clean.includes('transferencia_recibida')) {
    return 'transferencia_recibida';
  }
  if (clean.includes('transferencia') || clean.includes('transferencia enviada')) {
    return 'transferencia_enviada';
  }
  if (clean.includes('ingreso') || clean.includes('sueldo') || clean.includes('salario') || clean.includes('venta') || clean.includes('abono')) {
    return 'ingreso_venta';
  }
  if (clean.includes('comision') || clean.includes('interes')) {
    return 'comision_interes';
  }
  if (clean.includes('otro')) {
    return 'otro';
  }
  return 'compra';
}

// Parse structured line-by-line key: value message
interface ParsedTemplate {
  tipo?: string;
  cuenta?: string;
  monto?: string;
  categoria?: string;
  subcategoria?: string;
  descripcion?: string;
  fecha?: string;
}

function parseTemplateLines(text: string): ParsedTemplate {
  const result: ParsedTemplate = {};
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^\s*([^:=]+?)\s*[:=]\s*(.*)$/);
    if (!match) continue;

    const key = normalizeText(match[1]);
    const val = match[2].trim();
    if (!val) continue;

    if (key === 'tipo') {
      result.tipo = val;
    } else if (key === 'cuenta') {
      result.cuenta = val;
    } else if (key === 'monto' || key === 'valor' || key === 'importe' || key === 'precio') {
      result.monto = val;
    } else if (key === 'categoria' || key === 'categoria general') {
      result.categoria = val;
    } else if (key === 'subcategoria' || key === 'sub-categoria' || key === 'sub categoria') {
      result.subcategoria = val;
    } else if (key === 'descripcion' || key === 'detalle' || key === 'glosa' || key === 'comercio') {
      result.descripcion = val;
    } else if (key === 'fecha') {
      result.fecha = val;
    }
  }

  return result;
}

// Match account from user active accounts deterministically
function findUserAccount(accounts: any[], inputName: string) {
  if (!inputName || !accounts || accounts.length === 0) return null;
  const targetNorm = normalizeText(inputName);

  // 1. Coincidencia exacta insensible a mayúsculas y acentos
  const exact = accounts.find((a) => normalizeText(a.name) === targetNorm);
  if (exact) return exact;

  // 2. Coincidencia por inclusión de subcadena (ej. "Scotiabank" con "Corriente Scotiabank")
  const partial = accounts.find((a) => {
    const aNorm = normalizeText(a.name);
    return aNorm.includes(targetNorm) || targetNorm.includes(aNorm);
  });
  if (partial) return partial;

  return null;
}

// Resolve category & subcategory against user category mappings
function resolveCategories(
  categoryMappings: any[],
  inputCat?: string,
  inputSub?: string
): { category: string; subcategory: string } {
  const normCat = normalizeText(inputCat || '');
  const normSub = normalizeText(inputSub || '');

  // 1. Si el usuario ingresó ambas
  if (normCat && normSub) {
    const matchedCategory = categoryMappings.find((c) => normalizeText(c.name).includes(normCat));
    if (matchedCategory) {
      const matchedSub = (matchedCategory.subcategories || []).find((s: string) =>
        normalizeText(s).includes(normSub)
      );
      return {
        category: matchedCategory.name,
        subcategory: matchedSub || inputSub!.trim(),
      };
    }
  }

  // 2. Si sólo ingresó subcategoría, buscar a qué categoría general pertenece
  if (normSub) {
    for (const c of categoryMappings) {
      const matchedSub = (c.subcategories || []).find((s: string) =>
        normalizeText(s).includes(normSub)
      );
      if (matchedSub) {
        return {
          category: c.name,
          subcategory: matchedSub,
        };
      }
    }
  }

  // 3. Si sólo ingresó categoría general
  if (normCat) {
    const matchedCategory = categoryMappings.find((c) => normalizeText(c.name).includes(normCat));
    if (matchedCategory) {
      const firstSub = (matchedCategory.subcategories && matchedCategory.subcategories[0]) || 'General';
      return {
        category: matchedCategory.name,
        subcategory: firstSub,
      };
    }
  }

  // 4. Si ingresó valores directos pero no estaban en el catálogo
  if (inputCat && inputSub) {
    return { category: inputCat.trim(), subcategory: inputSub.trim() };
  }
  if (inputCat) {
    return { category: inputCat.trim(), subcategory: 'General' };
  }
  if (inputSub) {
    return { category: 'Otros Gastos', subcategory: inputSub.trim() };
  }

  // 5. Fallback por defecto
  return { category: 'Otros Gastos', subcategory: 'Varios' };
}

// ============================================================
// MAIN VERCEL SERVERLESS HANDLER
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Respuesta rápida de verificación para peticiones GET o health check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'FinanzApp Telegram Webhook Handler',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = body?.message;

    // Si no es un mensaje con texto (ej. stickers, fotos, eventos del sistema), responder OK inmediatamente
    if (!message || !message.text) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const chatId = message.chat.id;
    const fromUser = message.from;
    const rawText = message.text.trim();

    // Extraer comando básico (insensible a mayúsculas y permitiendo @NombreDelBot)
    const firstWord = rawText.split(/\s+/)[0].toLowerCase();
    const command = firstWord.split('@')[0];

    const supabaseAdmin = getSupabaseAdmin();

    // ------------------------------------------------------------
    // A. MANEJO DEL HANDSHAKE (/start o /start <token>)
    // ------------------------------------------------------------
    if (command === '/start') {
      const parts = rawText.split(/\s+/);
      const token = parts.length > 1 ? parts[1].trim() : null;

      if (token) {
        // Buscar el token en telegram_profiles
        const { data: profile, error: fetchErr } = await supabaseAdmin
          .from('telegram_profiles')
          .select('*')
          .eq('link_token', token)
          .maybeSingle();

        if (fetchErr || !profile) {
          await sendTelegramMessage(
            chatId,
            `❌ *Código de vinculación inválido o no encontrado*\n\n` +
            `El enlace utilizado no existe o ya fue usado.\n\n` +
            `Por favor, ve a *FinanzApp Web* y genera un nuevo enlace desde la sección *'Integración con Telegram'*.`
          );
          return res.status(200).json({ ok: true });
        }

        // Verificar expiración (15 minutos)
        if (profile.token_expires_at && new Date(profile.token_expires_at).getTime() < Date.now()) {
          await sendTelegramMessage(
            chatId,
            `⏳ *Código de vinculación expirado*\n\n` +
            `El enlace superó los 15 minutos de vigencia.\n\n` +
            `Por favor genera un nuevo enlace desde *FinanzApp Web*.`
          );
          return res.status(200).json({ ok: true });
        }

        // Actualizar registro: guardar chat_id, first_name, username y limpiar link_token
        const { error: updateErr } = await supabaseAdmin
          .from('telegram_profiles')
          .update({
            telegram_chat_id: chatId,
            first_name: fromUser?.first_name || null,
            username: fromUser?.username || null,
            link_token: null,
            token_expires_at: null,
          })
          .eq('id', profile.id);

        if (updateErr) {
          console.error('Error actualizando telegram_profiles en handshake:', updateErr);
          await sendTelegramMessage(chatId, '❌ Ocurrió un error al vincular tu cuenta. Intenta de nuevo desde FinanzApp Web.');
          return res.status(200).json({ ok: true });
        }

        // Mensaje de éxito de vinculación
        const userName = fromUser?.first_name || 'Usuario';
        await sendTelegramMessage(
          chatId,
          `🎉 *¡Cuenta Vinculada Exitosamente!*\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `Hola *${userName}*, tu cuenta de FinanzApp ha sido conectada a este chat.\n\n` +
          `Ahora puedes registrar tus movimientos enviando la siguiente plantilla:\n\n` +
          `\`Tipo: Compra\n` +
          `Cuenta: Corriente Scotiabank\n` +
          `Monto: 14000\n` +
          `Categoria: Alimentación & Gastronomía\n` +
          `Subcategoria: Supermercado\n` +
          `Descripcion: Compras en el Jumbo\n` +
          `Fecha: Hoy\`\n\n` +
          `📋 *Comandos Rápidos:*\n` +
          `• /plantilla - Copiar plantilla en blanco\n` +
          `• /cuentas - Ver tus cuentas activas\n` +
          `• /categorias - Ver tus categorías disponibles\n` +
          `• /ayuda - Ver instrucciones completas`
        );
        return res.status(200).json({ ok: true });
      }

      // Si sólo envió /start sin token, verificar si ya está vinculado
      const { data: existingProfile } = await supabaseAdmin
        .from('telegram_profiles')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .maybeSingle();

      if (existingProfile) {
        await sendTelegramMessage(
          chatId,
          `👋 *¡Hola de nuevo!*\n\n` +
          `Tu cuenta ya está vinculada a FinanzApp.\n\n` +
          `Puedes registrar un gasto enviando la plantilla o usar los comandos:\n` +
          `• /plantilla - Copiar plantilla para rellenar\n` +
          `• /cuentas - Ver tus cuentas activas\n` +
          `• /categorias - Ver tus categorías\n` +
          `• /ayuda - Ver ejemplos de uso`
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `👋 *¡Bienvenido al Bot de FinanzApp!*\n\n` +
          `Para registrar tus gastos por Telegram, primero debes vincular este chat con tu cuenta:\n\n` +
          `1️⃣ Inicia sesión en *FinanzApp Web*.\n` +
          `2️⃣ Abre la sección *'Integración con Telegram'* en la barra superior.\n` +
          `3️⃣ Presiona *'Vincular Telegram'* para abrir este bot con tu enlace de acceso seguro.`
        );
      }
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------------
    // B. VERIFICAR QUE EL REMITENTE ESTÉ VINCULADO
    // ------------------------------------------------------------
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('telegram_profiles')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .maybeSingle();

    if (profErr || !profile || !profile.user_id) {
      await sendTelegramMessage(
        chatId,
        `⚠️ *Telegram No Vinculado*\n\n` +
        `Tu usuario de Telegram no está vinculado a ninguna cuenta en FinanzApp.\n\n` +
        `Para comenzar, ingresa a la aplicación web de FinanzApp y presiona *'Vincular Telegram'*.`
      );
      return res.status(200).json({ ok: true });
    }

    const userId = profile.user_id;

    // ------------------------------------------------------------
    // C. MANEJO DE COMANDOS RÁPIDOS
    // ------------------------------------------------------------

    // 1. /plantilla
    if (command === '/plantilla') {
      await sendTelegramMessage(
        chatId,
        `📋 *Plantilla de Registro de Movimiento*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `Copia el siguiente mensaje, rellénalo y envíalo:\n\n` +
        `\`Tipo: Compra\n` +
        `Cuenta: \n` +
        `Monto: \n` +
        `Categoria: \n` +
        `Subcategoria: \n` +
        `Descripcion: \n` +
        `Fecha: Hoy\`\n\n` +
        `💡 _Usa /cuentas para ver los nombres exactos de tus cuentas y /categorias para tus categorías._`
      );
      return res.status(200).json({ ok: true });
    }

    // 2. /cuentas
    if (command === '/cuentas') {
      const { data: accounts, error: accErr } = await supabaseAdmin
        .from('accounts')
        .select('name, bank, type')
        .eq('user_id', userId)
        .order('name');

      if (accErr || !accounts || accounts.length === 0) {
        await sendTelegramMessage(
          chatId,
          `💳 *No tienes cuentas activas registradas.*\n\n` +
          `Ingresa a FinanzApp Web y crea tus cuentas bancarias o tarjetas de crédito para poder utilizarlas aquí.`
        );
        return res.status(200).json({ ok: true });
      }

      const typeLabels: Record<string, string> = {
        credit_card: 'Tarjeta de Crédito',
        checking: 'Cuenta Corriente',
        sight: 'Cuenta Vista / RUT',
        savings: 'Cuenta de Ahorro',
      };

      const accountListText = accounts
        .map((a) => {
          const tLabel = typeLabels[a.type] || a.type;
          return `• *${a.name}* (${a.bank || 'Banco'}) - _${tLabel}_`;
        })
        .join('\n');

      await sendTelegramMessage(
        chatId,
        `💳 *Tus Cuentas Activas en FinanzApp:*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${accountListText}\n\n` +
        `💡 _Copia el nombre exacto de la cuenta en el campo 'Cuenta:' de la plantilla._`
      );
      return res.status(200).json({ ok: true });
    }

    // 3. /categorias
    if (command === '/categorias') {
      const { data: mappings, error: mapErr } = await supabaseAdmin
        .from('category_mappings')
        .select('name, subcategories')
        .eq('user_id', userId)
        .order('name');

      if (mapErr || !mappings || mappings.length === 0) {
        await sendTelegramMessage(
          chatId,
          `📁 *No se encontraron categorías configuradas.*\n\n` +
          `Puedes agregar categorías personalizadas desde el gestor de categorías en FinanzApp Web.`
        );
        return res.status(200).json({ ok: true });
      }

      const catListText = mappings
        .map((m) => {
          const subs = Array.isArray(m.subcategories) && m.subcategories.length > 0
            ? m.subcategories.join(', ')
            : 'General';
          return `• *${m.name}*:\n  ↳ ${subs}`;
        })
        .join('\n\n');

      await sendTelegramMessage(
        chatId,
        `📁 *Tus Categorías y Subcategorías:*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${catListText}\n\n` +
        `💡 _Usa estos nombres en 'Categoria:' y 'Subcategoria:' de tu plantilla._`
      );
      return res.status(200).json({ ok: true });
    }

    // 4. /ayuda
    if (command === '/ayuda') {
      await sendTelegramMessage(
        chatId,
        `ℹ️ *Guía de Uso del Bot de FinanzApp*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `Este bot te permite registrar transacciones en FinanzApp de manera directa enviando una plantilla de texto estructurada.\n\n` +
        `📌 *Campos de la Plantilla:*\n` +
        `• *Tipo:* Compra, Pago TC, Transferencia, Ingreso, etc. (Por defecto: Compra)\n` +
        `• *Cuenta:* Nombre exacto de tu cuenta (usa /cuentas para verlas)\n` +
        `• *Monto:* Valor numérico (ej. 14000 o 14.000)\n` +
        `• *Categoria:* Categoría general (usa /categorias)\n` +
        `• *Subcategoria:* Subcategoría específica\n` +
        `• *Descripcion:* Glosa o comercio (ej. Compras en el Jumbo)\n` +
        `• *Fecha:* 'Hoy' o formato YYYY-MM-DD (Opcional, por defecto hoy)\n\n` +
        `🤖 *Comandos Útiles:*\n` +
        `/plantilla - Copiar plantilla en blanco\n` +
        `/cuentas - Listar tus cuentas activas\n` +
        `/categorias - Listar categorías y subcategorías\n` +
        `/ayuda - Ver esta explicación`
      );
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------------
    // D. PARSEO DETERMINÍSTICO DE LA PLANTILLA ESTRUCTURADA (SIN IA)
    // ------------------------------------------------------------
    const parsed = parseTemplateLines(rawText);

    // Si el mensaje no contiene 'cuenta' ni 'monto', no es un intento de plantilla
    if (!parsed.cuenta && !parsed.monto) {
      await sendTelegramMessage(
        chatId,
        `❓ *No reconocí el formato del mensaje*\n\n` +
        `Para registrar un movimiento, envía la plantilla estructurada o usa el comando /plantilla para copiarla.\n\n` +
        `Escribe /ayuda para ver ejemplos y comandos.`
      );
      return res.status(200).json({ ok: true });
    }

    // VALIDACIÓN 1: Cuenta
    if (!parsed.cuenta) {
      await sendTelegramMessage(
        chatId,
        `❌ *Falta el campo 'Cuenta'* en la plantilla.\n\n` +
        `Por favor especifica en qué cuenta o tarjeta se realizó el movimiento. Usa /cuentas para ver tus cuentas activas.`
      );
      return res.status(200).json({ ok: true });
    }

    // Consultar cuentas activas del usuario
    const { data: userAccounts } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('user_id', userId);

    if (!userAccounts || userAccounts.length === 0) {
      await sendTelegramMessage(
        chatId,
        `❌ *No tienes cuentas activas registradas en FinanzApp.*\n\n` +
        `Por favor ingresa a la aplicación web y crea una cuenta antes de registrar movimientos.`
      );
      return res.status(200).json({ ok: true });
    }

    const matchedAccount = findUserAccount(userAccounts, parsed.cuenta);
    if (!matchedAccount) {
      await sendTelegramMessage(
        chatId,
        `❌ La cuenta '${parsed.cuenta}' no fue encontrada en tus cuentas activas. Usa /cuentas para verlas.`
      );
      return res.status(200).json({ ok: true });
    }

    // VALIDACIÓN 2: Monto
    if (!parsed.monto) {
      await sendTelegramMessage(
        chatId,
        `❌ *Falta el campo 'Monto'* en la plantilla.\n\n` +
        `El monto debe ser un número válido mayor a 0 (ej: 14000 o 14.000).`
      );
      return res.status(200).json({ ok: true });
    }

    const parsedAmount = parseAmount(parsed.monto);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await sendTelegramMessage(
        chatId,
        `❌ El monto debe ser un número válido mayor a 0 (ej: 14000 o 14.000).`
      );
      return res.status(200).json({ ok: true });
    }

    // VALIDACIÓN 3: Fecha
    const parsedDate = parseUserDate(parsed.fecha);
    if (!parsedDate) {
      await sendTelegramMessage(
        chatId,
        `❌ La fecha ingresada no es válida. Usa formato YYYY-MM-DD o 'Hoy'.`
      );
      return res.status(200).json({ ok: true });
    }

    // Categoría & Subcategoría
    const { data: userCategories } = await supabaseAdmin
      .from('category_mappings')
      .select('*')
      .eq('user_id', userId);

    const { category, subcategory } = resolveCategories(
      userCategories || [],
      parsed.categoria,
      parsed.subcategoria
    );

    // Tipo de transacción
    const txType = mapTransactionType(parsed.tipo);

    // Descripción / Detalle
    const description = parsed.descripcion?.trim() || subcategory || 'Movimiento Telegram';

    // ------------------------------------------------------------
    // E. INSERCIÓN EN LA BASE DE DATOS (TABLA TRANSACTIONS)
    // ------------------------------------------------------------
    const newTransactionId = crypto.randomUUID();
    const period = parsedDate.substring(0, 7); // YYYY-MM

    const insertPayload = {
      id: newTransactionId,
      user_id: userId,
      account_id: matchedAccount.id,
      date: parsedDate,
      period: period,
      description: description,
      raw_description: description,
      amount: parsedAmount,
      transaction_type: txType,
      category: category,
      subcategory: subcategory,
      allocations: [],
    };

    const { error: insertErr } = await supabaseAdmin
      .from('transactions')
      .insert(insertPayload);

    if (insertErr) {
      console.error('Error insertando transacción en Supabase:', insertErr);
      await sendTelegramMessage(
        chatId,
        `❌ Ocurrió un error al guardar el movimiento en la base de datos. Por favor intenta nuevamente.`
      );
      return res.status(200).json({ ok: true });
    }

    // ------------------------------------------------------------
    // F. RESPUESTA DE ÉXITO AL USUARIO EN TELEGRAM
    // ------------------------------------------------------------
    const [y, m, d] = parsedDate.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    const formattedAmount = '$' + new Intl.NumberFormat('es-CL').format(parsedAmount);

    const successMessage =
      `✅ *Movimiento Registrado Exitosamente*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Monto:* ${formattedAmount}\n` +
      `💳 *Cuenta:* ${matchedAccount.name}\n` +
      `📁 *Categoría:* ${category} ➔ ${subcategory}\n` +
      `📝 *Detalle:* ${description}\n` +
      `📅 *Fecha:* ${formattedDate}`;

    await sendTelegramMessage(chatId, successMessage);
    return res.status(200).json({ ok: true, transactionId: newTransactionId });

  } catch (err: any) {
    console.error('Error no controlado en telegram-webhook:', err);
    // Siempre responder 200 a Telegram para evitar bucles de reintentos
    return res.status(200).json({ ok: false, error: err?.message || 'Error interno' });
  }
}
