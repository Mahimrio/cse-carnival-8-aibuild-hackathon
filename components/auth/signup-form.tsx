"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signupAction, type AuthState } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: AuthState = {};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);
  return (
    <>
      <form action={action} className="flex flex-col gap-4">
        <div className="space-y-1.5"><Label htmlFor="full_name">Full name</Label><Input id="full_name" name="full_name" placeholder="Your full name" autoComplete="name" required /></div>
        <div className="space-y-1.5"><Label htmlFor="email">AUST email</Label><Input id="email" name="email" type="email" placeholder="you@aust.edu" autoComplete="email" required /></div>
        <div className="space-y-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" placeholder="At least 6 characters" autoComplete="new-password" minLength={6} required /></div>
        <div className="space-y-1.5"><Label htmlFor="requested_role">Role request</Label><Select id="requested_role" name="requested_role" defaultValue="student"><option value="student">Student</option><option value="cr">Class Representative (CR)</option><option value="sr">Society Representative (SR)</option></Select></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="section">Section</Label><Input id="section" name="section" placeholder="B" /></div>
          <div className="space-y-1.5"><Label htmlFor="semester">Semester</Label><Input id="semester" name="semester" placeholder="8" /></div>
          <div className="space-y-1.5"><Label htmlFor="year">Year</Label><Input id="year" name="year" placeholder="4" /></div>
        </div>
        {state.error && <Alert variant="danger">{state.error}</Alert>}
        <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">Create Account</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
    </>
  );
}