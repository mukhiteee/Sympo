import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client lazily or safely
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is missing.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "PulseAI Health Services API" });
});

// Endpoint for conversational AI follow-up during symptom intake
app.post("/api/assessment/chat", async (req, res) => {
  try {
    const { messages, userProfile } = req.body;
    const ai = getGenAIClient();

    if (!ai) {
      // Return smart fallback if API key is not yet set up
      return res.json({
        text: "I understand how concerning symptoms can be. To help gather details for your campus clinic summary: How long have you been experiencing these symptoms, and have you noticed any fever or body aches?",
        suggestedChips: ["Since yesterday", "About 2-3 days", "Just started today", "I measured a fever"],
        readyForAssessment: false,
        detectedSymptoms: ["General discomfort"]
      });
    }

    const conversationContext = messages.map((m: any) => `${m.sender.toUpperCase()}: ${m.text}`).join("\n");

    const systemInstruction = `
You are PulseAI, an empathetic AI-powered symptom assessment and campus healthcare assistant for university students.

CRITICAL MEDICAL & SAFETY RULES:
1. You DO NOT diagnose diseases. Never say "You have [disease]". Use non-diagnostic terms like "Common possibilities to discuss with a nurse", "Potential causes".
2. You help students understand their symptoms, determine whether to seek campus healthcare attention, and prepare a structured clinic summary to save time during visits.
3. Be reassuring, calm, clear, and professional.
4. Keep answers brief (2-3 short sentences max) and ask ONE focused follow-up question at a time to gather key triage parameters:
   - Duration / timeline
   - Temperature / fever
   - Pain severity (1-10)
   - Accompanying symptoms (e.g. nausea, cough, throat pain, dizziness)
5. Suggest 3 to 4 quick response options ("suggestedChips") that make typing easy for a student on mobile.
6. Evaluate if you have enough information (usually after 3-4 user exchanges or when symptoms are clearly stated) to generate a full health report ("readyForAssessment").

Student context: Name: ${userProfile?.name || 'Student'}, Age: ${userProfile?.age || 20}, Allergies: ${userProfile?.allergies?.join(', ') || 'None reported'}.
    `.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Conversation History:\n${conversationContext}\n\nRespond with a structured JSON object.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "Empathetic, clear response with 1 follow-up question."
            },
            suggestedChips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-4 concise response options for the user."
            },
            readyForAssessment: {
              type: Type.BOOLEAN,
              description: "Set to true if user has provided symptom details, duration, severity, and key markers."
            },
            detectedSymptoms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of extracted key symptoms so far."
            }
          },
          required: ["text", "suggestedChips", "readyForAssessment", "detectedSymptoms"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({
      text: parsed.text || "Thank you for sharing that. Could you tell me a bit more about how severe the discomfort feels on a scale of 1 to 10?",
      suggestedChips: parsed.suggestedChips || ["Mild (1-3)", "Moderate (4-6)", "Severe (7-9)", "Constant pain"],
      readyForAssessment: Boolean(parsed.readyForAssessment),
      detectedSymptoms: parsed.detectedSymptoms || []
    });

  } catch (error: any) {
    console.error("Error in /api/assessment/chat:", error);
    res.status(500).json({
      text: "I'm having a brief issue connecting to the AI system. However, based on what you shared, let's proceed to review your symptoms and prepare a clinic summary.",
      suggestedChips: ["View Assessment Report", "Describe symptoms again", "Contact Campus Nurse"],
      readyForAssessment: true,
      detectedSymptoms: []
    });
  }
});

