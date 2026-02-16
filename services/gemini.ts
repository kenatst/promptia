import { PromptInputs, PromptResult } from '@/types/prompt';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return key && key.length > 5 ? key : null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

function buildSystemPrompt(inputs: PromptInputs): string {
  const isVisual = inputs.model === 'midjourney' || inputs.model === 'sdxl';
  const isVideo = inputs.model === 'video';

  if (isVisual) {
    return `You are the world's best AI image prompt engineer. You craft prompts that consistently produce stunning, award-winning results.

Your expertise covers all major image generation models: Midjourney, Stable Diffusion XL, DALL-E, Flux, etc.

RULES:
- Generate ONLY the final prompt text ready to paste into the target model
- No explanations, no meta-commentary, no markdown headers
- For Midjourney: use comma-separated descriptors, end with parameters (--ar, --v, --q, --s, --style)
- For SDXL/SD: output "Positive:" and "Negative:" sections with technical parameters
- Include specific artistic references, lighting techniques, camera settings when relevant
- Use power words: masterpiece, breathtaking, award-winning, highly detailed, 8K
- Be extremely specific about composition, colors, mood, atmosphere
- Include technical photography terms when appropriate (focal length, aperture, etc.)
- Layer multiple style descriptors for richness
- Always consider the visual hierarchy and focal point`;
  }

  if (isVideo) {
    return `You are an expert AI video prompt engineer specializing in AI video generation (Runway Gen-3, Pika, Kling, Sora).

RULES:
- Generate ONLY the final prompt ready to paste into the target video model
- No explanations, no meta-commentary
- Structure: Scene description, Camera movement, Lighting, Style, Motion details
- Be cinematic and specific about motion, transitions, and temporal flow
- Include camera movement terminology (dolly, pan, tilt, crane, tracking)
- Specify motion speed, direction, and quality
- Include atmosphere and mood descriptors
- Keep prompts dense but clear`;
  }

  return `You are a world-class prompt engineer who creates perfect, production-ready prompts for Large Language Models (ChatGPT, Claude, Gemini, etc.).

You follow the proven prompt engineering framework:
1. ROLE: Define who the AI should be (expert persona with specific credentials)
2. TASK: Clear, specific objective with expected deliverables
3. CONTEXT: Background information, constraints, and requirements
4. FORMAT: Exact output structure, length, and formatting
5. QUALITY: Success criteria, edge cases, and quality checks
6. EXAMPLES: When helpful, include few-shot examples

RULES:
- Generate ONLY the final prompt text, ready to paste — no explanations
- Use markdown formatting (##, -, **bold**) for structure
- Be extremely specific and actionable
- Include constraints that prevent common failure modes
- Add a quality checklist at the end
- If the user's input is vague, make intelligent assumptions and specify them
- Adapt complexity to the task: simple tasks get concise prompts, complex ones get detailed frameworks
- Include edge cases and error handling instructions when relevant
- Use chain-of-thought instructions for complex reasoning tasks
- For creative tasks, include style references and quality benchmarks`;
}

