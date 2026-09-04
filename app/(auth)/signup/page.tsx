import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return <AuthShell title="Create Account" description="AUST Campus Management Platform"><SignupForm /></AuthShell>;
}