# 🏛️ Architecture Document - FinanzApp

## 1. Visión General de la Arquitectura
**FinanzApp** está construida bajo un patrón **JAMstack / BaaS (Backend-as-a-Service)** moderno, desacoplado y optimizado para costo operacional $0 USD en producción. La capa de cliente se ejecuta enteramente en el navegador del usuario utilizando React y TypeScript compilado con Vite, mientras que la autenticación, seguridad y persistencia relacional residen en Supabase (PostgreSQL).

```mermaid
flowchart TD
    User["👤 Usuario Final (Navegador Web / Móvil)"]
    
    subgraph Frontend["Capa de Presentación (Vercel Edge Network)"]
        SPA["React 18 + Vite SPA"]
        Parser["In-Browser Statement Parser (CSV / Excel / PDF Text)"]
        AllocEngine["Motor de Asociación de Pagos & Monto Real"]
        LocalCache["LocalStorage (Caché Offline / Modo Invitado)"]
    end

    subgraph Backend["Capa de Datos & Servicios (Supabase BaaS)"]
        Auth["Supabase Auth (Google OAuth 2.0 & Email/Password)"]
        Postgres["PostgreSQL Database (Multi-Tenant)"]
        RLS["Row Level Security (Aislamiento por auth.uid)"]
    end

    User <-->|HTTPS / TLS 1.3| SPA
    SPA --> Parser
    SPA --> AllocEngine
    SPA <--> LocalCache
    SPA <-->|HTTPS REST & Realtime API| Backend
    Auth --> Postgres
    RLS --- Postgres
```

---

## 2. Diagrama de Contenedores & Tecnologías

| Componente | Tecnología | Responsabilidad | Despliegue |
| :--- | :--- | :--- | :--- |
| **Cliente Web SPA** | React 18, TypeScript, Tailwind CSS, Vite | Renderizado de interfaz, visualización de métricas y gráficos, gestión de estado reactivo. | Vercel Global Edge Network |
| **Lector de Cartolas** | PapaParse, SheetJS (`xlsx`), RegEx Engine | Detección, normalización y parseo de columnas, montos, cuotas y fechas en memoria del cliente. | Ejecutado en el navegador del usuario |
| **Autenticación** | Supabase Auth + Google Cloud OAuth | Emisión y validación de tokens JWT (`sb-access-token`), gestión de sesiones de usuario. | Infraestructura Supabase |
| **Persistencia Relacional** | PostgreSQL 15 | Almacenamiento estructurado de cuentas, cartolas, asignaciones, categorías y presupuestos. | Supabase (Región São Paulo) |
| **Control de Acceso** | PostgreSQL Row Level Security (RLS) | Garantía a nivel de motor de BD de que ningún usuario acceda a datos ajenos (`auth.uid() = user_id`). | Supabase Engine |

---

## 3. Modelo de Datos (Entity-Relationship Diagram)

```mermaid
erDiagram
    USERS ||--o{ ACCOUNTS : "posee"
    USERS ||--o{ TRANSACTIONS : "registra"
    USERS ||--o{ CATEGORY_MAPPINGS : "configura"
    USERS ||--o{ AUTO_RULES : "define"
    USERS ||--o{ CATEGORY_BUDGETS : "establece"
    
    ACCOUNTS ||--o{ TRANSACTIONS : "contiene"
    TRANSACTIONS ||--o{ PAYMENT_ALLOCATIONS : "recibe_pago (purchase)"
    TRANSACTIONS ||--o{ PAYMENT_ALLOCATIONS : "asigna_pago (payment)"

    USERS {
        uuid id PK
        string email
        timestamp created_at
    }

    ACCOUNTS {
        string id PK
        uuid user_id FK
        string name
        string type
        string bank
        string currency
        numeric credit_limit
        string color
        timestamp created_at
    }

    TRANSACTIONS {
        string id PK
        uuid user_id FK
        string account_id FK
        date date
        string period
        string description
        string raw_description
        numeric amount
        numeric original_total_amount
        string transaction_type
        string category
        string subcategory
        int installment_current
        int installment_total
        timestamp created_at
    }

    PAYMENT_ALLOCATIONS {
        string id PK
        uuid user_id FK
        string purchase_id FK
        string payment_id FK
        numeric amount
        timestamp created_at
    }

    CATEGORY_MAPPINGS {
        string id PK
        uuid user_id FK
        string name
        string_array subcategories
        timestamp created_at
    }

    AUTO_RULES {
        string id PK
        uuid user_id FK
        string pattern
        string category
        string subcategory
        timestamp created_at
    }

    CATEGORY_BUDGETS {
        string id PK
        uuid user_id FK
        string category_name
        numeric monthly_limit
        timestamp created_at
    }
```

---

