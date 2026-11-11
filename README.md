# LoomWorks — Production Management (Client / Orders module)

React + TypeScript + Vite + MUI + React Router + Lucide. Mock data only; no backend.

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (redirects to /production/orders)
npm run typecheck  # tsc --noEmit
npm run build
```

## Routes

| Route | Page |
|---|---|
| `/production/orders` | Orders list: summary cards, search, filters, table, actions, CSV export |
| `/production/orders/new` | New order form |
| `/production/orders/:id` | Order details: info, size breakdown, colors, workflow, history |
| `/production/orders/:id/edit` | Edit order (same form as New) |
| `/production/cutting` … `/inventory`, `/dashboard`, … | Placeholder pages (built later) |

## Architecture

```
src/
  config/       statusConfig.ts (ALL status colors/labels), workflowConfig.ts (transitions, line routing),
                statusIcons, navigation, brand, orderOptions, colorSwatches
  types/        production.ts
  data/         mockOrders.ts (12 orders, all 7 statuses, generated history)
  services/     productionOrdersService.ts  <- the only place that knows about mock data
  hooks/        useAsyncData (loading / error / reload), useProductionOrders, useOrderDetails
  utils/        workflow.ts, orderMetrics.ts (summary + filtering), orderForm.ts (validation + totals),
                format.ts, exportCsv.ts      <- pure business logic, no React
  components/   layout/  common/  orders/
  pages/        production/*, PlaceholderPage, NotFoundPage
  routes/       AppRoutes.tsx
```

### Connecting the API

Every function in `services/productionOrdersService.ts` is async and returns plain data.
Replace the body with a `fetch` (mapping is listed in the file header, e.g.
`getProductionOrders()` → `GET /api/production/orders`). No component changes needed.
Filtering currently runs client-side in `utils/orderMetrics.ts`; when the API paginates,
move `filterOrders` server-side and pass `OrderFilterValues` as query params.

### Workflow rules (single source: `config/workflowConfig.ts`)

```
Pending → Cutting → Sorting → Sewing ─┬─ Line 1 → Quality Check ─┐
                                      └─ Line 2 → Inventory ─────┴→ Completed
```
Changing status only offers valid next stages. Choosing Quality Check assigns Line 1,
Inventory assigns Line 2, progress is set from `statusConfig`, and a history event is logged.

## Behaviour notes

- Search filters as you type; Client / Status / Color / Date dropdowns apply with the **Filter** button.
- The top-bar search jumps to `/production/orders?q=…`.
- Summary cards count all orders (not the filtered view). "In Production" = every status between Pending and Completed.
- New Order supports several colors, each with its own fabric quantity; total fabric and total pieces are calculated live.
- PO numbers must be unique (enforced in the service, shown on the field).
- Brand name and current user are placeholders in `config/brand.ts`.
