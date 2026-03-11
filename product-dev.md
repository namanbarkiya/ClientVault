# Niya — Multi-Product SaaS Template

A complete starter for building multiple SaaS products on a single shared backend.

One FastAPI backend with a shared database. One Next.js template used as a starting point per product. Each product gets its own DB schema, client key, and independent frontend repo — but shares auth, billing, and users.

## Repos

| Repo                                                                       | Purpose                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [backend-product-bp](https://github.com/namanbarkiya/backend-product-bp)   | Shared FastAPI backend — submodule in this repo               |
| [frontend-product-bp](https://github.com/namanbarkiya/frontend-product-bp) | Next.js template — use GitHub "Use this template" per product |

```
niya-product-template/          ← this repo (launchpad + docs)
└── niya-fastapi-template/      ← git submodule → backend-product-bp
                                   (frontend lives in its own repo per product)
```

## Cloning

```bash
git clone --recurse-submodules https://github.com/namanbarkiya/niya-product-template
```

## Starting a New Product Frontend

Go to [frontend-product-bp](https://github.com/namanbarkiya/frontend-product-bp) → **Use this template** → create `your-product-frontend` as a new independent repo.

Each product frontend is fully independent. The template is a starting point, not a submodule — every product's UI will be different.

---

## Architecture at a Glance

```
                        ┌─────────────────────────────┐
  product-alpha.com ──▶ │  Next.js (niya-nextjs clone) │
                        └────────────┬────────────────┘
                                     │ X-Product-Client-Key: pk_alpha_...
                                     │ Authorization: Bearer <access_token>
                        ┌────────────▼────────────────┐
  product-beta.com  ──▶ │  Next.js (niya-nextjs clone) │
                        └────────────┬────────────────┘
                                     │ X-Product-Client-Key: pk_beta_...
                                     │
                        ┌────────────▼────────────────┐
                        │     FastAPI (shared)         │
                        │  /api/auth/*                 │
                        │  /api/users/*                │
                        │  /api/billing/*              │
                        │  /api/alpha/*  (product)     │
                        │  /api/beta/*   (product)     │
                        └────────────┬────────────────┘
                                     │
                        ┌────────────▼────────────────┐
                        │   PostgreSQL (Neon)          │
                        │   schema: shared             │
                        │   schema: alpha              │
                        │   schema: beta               │
                        └─────────────────────────────┘
```

---

## First-Time Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL database (Neon recommended)

---

### 1. Backend setup

```bash
cd niya-fastapi-template
```

**Install dependencies**

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Configure environment**

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
SECRET_KEY=your-secret-key-min-32-chars
ENVIRONMENT=development
```

**Run migrations**

```bash
alembic upgrade head
```

**Seed product client keys**

```bash
python scripts/seed_product_clients.py
```

This prints a key for each product in `config.py`. Save them — you'll need them for the frontend `.env.local`.

**Start the server**

```bash
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

### 2. Frontend setup

```bash
cd niya-nextjs-template
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PRODUCT_CLIENT_KEY=pk_alpha_xxxxxxxxxxxx   # from seed script above
```

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Adding a New Product

### Backend — 10 steps

> Full details in `niya-fastapi-template/ADD_PRODUCT.md`

**1. Register the slug**

`app/core/config.py`:

```python
products: List[str] = ["alpha", "taskboard", "your_product"]
```

**2. Scaffold the module**

```
app/products/your_product/
├── models/
├── repos/
├── schemas/
├── services/
└── routes/
    └── router.py
```

**3. Mount in main.py**

```python
import app.products.your_product.models  # noqa: F401
from app.products.your_product.routes.router import router as your_product_router

app.include_router(your_product_router, prefix="/api/your_product", tags=["your_product"])
```

**4. Create migration**

```
migrations/versions/your_product/001_initial.py
```

Always `CREATE SCHEMA IF NOT EXISTS your_product` before the tables.

**5. Run migration + seed**

```bash
alembic upgrade head
python scripts/seed_product_clients.py
# prints: X-Product-Client-Key: pk_your_product_xxxx
```

---

### Frontend — create from the GitHub template

1. Go to [frontend-product-bp](https://github.com/namanbarkiya/frontend-product-bp)
2. Click **Use this template** → **Create a new repository**
3. Name it `your-product-frontend` and clone it

```bash
git clone https://github.com/namanbarkiya/your-product-frontend
cd your-product-frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PRODUCT_CLIENT_KEY=pk_your_product_xxxx
```

Update the app name in `app/layout.tsx` and `components/layout/sidebar.tsx`, then replace the dashboard placeholder in `app/(dashboard)/dashboard/page.tsx` with your product UI.

---

## Backend Rules (Never Break These)

| Rule                                                          | Why                                |
| ------------------------------------------------------------- | ---------------------------------- |
| Every model has `__table_args__ = {"schema": "product_name"}` | Schema isolation                   |
| Cross-schema refs use plain UUID columns, not ForeignKey      | Enables future DB extraction       |
| Never JOIN across schemas                                     | Use two separate queries via repos |
| Products only import from `app/core/` and `app/shared/`       | No product cross-dependencies      |
| All PKs are UUID                                              | Portable across databases          |
| All timestamps are `DateTime(timezone=True)`                  | UTC everywhere                     |
| Business logic lives in services, not routes or repos         | Clean separation                   |

---

## Request Flow

Every request from the frontend must carry:

```
X-Product-Client-Key: pk_alpha_xxxx     ← identifies which product
Authorization: Bearer <access_token>    ← identifies the user (except auth routes)
```

The middleware looks up the client key in `shared.product_clients` to verify the request is from a known product frontend. The access token is a stateless JWT validated per-request.

---

## Auth Flow

```
Register  →  POST /api/auth/register  →  sends OTP email
Verify    →  POST /api/auth/verify-email  →  marks email_verified = true
Login     →  POST /api/auth/login  →  access_token (15min) + refresh_token cookie (7d)
Refresh   →  POST /api/auth/refresh  →  new access_token (automatic via axios interceptor)
Logout    →  POST /api/auth/logout  →  clears refresh_token cookie
```

Access tokens are stored **in memory only** on the frontend (not localStorage). The refresh token is an httpOnly cookie set by FastAPI.

---

## Directory Reference

### Backend (`niya-fastapi-template/`)

```
app/
  core/           Infrastructure — config, database, auth, middleware, exceptions
  shared/         Shared domain — auth, billing, users, orgs
    models/       SQLAlchemy models (schema = "shared")
    repos/        Data access — the ONLY way products touch shared data
    schemas/      Pydantic request/response models
    services/     Business logic
    routes/       /api/auth, /api/users, /api/billing, /api/orgs
  products/
    product_alpha/   Self-contained product module
    taskboard/       Self-contained product module
    your_product/    Add new products here
migrations/
  versions/
    shared/          Shared schema migrations
    product_alpha/   Product-specific migrations
scripts/
  seed_product_clients.py   Generate X-Product-Client-Key for each product
ADD_PRODUCT.md              Full AI-ready guide for adding a product
```

### Frontend (`niya-nextjs-template/`)

```
app/
  (auth)/         Login, register, verify-email, forgot/reset-password
  (dashboard)/    Protected pages — dashboard, profile, settings
components/
  layout/         Sidebar, header
  providers/      AuthProvider (session restore), QueryProvider (global errors)
  ui/             shadcn + custom: DataTable, StatCard, EmptyState, PageHeader, CopyButton, Spinner
hooks/            use-auth, use-debounce, use-copy, use-local-storage, use-pagination, use-confirm
lib/
  api.ts          Axios — in-memory token, 401 auto-refresh
  errors.ts       handleError() — one-line catch blocks with sonner toasts
  format.ts       formatDate, formatCurrency, formatCompact, getInitials…
  query-keys.ts   Centralised React Query key factory
stores/           Zustand auth store
middleware.ts     Route guard — unauthenticated → /login
```

---

## Running Both Together

```bash
# Terminal 1 — backend
cd niya-fastapi-template
source .venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 — your product frontend (its own repo, cloned separately)
cd your-product-frontend
npm run dev
```

## Updating the Backend

Work and push directly from inside the submodule — no parent repo step needed for day-to-day development:

```bash
cd niya-fastapi-template    # inside the submodule
# make changes
git add .
git commit -m "feat: ..."
git push                    # → pushes to backend-product-bp directly
```

To record the latest backend commit in this parent repo (do this occasionally):

```bash
cd ..                       # back to parent
git add niya-fastapi-template
git commit -m "chore: update backend pointer"
git push
```

| Service      | URL                          |
| ------------ | ---------------------------- |
| Frontend     | http://localhost:3000        |
| Backend API  | http://localhost:8000        |
| Swagger UI   | http://localhost:8000/docs   |
| Health check | http://localhost:8000/health |
