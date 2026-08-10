import { NextResponse, type NextRequest } from "next/server";

/*
 * Shared-secret gate for the embedded dashboard.
 *
 * The ClickUp URL Embed Card is configured with ?k=<DASHBOARD_SECRET>, and this
 * runs before the page and the API route so a new route cannot forget the check.
 *
 * This is obscurity, not authentication. The key sits in the card config, in
 * browser history, and in every request log. It stops casual discovery of the
 * URL; it does not stop anyone who has seen the link. Treat the data as
 * "anyone with the link can read it" — see the security section in README.md.
 *
 * Middleware is called Proxy as of Next.js 16; the behaviour is unchanged.
 */

/** Length-independent comparison, so the response time reveals nothing. */
function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function deny(message: string): NextResponse {
  return new NextResponse(message, {
    status: 401,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function proxy(request: NextRequest): NextResponse {
  const expected = process.env.DASHBOARD_SECRET;

  // Fail closed. A missing secret must never mean "let everyone in".
  if (!expected) {
    return deny("إعدادات الخادم غير مكتملة: DASHBOARD_SECRET غير محدد.");
  }

  const provided = request.nextUrl.searchParams.get("k");
  if (!provided || !secretsMatch(provided, expected)) {
    const hint =
      process.env.NODE_ENV === "development"
        ? "\n\nDev: append ?k=$DASHBOARD_SECRET (the value in .env.local)."
        : "";
    return deny(`مفتاح الوصول غير صحيح.${hint}`);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Everything except Next's own assets, the favicon and the fonts — those are
   * already public by nature and gating them would only break rendering of the
   * 401 page itself.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
