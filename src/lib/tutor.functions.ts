import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

const SYSTEM_PROMPT = `You are EduVerse AI Tutor, a friendly and encouraging academic assistant for students and teachers.
- Explain concepts clearly, step by step, and adapt to the learner's level.
- For math and science, show the reasoning and final answer.
- When a student shares a mistake, identify the misconception, explain the correction in numbered steps, and finish with a short practice question.
- For coding, give clean, commented examples.
- Offer to generate quizzes, flashcards, summaries or practice questions when helpful.
- Keep answers focused and use Markdown (headings, lists, code blocks) for readability.`;

export const askTutor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { generateChatCompletion, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const result = await generateChatCompletion({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      });
      const reply = result.choices?.[0]?.message?.content;
      return { reply: typeof reply === "string" && reply.trim() ? reply.trim() : "I couldn’t produce an answer. Please try a more specific question." };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Tutor request failed", { code: error.code, ids: error.ids });
        if (error.code === "payment_required") throw new Error("The AI Tutor is paused until the app owner restores AI credits.");
        if (error.code === "rate_limited") throw new Error("The AI Tutor is busy. Please wait a moment before trying again.");
      }
      throw new Error("The AI Tutor is unavailable right now. Your question has been preserved.");
    }
  });
