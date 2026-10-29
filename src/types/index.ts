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
  source?: 'cartola' | 'google_wallet' | 'telegram' | 'manual' | 'wallet' | string;
  created_at?: string;
  createdAt?: string;
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
  interestRate?: number;        // Tasa de interés mensual o CAE (%)
  isActive?: boolean;           // Estado activo o pausado (ej. suscripciones)
}

// ==========================================
// DASHBOARD CUSTOMIZATION CONFIGURATION
// ==========================================

export type MetricType =
  | 'liquidity'               // Saldo Disponible en Cuentas (Terminal)
  | 'credit_card_debt'        // Deuda Utilizada en TC (Terminal)
  | 'billing_projection'      // Facturación al Corte TC (Terminal)
  | 'monthly_net_spent'       // Gasto Neto Real del Mes (Terminal)
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
  color: 'rose' | 'emerald' | 'sky' | 'purple' | 'amber' | 'teal' | 'indigo' | 'neon-cyan' | 'neon-magenta' | 'neon-amber' | 'neon-blue' | string;
  icon: string;               // 'wallet' | 'credit-card' | 'calendar' | 'shield-check' | 'trending-down' | 'trending-up' | 'piggy-bank' | 'shopping-cart' | 'landmark' | string
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
      id: 'm-liquidity',
      title: 'Saldo en Cuentas',
      type: 'liquidity',
      color: 'neon-cyan',
      icon: 'wallet',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-credit-card-debt',
      title: 'Deuda Utilizada en TC',
      type: 'credit_card_debt',
      color: 'neon-cyan',
      icon: 'credit-card',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-billing-projection',
      title: 'Facturación al Corte',
      type: 'billing_projection',
      color: 'neon-amber',
      icon: 'calendar',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-monthly-net-spent',
      title: 'Gasto Neto Real del Mes',
      type: 'monthly_net_spent',
      color: 'neon-magenta',
      icon: 'shield-check',
      enabled: true,
      isSystem: true
    },
    {
      id: 'm-gross-expenses',
      title: 'Gastos Totales (Original)',
      type: 'gross_expenses',
      color: 'rose',
      icon: 'trending-down',
      enabled: false,
      isSystem: true
    },
    {
      id: 'm-total-payments',
      title: 'Abonos, Pagos y Sueldos',
      type: 'total_payments',
      color: 'emerald',
      icon: 'trending-up',
      enabled: false,
      isSystem: true
    },
    {
      id: 'm-net-amount',
      title: 'Monto Real Utilizado',
      type: 'net_amount_used',
      color: 'sky',
      icon: 'shield-check',
      enabled: false,
      isSystem: true
    },
    {
      id: 'm-unallocated-tc',
      title: 'Abonos TC Sin Asignar',
      type: 'unallocated_tc',
      color: 'purple',
      icon: 'credit-card',
      enabled: false,
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


