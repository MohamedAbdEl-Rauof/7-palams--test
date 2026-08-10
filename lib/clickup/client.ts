import { clickUpEnv } from "./env";
import type { ClickUpListMeta, ClickUpTask, ClickUpTaskPage } from "./types";

const API = "https://api.clickup.com/api/v2";

/** ClickUp returns 100 tasks per page and offers no way to raise it. */
const PAGE_SIZE = 100;

/**
 * Safety stop for the pagination loop. At 34 tasks today this is ~500x the
 * real size; it exists only so a malformed `last_page` can never spin forever
 * against a token that is rate-limited to ~100 requests/minute.
 */
const MAX_PAGES = 50;

export class ClickUpApiError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string, url: string) {
    super(`ClickUp API ${status} for ${url}: ${body.slice(0, 500)}`);
    this.name = "ClickUpApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const { token } = clickUpEnv();
  const url = new URL(`${API}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const response = await fetch(url, {
    // A personal token goes in a bare Authorization header — no "Bearer" prefix.
    headers: { Authorization: token, "Content-Type": "application/json" },
    // Opt out of caching explicitly: the dashboard must reflect ClickUp edits
    // immediately, and stale visit counts are worse than a slow render.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ClickUpApiError(response.status, await response.text(), url.pathname);
  }
  return (await response.json()) as T;
}

/**
 * Fetch every non-archived task on the configured list.
 *
 * Deliberately unfiltered by date. The list holds ~34 tasks — a single page —
 * so filtering in memory costs nothing and buys two things the API cannot do:
 * a due_date→date_created fallback (due_date is unset on 8 of 34 tasks), and
 * day boundaries resolved in Asia/Riyadh rather than ClickUp's own reckoning.
 * Revisit this if the list ever grows past a few thousand tasks.
 */
export async function fetchAllTasks(): Promise<ClickUpTask[]> {
  const { listId } = clickUpEnv();
  const tasks: ClickUpTask[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await request<ClickUpTaskPage>(`/list/${listId}/task`, {
      archived: "false",
      // Closed tasks are excluded by default, and تمت الزيارة is a closed-type
      // status. Without this the مكتمل column is a hard zero — verified during
      // discovery, where the list reported task_count 26 but returned 34.
      include_closed: "true",
      page: String(page),
    });

    tasks.push(...data.tasks);
    if (data.last_page || data.tasks.length < PAGE_SIZE) return tasks;
  }

  throw new Error(`Pagination exceeded ${MAX_PAGES} pages for list ${listId}.`);
}

/** List metadata, including the live status set. Used by the diagnostics route. */
export function fetchListMeta(): Promise<ClickUpListMeta> {
  const { listId } = clickUpEnv();
  return request<ClickUpListMeta>(`/list/${listId}`);
}
