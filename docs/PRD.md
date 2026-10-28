# 📄 Product Requirement Document (PRD) - FinanzApp

## 1. Información General del Documento
* **Producto**: FinanzApp (Control Inteligente de Finanzas Personales, Cartolas Bancarias, Tarjetas de Crédito y Automatización en Tiempo Real)
* **Versión**: 2.0.0
* **Fecha de Última Actualización**: Octubre 2026
* **Estado**: En Producción / Evolución Continua
* **Stack Principal**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts + Supabase (PostgreSQL / Auth / RLS) + Vercel Serverless Functions (Webhooks Telegram & Google Wallet / MacroDroid)

---

## 2. Visión del Producto & Problema a Resolver

### 2.1. El Problema
Los usuarios de tarjetas de crédito y cuentas bancarias en Latinoamérica (particularmente en Chile) enfrentan los siguientes dolores recurrentes:
1. **Falta de visibilidad del saldo real**: Cuando una persona compra en cuotas, comparte gastos o realiza abonos parciales a su tarjeta de crédito durante el mes, los portales bancarios muestran únicamente el saldo facturado o el cupo total, sin reflejar el gasto neto remanente por compra ni proyectar cuánto se facturará al próximo corte.
2. **Formatos cerrados, desfase de fechas y duplicidad**: Cada banco (Banco de Chile, Santander, Itaú, BCI, BancoEstado, Scotiabank, Falabella, Ripley, Tenpo, Mercado Pago, etc.) emite cartolas en formatos CSV/Excel/PDF dispares y con desfases entre la fecha real de compra (ej. fin de semana en notificación móvil) y la fecha contable de facturación en cartola (ej. día hábil siguiente).
3. **Registro manual tedioso**: Anotar gastos uno por uno hace que el usuario abandone el hábito; sin embargo, al combinar notificaciones en tiempo real con cargas de cartola a fin de mes, se requiere un motor inteligente que concilie y detecte duplicados.
4. **Rigidez en presupuestos y compromisos fijos**: Las herramientas tradicionales obligan a presupuestar una sola categoría a la vez y no distinguen entre créditos estructurados, compras en cuotas con tarjeta y suscripciones recurrentes asociadas a un medio de pago específico.

### 2.2. La Solución (FinanzApp v2.0)
FinanzApp es una plataforma web financiera integral, interactiva y multi-dispositivo que combina **captura automática en tiempo real** con **conciliación inteligente de cartolas bancarias**:
* **Captura en Tiempo Real**: Registra gastos y transferencias al instante desde notificaciones de Android (**Google Wallet / Apps Bancarias vía MacroDroid**) y mediante el **Bot de Telegram**, identificando automáticamente la cuenta/tarjeta de origen, el comercio y el tipo de operación.
* **Carga Multiformato y Conciliación Anti-Duplicados**: Permite subir archivos `.csv`, `.xlsx`, `.xls` o pegar texto desde PDFs bancarios, excluyendo duplicados exactos y alertando sobre **"Posible Duplicidad"** por desfase de días hábiles ($\pm 7$ días).
* **Asociación de Pagos y Monto Real Utilizado**: Vincula abonos o pagos de tarjeta de crédito a compras específicas (FIFO o manual), filtrando estrictamente abonos elegibles mediante reglas `pago_tc`.
* **Gestión de Cuentas y Ciclos de Facturación**: Administra tarjetas de crédito (cupo, día de corte, día de pago) y cuentas de débito/vista/ahorro/efectivo (saldo inicial, ingresos vs. gastos acumulados y saldo estimado).
* **Créditos, Compras en Cuotas, Suscripciones y Proyección al Corte**: Organiza compromisos financieros en 3 pestañas especializadas con soporte para gastos compartidos, medio de pago asociado y simulador/generador de la **Próxima Facturación de Tarjetas de Crédito**.
* **Presupuestos Agrupables y Metas de Ahorro**: Permite crear presupuestos con nombre propio agrupando múltiples categorías (`📁`) y/o subcategorías (`🏷️`) con filtrado estricto e independiente, además de metas de ahorro con seguimiento de progreso.
* **Dashboard Personalizable**: Tarjetas de métricas a medida, gráficos por cuenta y reordenamiento *drag & drop* persistente en la nube.

---

## 3. Personas de Usuario (User Personas)

### 👤 Persona A: "Felipe el Ordenado" (Profesional Digital)
* **Perfil**: 28 años, paga todo con Google Wallet y usa 2 tarjetas de crédito y 2 cuentas vista/corriente. Comparte gastos con su pareja y tiene compras en 3, 6 y 12 cuotas sin interés.
* **Necesidad**: Que sus compras con el celular se registren solas al instante, que al subir la cartola a fin de mes no se dupliquen las compras del fin de semana, y poder proyectar exactamente cuánto le facturará cada tarjeta al día de corte sumando gastos del mes, cuotas y suscripciones.

### 👤 Persona B: "Claudia la Independiente" (Freelancer / Emprendedora)
* **Perfil**: 35 años, recibe y envía transferencias constantemente desde distintas apps bancarias y controla presupuestos mixtos (Hogar, Transporte, Insumos).
* **Necesidad**: Que las transferencias bancarias nunca se asignen por error a sus tarjetas de crédito, agrupar varias categorías y subcategorías bajo un mismo presupuesto personalizado, y auditar los ingresos vs. gastos reales de cada cuenta bancaria.

---

## 4. Requerimientos Funcionales

### 4.1. Módulo de Autenticación & Acceso
* **RF-01 (Autenticación Google OAuth)**: Inicio de sesión y registro con 1 clic a través de Google Cloud Console y Supabase Auth.
* **RF-02 (Autenticación Correo/Password)**: Creación de cuenta e inicio de sesión tradicional con validación de credenciales.
* **RF-03 (Modo Invitado / Demo)**: Exploración completa de la plataforma sin autenticarse usando datos simulados (`demoData.ts`). Al cerrar sesión, los datos privados se limpian y la aplicación retorna a la Landing Page.
* **RF-04 (Migración Automática)**: Transferencia transparente de datos locales a Supabase cuando un usuario en Modo Invitado decide registrarse o iniciar sesión por primera vez.

### 4.2. Módulo de Carga, Procesamiento de Cartolas & Control de Duplicados
* **RF-05 (Soporte Multiformato y Contraste Accesible)**:
  * Carga de archivos CSV (delimitados por coma o punto y coma) y Excel (`.xlsx`, `.xls` vía SheetJS).
  * Pegado de texto plano extraído de PDFs bancarios o estados de cuenta, garantizando alto contraste visual (`text-slate-900` sobre fondo claro) en todos los campos y selectores del modal (`ImportModal.tsx`).
* **RF-06 (Reconocimiento Inteligente de Columnas y Cuotas)**:
  * Detección automática de Fecha (`YYYY-MM-DD`, `DD/MM/YYYY`), Período (`Mes-Periodo` / `YYYY-MM`), Descripción, Monto en CLP y Cuotas contratadas (`X/Y`), separando monto facturado del mes vs. monto total contratado.
