import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function POST(request: Request) {
  const { syllabus } = await request.json();
  if (!syllabus?.trim()) return Response.json({ error: "No syllabus provided." }, { status: 400 });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`Extract all deadlines, assignments, exams, and due dates from this course syllabus.
Return ONLY a valid JSON array â€” no markdown, no extra text.
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
    return Response.json({ error: "Failed to extract deadlines. Try again or add manually." }, { status: 500 });
  }
}
