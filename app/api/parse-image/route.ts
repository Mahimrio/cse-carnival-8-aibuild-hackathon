import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/actions/common";
import { proposerLabel } from "@/lib/auth/roles";
import { getToday } from "@/lib/now";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const proposalSchema = z.object({
  entity_type: z.enum(["schedule", "room", "event", "announcement", "assignment"]),
  operation: z.enum(["add", "edit", "delete"]),
  target_id: z.string().nullable().optional(),
  payload: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});
const generatedProposalSchema = proposalSchema.omit({ payload: true, target_id: true }).extend({ target_id: z.string(), payload_json: z.string() });
const responseSchema = z.object({ proposals: z.array(generatedProposalSchema).max(30) });

const jsonSchema = {
  type: Type.OBJECT,
  required: ["proposals"],
  properties: {
    proposals: {
      type: Type.ARRAY,
      maxItems: 30,
      items: {
        type: Type.OBJECT,
        required: ["entity_type", "operation", "target_id", "payload_json", "confidence", "reason"],
        properties: {
          entity_type: { type: Type.STRING, enum: ["schedule", "room", "event", "announcement", "assignment"] },
          operation: { type: Type.STRING, enum: ["add", "edit", "delete"] },
          target_id: { type: Type.STRING },
          payload_json: { type: Type.STRING },
          confidence: { type: Type.NUMBER, minimum: 0, maximum: 1 },
          reason: { type: Type.STRING },
        },
      },
    },
  },
};

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100);
}

function normalizePayload(entity: z.infer<typeof proposalSchema>["entity_type"], operation: z.infer<typeof proposalSchema>["operation"], value: Record<string, unknown>) {
  const payload = { ...value };
  if ("capacity" in payload) payload.capacity = Number(payload.capacity);
  if ("floor" in payload) payload.floor = Number(payload.floor);
  if ("marks" in payload) payload.marks = Number(payload.marks);
  if (entity === "room" && operation === "add") {
    if (!['classroom', 'lab', 'seminar'].includes(String(payload.type))) payload.type = "classroom";
    if (!['available', 'unavailable'].includes(String(payload.status))) payload.status = "available";
    if (!Array.isArray(payload.equipment)) payload.equipment = [];
  }
  if (entity === "event" && operation === "add") {
    if (!['upcoming', 'ongoing', 'completed', 'cancelled', 'full'].includes(String(payload.status))) payload.status = "upcoming";
    if (!payload.end_date && payload.date) payload.end_date = payload.date;
  }
  if (entity === "announcement" && operation === "add" && !['high', 'medium', 'low'].includes(String(payload.priority))) payload.priority = "medium";
  if (entity === "assignment" && operation === "add" && !['pending', 'submitted', 'graded', 'late'].includes(String(payload.status))) payload.status = "pending";
  return payload;
}

