export type AccountType = 'credit_card' | 'checking' | 'savings' | 'sight' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bank: string;
  accountNumber?: string;
  currency: string;
  creditLimit?: number;
  initialBalance?: number;
  color?: string;
  closingDay?: number; // 1-31 (Día de corte de facturación mensual)
  dueDay?: number;     // 1-31 (Día límite de pago o vencimiento mensual)
}

export type TransactionType =
  | 'compra'
  | 'pago_tc'
  | 'transferencia_enviada'
  | 'transferencia_recibida'
  | 'ingreso_venta'
  | 'comision_interes'
  | 'otro';

export interface CategoryMapping {
  id: string;
  name: string; // Categoría General (e.g. "Abonos y Pagos", "Alimentación y Gastronomía")
  subcategories: string[]; // Subcategorías asociadas
}

export interface PaymentAllocation {
  id: string;
  paymentTransactionId: string;
  amount: number;
  allocatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  period?: string; // YYYY-MM
  description: string;
  rawDescription: string;
  amount: number; // Monto de la cuota facturada o total
  originalTotalAmount?: number; // Total contratado si es cuotas
  transactionType: TransactionType;
  category: string; // Categoría General (e.g. "Abonos y Pagos")
  subcategory: string; // Subcategoría Específica (e.g. "Pago Tarjeta", "Abono de Tarjeta")
  installments?: {
    current: number;
    total: number;
  };
  allocations: PaymentAllocation[];
  notes?: string;
}

export interface ComputedTransaction extends Transaction {
  totalAllocated: number;
  netAmount: number;
  isFullyPaid: boolean;
  unallocatedPaymentBalance?: number;
}

export interface FilterState {
  month: string; // YYYY-MM or 'ALL'
  accountId: string; // Account ID or 'ALL'
  accountType: string; // AccountType or 'ALL'
  transactionType: string; // TransactionType or 'ALL'
  categories: string[]; // Selected general categories (empty array = ALL)
  subcategories: string[]; // Selected subcategories (empty array = ALL)
  searchQuery: string;
  onlyPendingTC: boolean;
}

export interface AutoCategoryRule {
  id: string;
  pattern: string; // e.g. "JUMBO", "UBER", "NETFLIX"
  category: string; // General Category name
  subcategory: string; // Subcategory name
}

export interface CategoryBudget {
  id: string;
  categoryName: string; // General Category or Subcategory
  monthlyLimit: number; // Limit in CLP
}

export interface TelegramProfile {
  id: string;
  user_id: string;
  telegram_chat_id?: number | string | null;
  first_name?: string | null;
  username?: string | null;
  link_token?: string | null;
  token_expires_at?: string | null;
  webhook_token?: string | null;
  created_at?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  categoryIcon?: string;
}

export type CreditType = 'hipotecario' | 'consumo' | 'avance_tc' | 'cuotas_tc' | 'automotriz' | 'otro';

export interface Credit {
  id: string;
  name: string;
  type: CreditType;
  bank: string;
  totalAmount: number;          // Monto total inicial de la deuda/préstamo
  totalInstallments: number;    // Cuotas totales (ej: 36, 240, 12)
  paidInstallments: number;     // Cuotas pagadas hasta ahora (ej: 14)
  installmentAmount: number;    // Valor de la cuota total cobrada por el banco
  isShared?: boolean;           // Si el crédito se comparte con alguien más (ej: hermano/pareja)
  mySharePercentage?: number;   // Porcentaje del usuario (ej: 50%)
  myShareAmount: number;        // Monto real mensual que paga este usuario (ej: $120.000)
  paymentDay?: number;          // Día del mes en que vence o se paga (1-31)
  startDate?: string;           // Fecha o mes de inicio (YYYY-MM)
  lastPaidPeriod?: string;      // Último mes en que se pagó la cuota (YYYY-MM)
}

