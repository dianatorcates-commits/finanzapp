import { CategoryMapping, TransactionType, AccountType, AutoCategoryRule } from '../types';

export interface CategorizationResult {
  category: string;
  subcategory: string;
  transactionType: TransactionType;
}

export const DEFAULT_AUTO_RULES: AutoCategoryRule[] = [
  { id: 'rule-jumbo', pattern: 'JUMBO', category: 'Alimentación & Gastronomía', subcategory: 'Alimentación & Supermercados' },
  { id: 'rule-lider', pattern: 'LIDER', category: 'Alimentación & Gastronomía', subcategory: 'Alimentación & Supermercados' },
  { id: 'rule-uber', pattern: 'UBER', category: 'Transporte & Movilidad', subcategory: 'Transporte & Vehículos' },
  { id: 'rule-netflix', pattern: 'NETFLIX', category: 'Vivienda & Servicios', subcategory: 'Suscripciones & Streaming' },
  { id: 'rule-spotify', pattern: 'SPOTIFY', category: 'Vivienda & Servicios', subcategory: 'Suscripciones & Streaming' },
  { id: 'rule-starbucks', pattern: 'STARBUCKS', category: 'Alimentación & Gastronomía', subcategory: 'Restaurantes & Bares' },
  { id: 'rule-pago-tc', pattern: 'PAGO TC', category: 'Abonos y Pagos', subcategory: 'Pagos de Tarjeta' }
];

export const DEFAULT_CATEGORY_MAPPINGS: CategoryMapping[] = [
  {
    id: 'cat-abonos',
    name: 'Abonos y Pagos',
    subcategories: ['Pagos de Tarjeta', 'Abono de Tarjeta', 'Abono Comida']
  },
  {
    id: 'cat-alimentacion',
    name: 'Alimentación & Gastronomía',
    subcategories: ['Alimentación & Supermercados', 'Restaurantes & Bares']
  },
  {
    id: 'cat-transporte',
    name: 'Transporte & Movilidad',
    subcategories: ['Transporte & Vehículos']
  },
  {
    id: 'cat-vivienda',
    name: 'Vivienda & Servicios',
    subcategories: ['Servicios Básicos & Hogar', 'Suscripciones & Streaming']
  },
  {
    id: 'cat-salud',
    name: 'Salud & Bienestar',
    subcategories: ['Salud & Farmacia']
  },
  {
    id: 'cat-compras',
    name: 'Compras & Estilo de Vida',
    subcategories: ['Ropa, Tecnología & Compras', 'Educación & Libros', 'Entretenimiento & Viajes']
  },
  {
    id: 'cat-ingresos',
    name: 'Ingresos & Transferencias',
    subcategories: ['Sueldo & Ventas', 'Transferencias']
  },
  {
    id: 'cat-otros',
    name: 'Otros Gastos',
    subcategories: ['Otros Gastos']
  }
];

export const TRANSACTION_TYPES: { id: TransactionType; label: string }[] = [
  { id: 'compra', label: 'Compra / Gasto' },
  { id: 'pago_tc', label: 'Pago a Tarjeta de Crédito' },
  { id: 'transferencia_enviada', label: 'Transferencia Enviada' },
  { id: 'transferencia_recibida', label: 'Transferencia Recibida' },
  { id: 'ingreso_venta', label: 'Ingreso / Venta / Sueldo' },
  { id: 'comision_interes', label: 'Comisión / Interés Banco' },
  { id: 'otro', label: 'Otro' }
];

export function getParentCategory(subcategory: string, mappings: CategoryMapping[] = DEFAULT_CATEGORY_MAPPINGS): string {
  for (const m of mappings) {
    if (m.subcategories.includes(subcategory)) {
      return m.name;
    }
  }
  return 'Otros Gastos';
}