export async function POST(request: Request) {
  let storagePath: string | null = null;
  try {
    const profile = await requireManager();
    const formData = await request.formData();
    const file = formData.get("file");
    const hint = String(formData.get("hint") ?? "").trim();
    if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Choose a valid image file." }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini is not configured." }, { status: 503 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const admin = createAdminClient();
    storagePath = `${profile.id}/${Date.now()}-${safeFileName(file.name || "upload")}`;
    const { error: uploadError } = await admin.storage.from("notices").upload(storagePath, bytes, { contentType: file.type, upsert: false });
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    const { data: publicUrl } = admin.storage.from("notices").getPublicUrl(storagePath);

    const [schedules, rooms, events, announcements, assignments] = await Promise.all([
      admin.from("schedules").select("id,course,day,start_time,room"),
      admin.from("rooms").select("id,room_number"),
      admin.from("events").select("id,name,date"),
      admin.from("announcements").select("id,title,date"),
      admin.from("assignments").select("id,course,title,deadline"),
    ]);
    const references = { schedules: schedules.data, rooms: rooms.data, events: events.data, announcements: announcements.data, assignments: assignments.data };
    const prompt = `Extract only explicit campus-data changes from this image. Today is ${getToday()}. ${hint ? `User hint: ${hint}` : ""}
Use these exact fields inside payload_json, which must be a JSON-encoded object string:
- schedule: course,title,day,start_time,end_time,room,instructor,section
- room: room_number,type,capacity,equipment,floor,status (never invent bookings)
- event: name,description,date,start_time,end_time,end_date,venue,organizer,capacity,status
- announcement: title,body,date,priority,posted_by,expires
- assignment: course,course_title,title,description,assigned_date,deadline,submission_platform,status,marks
Allowed values: room type=classroom|lab|seminar; room status=available|unavailable; event status=upcoming|ongoing|completed|cancelled|full; priority=high|medium|low; assignment status=pending|submitted|graded|late. Use pending for a new assignment when status is not printed.
Dates must be YYYY-MM-DD and times HH:MM. Use operation add unless the image clearly changes or removes an existing record. Use an empty target_id for add. For edit/delete use the matching target_id from this current-record reference: ${JSON.stringify(references)}. Put only changed fields in payload_json for edit; use "{}" for delete. Do not infer details that are not legible. Return an empty proposals array if there is no actionable campus record.`;

    const ai = new GoogleGenAI({ apiKey });
    const preferredModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const models = [preferredModel, "gemini-3.6-flash"];
    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    let modelError: unknown;
    for (const model of models) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { data: bytes.toString("base64"), mimeType: file.type } }] }],
          config: { temperature: 0.1, responseMimeType: "application/json", responseSchema: jsonSchema },
        });
        break;
      } catch (error) {
        modelError = error;
        const message = String(error);
        if (!message.includes('"code":400') && !message.includes('"code":404') && !message.includes('"code":503')) throw error;
      }
    }
    if (!response) {
      for (const model of [...new Set([preferredModel, "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"])]) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: [{ role: "user", parts: [{ text: `${prompt}\nReturn exactly this JSON shape: {"proposals":[{"entity_type":"assignment","operation":"add","target_id":"","payload_json":"{\\"field\\":\\"value\\"}","confidence":0.9,"reason":"..."}]}` }, { inlineData: { data: bytes.toString("base64"), mimeType: file.type } }] }],
            config: { temperature: 0.1, responseMimeType: "application/json" },
          });
          break;
        } catch (error) {
          modelError = error;
          const message = String(error);
          if (!message.includes('"code":404') && !message.includes('"code":503')) throw error;
        }
      }
    }
    if (!response) throw modelError ?? new Error("No Gemini model was available.");
    const generated = responseSchema.parse(JSON.parse(response.text ?? '{"proposals":[]}'));
    const parsed = {
      proposals: generated.proposals.map(({ payload_json, ...proposal }) =>
        proposalSchema.parse({ ...proposal, target_id: proposal.target_id || null, payload: normalizePayload(proposal.entity_type, proposal.operation, JSON.parse(payload_json)) }),
      ),
    };
    if (parsed.proposals.length === 0) {
      await admin.storage.from("notices").remove([storagePath]);
      storagePath = null;
      return NextResponse.json({ proposals: [], imageUrl: null });
    }

    const rows = parsed.proposals.map((proposal) => ({
      entity_type: proposal.entity_type,
      operation: proposal.operation,
      target_id: proposal.target_id ?? null,
      payload: { data: proposal.payload, confidence: proposal.confidence, reason: proposal.reason },
      source: "ai_image",
      image_url: publicUrl.publicUrl,
      status: "pending",
      proposed_by: profile.id === "00000000-0000-0000-0000-000000000000" ? null : profile.id,
      proposer_label: proposerLabel(profile),
    }));
    const { data, error } = await admin.from("pending_changes").insert(rows).select("*");
    if (error) throw new Error(`Could not save proposals: ${error.message}`);
    return NextResponse.json({ proposals: data, imageUrl: publicUrl.publicUrl });
  } catch (error) {
    if (storagePath) await createAdminClient().storage.from("notices").remove([storagePath]);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image parsing failed." }, { status: 500 });
  }
}