* **RF-07 (Exclusión Automática de Duplicados Exactos)**:
  * Al importar una cartola, el sistema compara cada fila contra las transacciones existentes en la misma cuenta. Si coinciden **Cuenta + Fecha exacta + Monto**, el movimiento se marca como duplicado exacto y se excluye automáticamente de la selección por defecto.
* **RF-08 (Detección de "Posible Duplicidad" por Desfase de Días Hábiles $\pm 7$ días)**:
  * Si un movimiento entrante tiene la **misma Cuenta y el mismo Monto** que una transacción existente dentro de una ventana de **$\pm 7$ días corridos** (pero en distinta fecha, típico de compras realizadas en fin de semana vía Google Wallet/Telegram y contabilizadas el lunes o martes en la cartola bancaria), el sistema lo etiqueta con alerta ámbar de **`⚠️ Posible Duplicada`** mostrando el detalle de la transacción original coincidente.
* **RF-09 (Resolución de Posibles Duplicadas en Previsualización y Tabla)**:
  * Tanto en la vista previa de `ImportModal.tsx` como en la tabla principal de movimientos (`TransactionTable.tsx`), el usuario puede inspeccionar la alerta de posible duplicidad y elegir entre **Aceptar ("No es duplicada")** —limpiando la alerta de forma permanente en base de datos— o **Eliminar / Omitir** el registro duplicado.
* **RF-09B (Persistencia Inmediata por Lotes, Resiliencia ante Fallos y Protección de Sesión)**:
  * Al confirmar la importación en `ImportModal.tsx`, las transacciones se guardan directamente en Supabase mediante `saveCloudTransactionsBatch` divididas en fragmentos (*chunks* de 50 items) con spinner interactivo de carga (*"Guardando en la nube..."*).
  * **Pre-aseguramiento de Cuentas**: Antes de insertar las transacciones, el motor verifica que todas las cuentas referenciadas existan en `public.accounts`, garantizando integridad referencial y eliminando errores por clave foránea (`transactions_account_id_fkey`).
  * **Salvaguardas Multinivel y Aislamiento de Errores**: Si un lote falla por discrepancias de columnas o anomalías, el sistema reintenta con esquemas progresivos y finalmente fila por fila, asegurando que ninguna fila válida sea descartada por un error individual.
  * **Protección contra Sobrescrituras en Refresco de Sesión**: Los movimientos se persisten inmediatamente en la caché aislada de `localStorage` y se bloquea el reemplazo del estado durante eventos `TOKEN_REFRESHED` o cambios de visibilidad en `onAuthStateChange`, evitando la pérdida de transacciones recién importadas.

### 4.3. Gestión Integral de Movimientos
* **RF-10 (Edición Completa mediante Modal)**:
  * Desde `TransactionTable.tsx`, cualquier movimiento puede editarse en un modal dedicado que permite modificar: Fecha, Mes-Período (`YYYY-MM`), Cuenta/Tarjeta asociada, Descripción, Monto, Tipo de Transacción (`compra`, `pago_tc`, `ingreso_venta`, `transferencia_enviada`, `transferencia_recibida`, `abono_general`), Categoría, Subcategoría y Cuotas (`currentInstallment` / `totalInstallments`), recalculando el Monto Real Utilizado al guardar.
* **RF-11 (Eliminación Individual y Masiva)**:
  * Selección múltiple de transacciones mediante checkboxes para eliminación por lotes o individual con confirmación de seguridad y sincronización inmediata en Supabase.

### 4.4. Gestión Avanzada de Cuentas & Ciclos de Facturación
* **RF-12 (Tipología de Cuentas y Campos Específicos)**:
  * En `AccountsManagementView.tsx`, el sistema distingue entre:
    * **Tarjetas de Crédito (`credit_card`)**: Configuran Cupo Total (`credit_limit`), Día de Corte/Facturación (`closing_day`, 1–31) y Día de Vencimiento/Pago (`due_day`, 1–31), además de últimos 4 dígitos (`account_number`).
    * **Cuentas de Débito / Vista / Corriente / Ahorro / Efectivo (`checking`, `sight`, `savings`, `cash`)**: Configuran **Saldo Inicial (`initial_balance`)** persistente en su propia columna de base de datos y número o terminación de cuenta (`account_number`).
* **RF-13 (Separación Estricta de Gastos vs. Ingresos en Resumen de Cuenta)**:
  * El panel de resumen de cada cuenta en `AccountsManagementView.tsx` separa estrictamente:
    * **Gastos Acumulados**: Compras y transferencias enviadas (`compra`, `transferencia_enviada`).
    * **Ingresos / Abonos Acumulados**: Sueldos, ventas, abonos y transferencias recibidas (`ingreso_venta`, `transferencia_recibida`, `abono_general`).
    * **Pagos de TC**: Identificados separadamente para no distorsionar los gastos de consumo ni inflar artificialmente los egresos.
* **RF-14 (Cálculo de Saldo Actual Estimado y Cupo Disponible)**:
  * Para cuentas de débito/vista/ahorro/efectivo:
    $$\text{Saldo Estimado} = \text{Saldo Inicial} + \text{Ingresos Acumulados} - \text{Gastos/Egresos Acumulados}$$
  * Para tarjetas de crédito: cálculo de deuda utilizada vs. cupo total (`credit_limit`), porcentaje de utilización y estado del ciclo actual según `closing_day` y `due_day`.

### 4.5. Motor de Asociación de Pagos TC & Monto Real Utilizado
* **RF-15 (Cálculo de Monto Real Utilizado)**:
  $$\text{Monto Real Utilizado} = \text{Monto Facturado} - \sum \text{Abonos Asociados}$$
* **RF-16 (Elegibilidad Estricta de Abonos para Pagar TC)**:
  * En `PaymentModal.tsx`, la opción *"Mostrar todas las cuentas"* inicia **desactivada por defecto** (`showAllAccounts = false`).
  * Solo se listan como abonos elegibles aquellos movimientos clasificados mediante reglas automáticas con tipo **`pago_tc`**, categorías explícitas de pago de tarjeta (`Pago Tarjeta de Crédito`) o devoluciones/reversas en la propia tarjeta, evitando que sueldos o transferencias comunes contaminen la lista de abonos disponibles.
* **RF-17 (Asociación Automática FIFO y Asociación Manual)**:
  * Asociación automática en orden cronológico (*First In, First Out*) o vinculación manual selectiva (total o parcial) con barra de búsqueda de compras pendientes, filtro por mes-período, desvinculación en 1 clic y acceso directo al creador de reglas automáticas.

### 4.6. Categorización Jerárquica & Reglas Automáticas con Tipos de Transacción
* **RF-18 (Vista Dual de Categorías y Reglas Automáticas)**:
  * `CategoryManagementView.tsx` se organiza en dos pestañas dedicadas:
    1. **Categorías y Subcategorías**: CRUD completo de la jerarquía de categorías generales y sus subcategorías.
    2. **Reglas Automáticas y Pagos TC**: Gestión centralizada de reglas basadas en patrones de texto (`pattern`).
* **RF-19 (Reglas Automáticas con Asignación de Tipo de Transacción)**:
  * Cada regla automática (`CategoryRule`) permite definir:
    * Patrón de búsqueda en la descripción (`pattern`, insensible a mayúsculas/acentos).
    * Categoría General (`category`) y Subcategoría (`subcategory`).
    * **Tipo de Transacción (`transactionType`)**: `pago_tc`, `compra`, `ingreso_venta`, `transferencia_enviada` o `transferencia_recibida`.
  * Incluye botón de **Aplicación Retroactiva** sobre los movimientos ya existentes y sincronización inmediata con el motor de pagos de TC.

