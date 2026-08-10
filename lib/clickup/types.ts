/*
 * Hand-written types for the subset of the ClickUp v2 response we actually
 * consume. The real payload is far larger; typing only what is read keeps the
 * surface honest and makes an upstream field rename a compile error rather
 * than a silent `undefined`.
 *
 * Note the string-typed epochs: ClickUp returns every timestamp as a
 * milliseconds-since-epoch *string*, not a number.
 */

export interface ClickUpUser {
  id: number;
  username: string;
  initials?: string;
  color?: string;
  profilePicture?: string | null;
}

export interface ClickUpStatus {
  /** The Arabic status label, e.g. "تمت الزيارة". ClickUp lowercases these. */
  status: string;
  /** "open" | "custom" | "closed" | "done" */
  type: string;
  orderindex: number;
  color: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  status: ClickUpStatus;
  assignees: ClickUpUser[];
  /** ms epoch as a string, or null when the task has no due date. */
  due_date: string | null;
  /** ms epoch as a string. Always present. */
  date_created: string;
  date_closed: string | null;
  url: string;
}

export interface ClickUpTaskPage {
  tasks: ClickUpTask[];
  /** Present on recent API versions; we also fall back to a short-page check. */
  last_page?: boolean;
}

export interface ClickUpListMeta {
  id: string;
  name: string;
  statuses: ClickUpStatus[];
}
