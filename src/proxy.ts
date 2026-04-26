import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getHostPolicy } from "@/lib/host-policy";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/claim") ||
    pathname.startsWith("/scans") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/api/user")
  );
}

function applyNoindexHeader(response: NextResponse, noindex: boolean): NextResponse {
  if (noindex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function createUnauthorizedResponse(req: NextRequest, noindex: boolean): NextResponse {
  // API clients want JSON 401, not an HTML redirect to /login.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.json(
      { error: "unauthorized" },
      { status: 401 },
    );
    return applyNoindexHeader(response, noindex);
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`,
  );
  const response = NextResponse.redirect(loginUrl);
  return applyNoindexHeader(response, noindex);
}

export async function proxy(req: NextRequest) {
  const policy = getHostPolicy({
    requestUrl: req.nextUrl,
    hostHeader: req.headers.get("host"),
    canonicalAppUrl:
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      null,
  });

  if (policy.redirectTo) {
    const response = NextResponse.redirect(policy.redirectTo, 308);
    return applyNoindexHeader(response, policy.noindex);
  }

  if (isProtectedPath(req.nextUrl.pathname)) {
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    if (!nextAuthSecret) {
      return createUnauthorizedResponse(req, policy.noindex);
    }

    const token = await getToken({ req, secret: nextAuthSecret });
    if (!token) {
      return createUnauthorizedResponse(req, policy.noindex);
    }
  }

  const response = NextResponse.next();
  return applyNoindexHeader(response, policy.noindex);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
