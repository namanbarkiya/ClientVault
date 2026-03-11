# Niya Next.js Template

Frontend template for the [Niya multi-product FastAPI backend](../niya-fastapi-template). One copy per product — point it at the shared backend, set a client key, build your product.

---

## Stack

| Layer | Library |
|-------|---------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | Zustand |
| Server state | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| HTTP | Axios (in-memory token, auto-refresh interceptor) |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Animations | Framer Motion |
| Toasts | Sonner |
| Dates | date-fns |
| URL state | nuqs |
| Theme | next-themes (light / dark / system) |

---

## Project Structure

```
app/
  (auth)/               # Public auth pages — no sidebar
    login/
    register/
    verify-email/
    forgot-password/
    reset-password/
  (dashboard)/          # Protected pages — sidebar + header layout
    dashboard/
    profile/
    settings/
  layout.tsx            # Root layout — providers, Toaster
  page.tsx              # Public landing page

components/
  layout/
    sidebar.tsx         # Nav links + sign-out
    header.tsx          # Theme toggle + avatar
  providers/
    auth-provider.tsx   # Restores session on page load via refresh token
    query-provider.tsx  # TanStack Query — global mutation error → sonner toast
  ui/
    data-table.tsx      # Sortable + paginated table (TanStack Table)
    stat-card.tsx       # Metric card with optional trend %
    empty-state.tsx     # Icon + title + description + action slot
    page-header.tsx     # Title + description + right-side action slot
    copy-button.tsx     # Copy icon → checkmark + sonner toast
    spinner.tsx         # Spinner + FullPageSpinner
    + all shadcn/ui components

hooks/
  use-auth.ts           # isAuthenticated, user, isLoading, logout
  use-debounce.ts       # Debounce any value
  use-copy.ts           # Clipboard copy with sonner feedback
  use-local-storage.ts  # Typed localStorage (SSR-safe)
  use-pagination.ts     # page / offset / next / prev state
  use-confirm.ts        # Double-click-to-confirm for destructive actions

lib/
  api.ts                # Axios instance — in-memory token + 401 auto-refresh
  errors.ts             # getErrorMessage(), handleError() → sonner toast
  format.ts             # formatDate, formatCurrency, formatCompact, getInitials…
  query-keys.ts         # Centralised React Query key factory
  utils.ts              # cn() (clsx + tailwind-merge)

stores/
  auth-store.ts         # Zustand — user, isLoading, logout

middleware.ts           # Route guard — redirects unauthenticated to /login
types/
  index.ts              # User, AuthResponse
```

---

## Auth Flow

```
Login form
  → POST /api/auth/login  (X-Product-Client-Key header)
  → access_token stored in memory (not localStorage)
  → refresh_token set as httpOnly cookie by FastAPI
  → session=1 cookie set on this origin for middleware

Page refresh
  → AuthProvider calls POST /api/auth/refresh on mount
  → Restores access_token in memory + user state

401 response
  → Axios interceptor calls /api/auth/refresh automatically
  → Retries original request with new token

Logout
  → POST /api/auth/logout
  → Clears in-memory token + session cookie
  → Redirects to /login
```

The `session` cookie is a lightweight marker on `localhost:3000` so the Next.js middleware can protect routes. The real security comes from the in-memory access token and the httpOnly refresh token cookie on the API domain.

---

## Getting Started

### 1. Prerequisites

The [niya-fastapi-template](../niya-fastapi-template) backend must be running:

```bash
cd ../niya-fastapi-template
uvicorn app.main:app --reload
# → http://localhost:8000
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_PRODUCT_CLIENT_KEY=pk_alpha_your_key_here
```

Get the client key by running the seed script on the backend:

```bash
cd ../niya-fastapi-template
python scripts/seed_product_clients.py
```

### 3. Install and run

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Using This Template for a New Product

1. Copy this directory: `cp -r niya-nextjs-template my-product`
2. Update `NEXT_PUBLIC_PRODUCT_CLIENT_KEY` in `.env.local` to the new product's key
3. Update the app name in `app/layout.tsx` (`metadata.title`) and `components/layout/sidebar.tsx`
4. Replace the dashboard placeholder in `app/(dashboard)/dashboard/page.tsx` with product content
5. Add product-specific routes inside `app/(dashboard)/`

Everything else (auth, profile, settings, error handling, providers) works out of the box.

---

## Key Utilities

### Error handling

```ts
import { handleError } from "@/lib/errors"

try {
  await api.post("/api/...")
} catch (err) {
  handleError(err) // shows sonner toast with the right message
}
```

All `useMutation` errors are caught globally — no `onError` needed unless you want custom behaviour.

### Formatting

```ts
import { formatDate, formatRelative, formatCurrency, formatCompact, getInitials } from "@/lib/format"

formatDate("2026-03-10")           // "Mar 10, 2026"
formatRelative("2026-03-10")       // "2 hours ago" / "Yesterday" / "Mar 10"
formatCurrency(4999)               // "$4,999.00"
formatCompact(12400)               // "12.4K"
getInitials("Jane Doe")            // "JD"
```

### React Query keys

```ts
import { queryKeys } from "@/lib/query-keys"

useQuery({ queryKey: queryKeys.user.me(), queryFn: fetchMe })
```

Add product-specific keys in `lib/query-keys.ts` alongside the existing ones.

### Data table

```tsx
import { DataTable, ColumnDef } from "@/components/ui/data-table"

const columns: ColumnDef<Order>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "status", header: "Status", enableSorting: true },
]

<DataTable columns={columns} data={orders} pageSize={25} />
```

### Hooks

```ts
const debouncedQuery = useDebounce(searchInput, 400)
const { copy, copied } = useCopy()          // copy(text, "ID copied")
const [val, setVal] = useLocalStorage("key", defaultValue)
const { page, next, prev, offset } = usePagination({ totalItems: 100 })
const { confirm, isConfirming } = useConfirm(() => deleteItem(id))
```

---

## Routes

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/register` | Public | Create account |
| `/verify-email` | Public | OTP verification |
| `/forgot-password` | Public | Request reset link |
| `/reset-password` | Public | Set new password |
| `/dashboard` | Private | Main product view |
| `/profile` | Private | User info |
| `/settings` | Private | Theme + account |
