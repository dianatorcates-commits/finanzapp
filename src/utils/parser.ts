import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Transaction, AccountType, TransactionType } from '../types';
import { autoCategorize } from './categorizer';

export interface RawParsedRow {
  date: string;
  description: string;
  amount: number;
  category?: string;
  subcategory?: string;
  transactionType?: TransactionType;
  cuotas?: { current: number; total: number };
}

/**
 * Normalizes date strings and JS Date objects to YYYY-MM-DD format.
 * Accurately supports Excel serial dates, Chilean bank text formats (DD/MM/YYYY, DD-MM-YY, YYYYMMDD, 15-SEP-2026).
 */
export function normalizeDate(dateVal: any): string {
  if (!dateVal) return new Date().toISOString().split('T')[0];

  // If JS Date object (e.g. from SheetJS cellDates: true)
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const dateStr = String(dateVal).trim();
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Excel serial number (e.g., 45535 or 45535.5)
  if (/^\d{5}(\.\d+)?$/.test(dateStr)) {
    const serial = parseFloat(dateStr);
    if (serial > 30000 && serial < 60000) {
      const utcDays = Math.floor(serial - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  const cleaned = dateStr.replace(/\./g, '/').replace(/\s+/g, ' ');

  // YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = cleaned.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YY or DD-MM-YY (e.g. 15/09/26)
  const ddmmyy = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/);
  if (ddmmyy) {
    const day = ddmmyy[1].padStart(2, '0');
    const month = ddmmyy[2].padStart(2, '0');
    const yy = parseInt(ddmmyy[3], 10);
    const year = (yy <= 50 ? 2000 + yy : 1900 + yy).toString();
    return `${year}-${month}-${day}`;
  }

  // YYYYMMDD (8 digits)
  const yyyymmddCompact = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (yyyymmddCompact) {
    return `${yyyymmddCompact[1]}-${yyyymmddCompact[2]}-${yyyymmddCompact[3]}`;
  }

  // Spanish Month Text (e.g. 15 SEP 2026 or 15-SEP-2026 or 15 DE SEPTIEMBRE DE 2026)
  const spanishMonths: Record<string, string> = {
    ene: '01', enero: '01',
    feb: '02', febrero: '02',
    mar: '03', marzo: '03',
    abr: '04', abril: '04',
    may: '05', mayo: '05',
    jun: '06', junio: '06',
    jul: '07', julio: '07',
    ago: '08', agosto: '08',
    sep: '09', sept: '09', septiembre: '09', set: '09',
    oct: '10', octubre: '10',
    nov: '11', noviembre: '11',
    dic: '12', diciembre: '12'
  };

  const textMatch = cleaned.match(/^(\d{1,2})\s*[\/-]?\s*(de\s*)?([a-z]{3,10})\s*[\/-]?\s*(de\s*)?(\d{2,4})/i);
  if (textMatch) {
    const day = textMatch[1].padStart(2, '0');
    const mStr = textMatch[3].toLowerCase();
    let year = textMatch[5];
    if (year.length === 2) {
      const yy = parseInt(year, 10);
      year = (yy <= 50 ? 2000 + yy : 1900 + yy).toString();
    }
    const month = spanishMonths[mStr] || Object.entries(spanishMonths).find(([k]) => mStr.startsWith(k))?.[1];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Fallback: Check if Date.parse works
  const parsedTs = Date.parse(cleaned);
  if (!isNaN(parsedTs)) {
    const d = new Date(parsedTs);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normalizes period strings like "2026-09", "09/2026", "09-2026", "202609", "Septiembre 2026" to YYYY-MM
 */
export function normalizePeriod(val: any): string | undefined {
  if (!val) return undefined;
  const str = String(val).trim();
  if (!str) return undefined;

  // Format YYYY-MM or YYYY/MM or YYYYMM
  let match = str.match(/^(\d{4})[\/-]?(\d{1,2})$/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    return `${year}-${month}`;
  }

  // Format MM/YYYY or MM-YYYY
  match = str.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const year = match[2];
    return `${year}-${month}`;
  }

  // Month names
  const spanishMonths: Record<string, string> = {
    ene: '01', enero: '01',
    feb: '02', febrero: '02',
    mar: '03', marzo: '03',
    abr: '04', abril: '04',
    may: '05', mayo: '05',
    jun: '06', junio: '06',
    jul: '07', julio: '07',
    ago: '08', agosto: '08',
    sep: '09', sept: '09', septiembre: '09', set: '09',
    oct: '10', octubre: '10',
    nov: '11', noviembre: '11',
    dic: '12', diciembre: '12'
  };

  const lower = str.toLowerCase();
  for (const [key, num] of Object.entries(spanishMonths)) {
    if (lower.includes(key)) {
      const yearMatch = str.match(/(\d{4})/);
      if (yearMatch) {
        return `${yearMatch[1]}-${num}`;
      }
    }
  }

  return undefined;
}

/**
 * Extracts installment info from description or string e.g. "03/12", "CUOTA 2/6", "C. 01 DE 03"
 */
export function parseInstallments(desc: string): { current: number; total: number } | undefined {
  if (!desc) return undefined;
  const match = desc.match(/(?:CUOTA|C\.|C)?\s*(\d{1,2})\s*[\/DEde]\s*(\d{1,2})/i);
  if (match) {
    const current = parseInt(match[1], 10);
    const total = parseInt(match[2], 10);
    if (current > 0 && total >= current) {
      return { current, total };
    }
  }
  return undefined;
}

/**
 * Parses numeric currency strings like "$ 100.000", "(50.000)", "-15.400", "100,000.00"
 */
export function parseAmount(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;

  let str = String(val).trim();
  const isNegative = str.includes('-') || (str.startsWith('(') && str.endsWith(')'));

  str = str.replace(/[^\d.,]/g, '');

  if (!str) return 0;

  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  }

  const num = parseFloat(str) || 0;
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Detects the index of the table header row in a 2D matrix of raw values.
 * Useful for bank statements with metadata headers in rows 1-3.
 */
export function findHeaderRowIndex(rows: any[][]): number {
  if (!rows || rows.length === 0) return 0;

  const headerKeywords = [
    'fecha', 'date', 'dia', 'f.trans', 'f.proces', 'f.operac', 'f.contab',
    'descripcion', 'descripción', 'detalle', 'glosa', 'concepto', 'merchant', 'comercio',
    'monto', 'valor', 'cargo', 'abono', 'importe', 'amount', 'debito', 'credito'
  ];

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' ');
    
    const matchCount = headerKeywords.filter(kw => rowText.includes(kw)).length;
    if (matchCount >= 2) {
      return i;
    }
  }

  return 0;
}

/**
 * Parses CSV string or File into raw transaction objects.
 */
export async function parseCSVFile(file: File, accountId: string, accountType: AccountType): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[][];
          if (!rows || rows.length === 0) {
            resolve([]);
            return;
          }

          const headerIdx = findHeaderRowIndex(rows);
          const headerRow = (rows[headerIdx] || []).map((h) => String(h || '').trim());
          const dataRows = rows.slice(headerIdx + 1);

          const rawDataObjects = dataRows.map((row) => {
            const obj: Record<string, any> = {};
            headerRow.forEach((colName, colIdx) => {
              if (colName) {
                obj[colName] = row[colIdx];
              } else {
                obj[`Col_${colIdx}`] = row[colIdx];
              }
            });
            return obj;
          });

          const transactions = mapRawRowsToTransactions(rawDataObjects, accountId, accountType);
          resolve(transactions);
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => reject(error)
    });
  });
}

