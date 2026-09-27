import { Account, Transaction } from '../types';

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-tc-santander',
    name: 'TC Visa Signature Santander',
    type: 'credit_card',
    bank: 'Banco Santander',
    accountNumber: '**** **** **** 4892',
    currency: 'CLP',
    creditLimit: 3000000,
    color: '#e53e3e' // Red Santander
  },
  {
    id: 'acc-cta-bchile',
    name: 'Cuenta Corriente Preferente',
    type: 'checking',
    bank: 'Banco de Chile',
    accountNumber: '00-123-98745-01',
    currency: 'CLP',
    color: '#2b6cb0' // Blue Banco Chile
  },
  {
    id: 'acc-vista-bestado',
    name: 'Cuenta RUT / Vista',
    type: 'sight',
    bank: 'BancoEstado',
    accountNumber: '18492019',
    currency: 'CLP',
    color: '#dd6b20' // Orange BancoEstado
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // ----------------------------------------------------
  // TC SANTANDER MOVEMENTS
  // ----------------------------------------------------
  {
    id: 'tx-tc-1',
    accountId: 'acc-tc-santander',
    date: '2026-09-02',
    description: 'RESTAURANTE MESTIZO VITACURA',
    rawDescription: 'RESTAURANTE MESTIZO SANTIAGO CL',
    amount: 100000,
    transactionType: 'compra',
    category: 'Alimentación & Gastronomía',
    subcategory: 'Restaurantes & Bares',
    allocations: [
      {
        id: 'alloc-demo-1',
        paymentTransactionId: 'tx-tc-p1',
        amount: 50000,
        allocatedAt: '2026-09-16T10:00:00Z'
      }
    ],
    notes: 'Almuerzo de equipo en Restaurante Mestizo'
  },
  {
    id: 'tx-tc-2',
    accountId: 'acc-tc-santander',
    date: '2026-09-05',
    description: 'JUMBO ALTO LAS CONDES',
    rawDescription: 'SUPERMERCADO JUMBO ALTO LAS CONDES',
    amount: 85400,
    transactionType: 'compra',
    category: 'Alimentación & Gastronomía',
    subcategory: 'Alimentación & Supermercados',
    allocations: []
  },
  {
    id: 'tx-tc-3',
    accountId: 'acc-tc-santander',
    date: '2026-09-08',
    description: 'SHELL LAS CONDES COMBUSTIBLE',
    rawDescription: 'ESTACION SHELL COMBUSTIBLES',
    amount: 35000,
    transactionType: 'compra',
    category: 'Transporte & Movilidad',
    subcategory: 'Transporte & Vehículos',
    allocations: []
  },
  {
    id: 'tx-tc-4',
    accountId: 'acc-tc-santander',
    date: '2026-09-10',
    description: 'FALABELLA PARK ARAUCO (CUOTA 02/06)',
    rawDescription: 'FALABELLA PARK ARAUCO C. 02/06',
    amount: 24998,
    originalTotalAmount: 149990,
    transactionType: 'compra',
    category: 'Compras & Estilo de Vida',
    subcategory: 'Ropa, Tecnología & Compras',
    installments: { current: 2, total: 6 },
    allocations: []
  },
  {
    id: 'tx-tc-5',
    accountId: 'acc-tc-santander',
    date: '2026-09-12',
    description: 'NETFLIX ENTERTAINMENT SANTIAGO',
    rawDescription: 'NETFLIX.COM DIGITAL SUBSCRIPTION',
    amount: 10990,
    transactionType: 'compra',
    category: 'Vivienda & Servicios',
    subcategory: 'Suscripciones & Streaming',
    allocations: []
  },
  {
    id: 'tx-tc-6',
    accountId: 'acc-tc-santander',
    date: '2026-09-14',
    description: 'SALCOBRAND RECETAS Y MEDICAMENTOS',
    rawDescription: 'FARMACIA SALCOBRAND SANTIAGO',
    amount: 24900,
    transactionType: 'compra',
    category: 'Salud & Bienestar',
    subcategory: 'Salud & Farmacia',
    allocations: []
  },
  // PAYMENTS ON TC SANTANDER
  {
    id: 'tx-tc-p1',
    accountId: 'acc-tc-santander',
    date: '2026-09-15',
    description: 'PAGO TC SANTANDER WEB BANCO',
    rawDescription: 'PAGO ESTADO DE CUENTA PESOS TC',
    amount: -50000,
    transactionType: 'pago_tc',
    category: 'Abonos y Pagos',
    subcategory: 'Pagos de Tarjeta',
    allocations: []
  },
  {
    id: 'tx-tc-p2',
    accountId: 'acc-tc-santander',
    date: '2026-09-20',
    description: 'ABONO TC DESDE CTA CORRIENTE',
    rawDescription: 'TRANSFERENCIA PAGO TC PESOS',
    amount: -40000,
    transactionType: 'pago_tc',
    category: 'Abonos y Pagos',
    subcategory: 'Abono de Tarjeta',
    allocations: []
  },

  // ----------------------------------------------------
  // BANCO DE CHILE CHECKING MOVEMENTS
  // ----------------------------------------------------
  {
    id: 'tx-ch-1',
    accountId: 'acc-cta-bchile',
    date: '2026-09-01',
    description: 'REMUNERACIONES MES DE AGOSTO EMPRESA S.A.',
    rawDescription: 'REMUNERACION DEPOSITO DIRECTO BANCO DE CHILE',
    amount: -2450000,
    transactionType: 'ingreso_venta',
    category: 'Ingresos & Transferencias',
    subcategory: 'Sueldo & Ventas',
    allocations: []
  },
  {
    id: 'tx-ch-2',
    accountId: 'acc-cta-bchile',
    date: '2026-09-03',
    description: 'PAGO VTR FIBRA OPTICA 500 MEGA',
    rawDescription: 'CARGO AUTOMATICO VTR TELECOMUNICACIONES',
    amount: 34990,
    transactionType: 'compra',
    category: 'Vivienda & Servicios',
    subcategory: 'Servicios Básicos & Hogar',
    allocations: []
  },
  {
    id: 'tx-ch-3',
    accountId: 'acc-cta-bchile',
    date: '2026-09-04',
    description: 'PAGO ENEL DISTRIBUCION ELEC',
    rawDescription: 'CARGO PAC ENEL SANTIAGO',
    amount: 28500,
    transactionType: 'compra',
    category: 'Vivienda & Servicios',
    subcategory: 'Servicios Básicos & Hogar',
    allocations: []
  },
  {
    id: 'tx-ch-4',
    accountId: 'acc-cta-bchile',
    date: '2026-09-10',
    description: 'TRANSFERENCIA A PEDRO GOMEZ (ARRIENDO ESPACIO)',
    rawDescription: 'TEF A PEDRO GOMEZ BANCO SANTANDER',
    amount: 450000,
    transactionType: 'transferencia_enviada',
    category: 'Ingresos & Transferencias',
    subcategory: 'Transferencias',
    allocations: []
  },
  {
    id: 'tx-ch-5',
    accountId: 'acc-cta-bchile',
    date: '2026-09-15',
    description: 'PAGO PAC TC SANTANDER VISA',
    rawDescription: 'CARGO AUTOMATICO PAGO TARJETA SANTANDER',
    amount: 50000,
    transactionType: 'pago_tc',
    category: 'Abonos y Pagos',
    subcategory: 'Pagos de Tarjeta',
    allocations: []
  },

  // ----------------------------------------------------
  // BANCO ESTADO CUENTA VISTA / RUT MOVEMENTS
  // ----------------------------------------------------
  {
    id: 'tx-vis-1',
    accountId: 'acc-vista-bestado',
    date: '2026-09-06',
    description: 'TRANSFERENCIA DE CARLOS PEREZ',
    rawDescription: 'TEF RECIBIDA BANCOESTADO',
    amount: -80000,
    transactionType: 'transferencia_recibida',
    category: 'Ingresos & Transferencias',
    subcategory: 'Transferencias',
    allocations: []
  },
  {
    id: 'tx-vis-2',
    accountId: 'acc-vista-bestado',
    date: '2026-09-07',
    description: 'CARGO BIP RED SANTIAGO',
    rawDescription: 'CARGATARJETA BIP METRO SANTIAGO',
    amount: 10000,
    transactionType: 'compra',
    category: 'Transporte & Movilidad',
    subcategory: 'Transporte & Vehículos',
    allocations: []
  },
  {
    id: 'tx-vis-3',
    accountId: 'acc-vista-bestado',
    date: '2026-09-11',
    description: 'UNIMARC EXPRESS SANTIAGO',
    rawDescription: 'COMPRA COMPRAS UNIMARC EXPRESS',
    amount: 22300,
    transactionType: 'compra',
    category: 'Alimentación & Gastronomía',
    subcategory: 'Alimentación & Supermercados',
    allocations: []
  }
];
