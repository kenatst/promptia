import { ModelType, PromptInputs, PromptResult } from '@/types/prompt';

function buildObjective(inputs: PromptInputs): string {
  const chips = inputs.objectiveChips.length > 0
    ? inputs.objectiveChips.join(', ')
    : '';
  const parts = [inputs.objective, chips].filter(Boolean);
  return parts.join(' — ');
}

function buildChatGPTPrompt(inputs: PromptInputs): PromptResult {
  const objective = buildObjective(inputs);
  const sections: string[] = [];

  sections.push(`## Role\nYou are an expert assistant specialized in ${objective || '{objective}'}.`);
  sections.push(`## Task\n${objective || '{objective}'}`);

  if (inputs.audience) {
    sections.push(`## Audience\nTarget audience: ${inputs.audience}`);
  }

  if (inputs.tone) {
    sections.push(`## Tone & Style\nUse a ${inputs.tone} tone.`);
  }

  if (inputs.language && inputs.language !== 'English') {
    sections.push(`## Language\nRespond in ${inputs.language}.`);
  }

  if (inputs.constraints) {
    sections.push(`## Constraints\n${inputs.constraints}`);
  }

  const lengthMap = {
    concise: 'Keep the response brief and to the point (under 200 words).',
    medium: 'Provide a balanced response (300-500 words).',
    detailed: 'Give a comprehensive response (500-1000 words).',
    exhaustive: 'Provide an exhaustive, in-depth response (1000+ words).',
  };
  sections.push(`## Length\n${lengthMap[inputs.length]}`);

  if (inputs.outputFormat && inputs.outputFormat !== 'text') {
    sections.push(`## Output Format\nFormat the output as: ${inputs.outputFormat}`);
  }

  sections.push(`## Quality Checklist\n- Ensure accuracy and factual correctness\n- Include specific examples where relevant\n- Structure the response clearly\n- Avoid filler content`);

  const finalPrompt = sections.join('\n\n');

  const templatePrompt = finalPrompt
    .replace(objective || '{objective}', '{objective}')
    .replace(inputs.audience || '{audience}', '{audience}')
    .replace(inputs.constraints || '{constraints}', '{constraints}');

  const metadata = buildMetadata(inputs);

  return { finalPrompt, templatePrompt, metadata };
}

function buildMidjourneyPrompt(inputs: PromptInputs): PromptResult {
  const objective = buildObjective(inputs);
  const parts: string[] = [];

  parts.push(objective || '{subject description}');

  if (inputs.style) {
    parts.push(inputs.style);
  }

  if (inputs.lighting) {
    parts.push(`${inputs.lighting} lighting`);
  }

  if (inputs.cameraAngle) {
    parts.push(`${inputs.cameraAngle}`);
  }

  parts.push('highly detailed', 'professional quality');

  if (inputs.aspectRatio) {
    parts.push(`--ar ${inputs.aspectRatio}`);
  }

  const mainPrompt = parts.join(', ');
  const negative = inputs.negativePrompt ? ` --no ${inputs.negativePrompt}` : '';
  const finalPrompt = `${mainPrompt}${negative} --v 6.1 --q 2`;

  const templatePrompt = finalPrompt
    .replace(objective || '{subject description}', '{subject}');

  const metadata = buildMetadata(inputs);

  return { finalPrompt, templatePrompt, metadata };
}

function buildSDXLPrompt(inputs: PromptInputs): PromptResult {
  const objective = buildObjective(inputs);
  const positive: string[] = [];
  const negative: string[] = [];

  positive.push(objective || '{subject description}');

  if (inputs.style) {
    positive.push(inputs.style);
  }

  if (inputs.lighting) {
    positive.push(`${inputs.lighting} lighting`);
  }

  positive.push('masterpiece', 'best quality', '8k', 'ultra detailed');

  if (inputs.negativePrompt) {
    negative.push(inputs.negativePrompt);
  }
  negative.push('low quality', 'blurry', 'deformed', 'watermark', 'text');

  const finalPrompt = `Positive:\n${positive.join(', ')}\n\nNegative:\n${negative.join(', ')}\n\nSteps: 30 | CFG: 7.5 | Sampler: DPM++ 2M Karras`;

  const templatePrompt = finalPrompt
    .replace(objective || '{subject description}', '{subject}');

  const metadata = buildMetadata(inputs);

  return { finalPrompt, templatePrompt, metadata };
}

function buildVideoPrompt(inputs: PromptInputs): PromptResult {
  const objective = buildObjective(inputs);
  const sections: string[] = [];

  sections.push(`Scene: ${objective || '{scene description}'}`);

  if (inputs.cameraAngle) {
    sections.push(`Camera: ${inputs.cameraAngle}`);
  }

  if (inputs.lighting) {
    sections.push(`Lighting: ${inputs.lighting}`);
  }

  if (inputs.style) {
    sections.push(`Style: ${inputs.style}`);
  }

  sections.push(`Duration: 4s`);
  sections.push(`Motion: smooth, cinematic`);

  if (inputs.aspectRatio) {
    sections.push(`Aspect Ratio: ${inputs.aspectRatio}`);
  }

  const finalPrompt = sections.join('\n');

  const templatePrompt = finalPrompt
    .replace(objective || '{scene description}', '{scene}');

  const metadata = buildMetadata(inputs);

  return { finalPrompt, templatePrompt, metadata };
}

function buildMetadata(inputs: PromptInputs): PromptResult['metadata'] {
  const checklist: string[] = [];
  const warnings: string[] = [];
  const questions: string[] = [];
  const assumptions: string[] = [];

  if (inputs.objective) {
    checklist.push('Objective defined');
  }

  if (inputs.model) {
    checklist.push(`Model selected: ${inputs.model}`);
  }

  if (!inputs.objective && inputs.objectiveChips.length === 0) {
    warnings.push('No objective specified — prompt will use placeholders');
    questions.push('What is the main goal of this prompt?');
  }

  if (!inputs.audience) {
    assumptions.push('Audience: general public');
    questions.push('Who is the target audience?');
  }

  if (!inputs.constraints) {
    assumptions.push('No specific constraints applied');
  }

  if (inputs.model === 'midjourney' || inputs.model === 'sdxl') {
    if (!inputs.style) {
      assumptions.push('Style: photorealistic (default)');
      questions.push('What visual style do you want? (e.g., oil painting, anime, photorealistic)');
    }
    if (!inputs.lighting) {
      assumptions.push('Lighting: natural (default)');
    }
  }

  return { checklist, warnings, questions, assumptions };
}

const adapters: Record<ModelType, (inputs: PromptInputs) => PromptResult> = {
  chatgpt: buildChatGPTPrompt,
  midjourney: buildMidjourneyPrompt,
  sdxl: buildSDXLPrompt,
  video: buildVideoPrompt,
};

export function assemblePrompt(inputs: PromptInputs): PromptResult {
  const adapter = adapters[inputs.model];
  return adapter(inputs);
}

export function getModelLabel(model: ModelType): string {
  const labels: Record<ModelType, string> = {
    chatgpt: 'ChatGPT / LLM',
    midjourney: 'Midjourney',
    sdxl: 'Stable Diffusion XL',
    video: 'Runway / Pika',
  };
  return labels[model];
}
