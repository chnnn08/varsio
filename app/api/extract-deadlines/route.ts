import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "GEMINI_API_KEY is not set. Add it in your Vercel project settings under Environment Variables." }, { status: 500 });
  }

  const { syllabus } = await request.json();
  if (!syllabus?.trim()) return Response.json({ error: "No syllabus provided." }, { status: 400 });

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`Extract all deadlines, assignments, exams, and due dates from this course syllabus.
Return ONLY a valid JSON array - no markdown, no extra text.
Format:
[{ "title": "...", "date": "YYYY-MM-DD or descriptive date", "type": "assignment|exam|quiz|project|other", "weight": "percentage or empty string" }]
If the year is not specified, assume 2026.

Syllabus:
${syllabus}`);

    const text = result.response.text().replace(/```json|```/g, "").trim();
    const deadlines = JSON.parse(text);
    return Response.json({ deadlines });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Failed to extract deadlines: ${message}` }, { status: 500 });
  }
}
