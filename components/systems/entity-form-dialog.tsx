"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/common";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface EntityField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  full?: boolean;
}

export function EntityFormDialog({ open, onClose, title, submitLabel = "Save", fields, initial, onSubmit, successMessage }: { open: boolean; onClose: () => void; title: string; submitLabel?: string; fields: EntityField[]; initial: object; onSubmit: (values: Record<string, string>) => Promise<ActionResult>; successMessage: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const initialValues = initial as Record<string, string | number>;
  const formKey = `${title}-${Object.values(initialValues).join("-")}`;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    startTransition(async () => {
      const result = await onSubmit(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      onClose();
      router.refresh();
    });
  }

  return <Dialog open={open} onClose={onClose} title={title} size="lg" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="entity-record-form" loading={pending}>{submitLabel}</Button></>}><form key={formKey} id="entity-record-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <div key={field.name} className={field.full ? "sm:col-span-2" : ""}><Label htmlFor={field.name}>{field.label}{field.required ? " *" : ""}</Label>{field.type === "textarea" ? <Textarea id={field.name} name={field.name} defaultValue={initialValues[field.name]} placeholder={field.placeholder} required={field.required} className="mt-1.5" /> : field.type === "select" ? <Select id={field.name} name={field.name} defaultValue={initialValues[field.name]} required={field.required} className="mt-1.5">{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select> : <Input id={field.name} name={field.name} type={field.type ?? "text"} defaultValue={initialValues[field.name]} placeholder={field.placeholder} required={field.required} className="mt-1.5" />}</div>)}</form></Dialog>;
}