export type AccountType = 'credit_card' | 'checking' | 'savings' | 'sight';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bank: string;
  accountNumber?: string;
  currency: string;
  creditLimit?: number;
  color?: string;
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
  name: string; // Categoría General (e.g. "Abonos y Pagos", "Alimentación & Gastronomía")
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

