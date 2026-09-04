import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
    const authRoute = path === "/login" || path === "/signup";

    const redirect = (destination: string, currentResponse?: NextResponse) => {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      url.search = "";
      const nextResponse = NextResponse.redirect(url);
      if (currentResponse) {
        try {
          currentResponse.cookies.getAll().forEach((cookie) => {
            nextResponse.cookies.set(cookie.name, cookie.value, cookie);
          });
        } catch {
          // ignore cookie copy errors
        }
      }
      return nextResponse;
    };

    // 1. If DEMO MODE is active, bypass all auth barriers immediately
    if (demoMode) {
      if (authRoute || path === "/pending") {
        return redirect("/");
      }
      return NextResponse.next();
    }

    // 2. If Supabase environment variables are not set on deployment, allow page to render rather than crashing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.next();
    }

    // 3. Safe session update with timeout protection (prevents Edge invocation timeout crash)
    const sessionPromise = updateSession(request);
    const timeoutPromise = new Promise<{ response: NextResponse; user: null }>((resolve) => {
      setTimeout(() => resolve({ response: NextResponse.next({ request }), user: null }), 2500);
    });

    const { response, user } = await Promise.race([sessionPromise, timeoutPromise]);

    if (!user) {
      return authRoute ? response : redirect("/login", response);
    }

    if (authRoute) {
      return redirect("/", response);
    }

    return response;
  } catch (error) {
    console.error("Middleware routing error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};