import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates JWT with Supabase Auth — required to avoid security warning.
  // This is the only auth network call in the entire request cycle; pages and API
  // routes read from the x-user-id header injected below instead of calling auth again.
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdmin = !!user && user.id === process.env.ADMIN_USER_ID;

  // Unauthenticated → signup (invite-only beta, most visitors are new)
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    return NextResponse.redirect(url);
  }

  // Only the invites page is admin-only; the rest of /admin is open to all users
  if (pathname.startsWith("/admin/invites") && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Logged-in on auth pages → dashboard
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password";
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Inject validated user context into request headers.
  // Pages and API routes read these — zero extra auth calls anywhere.
  const requestHeaders = new Headers(request.headers);
  if (user) {
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email ?? "");
    requestHeaders.set("x-is-admin", isAdmin ? "1" : "0");
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
