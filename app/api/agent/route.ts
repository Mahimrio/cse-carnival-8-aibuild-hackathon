import { GoogleGenAI, type Content, type Part, type Tool } from "@google/genai";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getSystemPrompt } from "@/lib/agent/systemPrompt";
import { agentToolsDeclaration, executeAgentTool } from "@/lib/agent/tools";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 503 });
    }

    const { messages } = await request.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(profile);
    const ai = new GoogleGenAI({ apiKey });

    const preferredModel = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    const modelsToTry = [...new Set([preferredModel, "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"])];

    // Format chat history into Gemini contents format
    const contents: Content[] = [];

    for (const msg of messages) {
      if (msg.role === "user") {
        contents.push({ role: "user", parts: [{ text: String(msg.content) }] });
      } else if (msg.role === "assistant") {
        contents.push({ role: "model", parts: [{ text: String(msg.content) }] });
      }
    }

    const toolsUsedSet = new Set<string>();
    let textResponse = "";
    let loopCount = 0;
    const maxLoops = 6;

    while (loopCount < maxLoops) {
      loopCount++;

      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      let lastError: unknown = null;

      for (const model of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: systemPrompt,
              tools: agentToolsDeclaration as unknown as Tool[],
              temperature: 0.2,
            },
          });
          break;
        } catch (err) {
          lastError = err;
          const msg = String(err);
          if (!msg.includes('"code":404') && !msg.includes('"code":503') && !msg.includes('"code":429') && !msg.includes("RESOURCE_EXHAUSTED")) {
            throw err;
          }
        }
      }

      if (!response) {
        throw lastError ?? new Error("Failed to reach Gemini API.");
      }

      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const modelContent = response.candidates?.[0]?.content;
        if (!modelContent) throw new Error("Gemini returned tool calls without model content.");

        // Echo the original signed parts; reconstructing them drops thoughtSignature.
        contents.push(modelContent);
        const functionResponses: Part[] = [];

        for (const call of functionCalls) {
          const toolName = call.name || "unknown_tool";
          toolsUsedSet.add(toolName);

          // Execute tool
          const result = await executeAgentTool(toolName, (call.args as Record<string, unknown>) || {}, profile);

          functionResponses.push({
            functionResponse: {
              id: call.id,
              name: toolName,
              response: { result },
            },
          });
        }

        contents.push({ role: "user", parts: functionResponses });
      } else {
        textResponse = response.text || "I'm sorry, I couldn't process your request.";
        break;
      }
    }

    return NextResponse.json({
      role: "assistant",
      content: textResponse,
      toolsUsed: Array.from(toolsUsedSet),
    });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Agent failed to respond." },
      { status: 500 }
    );
  }
}
