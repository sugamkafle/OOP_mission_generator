import { GoogleGenAI } from "@google/genai";
import { Mission } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const MISSION_SCHEMA = {
  type: "object",
  properties: {
    agents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          team: { type: "string", enum: ["Team_A", "Team_B"] },
          color: { type: "string" },
          className: { type: "string" },
        },
        required: ["id", "name", "team", "color", "className"],
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          agentId: { type: "string" },
          method: { type: "string" },
          material: { type: "string" },
          dependencyIds: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["id", "agentId", "method", "material", "dependencyIds"],
      },
    },
  },
  required: ["agents", "tasks"],
};

export async function generateMission(studentNames: string[], materials: string[]): Promise<Mission> {
  const prompt = `
    You are a Special Ops Mission Coordinator for a Year 9-10 OOP logic class.
    
    TASK: Generate a collaborative mission sequence based on the provided Students and Materials.
    
    STUDENTS: ${studentNames.join(", ")}
    MATERIALS: ${materials.join(", ")}
    
    RULES:
    1. ROLES: Split students randomly into "Team_A" and "Team_B".
    2. CLASS ASSIGNMENT: Assign an OOP Class Name (e.g., Technician, Organizer, Security) to each student.
    3. COVERAGE: EVERY single student MUST be assigned 2-3 specific tasks.
    4. LOGIC (OOP): 
       - Students are Objects (instances of their Class).
       - Actions are Methods.
       - Materials are Parameters.
       - IMPORTANT: Methods must be DOABLE PHYSICAL ACTIONS in a real classroom.
       - Example Methods: open(), close(), move(), wipe(), writeOn(), sitIn(), signInTo(), empty(), stack(), plug In().
    5. DEPENDENCIES: 
       - Create logic chains where one student's physical action allows another's.
    6. TERMINOLOGY: Every task should follow the syntax: object.method(parameter).
    7. COLOR CODING: Unique bright hex color for each object.
    
    OUTPUT: JSON matching schema. Doable verbs ONLY.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        //@ts-ignore
        responseSchema: MISSION_SCHEMA,
      }
    });

    if (!response.text) {
      throw new Error("AI_ENGINE_SILENT: The command center is not responding.");
    }

    return JSON.parse(response.text) as Mission;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("PERMISSION_DENIED")) {
      throw new Error("SECRET_ACCESS_DENIED: Please ensure your Gemini API Key is correctly configured in the Secrets panel.");
    }

    const message = error?.message || "Unknown anomaly in the logic-engine.";
    throw new Error(`MISSION_GENERATION_FAILED: ${message}`);
  }
}
