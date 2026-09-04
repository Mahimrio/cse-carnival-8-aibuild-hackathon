"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/common";

export function useServerAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, successMessage: string, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      onSuccess?.();
      router.refresh();
    });
  }

  return { pending, run };
}