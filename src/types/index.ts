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
  isPotentialDuplicate?: boolean;
  duplicateOfDescription?: string;
  duplicateOfId?: string;
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
  transactionType?: TransactionType; // e.g. 'compra', 'pago_tc', 'ingreso_venta'
}

export interface CategoryBudget {
  id: string;
  name?: string;
  categoryName: string; // Nombre visible del presupuesto
  monthlyLimit: number; // Limit in CLP
  categories?: string[];
  subcategories?: string[];
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

export type CreditType = 'hipotecario' | 'consumo' | 'avance_tc' | 'cuotas_tc' | 'automotriz' | 'otro' | 'suscripcion';

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
  accountId?: string;           // ID de la tarjeta o cuenta bancaria con que se paga
}

// ==========================================
// DASHBOARD CUSTOMIZATION CONFIGURATION
// ==========================================

export type MetricType =
  | 'gross_expenses'          // Gastos Totales (Original)
  | 'total_payments'          // Abonos, Pagos y Sueldos
  | 'net_amount_used'         // Monto Real Utilizado
  | 'unallocated_tc'          // Abonos TC Sin Asignar
  | 'net_balance'             // Balance Neto / Ahorro
  | 'compra'                  // Solo compras realizadas
  | 'pago_tc'                 // Solo pagos realizados a tarjetas
  | 'custom';                 // Filtro personalizado por cuenta/categoría

export interface CustomMetricCard {
  id: string;
  title: string;
  type: MetricType;
  filterAccountId?: string;   // 'ALL' o ID de cuenta específica
  filterCategory?: string;    // 'ALL' o Categoría específica
  color: 'rose' | 'emerald' | 'sky' | 'purple' | 'amber' | 'teal' | 'indigo';
  icon: string;               // 'trending-down' | 'trending-up' | 'shield-check' | 'credit-card' | 'piggy-bank' | 'shopping-cart' | 'landmark'
  enabled: boolean;
  isSystem?: boolean;
}

export type ChartType =
  | 'budgets_progress'        // Control de Presupuestos
  | 'category_pie'            // Gastos por Categoría (Dona)
  | 'monthly_trend'           // Evolución Mensual (Barras)
  | 'account_breakdown'       // Resumen Comparativo de todas las cuentas
  | 'account_specific';       // Gráfico específico de una cuenta/tarjeta en particular

export interface CustomChartWidget {
  id: string;
  title: string;
  chartType: ChartType;
  targetAccountId?: string;   // ID de la cuenta para 'account_specific'
  enabled: boolean;
  isSystem?: boolean;
}

export interface DashboardConfig {
  metrics: CustomMetricCard[];
  charts: CustomChartWidget[];
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  metrics: [
    {
      id: 'm-gross-expenses',
      title: 'Gastos Totales (Original)',
      type: 'gross_expenses',
      color: 'rose',
      icon: 'trending-down',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-total-payments',
      title: 'Abonos, Pagos y Sueldos',
      type: 'total_payments',
      color: 'emerald',
      icon: 'trending-up',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-net-amount',
      title: 'Monto Real Utilizado',
      type: 'net_amount_used',
      color: 'sky',
      icon: 'shield-check',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-unallocated-tc',
      title: 'Abonos TC Sin Asignar',
      type: 'unallocated_tc',
      color: 'purple',
      icon: 'credit-card',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-net-balance',
      title: 'Balance Neto / Ahorro',
      type: 'net_balance',
      color: 'teal',
      icon: 'piggy-bank',
      enabled: false,
      isSystem: true
    }
  ],
  charts: [
    {
      id: 'c-budgets',
      title: 'Control de Presupuestos Mensuales',
      chartType: 'budgets_progress',
      enabled: true,
      isSystem: true
    },
    {
      id: 'c-pie',
      title: 'Distribución de Gastos por Categoría',
      chartType: 'category_pie',
      enabled: true,
      isSystem: true
    },
    {
      id: 'c-trend',
      title: 'Evolución Histórica Mensual',
      chartType: 'monthly_trend',
      enabled: true,
      isSystem: true
    },
    {
      id: 'c-accounts',
      title: 'Resumen por Tarjeta / Cuenta',
      chartType: 'account_breakdown',
      enabled: true,
      isSystem: true
    }
  ]
};


