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

## Business rules

Task status → metric mapping (all 8 custom statuses must map to exactly one):

| Metric | Statuses |
| --- | --- |
| مكتمل (completed) | تمت الزيارة |
| متبقي (remaining) | ضروري الزيارة · البدء · انتظار التصريح · تحت الدراسة · في انتظار الزيارة |
| إخفاقات (failures) | لم تتم الزيارة · انتهت ولم تتم الزيارة |

**Invariant:** `total = completed + remaining + failures` for every delegate row.

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
