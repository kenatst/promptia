import { PromptInputs, PromptResult } from '@/types/prompt';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeminiConfig {
  apiKey: string;
}

let geminiApiKey: string | null = null;

export function setGeminiApiKey(key: string) {
  geminiApiKey = key;
}

export function getGeminiApiKey(): string | null {
  return geminiApiKey;
}

export function isGeminiConfigured(): boolean {
  return Boolean(geminiApiKey && geminiApiKey.length > 10);
}

function buildGeminiSystemPrompt(inputs: PromptInputs): string {
  return `You are an expert prompt engineer. Your task is to generate the perfect, production-ready prompt based on the user's specifications.

Rules:
- Generate ONLY the final prompt text, no explanations
- The prompt should be comprehensive, specific, and optimized for the target AI model
- Include role, task, context, constraints, and output format when applicable
- For image models (midjourney, sdxl), use comma-separated descriptors with technical parameters
- For video models, use structured scene descriptions
- Be creative but precise
- Never include meta-commentary about the prompt itself`;
}

function buildGeminiUserMessage(inputs: PromptInputs): string {
  const parts: string[] = [];
  parts.push(`Target Model: ${inputs.model}`);
  parts.push(`Objective: ${inputs.objective}`);

  if (inputs.objectiveChips.length > 0) {
    parts.push(`Keywords: ${inputs.objectiveChips.join(', ')}`);
  }
  if (inputs.tone) parts.push(`Tone: ${inputs.tone}`);
  if (inputs.audience) parts.push(`Audience: ${inputs.audience}`);
  if (inputs.length) parts.push(`Length: ${inputs.length}`);
  if (inputs.outputFormat) parts.push(`Output Format: ${inputs.outputFormat}`);
  if (inputs.constraints) parts.push(`Constraints: ${inputs.constraints}`);
  if (inputs.language) parts.push(`Language: ${inputs.language}`);
  if (inputs.style) parts.push(`Visual Style: ${inputs.style}`);
  if (inputs.lighting) parts.push(`Lighting: ${inputs.lighting}`);
  if (inputs.cameraAngle) parts.push(`Camera Angle: ${inputs.cameraAngle}`);
  if (inputs.negativePrompt) parts.push(`Negative/Exclude: ${inputs.negativePrompt}`);
  if (inputs.aspectRatio) parts.push(`Aspect Ratio: ${inputs.aspectRatio}`);

  return parts.join('\n');
}

export async function generateWithGemini(inputs: PromptInputs): Promise<PromptResult> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured. Go to Settings to add your key.');
  }

  const systemPrompt = buildGeminiSystemPrompt(inputs);
  const userMessage = buildGeminiUserMessage(inputs);

  console.log('[Gemini] Sending request...');

  const response = await fetch(`${GEMINI_API_URL}?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{
        parts: [{ text: userMessage }],
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.log('[Gemini] Error:', response.status, errorBody);
    throw new Error(`Gemini API error (${response.status}). Check your API key.`);
  }

  const data = await response.json();
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!generatedText) {
    throw new Error('No response from Gemini. Please try again.');
  }

  console.log('[Gemini] Response received, length:', generatedText.length);

  const templatePrompt = generatedText
    .replace(inputs.objective || '{objective}', '{objective}')
    .replace(inputs.audience || '{audience}', '{audience}');

  return {
    finalPrompt: generatedText.trim(),
    templatePrompt,
    metadata: {
      checklist: ['AI-generated prompt', `Model: ${inputs.model}`],
      warnings: [],
      questions: [],
      assumptions: [],
    },
  };
}