/**
 * Parses Excel file (.xlsx, .xls) into raw transaction objects with multi-line header support.
 */
export async function parseExcelFile(file: File, accountId: string, accountType: AccountType): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (!rows || rows.length === 0) {
          resolve([]);
          return;
        }

        const headerIdx = findHeaderRowIndex(rows);
        const headerRow = (rows[headerIdx] || []).map((h) => String(h || '').trim());
        const dataRows = rows.slice(headerIdx + 1);

        const rawDataObjects = dataRows.map((row) => {
          const obj: Record<string, any> = {};
          headerRow.forEach((colName, colIdx) => {
            if (colName) {
              obj[colName] = row[colIdx];
            } else {
              obj[`Col_${colIdx}`] = row[colIdx];
            }
          });
          return obj;
        });

        const transactions = mapRawRowsToTransactions(rawDataObjects, accountId, accountType);
        resolve(transactions);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses raw copy-pasted text from bank statements (e.g. PDF copy paste)
 */
export function parseRawText(text: string, accountId: string, accountType: AccountType): Transaction[] {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
  const transactions: Transaction[] = [];

  let currentPeriod: string | undefined = undefined;

  lines.forEach((line, idx) => {
    // Check if line specifies period e.g. "PERIODO 2026-09"
    const periodMatch = line.match(/(?:MES|PERIODO|CICLO)[\s:-]*([a-zA-Z0-9\/-]+)/i);
    if (periodMatch) {
      const parsedPeriod = normalizePeriod(periodMatch[1]);
      if (parsedPeriod) currentPeriod = parsedPeriod;
    }

    const dateMatch = line.match(/^(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/);
    if (!dateMatch) return;

    const dateStr = normalizeDate(dateMatch[1]);
    const rest = line.replace(dateMatch[0], '').trim();

    const numberMatch = rest.match(/([-\$]?\s*[\d\.,\s]+)$/);
    if (!numberMatch) return;

    const amountStr = numberMatch[1];
    const description = rest.replace(amountStr, '').trim() || 'Movimiento Importado';

    const rawAmount = parseAmount(amountStr);
    const installments = parseInstallments(description);
    const autoCat = autoCategorize(description, rawAmount, accountType);

    let effectiveAmount = Math.abs(rawAmount);
    let originalTotalAmount: number | undefined = undefined;

    if (accountType === 'credit_card' && autoCat.transactionType === 'compra' && installments && installments.total > 1) {
      originalTotalAmount = Math.abs(rawAmount);
      effectiveAmount = Math.round(originalTotalAmount / installments.total);
    }

    // Default period to month of date if not specified
    const defaultPeriod = currentPeriod || (dateStr ? dateStr.slice(0, 7) : undefined);

    transactions.push({
      id: `tx-text-${Date.now()}-${idx}`,
      accountId,
      date: dateStr,
      period: defaultPeriod,
      description,
      rawDescription: line,
      amount: effectiveAmount,
      originalTotalAmount,
      transactionType: autoCat.transactionType,
      category: autoCat.category,
      subcategory: autoCat.subcategory,
      installments,
      allocations: []
    });
  });

  return transactions;
}

/**
 * Intelligent mapping of dynamic table headers to standardized transaction fields.
 * Supports Chilean bank terminology (Banco de Chile, Santander, BCI, Scotiabank, Falabella, BancoEstado, Itaú).
 */
function mapRawRowsToTransactions(rows: Record<string, any>[], accountId: string, accountType: AccountType): Transaction[] {
  return rows
    .map((row, idx) => {
      const keys = Object.keys(row);

      const dateKey = keys.find((k) => /fecha|date|dia|f\.?\s*trans|f\.?\s*proces|f\.?\s*docto|f\.?\s*operac|f\.?\s*contab|fecha.*transac|fecha.*operac|fecha.*mov|f\.operacion|f\.contable/i.test(k));
      const periodKey = keys.find((k) => /mes.*periodo|periodo.*mes|mes_periodo|periodo|ciclo|facturac|mes.*facturad|mes.*cobro|mes/i.test(k));
      const descKey = keys.find((k) => /descripci|detalle|glosa|concepto|merchant|comercio|lugar|movimiento|establec|nombre.*comercio|transaccion/i.test(k));
      
      const amountKey = keys.find((k) => /monto|valor|cargo|abono|importe|amount|monto.*clp|monto.*compras|debito|credito|pesos/i.test(k));
      const montoCuotaKey = keys.find((k) => /monto.*cuota|valor.*cuota|cuota.*valor|cuota.*monto|valor.*de.*cuota/i.test(k));
      const montoTotalKey = keys.find((k) => /monto.*total|valor.*total|total.*compra|monto.*contrat|total.*contrat/i.test(k));
      const cuotasKey = keys.find((k) => /^cuota$|^cuotas$|nro.*cuota|cant.*cuota|n°.*cuota|cuotas.*vig|cuota.*n°/i.test(k));

      const abonoKey = keys.find((k) => /abono|credito|ingreso|pago.*realizado|abono.*clp|monto.*abono/i.test(k));
      const cargoKey = keys.find((k) => /cargo|gasto|debito|compra|cargo.*clp|monto.*cargo/i.test(k));

      const rawDate = dateKey ? row[dateKey] : undefined;
      const description = descKey ? String(row[descKey] || '') : '';
      const rawPeriod = periodKey ? row[periodKey] : undefined;

      let amount = 0;
      let isIncomeOrPayment = false;

      if (abonoKey && row[abonoKey] !== undefined && row[abonoKey] !== null && row[abonoKey] !== '') {
        const abonoVal = parseAmount(row[abonoKey]);
        if (abonoVal !== 0) {
          amount = Math.abs(abonoVal);
          isIncomeOrPayment = true;
        }
      }

      if (!isIncomeOrPayment && cargoKey && row[cargoKey] !== undefined && row[cargoKey] !== null && row[cargoKey] !== '') {
        const cargoVal = parseAmount(row[cargoKey]);
        if (cargoVal !== 0) {
          amount = Math.abs(cargoVal);
        }
      }

      if (amount === 0 && amountKey && row[amountKey] !== undefined && row[amountKey] !== null && row[amountKey] !== '') {
        const parsed = parseAmount(row[amountKey]);
        if (parsed < 0) {
          isIncomeOrPayment = true;
          amount = Math.abs(parsed);
        } else {
          amount = parsed;
        }
      }

      if ((rawDate === undefined || rawDate === '') && !description && amount === 0) return null;

      const dateStr = normalizeDate(rawDate);
      const parsedPeriod = normalizePeriod(rawPeriod);
      // Default period to month of date if not explicitly in statement
      const period = parsedPeriod || (dateStr ? dateStr.slice(0, 7) : undefined);
      
      let installments = parseInstallments(description);
      if (!installments && cuotasKey && row[cuotasKey] !== undefined && row[cuotasKey] !== null) {
        const valCuota = String(row[cuotasKey]).trim();
        installments = parseInstallments(valCuota);
        if (!installments && !isNaN(parseInt(valCuota, 10))) {
          const tot = parseInt(valCuota, 10);
          if (tot > 1) installments = { current: 1, total: tot };
        }
      }

      const autoCat = autoCategorize(description || 'Movimiento Importado', isIncomeOrPayment ? -amount : amount, accountType);

      let effectiveAmount = amount;
      let originalTotalAmount: number | undefined = undefined;

      if (montoCuotaKey && row[montoCuotaKey]) {
        effectiveAmount = Math.abs(parseAmount(row[montoCuotaKey]));
        if (montoTotalKey && row[montoTotalKey]) {
          originalTotalAmount = Math.abs(parseAmount(row[montoTotalKey]));
        } else if (amount > effectiveAmount) {
          originalTotalAmount = amount;
        }
      } else if (installments && installments.total > 1 && !isIncomeOrPayment && accountType === 'credit_card') {
        originalTotalAmount = amount;
        effectiveAmount = Math.round(amount / installments.total);
      }

      return {
        id: `tx-imp-${Date.now()}-${idx}`,
        accountId,
        date: dateStr,
        period: period,
        description: description || 'Movimiento Importado',
        rawDescription: JSON.stringify(row),
        amount: effectiveAmount,
        originalTotalAmount,
        transactionType: isIncomeOrPayment
          ? accountType === 'credit_card'
            ? 'pago_tc'
            : 'ingreso_venta'
          : autoCat.transactionType,
        category: autoCat.category,
        subcategory: autoCat.subcategory,
        installments,
        allocations: []
      } as Transaction;
    })
    .filter((t): t is Transaction => t !== null);
}