## 4. Flujos Clave de la Arquitectura

### 4.1. Flujo de Autenticación con Google (OAuth 2.0)
```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Frontend as Frontend (Vercel)
    participant Supabase as Supabase Auth
    participant Google as Google Cloud OAuth

    Usuario->>Frontend: Clic en "Continuar con Google"
    Frontend->>Supabase: signInWithOAuth({ provider: 'google' })
    Supabase-->>Frontend: Redirección a Google Consent Screen
    Frontend->>Google: Solicitud de autorización
    Usuario->>Google: Selecciona cuenta y autoriza
    Google-->>Supabase: Retorno a Callback URL (/auth/v1/callback)
    Supabase->>Supabase: Genera JWT y sesión de usuario
    Supabase-->>Frontend: Redirección al Site URL con tokens en hash
    Frontend->>Supabase: onAuthStateChange detecta sesión activa
    Frontend->>Frontend: Carga datos del usuario (loadCloudData)
    Frontend->>Usuario: Muestra Dashboard privado con correo en Header
```

### 4.2. Flujo de Carga y Parseo de Cartola en el Navegador
```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Modal as ImportModal
    participant Parser as In-Browser Parser
    participant Rules as Reglas Auto-Categorización
    participant State as Estado React / Supabase

    Usuario->>Modal: Arrastra archivo (.csv / .xlsx) o pega texto PDF
    Modal->>Parser: Invoca parseCSVFile / parseExcelFile / parseRawText
    Parser->>Parser: Normaliza fechas, montos y detecta cuotas (X/Y)
    Parser->>Rules: Aplica autoCategorize con AutoCategoryRules
    Rules-->>Parser: Retorna Categoría General y Subcategoría
    Parser-->>Modal: Lista de transacciones procesadas (Preview)
    Usuario->>Modal: Clic en "Confirmar e Importar"
    Modal->>State: Agrega transacciones al estado local
    Note over State: Si el usuario está autenticado, sincroniza con Supabase en segundo plano
```

### 4.3. Algoritmo de Asociación de Pagos y Saldo Real
Cada transacción tiene un estado base `amount` (monto facturado o cuota).
1. Un abono a la tarjeta de crédito se identifica por `transactionType === 'pago_tc'` o `amount < 0`.
2. Las asignaciones se registran en `payment_allocations`:
   * `purchase_id`: ID de la compra en la tarjeta.
   * `payment_id`: ID del movimiento de abono.
   * `amount`: Valor asignado.
3. El cálculo reactivo en `computeTransactions` genera:
   $$\text{totalAllocated} = \sum_{\text{allocations}} \text{amount}$$
   $$\text{netAmount} = \max(0, \text{amount} - \text{totalAllocated})$$
   $$\text{isFullyPaid} = (\text{netAmount} == 0)$$

---

## 5. Estrategia de Seguridad & Aislamiento (RLS)

> [!IMPORTANT]
> La seguridad de los datos no depende exclusivamente del código en el frontend, sino de las políticas estrictas de **Row Level Security (RLS)** evaluadas directamente por el motor PostgreSQL.

Cada tabla (`accounts`, `transactions`, `payment_allocations`, `category_mappings`, `auto_rules`, `category_budgets`) posee la siguiente regla:

```sql
CREATE POLICY "Strict Isolation" ON public.transactions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

* **`USING`**: Filtra automáticamente cualquier consulta `SELECT`, `UPDATE` o `DELETE` para que solo devuelva o altere filas donde `user_id` coincida con el UUID del token de la sesión actual.
* **`WITH CHECK`**: Impide que un usuario intente insertar registros asignándolos al `user_id` de otro usuario.

---

## 6. Integración Continua y Despliegue (CI/CD)

```mermaid
flowchart LR
    Dev["Desarrollador / Agente"] -->|git commit & push| Branch["Rama Feature (feature/...)"]
    Branch -->|git merge| Main["Rama Principal (main)"]
    Main -->|Webhook Automático| GitHub["GitHub Repository"]
    GitHub -->|Trigger Automático| Vercel["Vercel Build Pipeline"]
    Vercel -->|tsc & vite build| CDN["Despliegue Global en Vercel Edge"]
```

1. **Variables de Entorno en Vercel**:
   * `VITE_SUPABASE_URL`: Dirección pública de la API de Supabase.
   * `VITE_SUPABASE_ANON_KEY`: Clave pública para clientes web (`anon` / `Publishable key`).
2. **Cero Secretos Expuestos**: Las claves de servicio (`service_role`) jamás se configuran en el cliente ni se suben a Git.
3. **Control de Ramas**: El desarrollo activo se realiza en ramas `feature/*` y solo se fusiona a `main` cuando el comando `npm run build` compila con cero errores.
