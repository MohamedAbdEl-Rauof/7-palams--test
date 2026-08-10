# لوحة نور — Noor Dashboard

Arabic RTL executive dashboard showing delegate (مندوب) performance from ClickUp,
built for **شركة النخيل السبع التجارية** and designed to embed inside a ClickUp
Dashboard via a URL Embed Card.

## Why this exists

ClickUp's Business Plan cannot render a summary table with one row per assignee
and columns counting tasks per status (إجمالي | مكتمل | متبقي | إخفاقات) over a
free date range. This app reads the ClickUp API server-side and renders exactly
that table.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 ·
shadcn/ui (Radix primitives, RTL enabled) · lucide-react · date-fns

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in CLICKUP_TOKEN
npm run dev                  # http://localhost:3000
```

## Environment variables

See `.env.example`. Set the same values in Vercel → Settings → Environment
Variables before deploying.

### Discovering `CLICKUP_LIST_ID` and `CLICKUP_TEAM_ID`

With `CLICKUP_TOKEN` exported in your shell:

```bash
# 1. Team (workspace) ID
curl -s -H "Authorization: $CLICKUP_TOKEN" \
  https://api.clickup.com/api/v2/team | jq '.teams[] | {id, name}'

# 2. Spaces — look for "المناديب"
curl -s -H "Authorization: $CLICKUP_TOKEN" \
  "https://api.clickup.com/api/v2/team/$TEAM_ID/space?archived=false" \
  | jq '.spaces[] | {id, name}'

# 3a. Folderless lists in that space — look for "مشهد زيارة"
curl -s -H "Authorization: $CLICKUP_TOKEN" \
  "https://api.clickup.com/api/v2/space/$SPACE_ID/list?archived=false" \
  | jq '.lists[] | {id, name}'

# 3b. If not found above, the list lives inside a folder:
curl -s -H "Authorization: $CLICKUP_TOKEN" \
  "https://api.clickup.com/api/v2/space/$SPACE_ID/folder?archived=false" \
  | jq '.folders[] | {id, name, lists: [.lists[] | {id, name}]}'
```

`GET /space/{id}/list` returns **folderless lists only** — step 3b is not
optional if step 3a comes up empty.

Resolved for this workspace (values live in `.env.local`, not here): the
workspace is **النخيل السبع التجارية**, the space is **المناديب**, and
**مشهد زيارة** is a folderless list in it — so step 3b was not needed.

## Business rules

Task status → metric mapping. The list defines **five** statuses today
(verified against `GET /list/{id}`); the mapping in `lib/clickup/status.ts`
carries three extra entries so that re-adding one in ClickUp does not break the
dashboard.

| Metric | Live statuses | Mapped but not currently on the list |
| --- | --- | --- |
| مكتمل (completed) | تمت الزيارة | — |
| متبقي (remaining) | ضروري الزيارة · انتظار التصريح | البدء · تحت الدراسة · في انتظار الزيارة |
| إخفاقات (failures) | لم تتم الزيارة · انتهت ولم تتم الزيارة | — |

`classify()` **throws** on a status it does not know rather than defaulting to
متبقي — a renamed status quietly landing in the wrong bucket would keep the
invariant satisfied while reporting wrong numbers.

**Invariant:** `total = completed + remaining + failures` for every delegate row.

### Aggregation rules

Settled in Phase 2 against the real list (34 tasks):

- **Date range filters on `due_date`, falling back to `date_created`** when it
  is unset (8 of 34 tasks). Without the fallback those tasks would be invisible
  in every report. `meta.datedByFallback` counts how many used it.
- **A task with several assignees counts in full for each of them.** Seven tasks
  are co-assigned, so the column totals across rows exceed the task count;
  `meta.assignments` vs `meta.inRange` makes the gap explicit (43 vs 34 over the
  full span). Each individual row still satisfies the invariant.
- **Tasks with no assignee get a `غير مسند` row** rather than being dropped.
- **`include_closed=true` is mandatory.** Closed tasks are excluded by default
  and تمت الزيارة is a closed-type status — the list reports `task_count: 26`
  but returns 34. Omitting it makes مكتمل a hard zero.
- **Day boundaries resolve in Asia/Riyadh** (fixed UTC+3, no DST), not the
  server's UTC. See `lib/date-range.ts`.
- The list has no subtasks, so `subtasks=true` is not sent.

## API

`GET /api/report?from=yyyy-MM-dd&to=yyyy-MM-dd` → `{ rows, meta }`. Both params
are optional; omitting them reports the current month in Riyadh. Supplying only
one is a `400`.

Every route, including this one, requires `?k=<DASHBOARD_SECRET>` — see below.

## Embedding in ClickUp

Add a **URL Embed Card** to a ClickUp Dashboard pointing at:

```
https://<your-domain>/?k=<DASHBOARD_SECRET>
```

Append `&from=yyyy-MM-dd&to=yyyy-MM-dd` to pin the card to a fixed period;
without them it opens on the current month in Riyadh.

The gate lives in `proxy.ts` (Middleware is called **Proxy** as of Next.js 16)
so a route added later cannot forget it. It fails closed: a missing
`DASHBOARD_SECRET` denies every request rather than allowing them.

Headers set in `next.config.ts`:

| Header | Value | Why |
| --- | --- | --- |
| `Content-Security-Policy` | `frame-ancestors 'self' https://*.clickup.com` | Lets ClickUp frame the app; blocks everyone else. |
| `Referrer-Policy` | `no-referrer` | Stops `?k=<secret>` leaking to third parties via `Referer`. |
| `X-Content-Type-Options` | `nosniff` | |