export function autoCategorize(
  description: string,
  rawAmount: number,
  accountType?: AccountType,
  categoryMappings: CategoryMapping[] = DEFAULT_CATEGORY_MAPPINGS,
  customRules: AutoCategoryRule[] = []
): CategorizationResult {
  const descUpper = description.toUpperCase();
  let subcategory = 'Otros Gastos';
  let transactionType: TransactionType = 'compra';

  // 1. Check custom auto rules first
  if (customRules && customRules.length > 0) {
    const matchedRule = customRules.find((rule) => rule.pattern && descUpper.includes(rule.pattern.toUpperCase()));
    if (matchedRule) {
      const parentCat = matchedRule.category || getParentCategory(matchedRule.subcategory, categoryMappings);
      return {
        category: parentCat,
        subcategory: matchedRule.subcategory,
        transactionType: parentCat === 'Abonos y Pagos' ? 'pago_tc' : 'compra'
      };
    }
  }

  // Check TC Payment / Abono
  if (
    descUpper.includes('PAGO TC') ||
    descUpper.includes('ABONO TC') ||
    descUpper.includes('PAGO TARJETA') ||
    descUpper.includes('PAGO ESTADO DE CUENTA') ||
    descUpper.includes('PAGO PESOS TC') ||
    descUpper.includes('ABONO TARJETA') ||
    descUpper.includes('PAGO DESDE CTA') ||
    descUpper.includes('PAGO PAC TC')
  ) {
    subcategory = 'Pagos de Tarjeta';
    transactionType = 'pago_tc';
  } else if (descUpper.includes('ABONO COMIDA') || descUpper.includes('PAGO COMIDA')) {
    subcategory = 'Abono Comida';
    transactionType = 'pago_tc';
  } else if (
    descUpper.includes('TRANSFERENCIA A') ||
    descUpper.includes('TRANSF A') ||
    descUpper.includes('TEF A') ||
    descUpper.includes('CARGO POR TRANSFERENCIA')
  ) {
    subcategory = 'Transferencias';
    transactionType = 'transferencia_enviada';
  } else if (
    descUpper.includes('TRANSFERENCIA DE') ||
    descUpper.includes('TRANSF DE') ||
    descUpper.includes('TEF DE') ||
    descUpper.includes('ABONO POR TRANSFERENCIA')
  ) {
    subcategory = 'Transferencias';
    transactionType = 'transferencia_recibida';
  } else if (
    descUpper.includes('REMUNERACION') ||
    descUpper.includes('SUELDO') ||
    descUpper.includes('PAGO DE NOMINA') ||
    descUpper.includes('DEPOSITO') ||
    descUpper.includes('VENTA') ||
    descUpper.includes('HONORARIOS')
  ) {
    subcategory = 'Sueldo & Ventas';
    transactionType = 'ingreso_venta';
  } else if (
    descUpper.includes('LIDER') ||
    descUpper.includes('JUMBO') ||
    descUpper.includes('UNIMARC') ||
    descUpper.includes('TOTTUS') ||
    descUpper.includes('SANTA ISABEL') ||
    descUpper.includes('SUPERMERCADO') ||
    descUpper.includes('OKMARKET') ||
    descUpper.includes('ERBI') ||
    descUpper.includes('OXXO') ||
    descUpper.includes('ALIM') ||
    descUpper.includes('MINIMARKET') ||
    descUpper.includes('DISTRIBUIDORA')
  ) {
    subcategory = 'Alimentación & Supermercados';
    transactionType = 'compra';
  } else if (
    descUpper.includes('MCDONALDS') ||
    descUpper.includes('STARBUCKS') ||
    descUpper.includes('RAPPI') ||
    descUpper.includes('PEDIDOSYA') ||
    descUpper.includes('BURGER KING') ||
    descUpper.includes('KFC') ||
    descUpper.includes('SUSHI') ||
    descUpper.includes('PIZZA') ||
    descUpper.includes('RESTAURANT') ||
    descUpper.includes('REST ') ||
    descUpper.includes('CAFETERIA') ||
    descUpper.includes('BAR ') ||
    descUpper.includes('PUB') ||
    descUpper.includes('SCHOPDOG') ||
    descUpper.includes('DOMINOS') ||
    descUpper.includes('SUBWAY') ||
    descUpper.includes('DUNKIN') ||
    descUpper.includes('SANTA CLARA')
  ) {
    subcategory = 'Restaurantes & Bares';
    transactionType = 'compra';
  } else if (
    descUpper.includes('SHELL') ||
    descUpper.includes('COPEC') ||
    descUpper.includes('PETROBRAS') ||
    descUpper.includes('UBER') ||
    descUpper.includes('DIDI') ||
    descUpper.includes('CABIFY') ||
    descUpper.includes('METRO') ||
    descUpper.includes('BIP') ||
    descUpper.includes('AUTOPISTA') ||
    descUpper.includes('TAG') ||
    descUpper.includes('ESTACIONAMIENTO') ||
    descUpper.includes('SABA') ||
    descUpper.includes('LATAM') ||
    descUpper.includes('SKY AIRLINE') ||
    descUpper.includes('TUR BUS') ||
    descUpper.includes('PULLMAN')
  ) {
    subcategory = 'Transporte & Vehículos';
    transactionType = 'compra';
  } else if (
    descUpper.includes('ENEL') ||
    descUpper.includes('CGE') ||
    descUpper.includes('AGUAS ANDINAS') ||
    descUpper.includes('VTR') ||
    descUpper.includes('ENTEL') ||
    descUpper.includes('MOVISTAR') ||
    descUpper.includes('WOM') ||
    descUpper.includes('CLARO') ||
    descUpper.includes('METROGAS') ||
    descUpper.includes('LIPIGAS') ||
    descUpper.includes('GASCO') ||
    descUpper.includes('EASY') ||
    descUpper.includes('SODIMAC') ||
    descUpper.includes('CONSTRUMART') ||
    descUpper.includes('IKEA')
  ) {
    subcategory = 'Servicios Básicos & Hogar';
    transactionType = 'compra';
  } else if (
    descUpper.includes('NETFLIX') ||
    descUpper.includes('SPOTIFY') ||
    descUpper.includes('DISNEY') ||
    descUpper.includes('HBO') ||
    descUpper.includes('MAX') ||
    descUpper.includes('YOUTUBE') ||
    descUpper.includes('AMAZON PRIME') ||
    descUpper.includes('APPLE.COM') ||
    descUpper.includes('GOOGLE') ||
    descUpper.includes('MICROSOFT') ||
    descUpper.includes('CHATGPT') ||
    descUpper.includes('OPENAI') ||
    descUpper.includes('PLAYSTATION') ||
    descUpper.includes('STEAM') ||
    descUpper.includes('NINTENDO')
  ) {
    subcategory = 'Suscripciones & Streaming';
    transactionType = 'compra';
  } else if (
    descUpper.includes('SALCOBRAND') ||
    descUpper.includes('CRUZ VERDE') ||
    descUpper.includes('FARMACIAS AHUMADA') ||
    descUpper.includes('DR SIMI') ||
    descUpper.includes('FARMACIA') ||
    descUpper.includes('CLINICA') ||
    descUpper.includes('HOSPITAL') ||
    descUpper.includes('INTEGRAMEDICA') ||
    descUpper.includes('MEDS') ||
    descUpper.includes('ISAPRE') ||
    descUpper.includes('FONASA') ||
    descUpper.includes('CONSULTA MEDICA') ||
    descUpper.includes('LABORATORIO')
  ) {
    subcategory = 'Salud & Farmacia';
    transactionType = 'compra';
  } else if (
    descUpper.includes('FALABELLA') ||
    descUpper.includes('PARIS') ||
    descUpper.includes('RIPLEY') ||
    descUpper.includes('ZARA') ||
    descUpper.includes('HM ') ||
    descUpper.includes('H&M') ||
    descUpper.includes('MERCADOLIBRE') ||
    descUpper.includes('ALIEXPRESS') ||
    descUpper.includes('AMAZON') ||
    descUpper.includes('PC FACTORY') ||
    descUpper.includes('DECATHLON') ||
    descUpper.includes('ADIDAS') ||
    descUpper.includes('NIKE')
  ) {
    subcategory = 'Ropa, Tecnología & Compras';
    transactionType = 'compra';
  } else if (
    descUpper.includes('COMISION') ||
    descUpper.includes('INTERES') ||
    descUpper.includes('MANTENCION') ||
    descUpper.includes('SEGURO') ||
    descUpper.includes('IMPUESTO') ||
    descUpper.includes('COBRO')
  ) {
    subcategory = 'Otros Gastos';
    transactionType = 'comision_interes';
  } else if (rawAmount < 0 && accountType === 'credit_card') {
    subcategory = 'Pagos de Tarjeta';
    transactionType = 'pago_tc';
  } else {
    subcategory = rawAmount < 0 ? 'Sueldo & Ventas' : 'Otros Gastos';
    transactionType = rawAmount < 0 ? 'ingreso_venta' : 'compra';
  }

  const category = getParentCategory(subcategory, categoryMappings);

  return {
    category,
    subcategory,
    transactionType
  };
}
