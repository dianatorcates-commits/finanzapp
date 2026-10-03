# 📄 Product Requirement Document (PRD) - FinanzApp

## 1. Información General del Documento
* **Producto**: FinanzApp (Control Inteligente de Cartolas Bancarias & Tarjetas de Crédito)
* **Versión**: 1.0.0
* **Fecha**: Octubre 2026
* **Estado**: En Producción / MVP Activo
* **Stack Principal**: React + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL / Auth) + Vercel

---

## 2. Visión del Producto & Problema a Resolver

### 2.1. El Problema
Los usuarios de tarjetas de crédito y cuentas bancarias en Latinoamérica (particularmente en Chile) enfrentan los siguientes dolores recurrentes:
1. **Falta de visibilidad del saldo real**: Cuando una persona compra en cuotas o realiza abonos parciales a su tarjeta de crédito durante el mes, los portales bancarios muestran únicamente el saldo facturado o el cupo total, sin reflejar el gasto neto remanente por compra.
2. **Formatos cerrados e incompatibles**: Cada banco (Banco de Chile, Santander, BCI, BancoEstado, Scotiabank, Falabella, Ripley, etc.) emite cartolas en formatos CSV dispares, tablas Excel con encabezados variables o textos planos dentro de PDFs con protecciones de copia.
3. **Pérdida de control presupuestario**: Las herramientas tradicionales no vinculan un abono específico a un gasto en restaurante o supermercado, impidiendo saber cuánto de ese consumo inicial sigue pendiente de pago.

### 2.2. La Solución (FinanzApp)
FinanzApp es una plataforma web financiera interactiva, moderna y gratuita que permite:
* Cargar cartolas mediante arrastrar y soltar archivos (.csv, .xlsx, .xls) o pegando texto plano directamente desde un PDF bancario.
* Reconocer cuotas contratadas (`X/Y`) y asociar la columna `Mes-Periodo` de facturación.
* Asociar abonos o pagos a compras específicas de Tarjeta de Crédito, calculando en tiempo real el **Monto Real Utilizado** (gasto neto efectivo).
* Categorizar mediante jerarquía general y subcategorías, con reglas automáticas configurables.
* Comparar y auditar finanzas mediante filtros multi-select y gráficos dinámicos.
* Proveer sincronización segura en la nube (PostgreSQL + RLS) y permitir el uso anónimo en modo Demo/Invitado.

---

## 3. Personas de Usuario (User Personas)

### 👤 Persona A: "Felipe el Ordenado" (Profesional Joven)
* **Perfil**: 28 años, usa 2 tarjetas de crédito y 1 cuenta corriente. Paga siempre a tiempo pero le cuesta saber cuánto le queda por amortizar de sus compras en 3 y 6 cuotas sin interés.
* **Necesidad**: Conectar sus abonos con las compras en cuotas para saber qué ítems ya liquidó y proyectar su liquidez mensual.

### 👤 Persona B: "Claudia la Independiente" (Freelancer / Emprendedora)
* **Perfil**: 35 años, mezcla gastos profesionales y personales en sus cuentas vista y crédito.
* **Necesidad**: Subir la cartola mensual en Excel, filtrar por categorías generales (ej. "Negocio" vs. "Alimentación") mediante selección múltiple y exportar un consolidado limpio.

---

## 4. Requerimientos Funcionales

### 4.1. Módulo de Autenticación & Acceso
* **RF-01 (Autenticación Google OAuth)**: Inicio de sesión y registro con 1 clic a través de Google Cloud Console.
* **RF-02 (Autenticación Correo/Password)**: Creación de cuenta e inicio de sesión tradicional con validación de credenciales en Supabase Auth.
* **RF-03 (Modo Invitado / Demo)**: Los usuarios pueden explorar la plataforma sin autenticarse usando datos simulados de ejemplo (`demoData.ts`). Al cerrar sesión, los datos privados del usuario se limpian y la app retorna a la Landing Page.
* **RF-04 (Migración Automática)**: Si un usuario cargó cartolas en Modo Invitado y decide iniciar sesión con Google por primera vez, sus datos locales se transfieren a su cuenta de Supabase.

### 4.2. Módulo de Carga & Procesamiento de Cartolas (Parser)
* **RF-05 (Soporte Multiformato)**:
  * Archivos CSV delimitados por comas o punto y coma (ej. Banco de Chile, Santander).
  * Archivos Excel `.xlsx` y `.xls` (librería SheetJS).
  * Pegado de texto sin formato extraído de PDFs bancarios.