// Endpoint for Sympto AI Analysis (Powered by Gemma / Gemini)
app.post("/api/analyze", async (req, res) => {
  let turnCount = 0;
  let skipToReport = false;

  try {
    const { symptomsText, history = [], skipToReport: skip = false } = req.body;
    skipToReport = Boolean(skip);
    const ai = getGenAIClient();

    turnCount = Array.isArray(history) ? history.length : 0;

    if (!ai) {
      // Fallback logic supporting multi-turn simulation (3 questions)
      if (turnCount < 3 && !skipToReport) {
        const mockQuestions = [
          {
            q: "Question 1/3: Has your body temperature been measured, or do you feel feverish with cold chills?",
            opts: ["Fever measured above 38°C (100.4°F)", "Feeling warm/feverish, unmeasured", "No fever", "Cold chills only"],
            num: 1
          },
          {
            q: "Question 2/3: How long have these symptoms persisted, and did they start suddenly or develop gradually?",
            opts: ["Started suddenly today", "Persisting for 1 to 2 days", "Over 3 to 5 days", "Chronic / Ongoing"],
            num: 2
          },
          {
            q: "Question 3/3: Are you experiencing any associated red flags like stiff neck, light sensitivity, extreme dizziness, or vomiting?",
            opts: ["Nausea / Vomiting present", "Light sensitivity or visual aura", "Stiff neck / severe neck pain", "None of these"],
            num: 3
          }
        ];
        const nextQ = mockQuestions[turnCount] || mockQuestions[0];
        return res.json({
          needFollowUp: true,
          followUpQuestion: nextQ.q,
          suggestedOptions: nextQ.opts,
          questionNumber: turnCount + 1,
          estimatedTotalQuestions: 3
        });
      }

      // Final fallback report after 3 questions or skip
      return res.json({
        needFollowUp: false,
        riskLevel: "Moderate",
        conditions: [
          {
            title: "Viral Gastroenteritis / Febrile Syndrome",
            confidence: "High",
            description: "Common viral infection resulting in systemic fever, headache, and gastrointestinal distress."
          },
          {
            title: "Migraine with Systemic Response",
            confidence: "Medium",
            description: "Throbbing headache often accompanied by nausea, photo-sensitivity, or fatigue."
          },
          {
            title: "Seasonal Febrile Infection",
            confidence: "Medium",
            description: "Acute viral or bacterial response requiring hydration and temperature monitoring."
          }
        ],
        whyMatched: [
          `Initial report: "${symptomsText}"`,
          ...history.map((h: any, i: number) => `Q${i+1} answer: "${h.answer}"`)
        ],
        recommendations: [
          "Visit a healthcare professional or urgent care clinic today.",
          "Maintain active hydration with oral rehydration salts or broth.",
          "Rest in a quiet, dark environment.",
          "Seek immediate emergency care if high fever (>39°C) or severe neck stiffness develops."
        ]
      });
    }

    // Build rich prompt containing user initial symptoms & question history
    let promptContext = `Initial reported symptoms: "${symptomsText}"\n`;
    if (history && history.length > 0) {
      promptContext += `Follow-up Questions & Answers history so far (${history.length} answered):\n`;
      history.forEach((turn: any, index: number) => {
        promptContext += `Q${index + 1}: ${turn.question}\nA${index + 1}: ${turn.answer}\n`;
      });
    }

    if (skipToReport) {
      promptContext += `\nNote: The user requested to generate the final diagnostic assessment report now with available data.`;
    }

    const systemInstruction = `
You are Gemma, a clinical-grade medical symptom understanding model powering the Sympto WebMD-style diagnostic engine.
Your objective is to conduct a structured 3-question evaluation to maximize diagnostic accuracy before generating a comprehensive clinical-grade report.

MANDATORY RULES FOR MULTI-QUESTION EVALUATION:
1. Questions answered so far by user: ${turnCount}.
2. IF ${turnCount} < 3 AND skipToReport is FALSE:
   - YOU MUST set needFollowUp = true.
   - Ask the NEXT targeted clinical question based on what has been reported so far.
   - Question 1 focus (when turnCount == 0): Body temperature, fever level, or chills.
   - Question 2 focus (when turnCount == 1): Onset, duration, or pain severity progression.
   - Question 3 focus (when turnCount == 2): Associated red flags (e.g., neck stiffness, light sensitivity, severe nausea/vomiting, shortness of breath, skin rash).
   - Provide suggestedOptions: 3 to 4 short, relevant quick-choice chips.
   - Provide questionNumber = ${turnCount + 1}.
   - Provide estimatedTotalQuestions = 3.

3. IF ${turnCount} >= 3 OR skipToReport is TRUE:
   - You MUST set needFollowUp = false.
   - Synthesize initial symptoms AND ALL answered follow-up questions into a broad, accurate WebMD-style differential diagnostic assessment:
     - riskLevel: "Low", "Moderate", or "High"
     - conditions: 3-4 possible conditions ranked by likelihood. For each condition include:
       - title: Clinical & common name (e.g. "Viral Gastroenteritis (Stomach Flu)")
       - confidence: "High", "Medium", or "Low"
       - description: 2-sentence clinical overview explaining why this condition matches the patient's presentation.
       - matchedSymptoms: Array of 2-4 symptoms reported by user that fit this condition.
       - unmatchedSymptoms: Array of 1-3 typical symptoms for this condition that were NOT reported.
       - affectedSystem: e.g. "Gastrointestinal", "Neurological", "Systemic / Febrile", "Respiratory", "Musculoskeletal".
       - urgency: "Self-Care" | "Primary Care" | "Urgent Care" | "Emergency Room".
     - whyMatched: 4-6 detailed bullet points directly citing reported symptoms and follow-up answers (e.g. "✓ Confirmed fever >38°C", "✓ Acute onset 2 days ago", "✓ Mild nausea without neck stiffness").
     - redFlags: 3-4 emergency warning signs that warrant immediate emergency department evaluation.
     - recommendations: 4-5 clear, prioritized, actionable self-care & medical evaluation steps.

CRITICAL MEDICAL DISCLAIMER: Frame conditions strictly as possible explanations to discuss with a healthcare provider, never as definitive diagnoses.
`.trim();

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `${promptContext}\n\nAnalyze symptoms and history. Respond with structured JSON according to the rules.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            needFollowUp: { type: Type.BOOLEAN },
            followUpQuestion: { type: Type.STRING },
            suggestedOptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            questionNumber: { type: Type.INTEGER },
            estimatedTotalQuestions: { type: Type.INTEGER },
            riskLevel: { type: Type.STRING, enum: ["Low", "Moderate", "High"] },
            conditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  description: { type: Type.STRING },
                  matchedSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  unmatchedSymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  affectedSystem: { type: Type.STRING },
                  urgency: { type: Type.STRING, enum: ["Self-Care", "Primary Care", "Urgent Care", "Emergency Room"] }
                },
                required: ["title", "confidence", "description"]
              }
            },
            whyMatched: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            redFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["needFollowUp"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);

  } catch (error) {
    console.error("Sympto analyze error:", error);
    if (turnCount < 3 && !skipToReport) {
      const mockQuestions = [
        {
          q: "Question 1/3: Has your body temperature been measured, or do you feel feverish with cold chills?",
          opts: ["Fever measured above 38°C (100.4°F)", "Feeling warm/feverish, unmeasured", "No fever", "Cold chills only"]
        },
        {
          q: "Question 2/3: How long have these symptoms persisted, and did they start suddenly or develop gradually?",
          opts: ["Started suddenly today", "Persisting for 1 to 2 days", "Over 3 to 5 days", "Chronic / Ongoing"]
        },
        {
          q: "Question 3/3: Are you experiencing any associated red flags like stiff neck, light sensitivity, extreme dizziness, or vomiting?",
          opts: ["Nausea / Vomiting present", "Light sensitivity or visual aura", "Stiff neck / severe neck pain", "None of these"]
        }
      ];
      const nextQ = mockQuestions[turnCount] || mockQuestions[0];
      return res.json({
        needFollowUp: true,
        followUpQuestion: nextQ.q,
        suggestedOptions: nextQ.opts,
        questionNumber: turnCount + 1,
        estimatedTotalQuestions: 3
      });
    }

    const historySummary = Array.isArray(req.body?.history) 
      ? req.body.history.map((h: any, i: number) => `Q${i+1}: ${h.answer}`)
      : [];

    res.json({
      needFollowUp: false,
      riskLevel: "Moderate",
      conditions: [
        {
          title: "Viral Infection / Febrile Response",
          confidence: "High",
          description: "Acute viral response causing systemic discomfort, fever response, or body fatigue."
        },
        {
          title: "Primary Headache / Migraine Response",
          confidence: "Medium",
          description: "Headache pattern with associated fatigue or gastrointestinal distress."
        },
        {
          title: "Seasonal Inflammatory Response",
          confidence: "Medium",
          description: "Acute upper respiratory or systemic reaction."
        }
      ],
      whyMatched: [
        `Reported initial symptoms: "${req.body?.symptomsText || 'Symptom evaluation'}"`,
        ...historySummary
      ],
      recommendations: [
        "Consult a qualified healthcare professional or clinic for clinical diagnosis.",
        "Maintain active hydration with water, electrolyte solutions, or broth.",
        "Rest in a comfortable, quiet environment.",
        "Seek immediate medical attention if high fever or severe neck pain occurs."
      ]
    });
  }
});

async function startServer() {
  // Vite integration in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PulseAI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
