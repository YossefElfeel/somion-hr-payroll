# SOMION HR — Payroll

End-to-end payroll workflow for an HR system. Three roles, one shared run lifecycle, batched approvals and payments across days.

## Roles

- **HR** — adds bonuses, deductions, and loans; freezes the run; submits employees for approval; sends approved employees to finance.
- **Admin** — reviews submitted batches, approves or requests changes per employee.
- **Finance** — confirms bank payments and marks employees as paid.

Switch roles in the top-right dropdown of the header.

## Run lifecycle

A **Payroll Run** = (frequency, period). Run state is coarse:

```
OPEN  ──Freeze──►  FROZEN  ──all paid/excluded──►  CLOSED
  ▲                  │
  └──── Re-open ─────┘
```

Approval and payment progress is tracked **per employee**, not on the run, so HR can submit multiple batches across days while the run stays FROZEN. Each row moves independently:

```
DRAFT → SUBMITTED → APPROVED → IN_FINANCE_QUEUE → PAID
            │
            └→ CHANGES_NEEDED → SUBMITTED (after fix)
```

`EXCLUDED` is a terminal sidetrack for employees skipped this period (unpaid leave, etc.).

## Frequencies

Monthly, Bi-weekly, Weekly, Hourly. Each employee has one. Loans on multi-month employees auto-attach an installment to every new run for that employee, until paid off.

## Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS
- TypeScript
- In-memory store on `globalThis` (dev demo) — swap for Postgres when productionising

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The store lives in memory on `globalThis`, which is fine for one Node process.

## Deploy on Vercel

The store is held on `globalThis`. Local dev works because every request hits the same Node process — but Vercel's serverless functions don't share `globalThis` across invocations, so without persistence a `submit` action mutates instance A and the next `/admin/approvals` render lands on instance B and sees nothing.

Persistence layer ([src/lib/domain/persistence.ts](src/lib/domain/persistence.ts)) loads the store snapshot from **Upstash Redis** at the start of every request and saves it back after every mutation.

Setup:

1. Add **Upstash Redis** to the project via Vercel Marketplace → `Storage` → Upstash. Vercel auto-injects `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` into the project's env vars (also accepts the legacy `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
2. Redeploy. The seeded data populates Redis on the first request.

If the env vars aren't set, the persistence layer no-ops silently and you fall back to ephemeral in-memory state — fine for local dev, broken on serverless.

The store is seeded with one OPEN April 2026 run, one CLOSED March 2026 run, 9 monthly employees, 3 non-monthly employees, sample bonuses/deductions, and one active loan on Tim David.

## Project layout

```
src/
├─ app/
│  ├─ payroll/                     HR overview
│  ├─ admin/approvals/             Admin approval dashboard + run review
│  └─ finance/queue/               Finance payment queue
├─ components/
│  ├─ payroll/                     overview-table, modals, drawer
│  ├─ admin/                       approval-review
│  ├─ finance/                     finance-queue
│  ├─ shell/                       sidebar, header, role switcher
│  └─ ui/                          button, modal, badge, card, input
└─ lib/
   ├─ actions.ts                   Server actions (single source of mutations)
   ├─ utils.ts
   └─ domain/
      ├─ types.ts                  Domain types
      ├─ state-machine.ts          Run + employee transitions, gating helpers
      ├─ totals.ts                 Salary computation
      └─ store.ts                  In-memory data store + seed
```
