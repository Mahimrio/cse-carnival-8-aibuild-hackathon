/* eslint-disable @next/next/no-img-element */
"use client";

import { Camera, CheckCircle, FileImage, Sparkles, Upload, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";
import { useServerAction } from "@/hooks/use-server-action";
import { acceptPendingChange, rejectPendingChange } from "@/lib/actions/pending";
import { createClient } from "@/lib/supabase/client";
import type { PendingChange } from "@/lib/types";
import { cn } from "@/lib/utils";

const entityLabels = { schedule: "Schedule", room: "Room", event: "Event", announcement: "Announcement", assignment: "Assignment" };
const operationColor = {
  add: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  edit: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  delete: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function unpack(change: PendingChange) {
  const wrapper = change.payload as { data?: Record<string, unknown>; confidence?: number; reason?: string };
  return { data: wrapper.data ?? change.payload, confidence: wrapper.confidence ?? 0, reason: wrapper.reason ?? "Review the extracted fields before applying." };
}

export function SmartEntryPanel({ changes }: { changes: PendingChange[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { pending: reviewing, run } = useServerAction();
  const pending = changes.filter((change) => change.status === "pending");
  const reviewed = changes.filter((change) => change.status !== "pending");

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("smart-entry-queue").on("postgres_changes", { event: "*", schema: "public", table: "pending_changes" }, () => router.refresh()).subscribe();
    const fallback = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 10_000);
    return () => { clearInterval(fallback); void supabase.removeChannel(channel); };
  }, [router]);

  function chooseFile(next: File) {
    if (!next.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (next.size > 8 * 1024 * 1024) return toast.error("Images must be 8 MB or smaller.");
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  async function analyze() {
    if (!file) return toast.error("Choose an image first.");
    setProcessing(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("hint", hint);
      const response = await fetch("/api/parse-image", { method: "POST", body });
      const result = await response.json() as { proposals?: unknown[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Image parsing failed.");
      const count = result.proposals?.length ?? 0;
      if (count) toast.success(`Created ${count} proposal${count === 1 ? "" : "s"}.`);
      else toast.info("No actionable campus changes were found.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image parsing failed.");
    } finally {
      setProcessing(false);
    }
  }

  return <div><div className="mb-6"><h1 className="flex items-center gap-2 font-heading text-2xl font-bold"><Camera aria-hidden="true" className="text-primary" size={22} />Smart Entry</h1><p className="mt-1 text-sm text-muted-foreground">Turn a routine, notice, room sheet, event poster, or assignment image into reviewed campus data.</p></div><div className="mb-6 grid gap-4 lg:grid-cols-[1fr_20rem]"><button type="button" onClick={() => !processing && fileInput.current?.click()} onDrop={(event) => { event.preventDefault(); setDragging(false); const dropped = event.dataTransfer.files[0]; if (dropped) chooseFile(dropped); }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} className={cn("flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed p-8 text-center hover:border-primary hover:bg-teal-50/40 dark:hover:bg-teal-950/10", dragging && "border-primary bg-teal-50 dark:bg-teal-950/20", processing && "cursor-wait border-primary/50")}><input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; if (selected) chooseFile(selected); }} />{preview ? <><img src={preview} alt={`Preview of ${file?.name ?? "uploaded image"}`} className="max-h-40 max-w-full rounded-lg object-contain shadow-sm" /><p className="mt-3 text-sm font-medium">{file?.name}</p><p className="mt-1 text-xs text-muted-foreground">Click or drop another image</p></> : <><span className="mb-3 grid size-14 place-items-center rounded-full bg-muted text-muted-foreground"><Upload aria-hidden="true" size={24} /></span><p className="text-sm font-medium">Drop an image here, or click to upload</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPG, or WebP up to 8 MB</p></>}</button><Card><CardContent className="flex h-full flex-col pt-5"><label htmlFor="image-hint" className="text-sm font-medium">Optional context</label><Textarea id="image-hint" value={hint} onChange={(event) => setHint(event.target.value)} placeholder="Example: This is the revised Tuesday routine." className="mt-2 flex-1 resize-none" /><Button onClick={analyze} loading={processing} disabled={!file} className="mt-4 w-full"><Sparkles aria-hidden="true" size={16} />Analyze with Gemini</Button>{processing && <Progress value={65} className="mt-3" />}</CardContent></Card></div>{pending.length > 0 && <section className="mb-8"><SectionHeader title="Review Queue" description={`${pending.length} proposal${pending.length === 1 ? "" : "s"} awaiting review`} className="mb-4" /><div className="flex flex-col gap-4">{pending.map((change) => { const proposal = unpack(change); return <Card key={change.id} className="border-l-4 border-l-amber-400"><CardContent className="pt-5"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div className="flex flex-wrap items-center gap-2"><Badge className={operationColor[change.operation]}>{change.operation}</Badge><Badge>{entityLabels[change.entity_type]}</Badge><span className={cn("text-xs font-medium", proposal.confidence >= 0.8 ? "text-green-600" : "text-amber-600")}>{Math.round(proposal.confidence * 100)}% confidence</span></div>{change.image_url && <img src={change.image_url} alt="Source upload" className="size-16 rounded-lg border object-cover" />}</div><p className="mb-3 text-sm text-muted-foreground">{proposal.reason}</p>{change.target_id && <p className="mb-2 text-xs text-muted-foreground">Target: <code>{change.target_id}</code></p>}<div className="grid gap-2 rounded-lg border bg-muted/40 p-3 sm:grid-cols-2">{Object.entries(proposal.data).map(([key, value]) => <div key={key} className="min-w-0"><p className="text-xs font-medium text-muted-foreground">{key.replaceAll("_", " ")}</p><p className="break-words text-sm">{Array.isArray(value) ? value.join(", ") : String(value)}</p></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={reviewing} onClick={() => run(() => acceptPendingChange(change.id), "Proposal accepted and applied.")}><CheckCircle size={14} />Accept & Apply</Button><Button size="sm" variant="outline" disabled={reviewing} onClick={() => run(() => rejectPendingChange(change.id), "Proposal rejected.")}><XCircle size={14} />Reject</Button></div></CardContent></Card>; })}</div></section>}{reviewed.length > 0 && <section><SectionHeader title="Reviewed" description={`${reviewed.length} completed proposal${reviewed.length === 1 ? "" : "s"}`} className="mb-4" /><div className="flex flex-col gap-2">{reviewed.slice(0, 20).map((change) => <div key={change.id} className={cn("flex items-center gap-3 rounded-card border px-4 py-3 text-sm", change.status === "accepted" ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300" : "bg-card text-muted-foreground")}>{change.status === "accepted" ? <CheckCircle size={15} /> : <XCircle size={15} />}<span>{change.status === "accepted" ? "Accepted" : "Rejected"} · {change.operation} {entityLabels[change.entity_type]}</span></div>)}</div></section>}{changes.length === 0 && <EmptyState title="No proposals yet" description="Upload an image to create structured data proposals." icon={<FileImage size={22} />} />}</div>;
}