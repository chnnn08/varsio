import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "GEMINI_API_KEY is not set. Add it in your Vercel project settings under Environment Variables." }, { status: 500 });
  }

  const { materials } = await request.json();
  if (!materials?.trim()) {
    return Response.json({ error: "No materials provided." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a study assistant. Generate exactly 5 multiple-choice quiz questions from the study material below.

Return ONLY a valid JSON array - no markdown, no explanation, no extra text.
Format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "explanation": "Brief reason why this answer is correct."
  }
]
The "answer" field must be the 0-based index of the correct option.

Study material:
${materials}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);
    return Response.json({ questions });
  } catch (err) {
    console.error("Quiz generation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Quiz generation failed: ${message}` }, { status: 500 });
  }
}
