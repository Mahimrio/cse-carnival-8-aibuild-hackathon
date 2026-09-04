"use client";

import { X } from "lucide-react";
import { useEffect, useId } from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({ open, onClose, title, children, footer, size = "md" }: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close dialog" />
      <div className={cn("relative flex max-h-[90vh] w-full flex-col rounded-card bg-card shadow-2xl", sizes[size])}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id={titleId} className="font-heading text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button></>}>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </Dialog>
  );
}