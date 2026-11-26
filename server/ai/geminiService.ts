import { GoogleGenAI, Type } from '@google/genai';

export interface CopilotRequestPayload {
  prompt: string;
  taskType:
    | 'chat'
    | 'customer_summary'
    | 'conversation_summary'
    | 'email_draft'
    | 'lead_scoring'
    | 'report_insight'
    | 'workflow_suggestion';
  contextSummary: string;
  allowedModules: string[];
  language: 'vi' | 'en';
  userRole: string;
}

export interface CopilotResponsePayload {
  answer: string;
  sourcesUsed: string[];
  suggestedActions: string[];
  proposedWriteAction?: {
    actionType: 'create_task' | 'update_lead_score' | 'draft_reply' | 'none';
    title: string;
    description: string;
    requiresConfirmation: boolean;
  };
  model: string;
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY chưa được cấu hình trên máy chủ.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function runCrmCopilot(
  payload: CopilotRequestPayload
): Promise<CopilotResponsePayload> {
  const ai = getGenAIClient();
  const model = 'gemini-4-hydrogen';

  const langRule =
    payload.language === 'vi'
      ? 'Trả lời bằng tiếng Việt chuyên nghiệp, rõ ràng, súc tích.'
      : 'Respond in clear, concise, professional English.';

  const systemInstruction = `You are ONECRM AI Copilot, an enterprise CRM assistant.
Strict rules:
1. ${langRule}
2. ONLY use facts present in the authorized CRM context below. NEVER invent or hallucinate customer names, revenue figures, transactions, or tickets that do not exist in the context.
3. Respect the user's current role (${payload.userRole}) and allowed modules (${payload.allowedModules.join(', ')}).
4. Always list exact data sources/modules referenced in "sourcesUsed".
5. If proposing a data write (creating a task, drafting a reply, updating a score), set requiresConfirmation=true and never assume it was already executed.
6. If context is empty or insufficient, state clearly what data is missing instead of guessing.`;

  const userPrompt = `Task Type: ${payload.taskType}
Authorized CRM Context:
${payload.contextSummary}

User Request:
${payload.prompt}`;

  const response = await ai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          answer: {
            type: Type.STRING,
            description: 'Main analysis or reply grounded strictly in the provided CRM context.',
          },
          sourcesUsed: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Exact CRM modules or record IDs cited from context.',
          },
          suggestedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Next best actions recommended to the CRM operator.',
          },
          proposedWriteAction: {
            type: Type.OBJECT,
            properties: {
              actionType: {
                type: Type.STRING,
                description: 'One of: create_task, update_lead_score, draft_reply, none',
              },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              requiresConfirmation: { type: Type.BOOLEAN },
            },
          },
        },
        required: ['answer', 'sourcesUsed', 'suggestedActions'],
      },
    },
  });

  const rawText = (response.text ?? '{}').trim();
  const parsed = JSON.parse(rawText);

  return {
    answer: parsed.answer || 'Không có phản hồi từ AI.',
    sourcesUsed: Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed : [],
    suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
    proposedWriteAction: parsed.proposedWriteAction,
    model,
  };
}
