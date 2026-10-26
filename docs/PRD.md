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
  * El usuario puede **generar/materializar con 1 clic** los cargos pendientes del período en la tabla de transacciones, con verificación anti-duplicados para no volver a insertar cuotas o suscripciones ya cargadas.

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
