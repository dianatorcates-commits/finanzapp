export const LEGAL_TERMS_VERSION = '2026-11-22-v1';
export const LEGAL_PRIVACY_VERSION = '2026-11-22-v1';
export const LEGAL_EFFECTIVE_DATE = '22 de noviembre de 2026';

export const SUPPORT_EMAIL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPPORT_EMAIL) ||
  'privacidad@finanzapp.cl';

export const COOKIE_NOTICE_STORAGE_KEY = 'finanzapp_cookie_notice_ack';
export const PENDING_LEGAL_CONSENT_KEY = 'finanzapp_pending_legal_consent';

export interface LegalSectionItem {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ContactReasonOption {
  id: string;
  title: string;
  description: string;
  subject: string;
  bodyTemplate: string;
}

export const PRIVACY_SECTIONS: LegalSectionItem[] = [
  {
    id: 'responsable',
    title: '1. Responsable del Tratamiento y Marco Normativo',
    paragraphs: [
      'FinanzApp actúa como responsable del tratamiento de los datos personales ingresados voluntariamente por sus usuarios en la plataforma web y PWA, en conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada y los principios establecidos en la Ley N° 21.719 sobre Protección de Datos Personales de la República de Chile.',
      `Para cualquier consulta, solicitud de derechos o reclamo relacionado con privacidad, nuestro canal oficial de atención es ${SUPPORT_EMAIL}.`
    ]
  },
  {
    id: 'datos-recopilados',
    title: '2. Datos Personales y Financieros que Tratamos',
    paragraphs: [
      'FinanzApp opera bajo una arquitectura Zero-Trust: jamás solicitamos ni almacenamos contraseñas bancarias, claves dinámicas, pines ni acceso directo mediante APIs abiertas a tus instituciones financieras.',
      'Los datos tratados provienen exclusivamente de tu registro o carga voluntaria:'
    ],
    bullets: [
      'Datos de identificación y autenticación: correo electrónico, nombre visible y avatar provisto por Google OAuth (si eliges ese método) e identificador interno de usuario.',
      'Datos financieros ingresados o importados manualmente: nombres de cuentas o tarjetas (sin números completos de tarjeta requeridos), cupos referenciales, días de corte/pago, cartolas CSV/Excel/texto, movimientos, categorías, reglas, presupuestos, metas de ahorro y créditos/cuotas.',
      'Integración opcional de Telegram Bot: chat ID y nombre de usuario de Telegram únicamente si tú vinculas voluntariamente tu bot.',
      'Bitácora auditable de consentimiento legal: versión aceptada de Términos y Política de Privacidad, confirmación de mayoría de edad (+18), fecha/hora exacta (UTC), origen del registro y navegador (User-Agent).'
    ]
  },
  {
    id: 'almacenamiento-y-seguridad',
    title: '3. Definición de Almacenamiento, Retención y Seguridad',
    paragraphs: [
      'Tus datos se almacenan bajo dos capas claramente delimitadas:',
      'No vendemos, arrendamos ni cedemos tus datos personales o financieros a terceros, brókeres de datos ni redes publicitarias.'
    ],
    bullets: [
      'Nube (Supabase / PostgreSQL): base de datos relacional protegida con Row Level Security (RLS), garantizando a nivel de motor SQL que cada fila solo es visible y modificable por tu propio usuario autenticado (auth.uid() = user_id), cifrada en tránsito mediante HTTPS/TLS y cifrada en reposo.',
      'Almacenamiento local en tu dispositivo (localStorage / sessionStorage): caché técnica estrictamente aislada por identificador de usuario para acelerar la carga y preservar la interfaz. Toda caché de usuario se purga automáticamente al cerrar sesión o al eliminar tu cuenta.',
      'Retención de datos: conservamos tu información únicamente mientras mantengas una cuenta activa. Al solicitar la eliminación total de tu cuenta, todos tus registros en base de datos, vinculaciones e identidad de autenticación se suprimen de forma inmediata e irreversible.'
    ]
  },
  {
    id: 'subencargados',
    title: '4. Proveedores de Infraestructura Tecnológica',
    paragraphs: [
      'Para operar el servicio en producción utilizamos exclusivamente proveedores de infraestructura confiables que procesan datos bajo nuestros estándares técnicos:'
    ],
    bullets: [
      'Supabase Inc.: autenticación de usuarios y base de datos PostgreSQL con aislamiento RLS.',
      'Vercel Inc.: alojamiento de la aplicación web y funciones serverless para webhooks.',
      'Telegram Messenger (solo si el usuario activa el Bot): transporte de mensajes enviados voluntariamente por el titular hacia su webhook.'
    ]
  },
  {
    id: 'derechos-arco',
    title: '5. Derechos de Acceso, Rectificación, Supresión y Portabilidad (ARCO)',
    paragraphs: [
      'Como titular de los datos puedes ejercer en todo momento tus derechos legales:'
    ],
    bullets: [
      'Acceso y Rectificación: consulta, edita categorías, montos y cuentas directamente en la plataforma en cualquier momento.',
      'Portabilidad: descarga el historial completo de tus movimientos y montos en formato Excel (.xlsx) con un clic desde el menú Utilidades o desde Mi Cuenta y Privacidad.',
      'Supresión (Derecho al Olvido): elimina cuentas bancarias, transacciones individuales o ejecuta la eliminación total e irreversible de tu cuenta y todos tus datos desde "Mi Cuenta y Privacidad -> Eliminar mi Cuenta".',
      `Reclamos o asistencia directa: escríbenos a ${SUPPORT_EMAIL} y responderemos dentro de un plazo máximo de 15 días hábiles.`
    ]
  }
];

export const TERMS_SECTIONS: LegalSectionItem[] = [
  {
    id: 'objeto-servicio',
    title: '1. Naturaleza del Servicio y Deslinde de Asesoría Financiera',
    paragraphs: [
      'FinanzApp es una herramienta tecnológica de organización y control financiero personal diseñada para ayudar al usuario a consolidar cartolas, categorizar gastos y proyectar pagos de tarjetas de crédito.',
      'FinanzApp NO es un banco, institución financiera regulada, corredor de bolsa ni asesor financiero, contable, tributario o legal certificado. Toda métrica, proyección de facturación al corte o cálculo de deuda es referencial y depende estrictamente de los datos ingresados por el usuario; nunca reemplaza las cartolas o estados de cuenta oficiales emitidos por tu banco.'
    ]
  },
  {
    id: 'edad-minima',
    title: '2. Requisito Estricto de Edad (+18 Años)',
    paragraphs: [
      'El acceso y registro en FinanzApp está permitido exclusivamente a personas naturales mayores de 18 años con plena capacidad legal para contratar conforme a la legislación chilena.',
      'No recopilamos intencionadamente información de menores de edad. Al marcar la casilla de aceptación durante el registro o al confirmar el aviso legal, declaras bajo tu responsabilidad ser mayor de 18 años. Si detectamos una cuenta creada por un menor de edad o recibimos un aviso de sus padres o tutores en nuestro canal de reclamos, procederemos a su cierre y eliminación inmediata de datos.'
    ]
  },
  {
    id: 'registro-consentimiento',
    title: '3. Cuenta de Usuario y Registro de Aceptación',
    paragraphs: [
      'Para crear o continuar operando una cuenta autenticada en la nube es requisito obligatorio aceptar estos Términos y Condiciones y la Política de Privacidad vigentes.',
      'Por seguridad y transparencia jurídica, FinanzApp registra la versión aceptada y la fecha/hora exacta de tu consentimiento en tu historial de cuenta.'
    ]
  },
  {
    id: 'uso-automatizaciones',
    title: '4. Importación de Cartolas, Reglas y Automatizaciones',
    paragraphs: [
      'Las utilidades de lectura de archivos (CSV/Excel/texto), reglas automáticas de categorización y detección de posibles duplicados buscan ahorrar tiempo al usuario, pero requieren verificación manual.',
      'El usuario es único responsable de revisar los importes, fechas de corte, asignaciones de pago y conciliaciones antes de tomar decisiones financieras basadas en dichos reportes.'
    ]
  },
  {
    id: 'propiedad-licencias',
    title: '5. Propiedad Intelectual y Licencias Abiertas',
    paragraphs: [
      'El código, diseño, marca y recursos gráficos originales de la mascota FinanzApp pertenecen a sus respectivos autores y están protegidos por la normativa de propiedad intelectual aplicable.',
      'La interfaz utiliza fuentes tipográficas e iconografía de terceros debidamente licenciadas para uso comercial:'
    ],
    bullets: [
      'Tipografías Google Fonts (Inter, Sora y Space Grotesk): licenciadas bajo SIL Open Font License (OFL) 1.1.',
      'Iconografía Lucide Icons (lucide-react): licenciada bajo licencia ISC de código abierto.',
      'Componentes de visualización y parseo (Recharts, SheetJS/XLSX, PapaParse, Tailwind CSS): empleados conforme a sus respectivas licencias open-source.'
    ]
  },
  {
    id: 'responsabilidad-jurisdiccion',
    title: '6. Limitación de Responsabilidad y Jurisdicción',
    paragraphs: [
      'FinanzApp se entrega "tal cual" (as-is) y realiza sus mejores esfuerzos para mantener la disponibilidad en la nube mediante Supabase y Vercel, sin garantizar operación ininterrumpida ni ausencia absoluta de errores de software.',
      'Estos Términos y Condiciones se rigen e interpretan conforme a las leyes de la República de Chile. Ante cualquier controversia, las partes fijan domicilio en la ciudad de Santiago y se someten a la competencia de sus tribunales ordinarios.'
    ]
  }
];

export const COOKIES_SECTIONS: LegalSectionItem[] = [
  {
    id: 'cero-rastreadores',
    title: '1. Cero Rastreadores y Cero Publicidad',
    paragraphs: [
      'FinanzApp está libre de rastreadores comerciales. No cargamos Google Analytics, Meta Pixel, Hotjar, Mixpanel ni cookies de terceros con fines publicitarios o de perfilamiento conductual.',
      'Al no existir rastreadores no esenciales, tu navegación dentro de FinanzApp no es vendida ni compartida con redes de anuncios.'
    ]
  },
  {
    id: 'almacenamiento-tecnico',
    title: '2. Almacenamiento Técnico Estrictamente Necesario',
    paragraphs: [
      'Únicamente empleamos almacenamiento local técnico del navegador imprescindible para el funcionamiento de la sesión y la interfaz:'
    ],
    bullets: [
      'Token de sesión de Supabase Auth (sb-*-auth-token): mantiene tu sesión autenticada de forma segura entre recargas.',
      'Caché de datos aislada por usuario (finanzapp_*_<userId>): acelera la renderización de tus cuentas y transacciones; se borra al cerrar sesión.',
      'Preferencia de aviso técnico (finanzapp_cookie_notice_ack): recuerda que ya leíste el aviso de almacenamiento técnico para no volver a mostrarte el banner.'
    ]
  },
  {
    id: 'gestion-navegador',
    title: '3. Cómo Gestionar o Borrar estos Datos Locales',
    paragraphs: [
      'Puedes limpiar el almacenamiento local en cualquier momento cerrando sesión desde la app o desde la configuración de privacidad de tu navegador (Chrome, Safari, Firefox o Edge). Si limpias todos los datos del sitio, únicamente deberás volver a iniciar sesión.'
    ]
  }
];

export const CONTACT_INFO: {
  email: string;
  responseSla: string;
  reasons: ContactReasonOption[];
} = {
  email: SUPPORT_EMAIL,
  responseSla: 'Hasta 15 días hábiles según normativa de protección de datos',
  reasons: [
    {
      id: 'arco',
      title: 'Ejercicio de Derechos ARCO (Acceso / Rectificación / Supresión)',
      description: 'Solicita copia, corrección o verificación de eliminación de datos personales.',
      subject: '[FinanzApp ARCO] Solicitud de Derechos de Datos Personales',
      bodyTemplate:
        'Hola equipo FinanzApp,\n\nCorreo de mi cuenta: \nTipo de solicitud (Acceso / Rectificación / Supresión): \nDetalle:\n'
    },
    {
      id: 'reclamo',
      title: 'Canal de Reclamos y Soporte Técnico',
      description: 'Reporta incidentes de seguridad, cobros/errores visuales o reclamos formales.',
      subject: '[FinanzApp Reclamo] Ingreso de Reclamo / Soporte',
      bodyTemplate:
        'Hola equipo FinanzApp,\n\nCorreo de mi cuenta: \nDescripción del reclamo o problema:\nFecha aproximada:\n'
    },
    {
      id: 'menores',
      title: 'Reporte de Menor de Edad o Uso No Autorizado',
      description: 'Solicita cierre inmediato y borrado de una cuenta registrada por un menor de 18 años.',
      subject: '[FinanzApp Urgente] Reporte de Menor de Edad / Uso No Autorizado',
      bodyTemplate:
        'Hola equipo FinanzApp,\n\nSolicito la revisión y supresión de la cuenta asociada al correo: \nRelación con el titular (Padre / Madre / Tutor):\nComentarios:\n'
    }
  ]
};
