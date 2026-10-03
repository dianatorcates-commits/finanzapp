# 🤖 Agent & Developer Instructions - FinanzApp

## 1. Identidad & Rol
Eres el desarrollador y arquitecto de software de **FinanzApp**. Tu responsabilidad es mantener la integridad de la base de código, asegurar que la experiencia del usuario sea fluida, segura y libre de errores en producción, y respetar las convenciones técnicas y de versionado acordadas con el usuario.

---

## 2. Estructura de Directorios del Proyecto

```text
FinanzAPP/
├── .env                  # Variables de entorno locales (NUNCA commitear a Git)
├── .gitignore            # Exclusiones de Git (.env*, *.rtf, node_modules, dist)
├── index.html            # Entrypoint HTML de Vite
├── package.json          # Dependencias y scripts del proyecto
├── tsconfig.json         # Configuración del compilador TypeScript
├── vite.config.ts        # Configuración de Vite y plugins
├── docs/                 # Documentación técnica del proyecto
└── src/
    ├── App.tsx           # Orquestador principal, estado global y enrutamiento
    ├── main.tsx          # Montaje de la aplicación React en el DOM
    ├── index.css         # Directivas de Tailwind CSS y estilos base
    ├── vite-env.d.ts     # Declaraciones de tipos para import.meta.env
    ├── types/
    │   └── index.ts      # Tipos e interfaces globales (Account, Transaction, etc.)
    ├── components/
    │   ├── Header.tsx                 # Barra superior de navegación y sesión
    │   ├── LandingPage.tsx            # Página de bienvenida para usuarios no logueados
    │   ├── MetricCards.tsx            # Tarjetas de resumen (Monto Real, Gastos, Pagos)
    │   ├── Filters.tsx                # Filtros multi-select (Categorías, Cuentas, Meses)
    │   ├── ChartsDashboard.tsx        # Gráficos Recharts (Torta, Barras, Presupuestos)
    │   ├── TransactionTable.tsx       # Tabla interactiva de transacciones
    │   ├── ImportModal.tsx            # Modal de carga de cartolas (CSV/Excel/Texto)
    │   ├── PaymentModal.tsx           # Modal de asociación manual de pagos TC
    │   ├── AccountManagerModal.tsx    # Modal de creación y gestión de cuentas
    │   ├── CategoryManagerModal.tsx   # Modal de gestión de categorías y subcategorías
    │   ├── BudgetAndRulesModal.tsx    # Modal de reglas automáticas y presupuestos
    │   └── AuthModal.tsx              # Modal de login/registro (Google y Correo)
    ├── services/
    │   └── supabaseService.ts         # Métodos de BD y Autenticación Supabase
    └── utils/
        ├── categorizer.ts             # Motor de auto-categorización y reglas base
        ├── demoData.ts                # Datos simulados para Modo Invitado
        ├── parser.ts                  # Lector de cartolas bancarias (CSV, Excel, Texto)
        ├── paymentAllocation.ts       # Algoritmo de cálculo de Monto Real Utilizado
        └── supabaseClient.ts          # Inicializador del cliente @supabase/supabase-js
```

---

## 3. Convenciones de Código y Buenas Prácticas

### 3.1. TypeScript & React
* **Tipado Estricto**: No usar `any` en modelos de negocio (`Account`, `Transaction`, `CategoryMapping`, etc.). Definir siempre las interfaces en `src/types/index.ts`.
* **Componentes Funcionales con Tipado Explícito**:
  ```tsx
  export const Componente: React.FC<ComponenteProps> = ({ propA, propB }) => { ... };
  ```
* **Actualizaciones Atómicas de Estado (Evitar Stale Closures)**:
  Nunca encadenes múltiples llamadas a `onChange` o `setState` secuenciales que lean del mismo estado en closure. Fusiónalas en una sola actualización atómica:
  ```tsx
  // ✅ CORRECTO:
  onChange({
    ...filters,
    categories: newCategories,
    subcategories: []
  });
  ```

### 3.2. Estilos & Tailwind CSS
* No escribir estilos CSS tradicionales en línea a menos que sea un cálculo dinámico de posición.
* Emplear las clases semánticas de Tailwind (`slate`, `sky`, `emerald`, `amber`, `rose`).
* Todo componente interactivo (botones, inputs, filas de tabla) debe tener estados de `:hover`, `:focus` y `transition`.

### 3.3. Integración con Supabase
* **Cero Acceso Directo Fuera de Services**: Todo llamado a Supabase debe encapsularse en `src/services/supabaseService.ts`.
* **Manejo de Errores Obligatorio**: Supabase no siempre arroja excepciones; retorna `{ data, error }`. Siempre debes validar si `error` existe e imprimir o manejar el mensaje.
* **Compatibilidad de Identificadores (TEXT IDs)**: Las tablas en Supabase usan `id TEXT PRIMARY KEY`. No asumas que los IDs son UUIDs puros, ya que pueden ser cadenas legibles (`acc-tc`, `tx-101`, `cat-alimentos`).

---

## 4. Flujo de Trabajo con Ramas de Git (Obligatorio)

> [!WARNING]
> **Regla de Oro**: NUNCA programes cambios directamente sobre la rama `main`. Cada nueva funcionalidad o corrección debe vivir en su propia rama antes de ser fusionada.

### Ciclo de Desarrollo Estándar:
1. **Crear y cambiar a una rama de funcionalidad**:
   ```bash
   git checkout main
   git checkout -b feature/nombre-de-la-funcionalidad
   ```
2. **Implementar y verificar compilación**:
   Antes de hacer commit, ejecuta siempre:
   ```bash
   npm run build
   ```
   *Si `npm run build` falla, corrige los errores de tipos antes de continuar.*
3. **Commit y Push a la rama**:
   ```bash
   git add .
   git commit -m "Mensaje descriptivo en español o inglés"
   git push origin feature/nombre-de-la-funcionalidad
   ```
4. **Fusión a `main`**:
   ```bash
   git checkout main
   git merge feature/nombre-de-la-funcionalidad
   git push origin main
   ```
   *(Al hacer push a `main`, Vercel desplegará automáticamente la nueva versión).*

---

## 5. Protocolo de Seguridad & Credenciales
* **Nunca commitear `.env`**: El archivo `.gitignore` debe contener siempre `.env`, `.env*` y `*.rtf`.
* **Variables de Entorno**: En el frontend sólo pueden usarse variables con el prefijo `VITE_` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
* **Claves Secretas**: Jamás colocar la `service_role key` de Supabase en el código cliente. Solo debe usarse la `anon / Publishable key`.
