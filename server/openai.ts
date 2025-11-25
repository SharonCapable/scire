import OpenAI from "openai";

const OPENAI_ENABLED = !!process.env.OPENAI_API_KEY;

export const openai = OPENAI_ENABLED 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function checkOpenAI() {
  if (!openai) {
    throw new Error("OpenAI API key not configured. Please set OPENAI_API_KEY to use AI features.");
  }
}

export async function generateCourseTiers(courseContent: string, courseTitle: string) {
  checkOpenAI();
  const prompt = `Analyze the following educational content and create a structured learning path with 3 tiers (Start, Intermediate, Advanced).

Course Title: ${courseTitle}

Content:
${courseContent.slice(0, 4000)}

For each tier, create 3-5 modules. Each module should:
- Have a clear title
- Include focused content (2-3 paragraphs)
- Take approximately 10-20 minutes to complete
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

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert educational content designer. Create structured, progressive learning paths."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.tiers || [];
}

export async function generateFlashcards(moduleContent: string, moduleTitle: string, count: number = 5) {
  checkOpenAI();
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

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an expert at creating effective educational flashcards."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.flashcards || [];
}

export async function validateUnderstanding(moduleContent: string, userExplanation: string) {
  checkOpenAI();
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

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are a supportive educational AI that provides constructive feedback to help students learn."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return {
    score: result.score || 0,
    feedback: result.feedback || "No feedback available",
    areasForImprovement: result.areasForImprovement || [],
  };
}

export async function curateCoursesForInterests(topics: string[], learningGoals: string, availableCourses: any[]) {
  checkOpenAI();
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

  // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: "You are an AI learning advisor that matches students with appropriate educational content."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result.recommendations || [];
}