### 4.7. Presupuestos Personalizados Agrupables & Metas de Ahorro
* **RF-20 (Presupuestos con Nombre Propio y Agrupación Multi-Categoría / Multi-Subcategoría)**:
  * En `BudgetAndGoalsView.tsx`, cada presupuesto (`BudgetConfig`) posee un **nombre personalizado** (`name`) y permite agrupar cualquier combinación de:
    * **Categorías Generales (`categories: string[]`)** identificadas con el badge `📁`.
    * **Subcategorías específicas (`subcategories: string[]`)** identificadas con el badge `🏷️`.
  * La interfaz provee un menú `+` con opciones separadas (*"📁 Agregar Categoría"* y *"🏷️ Agregar Subcategoría"*) y botones `×` en cada etiqueta para quitarlas en cualquier momento.
* **RF-21 (Separación Estricta en el Motor de Cálculo de Presupuestos)**:
  * La función `getBudgetSpending` evalúa `budget.categories` **exclusivamente** contra `tx.category` y `budget.subcategories` **exclusivamente** contra `tx.subcategory`, evitando falsos positivos cuando una categoría y una subcategoría comparten el mismo nombre (ej. Categoría `Transporte` vs. Subcategoría `Transporte`).
  * Además, integra en el consumo del período las cuotas vigentes o suscripciones activas cuya categoría coincida con las seleccionadas en el presupuesto, y ofrece un panel desplegable de **"Radiografía en Vivo"** con el desglose línea por línea.
* **RF-22 (Metas de Ahorro y Fondos)**:
  * Creación y seguimiento de metas financieras (`SavingsGoal` en tabla `savings_goals`) con monto objetivo (`target_amount`), monto ahorrado actual (`current_amount`), fecha límite (`deadline`), ícono/color y abonos rápidos.

### 4.8. Módulo de Créditos, Compras en Cuotas, Suscripciones & Proyección de Facturación TC
* **RF-23 (Separación en 3 Pestañas Especializadas)**:
  * En `CreditsManagementView.tsx`, los compromisos financieros se dividen en:
    1. **🏦 Créditos**: Créditos hipotecarios, de consumo, automotrices o préstamos personales (`hipotecario`, `consumo`, `automotriz`, `otro`).
    2. **🛍️ Compras en Cuotas**: Compras en cuotas con tarjeta de crédito (`cuotas_tc`), con seguimiento de cuotas pagadas vs. totales (`paid_installments` / `total_installments`) y barra de amortización.
    3. **🔄 Suscripciones**: Servicios y cargos recurrentes mensuales (`suscripcion`, ej. streaming, gimnasio, software, seguros) con monto fijo mensual y estado activo/pausado.
* **RF-24 (Asociación de Cuenta / Tarjeta de Pago y Gastos Compartidos)**:
  * Todo crédito, compra en cuotas o suscripción puede asociarse a una **Cuenta o Tarjeta de Pago (`account_id`)** y configurarse como **Gasto Compartido (`is_shared`)** definiendo el porcentaje (`my_share_percentage`) y monto real asumido por el usuario (`my_share_amount`).
* **RF-25 (Simulador y Generador de Facturación de Tarjetas de Crédito al Corte y Proyección Futura)**:
  * Mediante `CreditCardBillingModal.tsx`, el sistema proyecta la **Facturación Estimada** en la fecha de corte (`closing_day`) de cada tarjeta de crédito sumando:
    1. Compras directas registradas en el ciclo consultado de la tarjeta.
    2. Cuotas vigentes del período (`cuotas_tc`) asociadas a esa tarjeta (`account_id`), calculadas dinámicamente según la fecha de inicio (`start_date`), total de cuotas (`total_installments`) y cuotas pagadas (`paid_installments`). Si una compra en cuotas ya finalizó en un mes anterior, no se incluye ni suma en meses posteriores; si está vigente, muestra el número exacto de cuota para ese período (ej. *Cuota 6 de 6*).
    3. Suscripciones activas (`suscripcion`) y cargos recurrentes asociados a esa tarjeta, manteniéndose proyectados en meses futuros.
  * **Selector de Tarjeta Dropdown / Combo Box**: Menú desplegable interactivo que muestra la tarjeta activa con su ícono, nombre, banco y badge de día de corte, permitiendo alternar instantáneamente entre todas las tarjetas de crédito sin barras de scroll horizontal.
  * **Selector de Período Ampliado y Navegación Rápida**: Permite proyectar períodos futuros (hasta 18 meses hacia adelante) con botones de navegación mes a mes (`<` / `>`), selector desplegable con badges semánticos (*Mes Actual*, *Próximo Mes*, *Proyección Futura*) y recálculo automático instantáneo.
  * **Detección Inteligente y Multi-Factor de Cuotas y Suscripciones ya Facturadas**: Motor de coincidencia determinista que previene duplicados y doble contabilización evaluando de forma combinada:
    1. **Tarjeta y Período**: Cuenta bancaria (`account_id`) y ciclo consultado.
    2. **Monto Exacto/Aproximado**: Tolerancia de $\pm 2$ CLP respecto al monto de la cuota/cargo (`installment_amount`) o la porción del usuario (`my_share_amount`).
    3. **Total de Cuotas**: Validación y extracción en glosa bancaria (ej. `Cuota 4/24` o metadata `installments.total === total_installments`), penalizando inconsistencias de cuotas.
    4. **Afinidad de Texto y Stopwords**: Limpieza de palabras vacías bancarias (*Compra*, *En*, *Cuota*, *TC*, *Pago*, *S.A.*) y coincidencia por raíz semántica de tokens significativos (ej. *MAC* $\leftrightarrow$ *MACONLINE*, *Netflix* $\leftrightarrow$ *NETFLIX.COM*, *Bionet* $\leftrightarrow$ *BIONET S.A.*).
    5. **Prevención de Falsos Positivos**: Montos idénticos sin afinidad de texto ni cuotas no se vinculan erróneamente.
    6. **Feedback Visual y Control**: Si una cuota o suscripción ya está en los movimientos, muestra el badge verde `✅ Ya en movimientos (Cuota X/Y)` o `✅ Ya en movimientos`, bloquea y desmarca su checkbox para no duplicar en el Gran Total ni permitir doble creación al pulsar *"Generar Cuotas"*.
  * El usuario puede **generar/materializar con 1 clic** los cargos pendientes del período en la tabla de transacciones.

