/// <reference types="vite/client" />
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface Flashcard {
  question: string;
  answer: string;
}

export interface MCQ {
  question: string;
  options: string[]; // now always 4 options
  answer: string;
}

export interface StudyResult {
  overview: string;
  keyTerms: string[];
  flashcards: Flashcard[];
  mcqs: MCQ[];
  notes: string[];
}

export async function generateStudyContent(
  topic: string,
  flashcardCount: number = 10,
  mcqCount: number = 10
): Promise<StudyResult> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "OpenRouter API key is missing. Please set VITE_OPENROUTER_API_KEY in your .env file and restart the dev server."
    );
  }

  const prompt = `You are a modern study assistant. For the topic: "${topic}", generate the following in JSON format:\n{\n  \"overview\": \"...\",\n  \"keyTerms\": [\"...\", ...],\n  \"flashcards\": [\n    {\n      \"question\": \"...\",\n      \"answer\": \"...\"\n    }, ... (${flashcardCount} total)\n  ],\n  \"mcqs\": [\n    {\n      \"question\": \"...\",\n      \"options\": [\"...\", \"...\", \"...\", \"...\"],\n      \"answer\": \"...\"\n    }, ... (${mcqCount} total)\n  ],\n  \"notes\": [\"...\", ...]\n}\n\n- The flashcards should be beautiful, clear, and concise, suitable for digital flashcard apps.\n- The MCQs should be well-formed, with 4 plausible options and the correct answer.\n- All content should be modern, engaging, and helpful for learning.\n- Do not include any explanations outside the JSON.`;

  const body = {
    model: "mistralai/mistral-7b-instruct",
    messages: [
      {
        role: "system",
        content: "You are a helpful study assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
  };

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("OpenRouter API fetch failed:", res.status, errorText);
    throw new Error(
      `Failed to fetch from OpenRouter API: ${res.status} ${errorText}`
    );
  }
  const data = await res.json();

  // OpenRouter returns the response in data.choices[0].message.content
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from OpenRouter");

  // Try to parse the JSON from the response
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}") + 1;
  const jsonString = text.slice(jsonStart, jsonEnd);
  try {
    const json = JSON.parse(jsonString);
    return json as StudyResult;
  } catch (e) {
    throw new Error("Failed to parse OpenRouter response: " + text);
  }
}
