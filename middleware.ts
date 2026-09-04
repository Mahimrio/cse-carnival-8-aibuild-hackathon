import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const authRoute = path === "/login" || path === "/signup";

  const redirect = (destination: string, currentResponse?: NextResponse) => {
    const nextResponse = NextResponse.redirect(new URL(destination, request.url));
    if (currentResponse) {
      currentResponse.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie));
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

  try {
    const { response, user } = await updateSession(request);
    if (!user) return authRoute ? response : redirect("/login", response);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return response;
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.status !== "active") {
      return path === "/pending" ? response : redirect("/pending", response);
    }
    if (authRoute || path === "/pending") return redirect("/", response);
    if (path.startsWith("/admin") && profile.role !== "super_admin") return redirect("/", response);
    if (path.startsWith("/smart-entry") && !["super_admin", "cr", "sr"].includes(profile.role)) return redirect("/", response);
    return response;
  } catch (error) {
    console.error("Middleware routing error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};