There is deliberately **no `X-Frame-Options`** header — `DENY` would override
`frame-ancestors` in older browsers and break the embed.

## Security

- `CLICKUP_TOKEN` is a **workspace-wide read/write** personal token. It is not
  scoped to one list. It is read only inside `app/api/*` route handlers and must
  never appear in a Client Component or a `NEXT_PUBLIC_*` variable.
- Any variable prefixed `NEXT_PUBLIC_` is inlined into the client bundle at
  build time — that prefix is a one-way door. Only `NEXT_PUBLIC_APP_NAME` uses it.
- `.env.local` is gitignored; `.env.example` is deliberately un-ignored via a
  `!.env.example` negation in `.gitignore`.
- **Embedding:** to be framed by ClickUp the app must send
  `Content-Security-Policy: frame-ancestors 'self' https://*.clickup.com` and
  must not send `X-Frame-Options: DENY`. Without an explicit `frame-ancestors`,
  any site can frame the dashboard.
- **`DASHBOARD_SECRET` in the URL is obscurity, not authentication.** It is
  stored in the ClickUp card config and leaks via `Referer` headers and request
  logs. Treat the dashboard as "anyone with the link can see the data".

## Verifying no secret reaches the client

```bash
npm run build
grep -r "pk_" .next/static && echo "LEAK" || echo "clean"
```

## RTL notes

- `<html lang="ar" dir="rtl">` plus shadcn's `DirectionProvider` in
  `app/layout.tsx`. Radix primitives (Select, Popover, Calendar) read direction
  from that React context, **not** from the `dir` attribute — without the
  provider, dropdown alignment and arrow-key navigation stay LTR.
- `components.json` has `"rtl": true`, so `npx shadcn@latest add <component>`
  emits RTL-correct styles automatically.
- Prefer logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`,
  `text-end`) over `left`/`right`.
- Numbers stay Latin (0-9), never Arabic-Indic. Tables use `tabular-nums`.

## Theming

Tailwind v4 is CSS-first — **there is no `tailwind.config.ts`.** The brand
palette lives in the `@theme inline` block in `app/globals.css`:

| Token | Value |
| --- | --- |
| `--color-brand` / `--primary` | `#0F766E` |
| `--color-success` | `#16A34A` |
| `--color-warning` | `#EAB308` |
| `--color-danger` | `#DC2626` |
| `--background` | `#FAFAFA` |
# 7-palams--test
