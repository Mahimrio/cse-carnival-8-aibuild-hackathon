import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const path = request.nextUrl.pathname;
  const authRoute = path === "/login" || path === "/signup";
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const redirect = (destination: string) => {
    const nextResponse = NextResponse.redirect(new URL(destination, request.url));
    response.cookies.getAll().forEach((cookie) => nextResponse.cookies.set(cookie));
    return nextResponse;
  };

  if (demoMode) return authRoute || path === "/pending" ? redirect("/") : response;
  if (!user) return authRoute ? response : redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    return path === "/pending" ? response : redirect("/pending");
  }
  if (authRoute || path === "/pending") return redirect("/");
  if (path.startsWith("/admin") && profile.role !== "super_admin") return redirect("/");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};