function buildUserMessage(inputs: PromptInputs): string {
  const parts: string[] = [];

  const modelLabels: Record<string, string> = {
    chatgpt: 'ChatGPT / LLM',
    midjourney: 'Midjourney v6.1',
    sdxl: 'Stable Diffusion XL',
    video: 'Runway Gen-3 / Pika',
  };

  parts.push(`TARGET MODEL: ${modelLabels[inputs.model] || inputs.model}`);
  parts.push(`OBJECTIVE: ${inputs.objective}`);

  if (inputs.objectiveChips.length > 0) {
    parts.push(`KEYWORDS/ACTIONS: ${inputs.objectiveChips.join(', ')}`);
  }

  if (inputs.tone) parts.push(`TONE: ${inputs.tone}`);
  if (inputs.audience) parts.push(`TARGET AUDIENCE: ${inputs.audience}`);

  if (inputs.length) {
    const lengthMap: Record<string, string> = {
      concise: 'Brief and to the point (under 200 words)',
      medium: 'Balanced (300-500 words)',
      detailed: 'Comprehensive (500-1000 words)',
      exhaustive: 'In-depth and exhaustive (1000+ words)',
    };
    parts.push(`DESIRED LENGTH: ${lengthMap[inputs.length] || inputs.length}`);
  }

  if (inputs.outputFormat && inputs.outputFormat !== 'text') {
    parts.push(`OUTPUT FORMAT: ${inputs.outputFormat}`);
  }

  if (inputs.constraints) parts.push(`CONSTRAINTS: ${inputs.constraints}`);
  if (inputs.language && inputs.language !== 'English') parts.push(`LANGUAGE: ${inputs.language}`);
  if (inputs.style) parts.push(`VISUAL STYLE: ${inputs.style}`);
  if (inputs.lighting) parts.push(`LIGHTING: ${inputs.lighting}`);
  if (inputs.cameraAngle) parts.push(`CAMERA ANGLE: ${inputs.cameraAngle}`);
  if (inputs.negativePrompt) parts.push(`EXCLUDE/NEGATIVE: ${inputs.negativePrompt}`);
  if (inputs.aspectRatio) parts.push(`ASPECT RATIO: ${inputs.aspectRatio}`);

  parts.push('\nGenerate the perfect prompt now. Output ONLY the prompt, nothing else.');

  return parts.join('\n');
}

export async function reversePromptFromImage(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in environment variables.');
  }

  console.log('[Gemini] Reverse prompt request, mime:', mimeType);

  const systemPrompt = `You are the world's best reverse prompt engineer. Given an image, you analyze every visual detail and produce the exact prompt that would recreate it using AI image generation tools (Midjourney, DALL-E, Stable Diffusion, Flux).

RULES:
- Output ONLY the reconstructed prompt, nothing else
- Be extremely detailed: describe subject, composition, lighting, colors, mood, style, camera angle, textures
- Include technical parameters: aspect ratio, quality flags, style references
- Use comma-separated descriptors in Midjourney style
- Include artistic references when identifiable (photographer style, art movement, etc.)
- Describe the atmosphere and emotional tone
- Note any post-processing effects (film grain, bokeh, color grading)
- If text is visible in the image, include it in quotes
- End with suggested parameters (--ar, --v, --q, --s) for Midjourney`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
          { text: 'Analyze this image and generate the exact AI prompt that would recreate it. Output ONLY the prompt.' },
        ],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.9,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.log('[Gemini] Reverse prompt error:', response.status, errorBody);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`Gemini API error (${response.status}). Please try again.`);
  }

  const data = await response.json();
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!generatedText) {
    throw new Error('No response from Gemini. Please try again.');
  }

  console.log('[Gemini] Reverse prompt received, length:', generatedText.length);
  return generatedText.trim();
}

export async function generateWithGemini(inputs: PromptInputs): Promise<PromptResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY in environment variables.');
  }

  const systemPrompt = buildSystemPrompt(inputs);
  const userMessage = buildUserMessage(inputs);

  console.log('[Gemini] Sending request with model:', inputs.model);
  console.log('[Gemini] User message length:', userMessage.length);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
        temperature: 0.85,
        maxOutputTokens: 4096,
        topP: 0.95,
        topK: 40,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.log('[Gemini] Error:', response.status, errorBody);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Invalid Gemini API key. Please check your configuration.');
    }
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(`Gemini API error (${response.status}). Please try again.`);
  }

  const data = await response.json();
  const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!generatedText) {
    throw new Error('No response from Gemini. Please try again.');
  }

  console.log('[Gemini] Response received, length:', generatedText.length);

  const cleanedPrompt = generatedText.trim();

  const templatePrompt = cleanedPrompt
    .replace(inputs.objective || '{objective}', '{objective}')
    .replace(inputs.audience || '{audience}', '{audience}');

  return {
    finalPrompt: cleanedPrompt,
    templatePrompt,
    metadata: {
      checklist: ['AI-generated prompt', `Model: ${inputs.model}`, 'Optimized by Gemini'],
      warnings: [],
      questions: [],
      assumptions: [],
    },
  };
}
