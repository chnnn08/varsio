import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(request: Request) {
  const { materials } = await request.json();

  if (!materials?.trim()) {
    return Response.json({ error: "No materials provided." }, { status: 400 });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a study assistant. Generate exactly 5 multiple-choice quiz questions from the study material below.

Return ONLY a valid JSON array â€” no markdown, no explanation, no extra text.
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
    return Response.json(
      { error: "Failed to generate quiz. Check your GEMINI_API_KEY in .env.local." },
      { status: 500 }
    );
  }
}
