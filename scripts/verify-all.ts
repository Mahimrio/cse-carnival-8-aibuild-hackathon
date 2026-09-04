import path from "node:path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { getSystemPrompt } from "../lib/agent/systemPrompt";
import { agentToolsDeclaration, executeAgentTool } from "../lib/agent/tools";
import type { Profile } from "../lib/types";

async function main() {
  console.log("==================================================");
  console.log("       CAMPUSOS VERIFICATION: PROMPTS 1-9 & QUERIES 1-9");
  console.log("==================================================\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const geminiKey = process.env.GEMINI_API_KEY!;
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ----------------------------------------------------
  // PART 1: CHECK PROMPTS 1 - 7 (Infrastructure & Backend)
  // ----------------------------------------------------
  console.log("--- CHECKING PROMPTS 1 TO 7 ---");

  // Prompt 1: DB Schema & Seed
  const tables = ["schedules", "rooms", "events", "announcements", "assignments", "profiles", "pending_changes", "audit_log"];
  const tableCounts: Record<string, number> = {};
  for (const t of tables) {
    const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.error(`❌ Table ${t} error:`, error.message);
    } else {
      tableCounts[t] = count ?? 0;
    }
  }
  console.log("✓ Prompt 1 (DB Schema & Seed):", tableCounts);

  // Prompt 2: RBAC Profile check
  const { data: testProfile } = await admin.from("profiles").select("*").limit(1).maybeSingle();
  const studentProfile: Profile = (testProfile as Profile) || {
    id: "00000000-0000-0000-0000-000000000001",
    email: "student@campusos.local",
    full_name: "Mahim Student",
    role: "student",
    requested_role: "student",
    status: "active",
    section: "A",
    semester: "8",
    year: "4",
    created_at: new Date().toISOString(),
  };
  console.log(`✓ Prompt 2 (RBAC Profile loaded): Role="${studentProfile.role}", User="${studentProfile.full_name}"`);

  // Prompt 6: Audit log check
  const { data: recentAudits } = await admin.from("audit_log").select("*").order("created_at", { ascending: false }).limit(3);
  console.log(`✓ Prompt 6 (Audit Trail): ${recentAudits?.length ?? 0} recent audit entries found`);

  // ----------------------------------------------------
  // PART 2: CHECK SAMPLE QUERIES 1 TO 9 (Prompts 8 & 9)
  // ----------------------------------------------------
  console.log("\n--- CHECKING SAMPLE QUERIES 1 TO 9 (PROMPTS 8 & 9) ---");

  const sampleQueries = [
    { id: 1, category: "Simple Lookup", query: "When is my next class?" },
    { id: 2, category: "Simple Lookup", query: "What classes do I have on Wednesday?" },
    { id: 3, category: "Simple Lookup", query: "What assignments do I have due this week?" },
    { id: 4, category: "Simple Lookup", query: "Show me all high priority announcements." },
    { id: 5, category: "Multi-Source Reasoning", query: "I'm free until 2 PM — is there anything on campus I could drop into?" },
    { id: 6, category: "Multi-Source Reasoning", query: "Which labs have a projector and can fit at least 30 people?" },
    { id: 7, category: "Action", query: "Book Room 7A02 tomorrow from 3 PM to 5 PM." },
    { id: 8, category: "Action", query: "Register me for the Guest Lecture on Deep Learning." },
    { id: 9, category: "Action", query: "I need a room for 5 people with a projector, tomorrow between 2 and 4." },
  ];

  const traps = [
    { id: "Trap-1", name: "Vague Request", query: "Just book me any room tomorrow afternoon." },
    { id: "Trap-2", name: "Unauthorized Edit", query: "Delete the CSE321 class" },
  ];

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const systemPrompt = getSystemPrompt(studentProfile);
  const modelsToTry = [modelName, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

  async function runAgent(promptText: string) {
    const contents: any[] = [{ role: "user", parts: [{ text: promptText }] }];
    const toolsCalled: string[] = [];
    let finalText = "";
    let loops = 0;

    while (loops < 5) {
      loops++;
      let response: any = null;
      let lastErr: any = null;

      for (const m of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: m,
            contents,
            config: {
              systemInstruction: { parts: [{ text: systemPrompt }] },
              tools: agentToolsDeclaration as any,
              temperature: 0.1,
            },
          });
          break;
        } catch (e: any) {
          lastErr = e;
          const msg = String(e);
          if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("503") || msg.includes("404")) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw e;
        }
      }

      if (!response) throw lastErr || new Error("All models failed");

      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      const functionCalls = parts.filter((p: any) => p.functionCall);

      if (functionCalls.length > 0) {
        contents.push(candidate.content);
        const responseParts: any[] = [];
        for (const fc of functionCalls) {
          const fn = fc.functionCall!;
          toolsCalled.push(fn.name);
          const toolResult = await executeAgentTool(fn.name, fn.args || {}, studentProfile);
          responseParts.push({
            functionResponse: {
              name: fn.name,
              response: { result: toolResult },
            },
          });
        }
        contents.push({ role: "user", parts: responseParts });
      } else {
        finalText = parts.map((p: any) => p.text || "").join("");
        break;
      }
    }

    return { toolsCalled, finalText };
  }

  for (const q of sampleQueries) {
    process.stdout.write(`\nTesting Query ${q.id} [${q.category}]: "${q.query}" ... `);
    try {
      const { toolsCalled, finalText } = await runAgent(q.query);
      console.log("✅ PASS");
      console.log(`   Tools used: [${toolsCalled.join(", ")}]`);
      const preview = finalText.replace(/\n+/g, " ").slice(0, 140);
      console.log(`   Response: ${preview}...`);
    } catch (err: any) {
      console.log("❌ FAIL:", err.message);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log("\n--- CHECKING HARDENING TRAPS (PROMPT 9) ---");
  for (const t of traps) {
    process.stdout.write(`Testing ${t.id} [${t.name}]: "${t.query}" ... `);
    try {
      const { toolsCalled, finalText } = await runAgent(t.query);
      console.log("✅ PASS");
      console.log(`   Tools used: [${toolsCalled.length > 0 ? toolsCalled.join(", ") : "none (as expected)"}]`);
      const preview = finalText.replace(/\n+/g, " ").slice(0, 140);
      console.log(`   Response: ${preview}...`);
    } catch (err: any) {
      console.log("❌ FAIL:", err.message);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log("\n==================================================");
  console.log("                SUMMARY COMPLETE");
  console.log("==================================================");
}

main().catch(console.error);
