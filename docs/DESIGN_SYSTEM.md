# 🎨 Design System - FinanzApp

## 1. Fundamentos & Filosofía de Diseño
El Design System de **FinanzApp** está concebido bajo el principio de **Finanzas Claras, Precisas y Modernas**. La interfaz combina una estética profesional de grado Fintech (dark headers, contrastes limpios, micro-interacciones sutiles) con una experiencia amigable para el usuario común.

* **Simplicidad**: Máxima densidad de datos sin saturar visualmente.
* **Consistencia Semántica**: Los colores comunican estados financieros de inmediato (saldo a favor, gasto neto, advertencia de presupuesto).
* **Accesibilidad**: Alto contraste en fuentes, áreas de toque amplias en móviles y estados de foco visibles.

---

## 2. Paleta de Colores (Tokens de Tailwind CSS)

### 2.1. Colores Principales (Brand & Surface)
| Token | Código HEX | Rol / Uso en la Interfaz |
| :--- | :--- | :--- |
| **`slate-950`** | `#020617` | Fondo principal de la Landing Page y fondos oscuros profundos |
| **`slate-900`** | `#0f172a` | Header principal, encabezados de modales y botones primarios oscuros |
| **`slate-800`** | `#1e293b` | Controles del header, bordes de elementos oscuros |
| **`slate-50`** | `#f8fafc` | Fondo de la aplicación web (*Canvas general*), fondos de inputs |
| **`white`** | `#ffffff` | Fondo de tarjetas (`MetricCards`), tablas y modales |

### 2.2. Colores Semánticos & Acciones
| Token | Código HEX | Significado / Uso |
| :--- | :--- | :--- |
| **`sky-500` / `sky-600`** | `#0ea5e9` / `#0284c7` | **Color de Acción Principal**: Botones de llamada a la acción (CTA), pestañas activas, enlaces |
| **`emerald-600`** | `#059669` | **Abonos / Pagos / Presupuesto Ok**: Representa ingresos, pagos completados y presupuestos $<80\%$ |
| **`amber-500`** | `#f59e0b` | **Advertencia**: Pagos parciales de tarjeta o presupuestos entre $80\%$ y $100\%$ |
| **`rose-600`** | `#e11d48` | **Gasto Bruto / Alerta**: Compras sin pagar, presupuestos excedidos ($>100\%$) y acciones destructivas (eliminar) |
| **`indigo-600`** | `#4f46e5` | **Acentos & Analítica**: Gráficos de tendencias, gradientes del hero y cuentas de inversión |

### 2.3. Paleta de Gráficos (Recharts Palette)
Para representar las diferentes categorías en los gráficos circulares y de barras:
```typescript
export const CHART_COLORS = [
  '#0284c7', // Sky 600
  '#e11d48', // Rose 600
  '#059669', // Emerald 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
  '#2563eb', // Blue 600
  '#475569', // Slate 600
  '#0891b2', // Cyan 600
  '#65a30d'  // Lime 600
];
```

---

## 3. Tipografía & Escala de Texto

* **Familia Tipográfica Principal**: `font-sans` (System font stack: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif).
* **Monospace para Datos Numéricos**: `font-mono` para montos, códigos o patrones clave.

| Tamaño Tailwind | Tamaño (px) | Peso | Uso |
| :--- | :--- | :--- | :--- |
| **`text-[10px]`** | 10px | Bold | Badges de estado en tablas y etiquetas de porcentajes |
| **`text-xs`** | 12px | Medium / Semibold | Textos secundarios, labels de formularios, inputs, filtros |
| **`text-sm`** | 14px | Semibold / Bold | Encabezados de tarjetas, títulos de modales, botones medianos |
| **`text-base`** | 16px | Bold | Títulos de secciones |
| **`text-xl`** | 20px | Extrabold | Logo FinanzApp, subtítulos destacados |
| **`text-3xl` / `text-4xl`** | 30px / 36px | Extrabold | Métricas principales (Monto Real Utilizado, Total Gastado) |
| **`text-6xl`** | 60px | Extrabold | Título principal en Landing Page |

---

## 4. Biblioteca de Componentes

### 4.1. Botones (Button Tokens)
* **Primario (Brand)**:
  `bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-sm transition`
* **Secundario / Header**:
  `bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition`
* **Acción Verde (Abonos & Presupuestos)**:
  `bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition`
* **Destructivo (Eliminar)**:
  `text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition`

### 4.2. Tarjetas de Métricas (`MetricCards`)
* **Contenedor**: `bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between`
* **Estructura Interna**:
  * Icono con fondo suave en esquina superior (`bg-sky-50 text-sky-600 p-2.5 rounded-xl`).
  * Etiqueta de la métrica en mayúsculas (`text-slate-500 text-xs font-bold uppercase tracking-wider`).
  * Monto formateado en moneda chilena con KaTeX/Intl (`text-2xl font-black text-slate-900 font-mono`).
  * Subtexto contextual de apoyo (`text-xs text-slate-400`).

### 4.3. Dropdowns Multi-Select (`Filters`)
* **Botón disparador**: `w-full py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-left flex items-center justify-between font-medium`
* **Menú flotante**: `absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 text-xs`
* **Ítems**: Lista con checkboxes personalizados, highlight al estar marcado (`bg-sky-50 text-sky-900 font-semibold`) y badge con cantidad de subcategorías.

### 4.4. Modales (`Modals`)
* **Fondo / Backdrop**: `fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4`
* **Contenedor**: `bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]`
* **Encabezado**: `bg-slate-900 text-white p-4 flex items-center justify-between`

### 4.5. Barras de Progreso de Presupuesto (`BudgetWidget`)
* **Contenedor de barra**: `w-full bg-slate-200 h-2 rounded-full overflow-hidden`
* **Indicador de nivel**:
  * $< 80\%$: `bg-emerald-500`
  * $80\% - 100\%$: `bg-amber-500`
  * $> 100\%$: `bg-rose-500`

---

## 5. Iconografía
Se utiliza la librería **`lucide-react`** con trazo consistente de $1.5$ a $2$ píxeles:
* 💳 **`CreditCard`**: Cuentas de tarjeta de crédito
* 🏦 **`Wallet`**: Logo corporativo y cuentas a la vista / corrientes
* 🎯 **`Target`**: Presupuestos y metas financieras
* ✨ **`Sparkles`**: Reglas inteligentes de auto-categorización
* 📂 **`Folder` / `Tag`**: Categorías generales y subcategorías
* 🔍 **`Search` / `Filter`**: Búsqueda textual y panel de filtros
* ☁️ **`Cloud` / `UserCheck`**: Estado de sincronización en la nube y login activo
