"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { loginAction, type AuthState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = {};
const demoEmail = "admin@campusos.demo";
const demoPassword = "CampusOS2026!";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <>
      <h2 className="mb-5 font-heading font-semibold">Sign in to your account</h2>
      <div className="mb-5 rounded-card border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">Demo Super Admin</p>
        <dl className="mt-2 grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Email</dt><dd><code className="select-all">{demoEmail}</code></dd>
          <dt className="text-muted-foreground">Password</dt><dd><code className="select-all">{demoPassword}</code></dd>
        </dl>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Already filled below. Click Sign In.</p>
      </div>
      <form action={action} className="flex flex-col gap-4">
        <div className="space-y-1.5"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" defaultValue={demoEmail} placeholder="you@aust.edu" autoComplete="email" autoFocus required /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" defaultValue={demoPassword} placeholder="Enter your password" autoComplete="current-password" minLength={6} required /></div>
        {state.error && <Alert variant="danger">{state.error}</Alert>}
        <Button type="submit" size="lg" loading={pending} className="mt-1 w-full"><LogIn aria-hidden="true" size={16} />Sign In</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">Don&apos;t have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link></p>
    </>
  );
}