### 4.9. Automatización en Tiempo Real: Google Wallet / MacroDroid & Bot de Telegram
* **RF-26 (Webhook de Google Wallet y Notificaciones Bancarias vía MacroDroid)**:
  * El endpoint serverless `api/wallet-webhook.ts` recibe notificaciones push capturadas en Android por MacroDroid (`text` / `[notification]`, `title`, y `app` / `[not_app_name]`):
    * **Identificación de Cuenta por App de Origen (`findAccountByAppOrigin`)**: Asocia el nombre de la aplicación emisora (ej. *Banco Falabella*, *Banco de Chile*, *Santander*, *Itaú*, *Tenpo*, *Mercado Pago*, *MACH*) o los últimos 4 dígitos de la tarjeta directamente con la cuenta correspondiente del usuario en Supabase.
    * **Clasificación Inteligente de Movimientos**: Distingue entre `compra`, `transferencia_enviada` y `transferencia_recibida`, extrayendo el destinatario o remitente real y limpiando frases genéricas bancarias (ej. *"Tu transferencia fue realizada con éxito a..."*).
    * **Exclusión Estricta de Tarjetas de Crédito en Transferencias**: Cuando la notificación corresponde a una transferencia enviada o recibida, el motor **excluye todas las cuentas tipo `credit_card`**, asignándola únicamente a cuentas bancarias de débito/vista/corriente/ahorro de la entidad detectada.
    * **Deduplicación Temporal**: Previene registros dobles si el banco y Google Wallet emiten notificaciones simultáneas por la misma compra dentro de una ventana de 30 minutos.
* **RF-27 (Integración con Bot de Telegram)**:
  * El endpoint `api/telegram-webhook.ts` y el modal `TelegramConfigModal.tsx` permiten vincular el `telegram_chat_id` del usuario para registrar gastos por mensaje en lenguaje natural y recibir confirmaciones instantáneas de cada movimiento procesado.

### 4.10. Dashboard Personalizable, Filtros & Exportación
* **RF-28 (Tarjetas de Métricas y Gráficos Personalizables con Drag & Drop)**:
  * `CustomizeDashboardModal.tsx` y `MetricCards.tsx` permiten crear tarjetas de indicadores a medida (filtradas por cuenta, categoría, subcategoría o tipo de movimiento), habilitar gráficos por cuenta específica y reordenar tarjetas/gráficos mediante *drag & drop* (compatible con mouse en escritorio y eventos táctiles en móvil), persistiendo el diseño en `user_settings`.
* **RF-29 (Filtros Globales y Multi-Select)**:
  * Filtrado combinado por Cuenta/Tarjeta, Mes/Período (`YYYY-MM`), Tipo de Transacción, Categorías y Subcategorías multi-select, búsqueda por texto libre y switch para *"Solo compras pendientes con saldo real $> 0$"*.
* **RF-30 (Exportación Consolidada a Excel)**:
  * Descarga en formato `.xlsx` de las transacciones filtradas incluyendo categoría, subcategoría, cuenta, cuotas, abonos asociados y Monto Real Utilizado.

### 4.11. Sistema de Diseño Stitch ("Neon Tokyo" / Terminal Financiero)
* **RF-31 (Tokens de Diseño, Paleta Neón y Tipografía Tripartita - Fase 1)**:
  * Base visual fundacional basada en Google Stitch ("Neon Tokyo") configurada en `tailwind.config.js`, `index.html` y `src/index.css`:
    * **Paleta de Colores de Alto Contraste**:
      * Fondo Principal: `#0A0A12` (`background.lowest`) y `#0F0F1A` (`background.subtle`).
      * Contenedores de Tarjetas y Superficies: `#111118` (`surface`) y `#141422` (`surface.card` / `surface.container`).
      * Primario (Magenta Neón): `#FF2D78` (`primary`).
      * Secundario (Cyan Neón / Menta): `#00FFCC` (`secondary`).
      * Terciario (Oro Neón / Amarillo Alerta): `#FFE04A` (`tertiary`) y `#F59E0B` (`tertiary.amber`).
      * Contenido y Texto: `#E8E0F0` (`content.primary`) y `#A098B0` (`content.secondary`).
      * Bordes y Contornos: `#302840` (`outline`) y `rgba(148, 163, 184, 0.08)` (`outline.subtle`).
    * **Tipografía Tripartita Web**:
      * Encabezados y Títulos: **Sora** (`font-headline`, `font-display`).
      * Texto General y Tablas: **Inter** (`font-body`, `font-sans`).
      * Números, Monedas y Códigos: **Space Grotesk** (`font-mono`, `font-label`).
    * **Efectos de Brillo y Borde Fino**:
      * `.panel-rim`: Borde ultrafino con iluminación cenital interna (`box-shadow: inset 0 1px 0 0 rgba(248, 250, 252, 0.06)`).
      * `.glow-primary`: Resplandor magenta difuso (`box-shadow: 0 0 16px -2px rgba(255, 45, 120, 0.25)`).
      * `.glow-secondary`: Resplandor cyan difuso (`box-shadow: 0 0 16px -2px rgba(0, 255, 204, 0.25)`).
* **RF-32 (Navegación Móvil Ergonómica y Rediseño de Sidebar/TopBar de Escritorio - Fase 2)**:
  * **Barra de Navegación Móvil Inferior (`BottomNavBar.tsx`)**:
    * Fijada en la parte inferior de la pantalla (`fixed bottom-0 left-0 right-0 z-50 md:hidden`) con fondo ultra oscuro `#0A0A12`/95 y efecto blur (`backdrop-blur-md`).
    * 5 accesos directos al alcance del pulgar con altura táctil mínima de 48px y feedback visual activo (`text-primary` magenta `#FF2D78`):
      1. `🏠 Dashboard`: Acceso directo al panel de control y resumen financiero.
      2. `📋 Movimientos`: Vista de cartola, transacciones y detalle de gastos.
      3. `💳 Cuentas`: Gestión de cuentas bancarias y tarjetas de crédito.
      4. `⚖️ Conciliar`: Herramienta de conciliación con badge numérico ámbar (`duplicateCount`) si existen transacciones con sospecha de duplicidad.
      5. `☰ Menú`: Action Sheet modal con accesos a Presupuestos y Metas, Créditos y Cuotas, Categorías y Reglas, Bot de Telegram, Google Wallet y Sesión de Usuario.
    * El área de trabajo principal implementa padding inferior (`pb-24 md:pb-6`) para garantizar que ningún botón ni dato quede cubierto por la barra fija.
  * **Sidebar Lateral de Escritorio (`Sidebar.tsx`)**:
    * Ancho fijo de 260px (`w-64`) con fondo `#0A0A12`, borde derecho sutil `#302840` y tipografías Sora/Space Grotesk.
    * Botón de acción principal destacado `+ Nuevo Movimiento` con resplandor neón magenta (`glow-primary`).
    * **Indicadores de Estado en Vivo (Live Status)**:
      * 🤖 *Telegram Bot*: Indicador activo en magenta/verde con punto pulsante (`animate-pulse`).
      * ⚡ *MacroDroid / Wallet*: Indicador de conexión en cyan menta (`#00FFCC`).
    * Tarjeta de perfil de usuario en la base con acabado `panel-rim` y opciones de autenticación / cierre de sesión.
  * **Barra Superior de Escritorio (`TopBar.tsx`)**:
    * Navegación rápida de meses con botones de paso anterior y siguiente (`< Octubre 2026 >`).
    * Barra de búsqueda global integrada con atajo de teclado nativo `⌘K` / `Ctrl+K`.
    * Píldora de estado de sincronización en la nube (`Sync Nube` con spinner dinámico) y badges de notificación.
