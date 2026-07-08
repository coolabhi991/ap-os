# CLAUDE.md — AP OS

This file is the single source of truth for any Claude Code session working in this repository. It reflects the **actual state of the codebase** (verified by direct inspection, not assumptions). Read it fully before making changes. If something here conflicts with what you observe in the code, trust the code, but flag the discrepancy to the user and update this file.

---

## 1. Project Architecture

**AP OS** is an Enterprise ERP for Construction Companies (currently `v0.0.5-alpha`). It is a **pnpm workspace monorepo** orchestrated by **Turborepo**.

```
Client (apps/web)  --axios-->  API (apps/api)  --Prisma-->  PostgreSQL
```

- **apps/api** — Express 5 + TypeScript REST API. Layered `routes → controllers → services → Prisma`. JWT-based stateless auth.
- **apps/web** — Vite + React 19 + TypeScript SPA. React Router v7 for routing, axios for API calls, Tailwind v4 + shadcn/radix-ui components.
- **apps/mobile** — exists as an empty directory only. No code yet. Do not assume any mobile conventions; if asked to build mobile features, they must be scaffolded from scratch.
- **packages/*** (`config`, `database`, `types`, `ui`, `utils`) — **empty placeholder directories, zero files, not referenced by any workspace**. See §3.
- Root `src/` (`repositories/`, `types/`, `validators/`) — **empty placeholder directories, dead scaffolding**. See §3.
- `docs/`, `infrastructure/`, `scripts/` at repo root — all empty. No docs, no IaC, no helper scripts currently exist.

There is no monorepo-wide shared type/DTO package in actual use today: the backend defines its own interfaces in `services/*.service.ts`, and the frontend hand-duplicates matching interfaces in `services/*.ts`. Keep them in sync manually whenever you change one side.

---

## 2. Folder Structure

```
ap-os/
├── apps/
│   ├── api/                          Express + TS + Prisma backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma         Single schema, all models
│   │   │   └── migrations/           Timestamped migration folders
│   │   └── src/
│   │       ├── app.ts                Express app wiring (middleware + route mounts)
│   │       ├── server.ts             dotenv.config() + app.listen()
│   │       ├── config/               jwt.ts, prisma.ts (singleton PrismaClient)
│   │       ├── middleware/           auth.middleware.ts, admin.middleware.ts
│   │       ├── routes/               <domain>.routes.ts — thin, mounts controllers
│   │       ├── controllers/          <domain>.controller.ts — req/res + error envelope
│   │       └── services/             <domain>.service.ts — Prisma access + business rules
│   ├── web/                          Vite + React 19 + TS frontend
│   │   └── src/
│   │       ├── App.tsx               All <Route> declarations (flat, not nested)
│   │       ├── main.tsx              BrowserRouter + QueryClientProvider bootstrap
│   │       ├── pages/<domain>/       <Domain>.tsx, Add<Domain>.tsx, Edit<Domain>.tsx, View<Domain>.tsx
│   │       ├── components/<domain>/  Filters/Table/Form subcomponents per domain
│   │       ├── components/layout/    Sidebar.tsx, Layout.tsx
│   │       ├── components/ui/        shadcn primitives
│   │       ├── services/             api.ts (axios instance) + <domain>.ts (typed API calls)
│   │       ├── routes/               ProtectedRoute.tsx (currently EMPTY — unused, see §12)
│   │       └── lib/utils.ts          cn() helper (clsx + tailwind-merge)
│   └── mobile/                       EMPTY — no code
├── packages/                         config, database, types, ui, utils — ALL EMPTY, unused
├── src/                              repositories/, types/, validators/ — ALL EMPTY, dead scaffolding
├── docs/ infrastructure/ scripts/    ALL EMPTY
├── pnpm-workspace.yaml               packages: ["apps/*", "packages/*"]
├── turbo.json                        build/dev/lint/test task graph
└── package.json                      root scripts: build (delegates to web), test (stub, fails)
```

---

## 3. The Empty / Dead Directories — DO NOT TREAT AS REAL CODE

Verified by direct filesystem inspection (not just a shallow listing):

- **Root `src/repositories/`, `src/types/`, `src/validators/`** — zero files in each. No root `tsconfig.json` exists. No path alias anywhere points at root `src`. Nothing in `apps/api` or `apps/web` imports from it. This is leftover scaffolding from an abandoned "shared repository/validator layer" idea.
- **`packages/config`, `packages/database`, `packages/types`, `packages/ui`, `packages/utils`** — zero files in each, including no `package.json`. No `@ap-os/*` or workspace-protocol reference exists anywhere in `apps/api/package.json`, `apps/web/package.json`, or `pnpm-lock.yaml`.
- **`docs/`, `infrastructure/`, `scripts/`, `apps/mobile/`** — all empty.

**Rule: never write code into these directories as if they were an established shared layer.** If a task genuinely calls for a shared package (e.g. extracting duplicated DTOs), that is a deliberate architectural decision the user must approve first — don't do it silently by "filling in" `packages/types`.

---

## 4. Backend Architecture (apps/api)

- **Runtime**: Express 5, TypeScript, ESM (`"type": "module"` in package.json, imports use explicit `.js` extensions per NodeNext resolution — e.g. `import x from "../services/x.service.js"` even though the source file is `.ts`).
- **Entry**: `src/server.ts` loads `.env` via `dotenv`, listens on `process.env.PORT || 5001`. `src/app.ts` builds the Express app: `cors()`, `express.json()`, a root health route `GET /`, then mounts every domain router under `/api/v1/<domain>`.
- **No global error-handling middleware, no request logger, no 404 handler.** Every controller does its own try/catch. Do not assume Express error middleware exists — if you throw inside a controller without catching, it will produce an unhandled rejection, not a clean JSON error response.
- **Database access**: single `PrismaClient` singleton exported from `src/config/prisma.ts`, imported by every service. Never instantiate a second `PrismaClient`.
- **Scripts**: `dev` = `tsx watch src/server.ts`, `build` = `tsc`, `start` = `node dist/server.js`. No test script.

### Auth flow
- **Stateless JWT**, not sessions. `src/config/jwt.ts`: `generateToken`/`verifyToken` sign/verify with `process.env.JWT_SECRET`, falling back to a hardcoded `"ap_os_secret"` if the env var is missing. **Never rely on that fallback — always set `JWT_SECRET` in `.env`.**
- `src/middleware/auth.middleware.ts` reads `Authorization: Bearer <token>`, verifies it, and attaches `req.user = { id, email, role, companyId }` on an extended `AuthRequest` type. Controllers that need auth import `AuthRequest` and cast `req` to it, then read `req.user!.companyId`.
- `src/middleware/admin.middleware.ts` checks `req.user.role !== "ADMIN"` → 403. Use it on any route that should be admin-only, chained after `authMiddleware`.
- Passwords hashed with bcrypt (cost factor 10). Tokens expire in `7d`.
- **Registration creates a brand-new tenant every time.** `registerUser` (in `services/auth.service.ts`) always creates a new `Company` row and makes the registering user its `ADMIN`. There is currently no "join an existing company via invite" flow. Do not assume registration attaches a user to an existing tenant unless you are explicitly asked to build that flow.
- `User.email` is globally unique (not scoped per company) — one email can only ever belong to one tenant.

---

## 5. Frontend Architecture (apps/web)

- **Stack**: Vite, React 19, TypeScript, React Router v7 (`BrowserRouter` + flat `<Routes>` in `App.tsx`), Tailwind v4, shadcn/radix-ui primitives in `components/ui/`, `lucide-react` icons, axios.
- **Routing**: all routes declared flatly in `src/App.tsx`, grouped by domain with comment headers (`/* Projects */`, `/* Vendors */`, etc.). Convention per domain: `/<domain>`, `/<domain>/new`, `/<domain>/:id`, `/<domain>/:id/edit`.
- **No client-side route protection currently wired.** `src/routes/ProtectedRoute.tsx` exists but is an **empty file** and is not used anywhere in `App.tsx`. Every route is reachable without a guard; the only real enforcement is the backend rejecting missing/invalid JWTs on API calls. If asked to add auth guarding, you'll need to implement `ProtectedRoute.tsx` from scratch and wrap routes in it — don't assume it already works.
- **API calls**: one shared axios instance, `src/services/api.ts`, `baseURL: "http://localhost:5001/api/v1"` (hardcoded — there is no `.env` file for `apps/web`, so changing the API URL currently means editing this file directly). A request interceptor attaches `Authorization: Bearer <token>` from `localStorage.getItem("token")`.
- **Per-domain service files**: `src/services/<domain>.ts` (e.g. `purchase-orders.ts`, `vendors.ts`) each export TypeScript interfaces mirroring backend DTOs plus typed functions (`getX`, `getXById`, `createX`, `updateX`, `deleteX`) that call the shared `api` instance and unwrap `response.data.data`.
- **React Query is installed and provider-wrapped** (`QueryClientProvider` in `main.tsx`) **but not actually used anywhere.** Pages fetch data with plain `useState` + `useEffect` + manual `.then()/.catch()` (see `pages/purchase-orders/PurchaseOrders.tsx` for the canonical example). Do not introduce `useQuery`/`useMutation` in one place while leaving the rest of the app on manual fetching without discussing it with the user first — that would create an inconsistent pattern.
- **Pages organized per-domain** under `pages/<domain>/` following a strict CRUD quartet: `<Domain>.tsx` (list/table), `Add<Domain>.tsx`, `Edit<Domain>.tsx`, `View<Domain>.tsx`. Matching `components/<domain>/` folders hold list/filter/table subcomponents.
- **Path alias `@/*` → `src/*`** is configured in `tsconfig.app.json` but is **not consistently used** — most existing imports are relative (`../../services/x`). Match the surrounding file's style rather than unilaterally switching to `@/`.
- `lib/utils.ts` exports the shadcn-standard `cn()` helper.

---

## 6. Multi-Tenant Rules

This is a multi-tenant ERP: `Company` is the tenant root. **Every tenant-scoped model has a `companyId` column, a relation to `Company`, and `@@index([companyId])`.**

Mandatory rules when writing or modifying any service:

1. **Every query that lists, reads, updates, or deletes a tenant-scoped record MUST filter by `companyId`** from `req.user.companyId` — use `where: { id, companyId }`, never `where: { id }` alone.
2. **Every create MUST stamp `companyId`** onto the new row from the authenticated user's context.
3. Look at `services/purchase-order.service.ts` and `services/vendor.service.ts` as the **correct reference pattern** — `getPOById`, `updatePO`, `deletePO` all call a helper that does `findFirst({ where: { id, companyId } })` and throw a domain-specific "not found" error if the tenant doesn't own the row.
4. `services/company.service.ts` (`getCompany`/`updateCompany`) is a **known-bad example**: it calls `prisma.company.findFirst()` with no `companyId` filter at all, so it silently returns/updates whichever company happens to be first in the table regardless of which tenant is logged in. **Do not copy this pattern.** If you touch this file, fix it to scope by `req.user.companyId` unless told otherwise.
5. Never trust a `companyId` from the request body/query for a *write* target — always derive the acting tenant from `req.user.companyId` (post-`authMiddleware`), and only use body/query values as filters for cross-referenced entities you additionally re-verify belong to the same company (see `createPO` in `purchase-order.service.ts`, which re-fetches the referenced `PurchaseRequisition` scoped by `companyId` before trusting it).

---

## 7. Prisma Rules

- Single schema: `apps/api/prisma/schema.prisma`. Provider: `postgresql`, connection via `env("DATABASE_URL")`.
- Single `PrismaClient` instance (`apps/api/src/config/prisma.ts`) — import it, never construct a new client in a service or controller.
- **Money fields** are `Decimal @db.Decimal(12, 2)` (or `(14, 2)` for billing/measurement models). Prisma returns these as `Decimal` objects, which are **not JSON-serializable directly** — every service's DTO mapper (`toDTO`/`toVendorDTO`/etc.) must call `.toString()` on them before returning to the controller. Follow this convention for any new money field.
- **Dates**: stored as `DateTime`; DTOs typically emit `YYYY-MM-DD` via `.toISOString().slice(0, 10)` for date-only fields, full ISO for timestamps.
- **Line items** (`items` on `PurchaseRequisition`, `PurchaseOrder`, `MaterialReceipt`) are `Json?` columns holding arrays of item objects — not normalized child tables. Keep this pattern for similar list-of-items use cases unless a real relational need (e.g. querying across items) forces normalization.
- **IDs**: `String @id @default(cuid())` everywhere. Don't switch to UUID or autoincrement ints for new models.
- **Numbering fields** (e.g. `poNumber`, `requisitionNumber`, `receiptNumber`) are unique strings generated server-side with a date-prefixed random-suffix helper (see `autoNumber()` in `purchase-order.service.ts`) — reuse this pattern (`<PREFIX>-YYMM-NNNN`) for any new numbered-document model.
- **Status fields** are Prisma enums (`ProcurementStatus`, `ReceiptStatus`, `BillStatus`, etc.), not free-text strings — except `Vendor.status`/`Client.status`, which are plain `String @default("Active")`. Match whichever convention the model you're extending already uses; don't silently convert one to the other.
- Transactions: use `prisma.$transaction(async (tx) => { ... })` whenever a mutation must atomically touch two related models (see `createPO`, which creates the PO and flips the source PR's status to `ORDERED` in one transaction).

---

## 8. Controller → Service → Prisma Pattern (mandatory shape for every new endpoint)

**routes/\<domain\>.routes.ts** — thin. Attach `authMiddleware` (and `adminMiddleware` if admin-only) per route. Declare specific/static sub-paths (e.g. `/approved-prs`) **before** `/:id` so Express doesn't swallow them as a param match.

```ts
router.get("/special-thing", authMiddleware, getSpecialThingHandler); // before /:id
router.get("/:id", authMiddleware, getOne);
```

**controllers/\<domain\>.controller.ts** — one function per route. Pattern to replicate exactly:

```ts
export const getThing = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user!.companyId;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await getThingById(id, companyId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const is404 = error instanceof Error && error.message === "Thing not found";
    res.status(is404 ? 404 : 500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to load thing",
    });
  }
};
```

Response envelope is always `{ success: boolean, data?, message?, ...listFields }`. List endpoints spread extra pagination fields at the top level: `{ success: true, total, page, limit, data }`.

**services/\<domain\>.service.ts** — all Prisma access lives here, never in controllers.

- Define a `<Domain>FormInput` interface for create/update payloads and a `<Domain>ListQuery` interface for list filters.
- Define a DTO mapper function (`toDTO`/`to<Domain>DTO`) converting the raw Prisma row (with `Decimal`/`Date`/nullable fields) into a frontend-friendly plain object.
- `list<Domain>(companyId, query)`: build a `Prisma.<Domain>WhereInput` scoped by `companyId`, support `search` (case-insensitive `OR` contains across relevant text fields), optional filters, an **allow-listed** `sortBy` field (never pass user input straight into `orderBy` — validate against a fixed array first), pagination with `page`/`limit` capped (`Math.min(100, limit)`), and return `{ total, page, limit, data }` via `Promise.all([count, findMany])`.
- `get<Domain>ById(id, companyId)`: `findFirst({ where: { id, companyId } })`, throw `new Error("<Domain> not found")` if null.
- `create<Domain>`, `update<Domain>`, `delete<Domain>`: validate required fields, verify ownership via `get<Domain>ById` before update/delete, wrap multi-model mutations in `$transaction`.

When adding a new domain module, create all four files (`routes`, `controller`, `service`, and register the router in `app.ts`) — never skip the service layer and call Prisma from a controller directly.

---

## 9. Coding Standards

- **TypeScript everywhere**, `strict: true` on the backend. No implicit `any`.
- **ESM with explicit `.js` import extensions** in `apps/api` (NodeNext resolution) — this is required for `tsc`/`tsx` to work, not a style choice. Always write `from "../services/x.service.js"` even though the file on disk is `x.service.ts`.
- **Error handling**: throw plain `Error` objects with human-readable messages from services (e.g. `throw new Error("Vendor not found")`); controllers string-match `error.message` to decide the HTTP status. If you introduce a new "not found" message, follow the exact `"<Model> not found"` phrasing already used, since controllers match on it literally.
- **No custom error classes exist yet** — don't introduce one for a single endpoint; the whole codebase would need updating consistently. Raise it with the user first if you think it's warranted.
- **DTO mapping is mandatory** for anything returned from a service — never let a raw Prisma row (with `Decimal` objects) flow straight to `res.json()`.
- Keep interfaces (`XFormInput`, `XListQuery`, DTO shape) defined at the top of each service file, mirrored by hand in the matching frontend `services/<domain>.ts` file. When you change one, update the other in the same change.
- Frontend components: functional components only, hooks-based, no class components. Match existing file's import style (relative vs. `@/` alias) rather than converting wholesale.

---

## 10. UI Standards

- **Tailwind CSS v4** utility classes directly in JSX; no CSS modules, no styled-components.
- **shadcn/radix-ui** primitives live in `apps/web/src/components/ui/` — reuse and extend these rather than hand-rolling new base components (buttons, inputs, dialogs, etc.).
- `cn()` from `apps/web/src/lib/utils.ts` (clsx + tailwind-merge) is the standard way to conditionally compose class names.
- **lucide-react** is the icon library — match existing icon choices/sizes in `Sidebar.tsx` and page headers when adding new nav items or buttons.
- Layout convention: pages wrap their content in a shared `Layout` component (`components/layout/Layout.tsx`) which renders the persistent `Sidebar`. New pages must follow this same wrapping, not reinvent page chrome.
- Status badges/colors: domains define a `<DOMAIN>_STATUS_LABELS` and `<DOMAIN>_STATUS_COLORS` record (see `services/purchase-orders.ts` in web) mapping backend enum values to display labels and Tailwind badge classes — duplicate this pattern for any new status-driven domain rather than inlining conditional classes in components.
- Forms: no form-library (react-hook-form, formik) is currently in use — forms are built with plain controlled `useState` per field. Don't introduce a form library into one page without discussing it, since it would diverge from every other form in the app.

---

## 11. Build Requirements

- Package manager: **pnpm** (`packageManager: "pnpm@11.9.0"` pinned in root `package.json`). Always use `pnpm`, never `npm`/`yarn`.
- Root `build` script only builds `web` (`pnpm --filter web build`) — it does **not** build `api`. To build the API, run `pnpm --filter api build` explicitly (`tsc` → `dist/`).
- `apps/api` build: `pnpm --filter api build` runs `tsc` (no bundler — plain `tsc` emit to `dist/`).
- `apps/web` build: `pnpm --filter web build` runs `tsc -b && vite build` — this **type-checks via project references before bundling**, so a build failure here is very often a type error, not a Vite/bundler issue.
- No monorepo-wide `typecheck` turbo task exists — `turbo.json` only defines `build`, `dev`, `lint`, `test`. If you need to type-check without a full build, run each app's `tsc`/`tsc -b` directly.
- `turbo.json`'s `build` task depends on `^build` (upstream workspace builds first) with `outputs: ["dist/**"]` — relevant only once/if the empty `packages/*` are ever populated with real buildable code.

---

## 12. Migration Rules

- Prisma migrations live in `apps/api/prisma/migrations/<timestamp>_<name>/`, one folder per migration, matching the pattern already used: `20260708100800_pr_items`, `20260708100900_po_fields`, `20260708101000_mr_fields` (timestamp prefix `YYYYMMDDHHMMSS`, short snake_case description).
- **Never hand-edit an already-applied migration folder.** If a schema change is needed after a migration has been created, generate a **new** migration on top of it.
- Workflow for any schema change:
  1. Edit `apps/api/prisma/schema.prisma`.
  2. Run `pnpm --filter api exec prisma migrate dev --name <short_description>` to generate and apply a new migration folder.
  3. Verify the generated SQL in the new migration folder before considering the change complete.
  4. Regenerate the Prisma client if not done automatically (`pnpm --filter api exec prisma generate`) so `@prisma/client` types match the schema.
- Every new tenant-scoped model **must** include `companyId String` + `company Company @relation(fields: [companyId], references: [id])` + `@@index([companyId])`, following every existing model. Also add `@@index` on any field commonly used as a filter (`status`, foreign keys used in `where`), matching the density of indexing already present (e.g. `Vendor` indexes `companyId`, `status`, `category`).
- Do not introduce a second `datasource`/schema file — this project intentionally keeps one `schema.prisma` for the whole API.

---

## 13. Git Workflow

- Main branch: `main`. Feature work happens on `feature/<kebab-case-description>` branches (e.g. current branch `feature/dashboard-control-center`).
- Commit message conventions observed in history are **mixed** — both plain descriptive titles (`"Vendor module connected to PostgreSQL"`, `"Migration 5: Billing engine schema"`) and Conventional Commits style (`"feat(auth): implement user registration and login"`, `"feat(company): complete company management module"`) appear. When creating new commits:
  - Prefer **Conventional Commits** (`feat(scope): ...`, `fix(scope): ...`, `refactor(scope): ...`) for new work going forward, since it's the more structured of the two styles already in use — but don't rewrite existing history to match.
  - For schema-only changes, the repo's own convention is `"Migration N: <short description>"` — follow this for future migration-only commits.
  - For "wire up a domain to the database" milestones, the repo's convention is `"<Domain> module connected to PostgreSQL"`.
- **Only commit when explicitly asked.** Never commit proactively.
- Never `--amend`, force-push, or skip hooks unless explicitly instructed.
- Stage specific files by name; avoid `git add -A`/`git add .` to prevent accidentally committing `.env` or other ignored-but-present secrets.

---

## 14. Development Workflow

1. Ensure PostgreSQL is running locally and `apps/api/.env` has `DATABASE_URL`, `JWT_SECRET`, and (optionally) `PORT` set. **There is no `.env.example` and no `docker-compose.yml` in this repo** — you must provision Postgres and the `.env` file yourself; there are no committed setup docs to fall back on (`docs/`, `infrastructure/`, `scripts/` are empty).
2. Install deps once at the root: `pnpm install` (workspace-aware).
3. Run the API: `pnpm --filter api dev` (tsx watch on `src/server.ts`, default port `5001`).
4. Run the web app: `pnpm --filter web dev` (Vite dev server). Note the web app's API base URL is **hardcoded** to `http://localhost:5001/api/v1` in `apps/web/src/services/api.ts` — if you change the API port, update that file too (there's no env var wired for it).
5. After any schema change: apply a Prisma migration (§12) before running the API, or Prisma Client types will drift from the database.
6. Lint the frontend: `pnpm --filter web lint` (eslint flat config). There is currently **no lint setup for `apps/api`** — don't assume `pnpm --filter api lint` does anything meaningful unless a config is added.

---

## 15. AP OS–Specific Domain Rules

- **Procurement lifecycle is enforced server-side, not just in the UI**: a `PurchaseOrder` cannot be created without a `requisitionId` referencing a `PurchaseRequisition` that is `APPROVED` — `createPO` throws if the PR is missing or not approved, and atomically flips the PR to `ORDERED` on success. Any new step added to this chain (e.g. `MaterialReceipt` linking back to a PO) should follow the same "verify referenced entity ownership + status, then transactionally update both sides" approach.
- **`purchase.routes.ts` (generic/legacy "purchase" module) coexists with the newer, more specific trio**: `purchase-requisition.routes.ts`, `purchase-order.routes.ts`, `material-receipt.routes.ts`. The PR → PO → MR trio (added most recently, per uncommitted files at the time of writing) is the **canonical, actively-developed procurement pattern** — build new procurement features against that trio, not the older generic `purchase` module, unless told to consolidate/deprecate one of them.
- **Status enums drive workflow state** across nearly every domain (`ProcurementStatus`, `ReceiptStatus`, `BillStatus`, `MeasurementStatus`, `EquipmentStatus`, `AttendanceStatus`, `PaymentStatus`) — when adding a new transition, update both the Prisma enum and the frontend's matching `<DOMAIN>_STATUS_LABELS`/`_STATUS_COLORS` maps together.
- **Documents (`Document` model) are polymorphically linked** — optional FKs to Project, Client, Vendor, PurchaseOrder, PurchaseRequisition, and MaterialReceipt can all coexist on one row. Don't assume a `Document` belongs to exactly one parent type.
- Construction-domain vocabulary to preserve exactly (don't rename/genericize): Purchase Requisition (PR), Purchase Order (PO), Material Receipt (MR/GRN-equivalent), Measurement Book (MB), Running Bill (RA Bill / Final Bill / Advance Bill), BOQ item, GST/PAN (India-specific tax fields on Company/Vendor/Client).

---

## 16. Common Mistakes to Avoid

- **Do not** write code into `packages/*` or root `src/*` believing them to be an active shared layer — they are empty and unused (§3).
- **Do not** query/update a tenant-scoped model without filtering by `companyId` — copy the `company.controller.ts` bug (§6.4), and you've introduced a cross-tenant data leak.
- **Do not** assume `ProtectedRoute.tsx` guards any frontend route — it's an empty file not wired into `App.tsx` (§5).
- **Do not** assume React Query hooks (`useQuery`/`useMutation`) are the fetching convention — the actual convention is manual `useEffect` + `useState` (§5).
- **Do not** return a raw Prisma row (with `Decimal` fields) from a controller — it must go through a DTO mapper first, or JSON serialization/consumption will misbehave.
- **Do not** pass user-supplied `sortBy`/`orderBy` values straight into Prisma without validating against an allow-list — every existing `list<Domain>` function validates first.
- **Do not** rely on the `JWT_SECRET` fallback (`"ap_os_secret"`) — always require the real env var in any environment that matters.
- **Do not** hand-edit an already-applied Prisma migration folder — generate a new one instead.
- **Do not** run `npm`/`yarn` commands — this is a pnpm workspace; mixing lockfiles will break installs.
- **Do not** add a test framework, form library, state-management library, or shared package unilaterally — none currently exist in this repo, and introducing one for a single feature creates inconsistency. Surface the idea to the user first.
- **Do not** assume the root `build`/`test` scripts cover the API — root `build` only builds `web`, and root `test` is a non-functional stub (§7, §11).

---

## 17. Rules for Extending Existing Modules

When adding a field, filter, or action to an existing domain (Vendor, Client, Project, PurchaseRequisition, PurchaseOrder, MaterialReceipt, etc.):

1. **Schema first**: add the column to the relevant model in `schema.prisma`, generate a migration (§12).
2. **Service**: update the model's `FormInput`/`ListQuery` interfaces, the DTO mapper, and the relevant `list`/`get`/`create`/`update` functions in `services/<domain>.service.ts`. Keep the `companyId`-scoping intact for every touched query.
3. **Controller**: only touches `routes/controllers` if the new field needs a new query param or route — otherwise the controller usually needs no change since it passes `req.query`/`req.body` through.
4. **Frontend service**: mirror the exact same interface change in `apps/web/src/services/<domain>.ts` (the type shape must match the backend DTO field-for-field).
5. **Frontend pages/components**: update the relevant `Add<Domain>.tsx`/`Edit<Domain>.tsx` form fields, `View<Domain>.tsx` display, and the list/filter/table components in `components/<domain>/`.
6. **Status/label maps**: if the change touches an enum, update `<DOMAIN>_STATUS_LABELS`/`_STATUS_COLORS` on both sides.
7. Never change only one layer and leave the others stale — a schema change with no corresponding service/DTO/frontend update will silently produce `undefined` fields in the UI.

When adding an entirely new module, replicate the full pattern of an existing, recently-added module (Vendor or Purchase Order are the cleanest current references) rather than inventing a new shape: `routes` + `controller` + `service` on the backend, `services/<domain>.ts` + `pages/<domain>/*` + `components/<domain>/*` on the frontend, router mount in `app.ts`, route declarations in `App.tsx`, nav entry in `Sidebar.tsx`.

---

## 18. Mandatory Build Verification Before Finishing

Before declaring any backend or frontend change complete, you **must** run the relevant build/type-check and confirm it passes:

- Backend changes: `pnpm --filter api build` (runs `tsc`) must succeed with no type errors.
- Frontend changes: `pnpm --filter web build` (runs `tsc -b && vite build`) must succeed — this both type-checks and bundles.
- Frontend lint: `pnpm --filter web lint` should also be run and any new violations addressed (pre-existing lint debt is not your responsibility to fix unless asked, but don't add new violations).
- If you touched `schema.prisma`, confirm the migration applies cleanly (`prisma migrate dev`) and that `pnpm --filter api build` still succeeds afterward (Prisma Client types must match).
- There is no automated test suite to run (§ "Testing" — none exists). Build/type-check success is the actual bar for "done" in this repo today. If the user asks you to verify runtime behavior, use the `run`/`verify` skills to actually exercise the affected flow (start the dev servers, hit the endpoint/page) rather than relying on the build alone.
- Never report a task as finished if a build step you could have run was skipped.

---

## 19. Permanent Development Guidelines for All Future Claude Code Sessions

- Treat this file as authoritative for architecture/conventions, but always **re-verify against the actual code** before large changes — the codebase evolves, and this file can drift.
- Preserve the layered `routes → controllers → services → Prisma` separation on the backend, and the per-domain `pages/ + components/ + services/` separation on the frontend, for every change, no matter how small.
- Preserve multi-tenant scoping (`companyId`) on every query touching a tenant-scoped model, with no exceptions — this is the single most important correctness rule in this codebase.
- Do not introduce new architectural patterns (a shared package, a form library, a state manager, an error-class hierarchy, a test framework) without first surfacing the tradeoff to the user — this repo currently has exactly one way of doing each of these things (or, in the case of shared packages/tests, no way at all), and silently adding a second way creates long-term inconsistency.
- Keep backend DTOs and frontend service interfaces in sync in the same change — never update just one side.
- Update this CLAUDE.md whenever you make a structural decision that future sessions should know about (e.g., populating one of the empty `packages/*` for real, wiring up `ProtectedRoute.tsx`, adding a test framework, adding a shared types package) — this file should stay the living source of truth, not a one-time snapshot.
