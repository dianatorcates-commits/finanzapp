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
 * Normalizes date strings like DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY to YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const cleaned = dateStr.trim().replace(/\./g, '/');

  // Regex DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // Regex YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = cleaned.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
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
 * Parses CSV string or File into raw transaction objects.
 */
export async function parseCSVFile(file: File, accountId: string, accountType: AccountType): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as Record<string, any>[];
          const transactions = mapRawRowsToTransactions(rawData, accountId, accountType);
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
 * Parses Excel file (.xlsx, .xls) into raw transaction objects.
 */
export async function parseExcelFile(file: File, accountId: string, accountType: AccountType): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        const transactions = mapRawRowsToTransactions(rawData, accountId, accountType);
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

    transactions.push({
      id: `tx-text-${Date.now()}-${idx}`,
      accountId,
      date: dateStr,
      period: currentPeriod,
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
 */
function mapRawRowsToTransactions(rows: Record<string, any>[], accountId: string, accountType: AccountType): Transaction[] {
  return rows
    .map((row, idx) => {
      const keys = Object.keys(row);

      const dateKey = keys.find((k) => /fecha|date|dia/i.test(k));
      const periodKey = keys.find((k) => /mes.*periodo|periodo.*mes|mes_periodo|periodo|ciclo|facturac/i.test(k));
      const descKey = keys.find((k) => /descripci|detalle|glosa|concepto|merchant/i.test(k));
      
      const amountKey = keys.find((k) => /monto|valor|cargo|importe|amount/i.test(k));
      const montoCuotaKey = keys.find((k) => /monto.*cuota|valor.*cuota|cuota.*valor|cuota.*monto/i.test(k));
      const montoTotalKey = keys.find((k) => /monto.*total|valor.*total|total.*compra|monto.*contrat/i.test(k));
      const cuotasKey = keys.find((k) => /^cuota$|^cuotas$|nro.*cuota|cant.*cuota/i.test(k));

      const abonoKey = keys.find((k) => /abono|credito|ingreso/i.test(k));
      const cargoKey = keys.find((k) => /cargo|gasto|debito/i.test(k));

      const rawDate = dateKey ? String(row[dateKey]) : '';
      const description = descKey ? String(row[descKey]) : 'Movimiento Sin Nombre';
      const rawPeriod = periodKey ? row[periodKey] : undefined;

      let amount = 0;
      let isIncomeOrPayment = false;

      if (abonoKey && row[abonoKey]) {
        const abonoVal = parseAmount(row[abonoKey]);
        if (abonoVal !== 0) {
          amount = Math.abs(abonoVal);
          isIncomeOrPayment = true;
        }
      }

      if (!isIncomeOrPayment && cargoKey && row[cargoKey]) {
        const cargoVal = parseAmount(row[cargoKey]);
        if (cargoVal !== 0) {
          amount = Math.abs(cargoVal);
        }
      }

      if (amount === 0 && amountKey && row[amountKey]) {
        const parsed = parseAmount(row[amountKey]);
        if (parsed < 0) {
          isIncomeOrPayment = true;
          amount = Math.abs(parsed);
        } else {
          amount = parsed;
        }
      }

      if (!rawDate && !description && amount === 0) return null;

      const dateStr = normalizeDate(rawDate);
      const period = normalizePeriod(rawPeriod);
      
      let installments = parseInstallments(description);
      if (!installments && cuotasKey && row[cuotasKey]) {
        const valCuota = String(row[cuotasKey]).trim();
        installments = parseInstallments(valCuota);
        if (!installments && !isNaN(parseInt(valCuota, 10))) {
          const tot = parseInt(valCuota, 10);
          if (tot > 1) installments = { current: 1, total: tot };
        }
      }

      const autoCat = autoCategorize(description, isIncomeOrPayment ? -amount : amount, accountType);

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
        period: period || undefined,
        description,
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