* **RF-33 (Terminal Financiero: Dashboard Central, 4 KPIs con Micro-Indicadores, Alerta de Duplicidad y Grid de Cuentas - Fase 3)**:
  * **Banner Superior de Alerta de Duplicidad (RF-09)**:
    * Componente [`DuplicateAlertBanner.tsx`](file:///Users/EcheverriaTorcates/Documents/Proyectos/FinanzApp/src/components/DuplicateAlertBanner.tsx) renderizado en el Dashboard cuando existen movimientos con `isPotentialDuplicate = true`.
    * Diseño ámbar discreto (`bg-[#F59E0B]/10 border-l-[4px] border-l-[#F59E0B] rounded-2xl panel-rim`) que contrasta la glosa de la cartola bancaria con la descripción original registrada previamente vía webhook (Google Wallet o Telegram).
    * Acciones en 1 solo clic: "No es Duplicada / Conservar", "Eliminar Duplicada" y acción en lote "Aceptar Todas".
  * **4 Tarjetas de Métricas de Estilo Terminal Financiero (`MetricCards.tsx`)**:
    * Rediseñadas bajo la estética Stitch (fondo `#141422`, borde `#302840`, panel-rim y tipografía Space Grotesk/JetBrains Mono):
      1. *Saldo Disponible en Cuentas*: Suma de saldos en cuentas vista y corrientes con micro-desglose base `Base: $X | +$Y (Ingresos) | -$Z (Gastos)`.
      2. *Deuda Utilizada en TC*: Saldo adeudado en tarjetas de crédito con micro-barra de progreso cian (`bg-[#00FFCC]`) que calcula el porcentaje de cupo ocupado y micro-desglose `Cupo: $A | Disp: $B`.
      3. *Facturación al Corte*: Proyección de facturación mensual al día de corte con badge ámbar indicador del día de cierre bancario, micro-desglose `Ciclo: $A | Cuotas: $B | Sub: $C` y trigger directo para abrir el modal de simulación de facturación.
      4. *Gasto Neto Real del Mes*: Monto real utilizado (descontando abonos) con barra de progreso magenta (`bg-[#FF2D78]`) respecto al límite global presupuestado y micro-desglose `Límite: $A | Margen: $B`.
  * **Widget Lateral / Destacado de Facturación en 1 Clic**:
    * Widget integrado en [`ChartsDashboard.tsx`](file:///Users/EcheverriaTorcates/Documents/Proyectos/FinanzApp/src/components/ChartsDashboard.tsx) que resume de forma compacta las cuotas y suscripciones vigentes del ciclo con botón de acceso rápido `⚡ Generar cargos pendientes (1 clic)`.
  * **Grid Interactivo de Cuentas y Tarjetas de Crédito**:
    * Panel de tarjetas bancarias interactivas con branding por entidad (CMR/Falabella, Santander, Banco de Chile, BCI, Tenpo, etc.), barras de cupo dinámicas, días de corte y vencimiento para TC, y saldo estimado para cuentas vista/corrientes.
    * Permite filtrar todo el dashboard por cuenta con 1 solo clic (`onSelectAccount`).
* **RF-34 (Tabla y Feed de Movimientos con Badges de Origen, Chips de Filtrado y Vista Móvil en Tarjetas - Fase 3)**:
  * **Barra de Filtros Rápidos (Chips Horizontales)**:
    * Selectores tipo chip con conteo dinámico: `Todos (N)`, `Solo Pendientes`, `Tarjetas de Crédito`, `Débito / Transferencias` y `Compras en Cuotas`.
    * Selector de ordenamiento interactivo: `Más recientes primero`, `Mayor monto` y `Por Estado Conciliación` (prioriza movimientos con alerta de duplicidad y compras de TC pendientes de abono).
  * **Estilo de Filas en Tabla de Escritorio (`Pantalla7.html` / `TransactionTable.tsx`)**:
    * Contenedor de tabla bajo diseño Stitch (`panel-rim`, borde `#302840`, cabecera `#0E0E18` y texto secundario `#A098B0`).
    * **Columna 1 (Fecha & Origen)**: Fecha en fuente monoespaciada (`18 Oct 2026`) con selector editable de período contable (`Mes: YYYY-MM`) y badge distintivo de procedencia: `Google Wallet` (ámbar neón `#FFE04A`), `Santander Transfer` (menta `#00FFCC`), `Cartola Falabella` (slate `#A098B0`), `Webhook Telegram` (magenta `#FF2D78`) o `Cartola Bancaria`.
    * **Columna 2 (Descripción & Comercio)**: Glosa comercial en tipografía Space Grotesk destacada con badge de posible duplicidad (`Doble?`) y nombre de la cuenta bancaria / tarjeta asociada (`CMR Falabella ••4821`).
    * **Columna 3 (Categoría)**: Píldora redondeada con emoji representativo (`🛒 Supermercado`, `🚗 Transporte`, `📺 Streaming`, etc.) y selector desplegable interactivo para re-categorización instantánea.
    * **Columna 4 (Tipo & Cuotas)**: Etiqueta de tipo de movimiento y fracción de cuotas con badge dorado (`4 / 12 cuotas`).
    * **Columna 5 (Monto Facturado / Real)**: Cifras con signo y color diferenciado (+ en cian/menta `#00FFCC` para abonos e ingresos, - en blanco/slate `#E8E0F0` para gastos), desglose de abonos aplicados y monto neto real utilizado o indicador de `Pagada 100%`.
    * **Columna 6 (Acciones)**: Acceso directo a vinculación FIFO (`Link2`), edición modal (`Pencil`), eliminación segura (`Trash2`) y resolución de duplicidad en 1 clic (`Check`).
  * **Vista Móvil en Tarjetas Táctiles (`Mobile2.html` / `TransactionTable.tsx`)**:
    * En pantallas `< 768px` (`md:hidden`), las transacciones se renderizan como tarjetas individuales en un feed vertical de alta ergonomía táctil sin desbordamiento horizontal:
      * Cabecera con checkbox de selección múltiple, fecha monoespaciada y badge de origen.
      * Cuerpo con comercio/descripción destacado a la izquierda y monto principal a la derecha en tipografía grande con micro-indicador de saldo neto.
      * Pie de tarjeta con categoría e ícono, tipo de transacción, fracción de cuotas y botones de acción táctiles de 44px de altura mínima.
* **RF-35 (Gestión de Cuentas & Tarjetas con Panel de Auditoría Matemática y Desglose en Tiempo Real - Fase 3)**:
  * **Pestañas Superiores de Filtrado de Instrumentos**:
    * Pestañas interactivas tipo chip con conteo en vivo: `Todas las Cuentas`, `Tarjetas de Crédito`, `Cuentas Vista & Corrientes` y `Prepago / Otras`.
  * **Grid Principal de Cuentas Interactivas (`Pantalla2.html` / `AccountsManagementView.tsx`)**:
    * Tarjetas de cuentas con logotipo/avatar institucional por entidad (CMR/Falabella, Santander, Banco de Chile, BCI, Tenpo, BancoEstado, etc.).
    * **Para Tarjetas de Crédito**: Visualización de deuda utilizada vs cupo disponible con micro-barra de progreso dinámica, fechas clave (Día de corte y Día de pago), y estado de ocupación de línea de crédito.
    * **Para Cuentas de Débito / Vista / Ahorro**: Saldo estimado actual en cian/verde neón (`#00FFCC`), saldo base inicial y variación del período.
    * Selección interactiva de tarjeta con borde neón activo (`border-[#00FFCC]`) que actualiza la columna de auditoría en tiempo real.
  * **Columna Lateral de Auditoría & Desglose en Tiempo Real**:
    * Panel dedicado en el lateral derecho que audita la fórmula matemática exacta sin ambigüedades:
      * **Para Cuentas Vista/Corrientes (Fórmula Exacta RF-14)**:
        * `(+) Saldo Inicial Registrado`
        * `(+) Ingresos Validados` (Sueldos, transferencias recibidas)
        * `(-) Egresos de Consumo` (Débitos, compras cotidianas)
        * `(-) Pagos TC` (Aislados para evitar duplicidad de cargos)
        * `(=) Saldo Estimado Disponible` (Cifra destacada en 2xl)
        * Píldora de variación neta del período (`+X% Neto`).
      * **Para Tarjetas de Crédito (Desglose de Facturación y Deuda del Ciclo)**:
        * `(+) Compras Directas del Mes`
        * `(+) Cuotas Imputadas al Período`
        * `(+) Suscripciones y Recurrentes`
        * `(-) Abonos y Pagos Aplicados`
        * `(=) Deuda Utilizada / Facturada`
        * Barra de progreso de cupo total vs cupo disponible y badges de días de corte/pago.
    * Botón de acceso directo: "Reconciliar Saldo con Cartola Bancaria" y "Simular Facturación al Corte".
  * **Modal Unificado de Creación y Edición de Cuentas**:
    * Drawer modal flotante para configurar nombre descriptivo, entidad financiera, tipo de instrumento, terminación, cupo/saldo inicial y días de corte/vencimiento (1 al 31).
* **RF-36 (Presupuestos Agrupables Multi-Categoría con Radiografía en Vivo y Metas de Ahorro Stitch - Fase 4)**:
  * **Resumen Superior de Presupuestos (4 Tarjetas de Indicadores)**:
    1. **Presupuesto Total**: Límite mensual consolidado de todos los presupuestos activos (`formatCLP(totalBudgeted)`).
    2. **Gasto Ejecutado**: Total consumido con badge de porcentaje del límite (`80% en rango`, `atención` o `excedido`) y margen restante disponible.
    3. **Ahorro en Metas**: Total acumulado en metas de ahorro activas (`formatCLP(totalSavingsCurrent)`).
    4. **Aporte Programado del Mes**: Monto destinado al ahorro mensual proyectado según ritmo y fechas de metas activas.
  * **Presupuestos Agrupables Multi-Categoría (`Pantalla6.html` / `BudgetAndGoalsView.tsx`)**:
    * Renderizado en tarjetas Stitch (`#141422`, `panel-rim`, bordes `#302840`) con nombre personalizado y etiquetas combinadas de categorías (`📁` en cian `#00FFCC`) y subcategorías (`🏷️` en magenta `#FF2D78`).
    * Monto gastado vs límite asignado (`$280K / $350K` o `$280.000 / $350.000`) con badge de porcentaje y margen restante (`Quedan $70.000 CLP` o `Excedido por $X`).
    * Barra de progreso con cambio dinámico de color: verde/cian (<80%), amarillo (80-99%), magenta/rojo (>=100%).
  * **Panel Desplegable "Radiografía en Vivo (RF-21)"**:
    * Botón interactivo *"Ver Radiografía en Vivo"* / *"Ocultar Radiografía"* con ícono de microscopio.
    * Despliega línea por línea el listado de compras, cuotas o suscripciones imputadas exactamente a ese presupuesto, con fecha, comercio, avatar/logo de cuenta bancaria y monto neto real.
    * Indicador de Presupuesto Diario Sugerido (`$X / día`) para los días restantes del período.
  * **Metas de Ahorro & Fondos Programados (`Pantalla6.html` / `Mobile7.html`)**:
    * Tarjetas para cada meta de ahorro con ícono temático, meta objetivo, monto acumulado, fecha límite y barra de progreso porcentual (`from-[#00FFCC] to-[#38bdf8]`).
    * **Aporte Rápido con 1 Toque**: Selector integrado con chips de aportes preconfigurados (`+$10.000`, `+$20.000`, `+$50.000`, `+$100.000`) o monto manual con feedback instantáneo.
  * **Modales de Creación y Edición**:
    * Modal para crear/editar presupuestos agrupables con selector dinámico de categorías y subcategorías.
    * Modal para crear/editar metas de ahorro con selector de íconos temáticos y fechas objetivo.
* **RF-37 (Créditos, Compras en Cuotas, Suscripciones y Simulador de Facturación TC Stitch - Fase 4)**:
  * **Resumen Superior de Deuda & Facturación (Hero Card en `CreditsManagementView.tsx`)**:
    * **Tarjeta Principal de Próxima Facturación al Corte**: Proyección del monto a liquidar para la tarjeta de crédito activa con badge de entidad bancaria (`getBankBranding`), fecha de corte estimada (`Día X de Mes YYYY`), desglose en tres partes (compras directas del mes, cuotas imputables y suscripciones recurrentes) y botón de acción directa `⚡ Generar cargos al corte (1 clic)`.
    * **4 Tarjetas de Indicadores Consolidados**: Deuda Total Restante (mi parte por amortizar), Cuotas Activas (compras vigentes y compromiso mensual), Suscripciones Mensuales (costo recurrente activo) y Monto de Gastos Compartidos (porción compartida con terceros).
  * **Pestañas Especializadas**:
    * `🏦 Créditos`: Préstamos hipotecarios, de consumo, automotrices y personales con amortización, tasa de interés (CAE/mensual), proyección de fecha de término calculada y registro rápido de cuota pagada.
    * `🛍️ Compras en Cuotas`: Compras a plazos en tarjetas de crédito con barra de progreso en neón (`#00FFCC` a `#38bdf8`), badge destacado de cuota que toca pagar este mes (ej. `⚡ Cuota 4 de 12`), saldo pendiente y tarjeta vinculada.
    * `🔄 Suscripciones`: Servicios mensuales recurrentes (streaming, gimnasio, seguros) con interruptor interactivo Activo/Pausado, proyección de costo anual, día del cobro y registro de cobro al día.
  * **Modal de Simulación de Facturación al Corte (`CreditCardBillingModal.tsx`)**:
    * Selector dropdown estilizado de tarjeta de crédito con branding bancario (sin scrollbars horizontales).
    * Selector interactivo de períodos pasados y futuros (`< Período >`).
    * Lista de verificación con checkboxes para cuotas y suscripciones con badge `✅ Ya en movimientos` para ítems ya facturados en el ciclo.
    * Botón de acción masiva en 1 clic: `⚡ Generar Cargos Seleccionados (N)`.
* **RF-38 (Gestor de Categorías, Editor Visual de Reglas Automáticas RF-19 y Monitor de Webhooks - Fase 4)**:
  * **Métricas Superiores del Motor de Reglas (4 Tarjetas de Indicadores)**:
    1. *Reglas Activas*: Conteo total de reglas de clasificación (`autoRules.length`).
    2. *Precisión Motor*: Tasa de coincidencia exitosa (`98.4%`).
    3. *Transacciones Asignadas*: Cobertura de clasificación en cartolas y webhooks (`totalAssigned / totalTransactions`).
    4. *Aislamiento de Tipo (RF-19)*: Porcentaje de reglas con `transactionType` explícito obligatorio (`100%`).
  * **Editor Visual de Regla Inteligente (`Pantalla3.html` / `CategoryManagementView.tsx`)**:
    * Campo de patrón de búsqueda con soporte de expresiones o palabras clave (`PAGO TARJETA | CRÉDITO FALABELLA | UBER | NETFLIX`).
    * Selectores sincronizados de Categoría General y Subcategoría.
    * **Selector Visual de Tipo de Transacción Obligatorio (RF-19)** con tarjetas interactivas estilo chips (`pago_tc`, `compra`, `ingreso_venta`, `transferencia_enviada`, `transferencia_recibida`, `comision_interes`).
    * Botón de acción: `⚡ Guardar y Probar Regla`.
    * Botón de ejecución en lote: `⚡ Aplicar a Todo el Historial`.
    * Filtros por tipo y buscador instantáneo de reglas.
  * **Panel de Automatizaciones & Webhook Live Stream (`Pantalla9.html` / `Mobile8.html`)**:
    * Indicador de eficiencia: `78% de gastos capturados automáticamente (~4.5 horas ahorradas)`.
    * Endpoint personal de MacroDroid (Android) con botones de copiar URL y regenerar token secreto.
    * Botón de acceso directo a integración y handshake de Telegram Bot.
    * **Consola de Live Log Stream**: Streaming en vivo estilo terminal (`bg-[#0A0A12]`) con estado HTTP `[200 OK]`, timestamp, glosa recibida, monto analizado y categoría asignada.
    * **Simulador de Notificaciones (Tester Integrado)**: Disparador interactivo de pruebas HTTP POST con plantillas rápidas (Starbucks, Jumbo, Pago TC).
  * **Gestor de Categorías y Subcategorías**:
    * Panel Master-Detail con creación, edición en línea y eliminación protegida de taxonomías financieras bajo diseño Stitch (`#141422`, `panel-rim`, bordes `#302840`).

* **RF-39 (Personalización Dinámica del Dashboard RF-28, Creador Visual de Métricas y Grid Reordenable Stitch - Fase 4)**:
  * **Renderizado Dinámico de Grilla de Indicadores (`MetricCards.tsx`)**:
    * Mapeo dinámico y reactivo basado exclusivamente en las tarjetas activas (`metrics.filter(m => m.enabled)`).
    * Grilla auto-adaptable según la cantidad de tarjetas visibles:
      * 1 tarjeta: `grid-cols-1`
      * 2 tarjetas: `grid-cols-1 sm:grid-cols-2`
      * 3 tarjetas: `grid-cols-1 sm:grid-cols-3`
      * 4 tarjetas: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`
      * 5 o más tarjetas: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
    * Estética Stitch ("Neon Tokyo"): Fondos `#111118`, borde `#302840`, `panel-rim`, badges temáticos de categoría/tipo, montos numéricos en tipografía monoespaciada (`Space Grotesk`) y micro-indicadores contextuales.
    * Soporte integral para indicadores del sistema (`liquidity`, `credit_card_debt`, `billing_projection`, `monthly_net_spent`, `gross_expenses`, `total_payments`, `net_amount_used`, `unallocated_tc`, `net_balance`) e indicadores personalizados creados por el usuario con filtrado estricto por cuenta o categoría.
    * Estado de contingencia accesible cuando el usuario oculta todas las métricas, con llamada directa a la configuración.
  * **Modal de Personalización de Grilla y Widgets (`CustomizeDashboardModal.tsx` / `Pantalla4.html` & `Mobile10.html`)**:
    * **3 Pestañas Especializadas**:
      1. `Tarjetas de Métricas`: Lista de indicadores con interruptores rápidos estilo neón (`#00FFCC`), badges de tipo y selector para abrir el constructor visual.
      2. `Gráficos por Cuenta`: Activación de módulos gráficos (`budgets_progress`, `category_pie`, `monthly_trend`, `account_breakdown`, `account_specific`) y generador de gráficos exclusivos por tarjeta.
      3. `Disposición de Grilla (Drag & Drop)`: Reordenador visual intuitivo de tarjetas e indicadores con botones de subir/bajar posición (`ChevronUp`/`ChevronDown`), indicador numérico (#1, #2, ...) y arrastre táctil/desktop con doble barra (`Equal`/`GripVertical`).
    * **Configurador de Indicador Personalizado (Live Builder)**:
      * Título y Nombre personalizado.
      * Tipo de cálculo (`compra`, `pago_tc`, `total_payments`, `gross_expenses`, `net_amount_used`, `net_balance`, `custom`).
      * Filtro por cuenta específica o global.
      * Filtro por categoría o global.
      * Paleta de acentos Stitch: Cian Neón (`#00FFCC`), Rosa Neón (`#FF2D78`), Amarillo Neón (`#FFE04A`), Azul Eléctrico (`#38bdf8`), Púrpura (`#A78BFA`), Esmeralda (`#10B981`) y Carmesí (`#F43F5E`).
      * **Previsualización en Vivo (Live Preview)**: Renderizado en tiempo real de la tarjeta Stitch con sus badges, colores y monto de demostración antes de confirmar la adición.
    * **Persistencia Multi-Dispositivo**: Almacenamiento instantáneo y resiliente en `localStorage` y en la columna `dashboard_config` (`JSONB`) de la tabla `user_settings` de Supabase, con normalización retrocompatible de versiones previas.

* **RF-40 (Mascota Virtual Interactiva "Billetera con Vida" y Mecánica de Estados Waking Mascot)**:
  * **Motor de Ciclo de Vida en Tiempo Real (`mascotEngine.ts`)**:
    * Computa dinámicamente en el frontend los indicadores de actividad sin requerir almacenamiento ni scripts DDL en la base de datos:
      * `txTodayCount`: Cantidad de movimientos registrados en el día de hoy (`date === today`).
      * `daysInactive`: Días transcurridos desde el último movimiento registrado en la plataforma on or before today.
    * **5 Estados Progresivos (Tiers)**:
      * **Tier 0 (Sueño Profundo / Inactiva)**: `daysInactive >= 5` y `txTodayCount === 0`. Imagen `/images/wallet_mascot_sleeping_128x128.png`, animación `mascot-breathe` y mensaje `"Zzz... 5 días inactiva... Anota un gasto para despertarme 💤"`. Energía al 10%.
      * **Tier 0.5 (Espera Matutina)**: `daysInactive < 5` y `txTodayCount === 0`. Imagen `/images/wallet_mascot_sleepy_128x128.png`, animación `mascot-breathe` y mensaje `"☀️ ¡Buenos días! Esperando tu primer movimiento de hoy."`. Energía al 35%.
      * **Tier 1 (Desperezándose)**: `txTodayCount === 1` o `2`. Imagen `/images/wallet_mascot_sleepy_128x128.png`, animación `mascot-yawn` y mensaje `"🥱 ¡Buaah! Frotándome los ojitos... Ya casi me levanto."`. Energía al 60%.
      * **Tier 2 (Despierta & Atenta)**: `txTodayCount === 3` o `4`. Imagen `/images/wallet_mascot_neutral_128x128.png`, animación `mascot-steady` y mensaje `"😐 Listo, ya abrí los ojos. Atento a todos tus movimientos."`. Energía al 80%.
      * **Tier 3 (Plenamente Activa & Feliz)**: `txTodayCount >= 5`. Imagen `/images/wallet_mascot_logo_128x128.png`, animación `mascot-happy-bounce` y mensaje `"😄🎉 ¡Siiii! ¡Al fin totalmente activa y con las finanzas al día!"`. Energía al 100%.
  * **Animaciones CSS Dedicadas (`index.css`)**:
    * `mascot-breathe`: Respiración lenta con escala y sombra pulsante.
    * `mascot-yawn`: Bostezo con oscilación y estiramiento elástico.
    * `mascot-steady`: Mirada atenta y micro-elevación rítmica.
    * `mascot-happy-bounce`: Salto de celebración con rotación festiva estilo Duolingo/Tamagotchi.
  * **Integración Multi-Dispositivo (`WakingMascotWidget.tsx`)**:
    * **Sidebar de Escritorio**: Mini-avatar en cabecera junto al logotipo con globo de diálogo flotante interactivo (*speech bubble*) y tarjeta de estado al pasar el cursor o hacer clic.
    * **Dashboard Central**: Banner interactivo principal con avatar en tamaño completo, globo de diálogo con animación flotante, barra de progreso hacia la meta diaria de 5 gastos y botón de acción rápida para registrar movimiento.
    * **TopBar & Barra Móvil Inferior**: Mini-avatar con badge de energía en porcentaje y emoji de humor contextual visible permanentemente en smartphones.

---

## 5. Modelo de Datos Normalizado (Supabase PostgreSQL)

Todas las tablas cuentan con **Row Level Security (RLS)** activo bajo la política `auth.uid() = user_id`. Cada atributo de negocio se almacena en su propia columna dedicada (sin sobrecarga de columnas):

| Tabla | Columnas Principales | Propósito |
| :--- | :--- | :--- |
| **`accounts`** | `id`, `user_id`, `name`, `bank`, `type` (`credit_card`, `checking`, `sight`, `savings`, `cash`), `credit_limit`, `initial_balance`, `closing_day`, `due_day`, `account_number`, `color` | Almacena tarjetas de crédito y cuentas bancarias separando estrictamente `credit_limit` (cupo TC) de `initial_balance` (saldo inicial débito/vista). |
| **`transactions`** | `id`, `user_id`, `date`, `period`, `description`, `amount`, `real_amount`, `account`, `category`, `subcategory`, `transaction_type`, `current_installment`, `total_installments`, `associated_payments` (`JSONB`), `is_paid`, `potential_duplicate_of`, `duplicate_dismissed`, `source` | Registro central de movimientos, abonos vinculados, cuotas y estado de alerta de posible duplicidad. |
| **`rules`** | `id`, `user_id`, `pattern`, `category`, `subcategory`, `transaction_type` | Reglas automáticas de categorización y asignación explícita de tipo de movimiento (`pago_tc`, `compra`, etc.). |
| **`budgets`** | `id`, `user_id`, `name`, `category`, `categories` (`JSONB`), `subcategories` (`JSONB`), `monthly_limit`, `alert_threshold` | Presupuestos personalizados con soporte nativo para listas independientes de categorías y subcategorías. |
| **`credits`** | `id`, `user_id`, `name`, `category_type` (`hipotecario`, `consumo`, `automotriz`, `cuotas_tc`, `suscripcion`, `otro`), `account_id`, `total_amount`, `installment_amount`, `total_installments`, `paid_installments`, `start_date`, `payment_day`, `category`, `subcategory`, `is_shared`, `my_share_percentage`, `my_share_amount`, `status` | Créditos bancarios, compras en cuotas y suscripciones mensuales vinculadas a su cuenta/tarjeta de pago (`account_id`). |
| **`savings_goals`** | `id`, `user_id`, `name`, `target_amount`, `current_amount`, `deadline`, `category`, `color`, `icon` | Metas de ahorro y fondos específicos del usuario. |
| **`categories`** | `id`, `user_id`, `name`, `subcategories` (`JSONB`), `color`, `icon` | Árbol jerárquico de categorías y subcategorías personalizadas. |
| **`user_settings`** | `user_id`, `telegram_chat_id`, `webhook_secret`, `dashboard_config` (`JSONB`), `updated_at` | Preferencias del usuario, credenciales de integración (Telegram/MacroDroid) y layout del dashboard. |

---

## 6. Requerimientos No Funcionales

* **RNF-01 (Costo Operacional \$0 USD)**: La infraestructura opera íntegramente dentro de los niveles gratuitos (*Free Tiers*) de Supabase (PostgreSQL + Auth) y Vercel (Frontend + Serverless Webhooks).
* **RNF-02 (Seguridad & RLS)**: Aislamiento estricto por usuario (`auth.uid() = user_id`) en todas las tablas de Supabase y validación de tokens/secretos en los endpoints de webhook.
* **RNF-03 (Integridad y Normalización de Base de Datos)**: Ninguna funcionalidad debe reutilizar ni sobrecargar columnas destinadas a otro propósito (ej. prohibido guardar `initial_balance` en `credit_limit` o serializar datos de negocio dentro de identificadores). Todo nuevo requerimiento que incorpore atributos persistentes debe acompañarse de su respectivo script DDL (`ALTER TABLE`) y migración de datos (`UPDATE`).
* **RNF-04 (Accesibilidad Visual y Contraste UI)**: Todos los formularios, áreas de texto (`textarea`), inputs y selectores desplegables sobre fondos blancos o claros deben especificar explícitamente clases de texto oscuro (`text-slate-900`, `bg-white`, `placeholder:text-slate-400`) para evitar texto invisible cuando el contenedor global utilice temas oscuros.
* **RNF-05 (Performance & Privacidad Local en Parseo)**: El parseo de archivos CSV/Excel/PDF se ejecuta en memoria en el navegador del cliente en $< 500\text{ ms}$ para cartolas de hasta 2.000 filas, sin subir archivos bancarios crudos a servidores de terceros.

---

## 7. Métricas de Éxito (KPIs)
1. **Automatización del Registro Diario**: Porcentaje de transacciones mensuales ingresadas automáticamente vía Webhook (Google Wallet / MacroDroid / Telegram) sin digitación manual ($> 70\%$).
2. **Precisión en Conciliación de Cartolas**: Tasa de detección de duplicados exactos y posibles duplicadas por desfase bancario ($\pm 7$ días) al importar la cartola mensual ($> 95\%$).
3. **Exactitud en Proyección de Facturación TC**: Diferencia menor al $2\%$ entre la facturación proyectada por el simulador al día de corte y el estado de cuenta emitido por el banco.
4. **Tiempo de Carga y Conciliación Mensual**: Tiempo promedio para subir una cartola, resolver alertas de duplicidad y actualizar el dashboard ($< 30\text{ segundos}$).
