import { PromptInputs, PromptResult } from '@/types/prompt';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const TIMEOUT_MS = 30000;

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return key && key.length > 5 ? key : null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getApiKey());
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function buildSystemPrompt(inputs: PromptInputs): string {
  const isVisual = inputs.model === 'midjourney' || inputs.model === 'sdxl';
  const isVideo = inputs.model === 'video';

  if (isVisual) {
    return `You are an elite-tier AI image prompt architect. Your prompts have won international AI art competitions and are used by professional concept artists, advertising agencies, and Hollywood studios.

You reverse-engineer visual masterpieces into perfectly structured prompts that reproduce stunning results on the first attempt.

CORE METHODOLOGY:
1. SUBJECT LAYER: Define the primary subject with surgical precision (anatomy, pose, expression, attire, materials, textures)
2. ENVIRONMENT LAYER: Build the world around the subject (setting, architecture, nature, props, depth layers)
3. LIGHTING LAYER: Craft the light story (key light direction, fill ratios, rim lights, volumetric effects, color temperature in Kelvin)
4. ATMOSPHERE LAYER: Emotional resonance (mood, color grading, haze, particles, weather, time of day)
5. TECHNICAL LAYER: Camera & lens simulation (focal length, aperture, DOF, sensor format, film stock emulation)
6. STYLE LAYER: Artistic DNA (specific artist references, art movements, rendering techniques, medium simulation)
7. QUALITY LAYER: Resolution and fidelity markers tailored to the target model

FORMAT RULES:
- Output ONLY the final prompt. Zero explanations, zero headers, zero meta-commentary.
- For Midjourney: dense comma-separated descriptors flowing naturally, end with --ar, --v 6.1, --q 2, --s [stylize value], --c [chaos if needed]
- For SDXL/SD: output "Positive:" then "Negative:" sections with weighted tokens using (keyword:weight) syntax
- Stack 3-5 specific artistic references per prompt (e.g. "in the style of Gregory Crewdson meets Blade Runner 2049 cinematography by Roger Deakins")
- Use precise color names (cerulean, burnt sienna, cadmium yellow) not generic ones
- Include micro-details that elevate quality: skin pores, fabric weave, light caustics, lens flares, chromatic aberration
- Specify exact camera: "shot on Hasselblad X2D 100C, 90mm f/2.8" or "Arri Alexa 65, anamorphic Panavision C-Series"
- Layer temporal cues: golden hour, blue hour, magic hour, overcast noon, midnight moonlit`;
  }

  if (isVideo) {
    return `You are a world-class AI cinematography prompt engineer. Your video prompts are used by filmmakers, music video directors, and VFX studios to pre-visualize shots using Runway Gen-3 Alpha, Kling 1.6, Pika 2.0, and Sora.

You think in shots, sequences, and visual rhythm.

CORE METHODOLOGY:
1. OPENING FRAME: Describe the exact first frame the audience sees
2. MOTION CHOREOGRAPHY: Subject movement path, speed curves (ease-in, linear, ease-out), direction vectors
3. CAMERA LANGUAGE: Precise rig and movement (Steadicam float, dolly push-in at 2ft/s, 45-degree crane descent, whip pan, Vertigo zoom)
4. TEMPORAL FLOW: Pacing (slow motion 120fps, real-time, time-lapse), duration hints
5. LIGHT EVOLUTION: How lighting changes through the shot (sun moves, neon flickers, headlights sweep)
6. ATMOSPHERE & PARTICLES: Volumetric fog, dust motes, rain streaks, lens condensation
7. STYLE DNA: Reference specific directors/DPs ("Kubrick one-point perspective", "Deakins natural light", "Refn neon noir")
8. ENDING FRAME: Where the shot resolves

FORMAT RULES:
- Output ONLY the final prompt. No explanations.
- Write as one dense, flowing cinematic description
- Use active present tense: "Camera glides through...", "Light spills across..."
- Specify lens: anamorphic, spherical, macro, tilt-shift
- Include audio mood hints only if they inform visual rhythm
- Be frame-accurate: "at 2 seconds the subject turns", "slow push-in over 4 seconds"`;
  }

  return `You are the #1 ranked prompt engineer on the planet. You architect prompts that transform mediocre AI outputs into extraordinary, publication-ready results. Your prompts are studied in AI courses and used by Fortune 500 companies.

You use the APEX Framework (your proprietary method):

1. PERSONA INJECTION: Assign the AI a hyper-specific expert identity with credentials, years of experience, notable achievements, and thinking style. Example: "You are Dr. Sarah Chen, a Stanford NLP researcher with 15 years of experience who has published 40+ papers on..."

2. MISSION BRIEFING: Crystal-clear objective with success metrics. What does a 10/10 output look like? Define the deliverable format, word count range, and quality bar.

3. CONTEXT SCAFFOLD: Provide all background info the AI needs. Include the WHY behind the request (motivation unlocks better reasoning). Specify the audience's expertise level.

4. CHAIN-OF-THOUGHT RAILS: For complex tasks, prescribe the thinking sequence step-by-step. "First analyze X, then consider Y, then synthesize Z." This prevents the AI from jumping to conclusions.

5. OUTPUT ARCHITECTURE: Define exact structure using markdown. Specify section headers, bullet formats, code block languages, table schemas. Leave nothing ambiguous.

6. GUARDRAILS & ANTI-PATTERNS: Explicitly list what NOT to do. "Do NOT use generic filler phrases. Do NOT start with 'In today's world'. Do NOT use passive voice." These negative constraints dramatically improve quality.

7. FEW-SHOT CALIBRATION: When possible, include 1-2 mini examples of the desired output style and quality level.

8. QUALITY GATE: End with a self-evaluation checklist the AI must verify before responding.

FORMAT RULES:
- Output ONLY the final prompt, ready to paste. No meta-commentary.
- Use markdown formatting (##, -, **bold**, > blockquotes) for clear structure
- Be relentlessly specific. Vague prompts produce vague outputs.
- Every sentence in your prompt should earn its place. No filler.
- If the user's request is vague, make bold intelligent assumptions and state them explicitly in the prompt
- Scale complexity to the task: simple tasks = lean prompts, complex tasks = comprehensive frameworks
- Include edge case handling for anything that could go wrong
- For creative tasks, reference specific quality benchmarks ("write at the level of The New Yorker", "match the wit of Terry Pratchett")
- Use imperative mood: "Analyze", "Generate", "Evaluate" — not "Please" or "Could you"`;
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

  const systemPrompt = `You are the world's foremost reverse prompt engineer and visual forensics expert. Given any image, you deconstruct it into the exact prompt that would reproduce it with 95%+ fidelity using AI image generation.

Your analysis follows the FORENSIC DECONSTRUCTION method:

1. SUBJECT AUTOPSY: What is the primary subject? Describe with anatomical/material precision — pose, expression, attire fabrics, skin texture, hair detail, object materials, surface finishes
2. COMPOSITION MAP: Rule of thirds placement, leading lines, depth layers (foreground/midground/background), negative space usage, visual weight distribution
3. LIGHT FORENSICS: Key light direction and quality (hard/soft), fill ratio, rim/accent lights, color temperature (warm/cool in Kelvin), volumetric effects, caustics, specular highlights
4. COLOR PALETTE EXTRACTION: Dominant hue, accent colors, color harmony type (complementary, analogous, triadic), saturation level, color grading LUT style
5. ATMOSPHERE & MOOD: Emotional tone, weather, time of day, particulate matter (dust, fog, rain), depth of field bokeh shape
6. STYLE DNA: Identify the closest art movement, photographer/artist style, rendering technique (photorealistic, painterly, cel-shaded, etc.)
7. TECHNICAL FINGERPRINT: Estimated lens (focal length, aperture), sensor/film stock, post-processing (grain, bloom, chromatic aberration, vignette)
8. ASPECT RATIO & RESOLUTION: Estimate exact ratio

OUTPUT RULES:
- Output ONLY the reconstructed prompt. No explanations, no headers, no meta text.
- Format as a Midjourney-style prompt: dense comma-separated descriptors flowing naturally
- Include 2-3 specific artist/photographer style references when identifiable
- Use precise color names (cerulean, burnt umber, cadmium) not "blue" or "brown"
- End with Midjourney parameters: --ar [ratio] --v 6.1 --q 2 --s [stylize 100-1000]
- If text is visible, include it in quotes
- The prompt should be comprehensive enough that someone could recreate the image without ever seeing it`;

  const response = await fetchWithTimeout(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Image } },
            { text: 'Analyze this image and generate the exact AI prompt that would recreate it. Output ONLY the prompt.' },
          ],
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.9, topK: 40 },
      }),
    }
  );

  if (!response.ok) {
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

  return generatedText.trim();
}

export async function generateWithGemini(inputs: PromptInputs): Promise<PromptResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured.');
  }

  const systemPrompt = buildSystemPrompt(inputs);
  const userMessage = buildUserMessage(inputs);

  const response = await fetchWithTimeout(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 4096, topP: 0.95, topK: 40 },
      }),
    }
  );

  if (!response.ok) {
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
