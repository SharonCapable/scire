import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function checkGemini() {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not set");
  }
}

export async function generateCourseTiers(courseContent: string, courseTitle: string) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Analyze the following educational content and create a structured learning path with 3 tiers (Start, Intermediate, Advanced).

Course Title: ${courseTitle}

Content:
${courseContent.slice(0, 4000)}

For each tier, create 3-5 modules. Each module should:
- Have a clear title
- Include comprehensive, in-depth educational content (at least 800 words).
- Structure the content with clear headings (Markdown h2/h3), subheadings, and bullet points.
- Include real-world examples, code snippets (if applicable), and detailed explanations.
- Explain concepts thoroughly as if teaching a full university lecture.
- Take approximately 20-40 minutes to complete
- Build progressively on previous modules

Return the response in JSON format with this structure:
{
  "tiers": [
    {
      "level": "start" | "intermediate" | "advanced",
      "title": "string",
      "description": "string",
      "modules": [
        {
          "title": "string",
          "content": "string",
          "estimatedMinutes": number
        }
      ]
    }
  ]
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.tiers;
}

export async function generateFlashcards(moduleContent: string, moduleTitle: string, count: number = 5) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create ${count} flashcards for the following educational module.

Module: ${moduleTitle}
Content: ${moduleContent}

Each flashcard should test understanding of key concepts. Return in JSON format:
{
  "flashcards": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.flashcards;
}

export async function validateUnderstanding(moduleContent: string, userExplanation: string) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Evaluate this student's understanding of the module content.

Module Content:
${moduleContent.slice(0, 2000)}

Student Explanation:
${userExplanation}

Provide:
1. Score (0-100) based on accuracy and completeness
2. Constructive feedback on their understanding
3. 2-3 specific areas for improvement

Return in JSON format:
{
  "score": number,
  "feedback": "string",
  "areasForImprovement": ["string"]
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}

export async function curateCoursesForInterests(topics: string[], learningGoals: string, availableCourses: any[]) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Recommend the most relevant courses for a learner with these interests:

Topics: ${topics.join(", ")}
Learning Goals: ${learningGoals}

Available Courses:
${availableCourses.map((c, i) => `${i + 1}. ${c.title}: ${c.description}`).join("\n")}

Return recommended course IDs in order of relevance with brief reasoning:
{
  "recommendations": [
    {
      "courseId": "string",
      "reason": "string",
      "suggestedTier": "start" | "intermediate" | "advanced"
    }
  ]
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.recommendations || [];
}

export async function generateQuiz(moduleContent: string, moduleTitle: string) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a multiple-choice quiz with 5 questions for this module.

Module: ${moduleTitle}
Content: ${moduleContent}

Return in JSON format:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": number (0-3),
      "explanation": "string"
    }
  ]
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.5,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  const data = JSON.parse(text);
  return data.questions;
}

export async function generateUnderstandingPrompt(moduleContent: string, moduleTitle: string) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a prompt for an open-ended understanding check for this module.

Module: ${moduleTitle}
Content: ${moduleContent}

The prompt should ask the student to explain the core concepts in their own words.
Also provide a rubric or key points they should cover.

Return in JSON format:
{
  "prompt": "string",
  "rubric": "string"
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}

export async function generateCourseStructure(topic: string, learningGoal: string) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Create a comprehensive course structure for the topic: "${topic}".
  User's Learning Goal: "${learningGoal}"

  The course should be structured into 3 distinct tiers:
  1. Start (Beginner)
  2. Intermediate
  3. Advanced

  For EACH tier, provide:
  - A clear title and description for the tier.
  - 3-5 Modules. Each module must have:
    - A specific title.
    - A brief summary of what will be covered.
    - Estimated time to complete (in minutes).

  Also provide a catchy Title and Description for the overall course.

  Return strictly in this JSON format:
  {
    "title": "string",
    "description": "string",
    "tiers": [
      {
        "level": "start" | "intermediate" | "advanced",
        "title": "string",
        "description": "string",
        "modules": [
          {
            "title": "string",
            "summary": "string",
            "estimatedMinutes": number
          }
        ]
      }
    ]
  }`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const response = result.response;
  const text = response.text();
  return JSON.parse(text);
}

export async function generateModuleContent(moduleTitle: string, moduleSummary: string, courseTitle: string) {
  checkGemini();
  const model = genAI!.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Write comprehensive educational content for this module.

  Course: ${courseTitle}
  Module: ${moduleTitle}
  Summary: ${moduleSummary}

  Requirements:
  - At least 800 words.
  - Clear headings (Markdown h2/h3) and structure.
  - Real-world examples and case studies.
  - Detailed explanations of concepts.
  - Engaging and easy to understand.

  Return the content as a single Markdown string.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    },
  });

  return result.response.text();
}
