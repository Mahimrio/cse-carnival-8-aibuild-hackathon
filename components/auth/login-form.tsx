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

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <>
      <h2 className="mb-5 font-heading font-semibold">Sign in to your account</h2>
      <form action={action} className="flex flex-col gap-4">
        <div className="space-y-1.5"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" placeholder="you@aust.edu" autoComplete="email" autoFocus required /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" minLength={6} required /></div>
        {state.error && <Alert variant="danger">{state.error}</Alert>}
        <Button type="submit" size="lg" loading={pending} className="mt-1 w-full"><LogIn aria-hidden="true" size={16} />Sign In</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">Don&apos;t have an account? <Link href="/signup" className="font-medium text-primary hover:underline">Sign up</Link></p>
    </>
  );
}