* **RF-06 (Reconocimiento Inteligente de Columnas)**:
  * Fecha (`YYYY-MM-DD`, `DD/MM/YYYY`, etc.).
  * Período de facturación (`Mes-Periodo` o `YYYY-MM`).
  * Descripción / Detalle.
  * Monto de cargo o abono (parseo de montos en CLP con separadores de miles).
  * Detección de cuotas (ej. `CUOTA 02/06`, `03/12`) desglosando cuota facturada vs. monto total contratado.
* **RF-07 (Previsualización de Importación)**: Tabla interactiva para revisar y confirmar los movimientos detectados antes de incorporarlos a la base de datos.

### 4.3. Motor de Asociación de Pagos & Monto Real Utilizado
* **RF-08 (Cálculo de Monto Real Utilizado)**:
  $$\text{Monto Real Utilizado} = \text{Monto Facturado} - \sum \text{Abonos Asociados}$$
* **RF-09 (Asociación Automática FIFO)**: Botón para asociar abonos pendientes a compras de tarjeta de crédito en orden cronológico (*First In, First Out*).
* **RF-10 (Asociación Manual)**: Modal interactivo para que el usuario vincule un abono específico a una compra particular, permitiendo pagos totales o parciales y desvinculaciones inmediatas.

### 4.4. Categorización y Presupuestos
* **RF-11 (Estructura Jerárquica)**: Categoría General (ej. *Alimentación & Gastronomía*) y Subcategorías (ej. *Supermercados*, *Restaurantes*).
* **RF-12 (Gestor de Categorías)**: Modal para crear, renombrar y eliminar categorías y subcategorías personalizadas.
* **RF-13 (Reglas de Auto-Categorización)**: Mapeo por coincidencia de palabras clave (ej. `JUMBO` $\rightarrow$ `Alimentación & Supermercados`). Botón para ejecutar retroactivamente sobre cartolas ya cargadas.
* **RF-14 (Presupuestos Mensuales)**: Fijación de metas de gasto mensual por categoría en CLP con barras de progreso y códigos de color (Verde $<80\%$, Amarillo $80-100\%$, Rojo $>100\%$).

### 4.5. Filtros, Reportes & Visualización
* **RF-15 (Filtro Multi-Select)**: Selección múltiple interactiva con checkboxes para Categorías Generales y Subcategorías.
* **RF-16 (Filtros Globales)**: Filtrado por Cuenta/Tarjeta, Mes/Período, Tipo de Transacción, Búsqueda de texto y switch para *"Solo compras pendientes con saldo real $> 0$"*.
* **RF-17 (Dashboard Interactivo)**: Gráficos de torta con switch Categoría/Subcategoría, barras de evolución mensual y barras horizontales por cuenta (Recharts).
* **RF-18 (Exportación a Excel)**: Descarga en `.xlsx` de las transacciones filtradas con cálculo de saldo neto y estado de pago.

---

## 5. Requerimientos No Funcionales

* **RNF-01 (Costo Operacional $0 USD)**: La infraestructura debe mantenerse 100% dentro de los niveles gratuitos (*Free Tiers*) de Supabase (500 MB BD, 50k MAU) y Vercel (Hobby Plan).
* **RNF-02 (Seguridad & RLS)**: Ningún usuario autenticado puede leer, insertar, modificar o eliminar registros pertenecientes a otro usuario (`auth.uid() = user_id`).
* **RNF-03 (Performance)**: Tiempo de carga inicial $< 1.5$ segundos en redes 4G estándar. Parseo de archivos de 2.000 filas en $< 500$ ms en el cliente.
* **RNF-04 (Compatibilidad)**: Funcionamiento responsivo en navegadores modernos (Chrome, Safari, Firefox, Edge) tanto en escritorio como en dispositivos móviles iOS y Android.
* **RNF-05 (Privacidad de Cartolas)**: El parseo de archivos bancarios se realiza en memoria en el navegador cliente (JavaScript), evitando subir documentos PDF en bruto a servidores externos.

---

## 6. Métricas de Éxito (KPIs)
1. **Tasa de Conversión a Registro**: Porcentaje de visitantes de la Landing Page que inician sesión con Google o correo ($> 25\%$).
2. **Tiempo de Carga de Cartola**: Tiempo promedio que le toma a un usuario subir un archivo y ver su dashboard actualizado ($< 30$ segundos).
3. **Retención de Usuarios (Day 30)**: Usuarios que regresan al mes siguiente a cargar su nuevo estado de cuenta ($> 40\%$).
