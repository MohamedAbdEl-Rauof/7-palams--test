/*
 * Server-only accessor for the ClickUp credentials.
 *
 * CLICKUP_TOKEN is a workspace-wide read/write personal token — it is not
 * scoped to the one list this dashboard reads. Import this module only from
 * `app/api/*` route handlers. The window guard below turns an accidental
 * Client Component import into a loud crash instead of a silent `undefined`
 * that would ship the variable name into the client bundle.
 */

export class MissingEnvError extends Error {
  constructor(name: string) {
    super(
      `Missing environment variable ${name}. Copy .env.example to .env.local ` +
        `and fill it in — see the ID-discovery curls in README.md.`,
    );
    this.name = "MissingEnvError";
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new MissingEnvError(name);
  return value;
}

export interface ClickUpEnv {
  token: string;
  listId: string;
}

/*
 * CLICKUP_TEAM_ID is deliberately NOT required here. Nothing in the running
 * app consumes it — the workspace id is only needed for the one-off ID
 * discovery curls in README.md. Demanding it would turn a forgotten Vercel
 * variable into a hard 500 on every request in exchange for nothing.
 */
export function clickUpEnv(): ClickUpEnv {
  if (typeof window !== "undefined") {
    throw new Error("clickUpEnv() was called on the client — it leaks the token.");
  }
  return {
    token: required("CLICKUP_TOKEN"),
    listId: required("CLICKUP_LIST_ID"),
  };
}
