import Colors from '@/constants/colors';
import {
  GenerateConfig,
  GenerateResult,
  MissingInfoItem,
  ModelType,
  OutputFormatType,
  PromptCategory,
  PromptInputs,
  PromptResult,
  PromptSection,
} from '@/types/prompt';

type CategoryTemplate = {
  categoryLabel: string;
  defaultRole: string;
  objectivePrefix: string;
  contextFrame: string;
  detailedInstructions: string[];
  qualityCriteria: string[];
  defaultModel: ModelType;
};

const SECTION_META = {
  role: { emoji: '🎭', header: 'Role & Persona', color: Colors.role },
  task: { emoji: '🎯', header: 'Objective', color: Colors.task },
  context: { emoji: '🧠', header: 'Context & Background', color: Colors.context },
  constraints: { emoji: '🔧', header: 'Constraints & Guardrails', color: Colors.constraints },
  format: { emoji: '📐', header: 'Output Specification', color: Colors.format },
  examples: { emoji: '💡', header: 'Examples', color: Colors.examples },
} as const;

const TEMPLATE_BY_CATEGORY: Record<PromptCategory, CategoryTemplate> = {
  chat_qa: {
    categoryLabel: 'Chat & QA',
    defaultRole: 'Senior educator and domain expert using Socratic questioning and precise explanations.',
    objectivePrefix: 'Answer, explain, and guide with high factual reliability and practical clarity.',
    contextFrame: 'The user needs trustworthy guidance and actionable understanding.',
    detailedInstructions: [
      'Start by clarifying assumptions, then provide a direct answer before deeper reasoning.',
      'Use step-by-step logic where needed, but keep the final response concise and structured.',
      'If uncertainty exists, state confidence and what additional input would improve accuracy.',
    ],
    qualityCriteria: ['accuracy', 'clarity', 'structure', 'actionability'],
    defaultModel: 'chatgpt',
  },
  code_dev: {
    categoryLabel: 'Code & Dev',
    defaultRole: 'Staff software engineer specialized in architecture, reliability, and readable production code.',
    objectivePrefix: 'Design, generate, debug, and refactor code with explicit trade-offs and safe defaults.',
    contextFrame: 'The output should be executable, testable, and maintainable in a real codebase.',
    detailedInstructions: [
      'State assumptions about environment, versions, and constraints before proposing implementation.',
      'Prefer incremental, testable changes and include edge-case handling.',
      'When relevant, provide code plus a verification plan and potential risks.',
    ],
    qualityCriteria: ['correctness', 'maintainability', 'performance', 'testability'],
    defaultModel: 'gpt-4o',
  },
  writing: {
    categoryLabel: 'Writing',
    defaultRole: 'Editorial writer with strong narrative craft and conversion-aware structure.',
    objectivePrefix: 'Write compelling copy tailored to audience, intent, and channel.',
    contextFrame: 'The content should read naturally while remaining strategically effective.',
    detailedInstructions: [
      'Use clear narrative flow: hook, development, and strong ending.',
      'Avoid generic filler and prioritize concrete, vivid language.',
      'Match tone and pacing to target audience sophistication.',
    ],
    qualityCriteria: ['voice consistency', 'readability', 'impact', 'specificity'],
    defaultModel: 'chatgpt',
  },
  marketing: {
    categoryLabel: 'Marketing',
    defaultRole: 'Growth strategist experienced in AIDA/PAS copy frameworks and GTM execution.',
    objectivePrefix: 'Create conversion-driven messaging with clear positioning and persuasive flow.',
    contextFrame: 'The response should connect audience pain points to a credible value proposition.',
    detailedInstructions: [
      'Structure messaging using AIDA or PAS based on context fit.',
      'Differentiate with concrete benefits, proof, and decisive call-to-action.',
      'Include channel-specific adaptation guidance if applicable.',
    ],
    qualityCriteria: ['positioning clarity', 'persuasion', 'audience fit', 'conversion intent'],
    defaultModel: 'chatgpt',
  },
  email: {
    categoryLabel: 'Email',
    defaultRole: 'Senior lifecycle marketer focused on high open-rate, reply-rate, and conversion.',
    objectivePrefix: 'Write high-performing emails with sharp subject lines and clear CTA.',
    contextFrame: 'Deliver concise, scannable messages aligned with audience and funnel stage.',
    detailedInstructions: [
      'Draft subject line options optimized for curiosity and relevance.',
      'Keep body tight and one-idea-per-email when possible.',
      'End with one explicit action and friction-reducing next step.',
    ],
    qualityCriteria: ['openability', 'clarity', 'CTA strength', 'tone match'],
    defaultModel: 'chatgpt',
  },
  data_analysis: {
    categoryLabel: 'Data & Analysis',
    defaultRole: 'Senior analyst skilled in statistical reasoning, business storytelling, and visualization logic.',
    objectivePrefix: 'Analyze data rigorously and present insights with decision-ready recommendations.',
    contextFrame: 'The user needs signal over noise with transparent assumptions.',
    detailedInstructions: [
      'Summarize key findings first, then support with evidence and caveats.',
      'Highlight anomalies, trend drivers, and confidence limitations.',
      'Conclude with prioritized actions and measurable KPIs.',
    ],
    qualityCriteria: ['analytical rigor', 'insight depth', 'clarity', 'decision utility'],
    defaultModel: 'chatgpt',
  },
  image_art: {
    categoryLabel: 'Image Art',
    defaultRole: 'AI visual art director creating production-grade prompts for image generation models.',
    objectivePrefix: 'Generate visually rich composition prompts with style, lighting, and technical fidelity.',
    contextFrame: 'The output should be model-ready and aesthetically intentional.',
    detailedInstructions: [
      'Specify subject, scene details, composition, mood, and rendering quality.',
      'Use artist references only as style guidance, never as vague filler.',
      'Add exact model parameters for reproducibility.',
    ],
    qualityCriteria: ['visual specificity', 'coherence', 'style control', 'technical precision'],
    defaultModel: 'midjourney',
  },
  photography: {
    categoryLabel: 'Photography',
    defaultRole: 'Commercial photographer and prompt stylist specialized in lighting, lensing, and mood.',
    objectivePrefix: 'Craft photo-real prompts with controlled composition and lighting intent.',
    contextFrame: 'The output should read like a high-end art direction brief.',
    detailedInstructions: [
      'Define subject, camera framing, color treatment, and lighting behavior.',
      'Include exclusion guidance to avoid artifacts or low-quality render traits.',
      'Tune parameters for realism and texture detail.',
    ],
    qualityCriteria: ['realism', 'composition quality', 'lighting control', 'artifact suppression'],
    defaultModel: 'sdxl',
  },
  video_clip: {
    categoryLabel: 'Video Clip',
    defaultRole: 'Cinematic director and storyboard artist for generative video tools.',
    objectivePrefix: 'Design short cinematic clips with clear camera intent and motion language.',
    contextFrame: 'The output should be directly usable in Runway, Pika, or Sora.',
    detailedInstructions: [
      'Describe opening shot, camera move, key action, and transition.',
      'Define mood, visual style, and ambient sound direction.',
      'State exact duration and movement pacing.',
    ],
    qualityCriteria: ['cinematic clarity', 'motion coherence', 'scene readability', 'stylistic consistency'],
    defaultModel: 'runway',
  },
  logo_brand: {
    categoryLabel: 'Logo & Brand',
    defaultRole: 'Brand identity designer focused on scalable marks and strategic visual systems.',
    objectivePrefix: 'Create branding concepts with strong symbolism and practical brand fit.',
    contextFrame: 'Deliver outputs suitable for identity exploration and direction setting.',
    detailedInstructions: [
      'Define brand personality, symbolic language, and visual constraints.',
      'Prioritize readability, contrast, and memorability.',
      'Include composition guidance for lockups and icon-first use cases.',
    ],
    qualityCriteria: ['brand fit', 'distinctiveness', 'clarity', 'usability'],
    defaultModel: 'midjourney',
  },
  social_media: {
    categoryLabel: 'Social Media',
    defaultRole: 'Social strategist optimizing hooks, retention, and conversion across platforms.',
    objectivePrefix: 'Generate platform-native posts with high engagement potential.',
    contextFrame: 'The content should be concise, thumb-stopping, and immediately useful.',
    detailedInstructions: [
      'Use high-contrast hooks in the opening line.',
      'Maintain platform-specific rhythm and formatting.',
      'End with a lightweight engagement trigger or CTA.',
    ],
    qualityCriteria: ['hook strength', 'readability', 'engagement fit', 'voice consistency'],
    defaultModel: 'chatgpt',
  },
  education: {
    categoryLabel: 'Education',
    defaultRole: 'Instructional designer creating pedagogically sound learning experiences.',
    objectivePrefix: 'Teach concepts progressively with examples, checks, and clear takeaways.',
    contextFrame: 'The output should support comprehension and retention for the target learner.',
    detailedInstructions: [
      'Break complex topics into staged learning steps.',
      'Use concrete examples before abstraction.',
      'Include quick knowledge checks and summary points.',
    ],
    qualityCriteria: ['clarity', 'pedagogical flow', 'accuracy', 'learner relevance'],
    defaultModel: 'chatgpt',
  },
  seo_content: {
    categoryLabel: 'SEO & Content',
    defaultRole: 'SEO strategist balancing ranking performance with editorial quality.',
    objectivePrefix: 'Create search-optimized content with intent alignment and semantic depth.',
    contextFrame: 'The output should rank while preserving readability and trust.',
    detailedInstructions: [
      'Map content to search intent and include semantic keyword clusters.',
      'Propose title/meta options and clear heading hierarchy.',
      'Include internal-link and FAQ opportunities where relevant.',
    ],
    qualityCriteria: ['search intent fit', 'semantic coverage', 'readability', 'CTR potential'],
    defaultModel: 'chatgpt',
  },
  translation: {
    categoryLabel: 'Translation',
    defaultRole: 'Senior localization specialist for culturally accurate transcreation.',
    objectivePrefix: 'Translate and adapt copy while preserving meaning, tone, and intent.',
    contextFrame: 'The output should feel native in target language and context.',
    detailedInstructions: [
      'Preserve nuance, register, and domain terminology.',
      'Adapt idioms and cultural references for target audience.',
      'When ambiguity exists, provide best translation plus alternate phrasing.',
    ],
    qualityCriteria: ['fidelity', 'fluency', 'cultural fit', 'tone preservation'],
    defaultModel: 'chatgpt',
  },
  business_plan: {
    categoryLabel: 'Business Plan',
    defaultRole: 'Strategy consultant building investor-ready plans and execution roadmaps.',
    objectivePrefix: 'Develop robust strategy documents with market logic and measurable milestones.',
    contextFrame: 'The output should be practical for founders, operators, or investors.',
    detailedInstructions: [
      'Cover market, positioning, business model, GTM, and risks.',
      'Quantify assumptions and provide milestone metrics.',
      'Structure recommendations by priority and execution horizon.',
    ],
    qualityCriteria: ['strategic depth', 'coherence', 'practicality', 'metric clarity'],
    defaultModel: 'chatgpt',
  },
  ui_design: {
    categoryLabel: 'UI Design',
    defaultRole: 'Product designer translating UX goals into coherent visual systems.',
    objectivePrefix: 'Generate interface direction with hierarchy, components, and visual logic.',
    contextFrame: 'Outputs should support wireframes, style references, and design critiques.',
    detailedInstructions: [
      'Define information hierarchy, spacing rhythm, and visual consistency.',
      'Balance accessibility, brand expression, and interaction clarity.',
      'Provide concrete guidance for states and component behavior.',
    ],
    qualityCriteria: ['usability', 'consistency', 'accessibility', 'visual hierarchy'],
    defaultModel: 'midjourney',
  },
  research: {
    categoryLabel: 'Research',
    defaultRole: 'Research analyst synthesizing sources into clear evidence-backed conclusions.',
    objectivePrefix: 'Conduct deep synthesis and deliver structured, critical insights.',
    contextFrame: 'The output should separate facts, inferences, and open questions.',
    detailedInstructions: [
      'Frame research scope and methodology explicitly.',
      'Summarize findings by theme and support with evidence quality notes.',
      'Conclude with unresolved questions and next research steps.',
    ],
    qualityCriteria: ['source rigor', 'synthesis quality', 'clarity', 'critical thinking'],
    defaultModel: 'claude',
  },
  legal: {
    categoryLabel: 'Legal',
    defaultRole: 'Legal analyst specialized in contract and policy interpretation (non-lawyer guidance).',
    objectivePrefix: 'Summarize legal text, identify risk, and clarify obligations in plain language.',
    contextFrame: 'The output should highlight practical implications without offering legal representation.',
    detailedInstructions: [
      'Identify critical clauses, liabilities, and ambiguities.',
      'Use plain-language summaries and risk grading.',
      'Explicitly note where professional counsel is recommended.',
    ],
    qualityCriteria: ['precision', 'risk visibility', 'clarity', 'scope discipline'],
    defaultModel: 'claude',
  },
  productivity: {
    categoryLabel: 'Productivity',
    defaultRole: 'Operations lead creating practical SOPs, templates, and repeatable workflows.',
    objectivePrefix: 'Design execution-ready systems that reduce friction and increase consistency.',
    contextFrame: 'Outputs should be straightforward to adopt by teams or solo operators.',
    detailedInstructions: [
      'Break processes into repeatable steps with ownership and inputs/outputs.',
      'Specify quality checkpoints and fallback handling.',
      'Keep language concise and implementation-focused.',
    ],
    qualityCriteria: ['clarity', 'repeatability', 'efficiency', 'adoption readiness'],
    defaultModel: 'chatgpt',
  },
  custom: {
    categoryLabel: 'Custom',
    defaultRole: 'Expert AI prompt engineer crafting robust prompts for high-quality outputs.',
    objectivePrefix: 'Build a precise and adaptable prompt tailored to the requested outcome.',
    contextFrame: 'The user has a custom task that needs strong structure and clear constraints.',
    detailedInstructions: [
      'Clarify role, objective, context, guardrails, and output format.',
      'Avoid ambiguity by defining measurable acceptance criteria.',
      'Use concise language and avoid redundant instructions.',
    ],
    qualityCriteria: ['specificity', 'structure', 'coherence', 'result predictability'],
    defaultModel: 'chatgpt',
  },
};

const VISUAL_MODELS: ModelType[] = ['midjourney', 'sdxl', 'comfyui'];
const VIDEO_MODELS: ModelType[] = ['runway', 'pika', 'sora', 'video'];

const VISUAL_CATEGORIES = new Set<PromptCategory>(['image_art', 'photography', 'logo_brand', 'ui_design']);
const VIDEO_CATEGORIES = new Set<PromptCategory>(['video_clip']);

const MODEL_LABELS: Record<ModelType, string> = {
  chatgpt: 'ChatGPT / LLM',
  'gpt-4o': 'GPT-4o',
  claude: 'Claude',
  gemini: 'Gemini',
  midjourney: 'Midjourney',
  sdxl: 'SDXL',
  comfyui: 'ComfyUI / SDXL',
  runway: 'Runway',
  pika: 'Pika',
  sora: 'Sora',
  video: 'Runway / Pika / Sora',
};

function normalizeModel(config: GenerateConfig): ModelType {
  const fallback = TEMPLATE_BY_CATEGORY[config.category].defaultModel;
  const candidate = config.targetModel ?? fallback;

  if (VISUAL_CATEGORIES.has(config.category) && !VISUAL_MODELS.includes(candidate)) {
    return fallback;
  }

  if (VIDEO_CATEGORIES.has(config.category) && !VIDEO_MODELS.includes(candidate)) {
    return fallback;
  }

  if (!VISUAL_CATEGORIES.has(config.category) && !VIDEO_CATEGORIES.has(config.category)) {
    if (VISUAL_MODELS.includes(candidate) || VIDEO_MODELS.includes(candidate)) {
      return fallback;
    }
  }

  return candidate;
}

function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words * 1.3));
}

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((chunk) => (chunk.length > 0 ? `${chunk[0].toUpperCase()}${chunk.slice(1).toLowerCase()}` : chunk))
    .join(' ');
}

function normalizeGoal(goal: string, category: PromptCategory, assumptions: string[]): string {
  const cleanGoal = normalizeLine(goal);
  if (cleanGoal.length > 0) {
    return cleanGoal;
  }

  const fallback = `Create a high-quality output for ${TEMPLATE_BY_CATEGORY[category].categoryLabel}.`;
  assumptions.push(`Goal was missing. Assumed objective: "${fallback}".`);
  return fallback;
}

function computeQualityScore(config: GenerateConfig, assumedRole: boolean, assumedContext: boolean): number {
  const goalWordCount = config.goal.trim().split(/\s+/).filter(Boolean).length;
  const hasRole = config.context.role?.trim().length ? 1 : 0;
  const hasAudience = (config.context.audience?.trim().length ?? 0) > 0 || (config.finetuneOptions.audience?.trim().length ?? 0) > 0;
  const hasBackground = (config.context.background?.trim().length ?? 0) > 0;
  const hasConstraints = (config.finetuneOptions.constraints?.trim().length ?? 0) > 0 || (config.finetuneOptions.negativePrompt?.trim().length ?? 0) > 0;
  const hasFormat = (config.finetuneOptions.outputFormat?.trim().length ?? 0) > 0 && (config.finetuneOptions.language?.trim().length ?? 0) > 0;
  const hasExamplePair =
    config.finetuneOptions.addExamples &&
    (config.finetuneOptions.examplePair?.input.trim().length ?? 0) > 0 &&
    (config.finetuneOptions.examplePair?.output.trim().length ?? 0) > 0;

  let score = 0;

  if (hasRole) {
    score += 20;
  } else if (assumedRole) {
    score += 12;
  }

  if (goalWordCount >= 8) {
    score += 20;
  } else if (goalWordCount >= 4) {
    score += 12;
  } else {
    score += 6;
  }

  if (hasAudience && hasBackground) {
    score += 15;
  } else if (hasAudience || hasBackground || assumedContext) {
    score += 8;
  }

  if (hasConstraints) {
    score += 15;
  } else {
    score += 6;
  }

  if (hasFormat) {
    score += 15;
  } else {
    score += 8;
  }

  if (hasExamplePair) {
    score += 15;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function ensureImprovementSuggestions(
  missingInfo: MissingInfoItem[],
  category: PromptCategory,
  quickTags: string[],
): string[] {
  const suggestions: string[] = [];

  for (const item of missingInfo) {
    if (suggestions.length >= 3) {
      break;
    }

    if (item.stepToGoBack === 2) {
      suggestions.push('Clarify the objective with one concrete deliverable, one audience, and one measurable outcome.');
    }

    if (item.stepToGoBack === 3) {
      suggestions.push('Add richer context (role, audience, and background) so the model can optimize style and decision depth.');
    }

    if (item.stepToGoBack === 4) {
      suggestions.push('Tighten constraints and output format to reduce ambiguity and improve first-run quality.');
    }
  }

  if (suggestions.length < 3) {
    suggestions.push('Include at least one concrete example of expected output to improve consistency.');
  }

  if (suggestions.length < 3) {
    const tagHint = quickTags.length > 0 ? quickTags.join(', ') : 'priority actions';
    suggestions.push(`Use sharper action tags (${tagHint}) directly in the task sentence for better instruction clarity.`);
  }

  if (suggestions.length < 3) {
    suggestions.push(`Add domain-specific terminology relevant to ${TEMPLATE_BY_CATEGORY[category].categoryLabel} to improve precision.`);
  }

  return suggestions.slice(0, 3);
}

function getRole(config: GenerateConfig, assumptions: string[]): { role: string; assumed: boolean } {
  const explicitRole = normalizeLine(config.context.role ?? '');
  if (explicitRole.length > 0) {
    return { role: explicitRole, assumed: false };
  }

  const fallbackRole = TEMPLATE_BY_CATEGORY[config.category].defaultRole;
  assumptions.push(`Role not provided. Assumed role: "${fallbackRole}".`);
  return { role: fallbackRole, assumed: true };
}

function getContext(config: GenerateConfig, assumptions: string[]): { audience: string; background: string; assumed: boolean } {
  let assumed = false;

  const audienceRaw = normalizeLine(config.context.audience || config.finetuneOptions.audience || '');
  const backgroundRaw = normalizeLine(config.context.background ?? '');

  const audience = audienceRaw.length > 0 ? audienceRaw : 'General audience with intermediate familiarity.';
  const background = backgroundRaw.length > 0 ? backgroundRaw : TEMPLATE_BY_CATEGORY[config.category].contextFrame;

  if (audienceRaw.length === 0) {
    assumptions.push('Audience not provided. Assumed audience: general intermediate users.');
    assumed = true;
  }

  if (backgroundRaw.length === 0) {
    assumptions.push(`Background not provided. Assumed context: "${background}".`);
    assumed = true;
  }

  return { audience, background, assumed };
}

function createMissingInfo(config: GenerateConfig, model: ModelType): MissingInfoItem[] {
  const missing: MissingInfoItem[] = [];
  const add = (id: string, label: string, stepToGoBack: 2 | 3 | 4) => {
    if (!missing.some((item) => item.id === id)) {
      missing.push({ id, label, stepToGoBack });
    }
  };

  if (config.goal.trim().length < 12) {
    add('goal_precision', 'Make the goal more specific (deliverable + context + measurable outcome).', 2);
  }

  if (!VISUAL_MODELS.includes(model) && !VIDEO_MODELS.includes(model)) {
    if ((config.context.role?.trim().length ?? 0) === 0) {
      add('role', 'Define who the AI is with expertise level and style.', 3);
    }

    if ((config.context.audience?.trim().length ?? 0) === 0 && (config.finetuneOptions.audience?.trim().length ?? 0) === 0) {
      add('audience', 'Specify target audience profile for better adaptation.', 3);
    }

    if ((config.context.background?.trim().length ?? 0) === 0) {
      add('background', 'Add relevant background context (product, problem, constraints).', 3);
    }
  }

  if (VISUAL_MODELS.includes(model)) {
    if ((config.context.style?.trim().length ?? 0) === 0) {
      add('visual_style', 'Add an artistic style direction.', 3);
    }
    if ((config.context.artistReference?.trim().length ?? 0) === 0) {
      add('artist_reference', 'Add an artist or movement reference.', 3);
    }
  }

  if (VIDEO_MODELS.includes(model)) {
    if ((config.context.cameraMovement?.trim().length ?? 0) === 0) {
      add('camera_movement', 'Define camera movement for cinematic clarity.', 3);
    }
  }

  if ((config.finetuneOptions.constraints?.trim().length ?? 0) === 0 && (config.finetuneOptions.negativePrompt?.trim().length ?? 0) === 0) {
    add('constraints', 'Define constraints or exclusions for tighter output control.', 4);
  }

  if ((config.finetuneOptions.outputFormat?.trim().length ?? 0) === 0) {
    add('output_format', 'Select explicit output format.', 4);
  }

  if (!config.finetuneOptions.addExamples) {
    add('examples', 'Add one input/output example to improve consistency.', 4);
  }

  return missing;
}

function mapLengthToWords(length: GenerateConfig['finetuneOptions']['length']): string {
  if (length === 'concise') {
    return '~150 words';
  }
  if (length === 'detailed') {
    return '~1000 words';
  }
  return '~500 words';
}

function mapOutputFormat(format: OutputFormatType): string {
  if (format === 'bullet points') {
    return 'Bullet points';
  }
  if (format === 'step-by-step') {
    return 'Step-by-step checklist';
  }
  return toTitleCase(format);
}

function buildLLMSections(
  config: GenerateConfig,
  model: ModelType,
  assumptions: string[],
): { sections: PromptSection[]; qualityCriteriaLine: string; roleAssumed: boolean; contextAssumed: boolean } {
  const template = TEMPLATE_BY_CATEGORY[config.category];
  const goal = normalizeGoal(config.goal, config.category, assumptions);
  const roleData = getRole(config, assumptions);
  const contextData = getContext(config, assumptions);

  const quickTagLine = config.quickTags.length > 0 ? `Priority actions: ${config.quickTags.join(', ')}.` : 'Priority actions: analyze, structure, and deliver actionable output.';

  if (config.quickTags.length === 0) {
    assumptions.push('Quick tags were empty. Assumed default action tags for stronger instruction bias.');
  }

  const chainOfThoughtLine = config.context.addChainOfThought
    ? 'Reason carefully in private and provide a concise rationale in the final response only.'
    : 'Use concise reasoning and avoid unnecessary intermediate steps.';

  const instructions = [
    ...template.detailedInstructions,
    chainOfThoughtLine,
  ];

  const constraints = [
    `DO: Prioritize ${template.qualityCriteria.join(', ')}.`,
    'DO: Ground claims in explicit logic and concrete details.',
    "DON'T: Hallucinate facts or invent sources.",
    "DON'T: Use vague filler or repetitive phrasing.",
    `TONE: ${toTitleCase(config.finetuneOptions.tone)}.`,
  ];

  if ((config.finetuneOptions.constraints?.trim().length ?? 0) > 0) {
    constraints.push(`ADDITIONAL CONSTRAINTS: ${normalizeLine(config.finetuneOptions.constraints ?? '')}`);
  } else {
    assumptions.push('No custom constraints provided. Applied standard safety and precision guardrails.');
  }

  const outputSpecLines = [
    `Format: ${mapOutputFormat(config.finetuneOptions.outputFormat)}.`,
    `Length: ${mapLengthToWords(config.finetuneOptions.length)}.`,
    `Language: ${config.finetuneOptions.language}.`,
    'Structure: Use clear sections with descriptive headings when appropriate.',
  ];

  const examplesEnabled = Boolean(config.finetuneOptions.addExamples);
  let examplesContent = 'No explicit example pair provided.';

  if (examplesEnabled && (config.finetuneOptions.examplePair?.input.trim().length ?? 0) > 0 && (config.finetuneOptions.examplePair?.output.trim().length ?? 0) > 0) {
    examplesContent = [
      `Input example: ${config.finetuneOptions.examplePair?.input.trim() ?? ''}`,
      `Output example: ${config.finetuneOptions.examplePair?.output.trim() ?? ''}`,
    ].join('\n');
  } else if (examplesEnabled) {
    assumptions.push('Examples were enabled without complete pair. The engine kept example structure but cannot enforce style by demonstration.');
  }

  const qualityCriteriaLine = `Your response will be evaluated on: ${template.qualityCriteria.join(', ')}.`;

  const roleSection: PromptSection = {
    id: 'role',
    type: 'role',
    header: SECTION_META.role.header,
    emoji: SECTION_META.role.emoji,
    color: SECTION_META.role.color,
    content: `You are ${roleData.role}`,
  };

  const taskSection: PromptSection = {
    id: 'task',
    type: 'task',
    header: SECTION_META.task.header,
    emoji: SECTION_META.task.emoji,
    color: SECTION_META.task.color,
    content: `${template.objectivePrefix}\n\nPrimary objective: ${goal}\n${quickTagLine}`,
  };

  const contextSection: PromptSection = {
    id: 'context',
    type: 'context',
    header: SECTION_META.context.header,
    emoji: SECTION_META.context.emoji,
    color: SECTION_META.context.color,
    content: `Audience: ${contextData.audience}\nBackground: ${contextData.background}\nModel target: ${MODEL_LABELS[model]}`,
  };

  const constraintsSection: PromptSection = {
    id: 'constraints',
    type: 'constraints',
    header: SECTION_META.constraints.header,
    emoji: SECTION_META.constraints.emoji,
    color: SECTION_META.constraints.color,
    content: [
      ...instructions.map((instruction, index) => `${index + 1}. ${instruction}`),
      '',
      ...constraints,
    ].join('\n'),
  };

  const formatSection: PromptSection = {
    id: 'format',
    type: 'format',
    header: SECTION_META.format.header,
    emoji: SECTION_META.format.emoji,
    color: SECTION_META.format.color,
    content: [...outputSpecLines, '', qualityCriteriaLine].join('\n'),
  };

  const sections: PromptSection[] = [roleSection, taskSection, contextSection, constraintsSection, formatSection];

  if (examplesEnabled) {
    sections.push({
      id: 'examples',
      type: 'examples',
      header: SECTION_META.examples.header,
      emoji: SECTION_META.examples.emoji,
      color: SECTION_META.examples.color,
      content: examplesContent,
    });
  }

  return {
    sections,
    qualityCriteriaLine,
    roleAssumed: roleData.assumed,
    contextAssumed: contextData.assumed,
  };
}

function toMarkdownPrompt(sections: PromptSection[]): string {
  return sections
    .map((section) => `## ${section.header}\n${section.content}`)
    .join('\n\n');
}

function toClaudePrompt(sections: PromptSection[]): string {
  const toTagName = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  return sections
    .map((section) => {
      const tag = toTagName(section.header);
      return `<${tag}>\n${section.content}\n</${tag}>`;
    })
    .join('\n\n');
}

function toGeminiPrompt(sections: PromptSection[]): string {
  return sections
    .map((section) => `${section.header}:\n${section.content}`)
    .join('\n\n');
}

function buildLLMFullPrompt(model: ModelType, sections: PromptSection[]): string {
  if (model === 'claude') {
    return toClaudePrompt(sections);
  }

  if (model === 'gemini') {
    return toGeminiPrompt(sections);
  }

  return toMarkdownPrompt(sections);
}

function buildLLMConcisePrompt(model: ModelType, sections: PromptSection[]): string {
  const conciseSections = sections.filter((section) => section.type === 'role' || section.type === 'task' || section.type === 'format');
  return buildLLMFullPrompt(model, conciseSections);
}

function buildVisualSections(config: GenerateConfig, model: ModelType, assumptions: string[]): PromptSection[] {
  const goal = normalizeGoal(config.goal, config.category, assumptions);
  const role = getRole(config, assumptions).role;
  const style = normalizeLine(config.context.style ?? '') || 'cinematic, high-detail, art-directed';
  const artist = normalizeLine(config.context.artistReference ?? '') || 'contemporary concept art direction';
  const palettes = (config.context.colorPalettes ?? []).length > 0 ? (config.context.colorPalettes ?? []).join(', ') : 'Vibrant';
  const moods = (config.context.moods ?? []).length > 0 ? (config.context.moods ?? []).join(', ') : 'Dramatic';
  const negative = normalizeLine(config.finetuneOptions.negativePrompt ?? '') || 'ugly, deformed, blurry, low quality, watermark, text';

  if ((config.context.style?.trim().length ?? 0) === 0) {
    assumptions.push('Visual style missing. Assumed cinematic high-detail style.');
  }

  if ((config.context.artistReference?.trim().length ?? 0) === 0) {
    assumptions.push('Artist reference missing. Assumed contemporary concept-art reference.');
  }

  const quality = config.finetuneOptions.quality ?? 'Standard';
  const aspectRatio = config.finetuneOptions.aspectRatio ?? '16:9';
  const mjQuality = quality === 'Ultra' ? '--q 2' : quality === 'Draft' ? '--q 1' : '--q 1.5';

  const roleSection: PromptSection = {
    id: 'role',
    type: 'role',
    header: SECTION_META.role.header,
    emoji: SECTION_META.role.emoji,
    color: SECTION_META.role.color,
    content: `You are ${role}`,
  };

  const taskSection: PromptSection = {
    id: 'task',
    type: 'task',
    header: SECTION_META.task.header,
    emoji: SECTION_META.task.emoji,
    color: SECTION_META.task.color,
    content: `Create an image for: ${goal}`,
  };

  const contextSection: PromptSection = {
    id: 'context',
    type: 'context',
    header: SECTION_META.context.header,
    emoji: SECTION_META.context.emoji,
    color: SECTION_META.context.color,
    content: `Style: ${style}\nReference: ${artist}\nPalette: ${palettes}\nMood: ${moods}`,
  };

  const constraintsSection: PromptSection = {
    id: 'constraints',
    type: 'constraints',
    header: SECTION_META.constraints.header,
    emoji: SECTION_META.constraints.emoji,
    color: SECTION_META.constraints.color,
    content: `Negative prompt: ${negative}`,
  };

  let formatContent = '';

  if (model === 'midjourney') {
    formatContent = [
      'Midjourney prompt format',
      `${goal}, ${style}, ${artist}, dramatic lighting, ${palettes} palette, cinematic composition, ${moods.toLowerCase()} mood, ultra-detailed, 8k`,
      `Parameters: --ar ${aspectRatio} --style raw --v 6.1 ${mjQuality}`,
    ].join('\n');
  } else {
    formatContent = [
      `Positive: ${goal}, ${style}, masterpiece, best quality, ultra-detailed, dramatic lighting, ${artist}`,
      `Negative: ${negative}`,
      'Steps: 30, CFG: 7, Sampler: DPM++ 2M Karras',
    ].join('\n');
  }

  const formatSection: PromptSection = {
    id: 'format',
    type: 'format',
    header: SECTION_META.format.header,
    emoji: SECTION_META.format.emoji,
    color: SECTION_META.format.color,
    content: formatContent,
  };

  return [roleSection, taskSection, contextSection, constraintsSection, formatSection];
}

function buildVideoSections(config: GenerateConfig, assumptions: string[]): PromptSection[] {
  const goal = normalizeGoal(config.goal, config.category, assumptions);
  const role = getRole(config, assumptions).role;
  const cameraMovement = config.context.cameraMovement ?? 'Static';
  const durationSeconds = config.context.durationSeconds ?? 5;
  const style = normalizeLine(config.context.style ?? '') || 'cinematic realism';
  const mood = (config.context.moods ?? []).length > 0 ? (config.context.moods ?? []).join(', ') : 'Epic';
  const background = normalizeLine(config.context.background ?? '') || 'No extra background provided.';

  if ((config.context.cameraMovement?.trim().length ?? 0) === 0) {
    assumptions.push('Camera movement was missing. Assumed Static camera.');
  }

  if ((config.context.style?.trim().length ?? 0) === 0) {
    assumptions.push('Video style was missing. Assumed cinematic realism.');
  }

  const roleSection: PromptSection = {
    id: 'role',
    type: 'role',
    header: SECTION_META.role.header,
    emoji: SECTION_META.role.emoji,
    color: SECTION_META.role.color,
    content: `You are ${role}`,
  };

  const taskSection: PromptSection = {
    id: 'task',
    type: 'task',
    header: SECTION_META.task.header,
    emoji: SECTION_META.task.emoji,
    color: SECTION_META.task.color,
    content: `Produce a cinematic clip for: ${goal}`,
  };

  const contextSection: PromptSection = {
    id: 'context',
    type: 'context',
    header: SECTION_META.context.header,
    emoji: SECTION_META.context.emoji,
    color: SECTION_META.context.color,
    content: `Opening scene: ${goal}.\nBackground: ${background}\nMood: ${mood}\nStyle: ${style}`,
  };

  const constraintsSection: PromptSection = {
    id: 'constraints',
    type: 'constraints',
    header: SECTION_META.constraints.header,
    emoji: SECTION_META.constraints.emoji,
    color: SECTION_META.constraints.color,
    content: [
      `Camera movement: ${cameraMovement}.`,
      'Action: keep one main action in focus to avoid temporal drift.',
      'Transition: smooth cinematic transition before final beat.',
      'Audio ambience: subtle, immersive, non-distracting.',
    ].join('\n'),
  };

  const formatSection: PromptSection = {
    id: 'format',
    type: 'format',
    header: SECTION_META.format.header,
    emoji: SECTION_META.format.emoji,
    color: SECTION_META.format.color,
    content: `Video prompt format:\n[Opening scene]. [Camera movement]. [Main action]. [Transition]. [Ambient sound]. [Visual style]. Duration: ${durationSeconds}s.`,
  };

  return [roleSection, taskSection, contextSection, constraintsSection, formatSection];
}

function buildImageFullPrompt(model: ModelType, sections: PromptSection[]): { fullPrompt: string; concisePrompt: string } {
  const task = sections.find((section) => section.type === 'task')?.content ?? '';
  const context = sections.find((section) => section.type === 'context')?.content ?? '';
  const constraints = sections.find((section) => section.type === 'constraints')?.content ?? '';
  const format = sections.find((section) => section.type === 'format')?.content ?? '';

  if (model === 'midjourney') {
    const promptLine = format
      .split('\n')
      .find((line) => line.toLowerCase().includes('midjourney prompt format'))
      ? format.split('\n')[1] ?? task
      : task;
    const paramsLine = format.split('\n').find((line) => line.startsWith('Parameters:'))?.replace('Parameters: ', '') ?? '--ar 16:9 --style raw --v 6.1 --q 1.5';
    const negative = constraints.replace('Negative prompt: ', '');
    const fullPrompt = `${promptLine}, ${negative.startsWith('Negative prompt:') ? negative.replace('Negative prompt: ', '') : ''} --no ${negative} ${paramsLine}`.replace(/\s+/g, ' ').trim();
    const concisePrompt = `${promptLine} ${paramsLine}`.replace(/\s+/g, ' ').trim();
    return { fullPrompt, concisePrompt };
  }

  const fullPrompt = format;
  const concisePrompt = `Positive: ${task.replace('Create an image for: ', '')}\nNegative: ${constraints.replace('Negative prompt: ', '')}\nSteps: 28, CFG: 7`;
  return { fullPrompt, concisePrompt };
}

function buildVideoFullPrompt(sections: PromptSection[]): { fullPrompt: string; concisePrompt: string } {
  const context = sections.find((section) => section.type === 'context')?.content ?? '';
  const constraints = sections.find((section) => section.type === 'constraints')?.content ?? '';
  const format = sections.find((section) => section.type === 'format')?.content ?? '';

  const openingScene = context.split('\n')[0]?.replace('Opening scene: ', '') ?? '';
  const cameraMovement = constraints.split('\n')[0]?.replace('Camera movement: ', '') ?? 'Static';

  const fullPrompt = [openingScene, cameraMovement, constraints, format.replace('Video prompt format:\n', '')]
    .filter(Boolean)
    .join('. ')
    .replace(/\s+/g, ' ')
    .trim();

  const concisePrompt = `${openingScene}. Camera: ${cameraMovement}. Keep it cinematic.`;

  return { fullPrompt, concisePrompt };
}

export function generatePrompt(config: GenerateConfig): GenerateResult {
  const assumptions: string[] = [];
  const model = normalizeModel(config);
  const missingInfo = createMissingInfo(config, model);

  let sections: PromptSection[] = [];
  let roleAssumed = false;
  let contextAssumed = false;

  if (VISUAL_MODELS.includes(model)) {
    sections = buildVisualSections(config, model, assumptions);
    roleAssumed = (config.context.role?.trim().length ?? 0) === 0;
    contextAssumed = (config.context.style?.trim().length ?? 0) === 0;
  } else if (VIDEO_MODELS.includes(model)) {
    sections = buildVideoSections(config, assumptions);
    roleAssumed = (config.context.role?.trim().length ?? 0) === 0;
    contextAssumed = (config.context.background?.trim().length ?? 0) === 0;
  } else {
    const llm = buildLLMSections(config, model, assumptions);
    sections = llm.sections;
    roleAssumed = llm.roleAssumed;
    contextAssumed = llm.contextAssumed;
  }

  let fullPrompt = '';
  let concisePrompt = '';

  if (VISUAL_MODELS.includes(model)) {
    const visual = buildImageFullPrompt(model, sections);
    fullPrompt = visual.fullPrompt;
    concisePrompt = visual.concisePrompt;
  } else if (VIDEO_MODELS.includes(model)) {
    const video = buildVideoFullPrompt(sections);
    fullPrompt = video.fullPrompt;
    concisePrompt = video.concisePrompt;
  } else {
    fullPrompt = buildLLMFullPrompt(model, sections);
    concisePrompt = buildLLMConcisePrompt(model, sections);
  }

  const qualityScore = computeQualityScore(config, roleAssumed, contextAssumed);
  const improvementSuggestions = ensureImprovementSuggestions(missingInfo, config.category, config.quickTags);

  return {
    model,
    sections,
    fullPrompt,
    concisePrompt,
    assumptions,
    missingInfo,
    improvementSuggestions,
    qualityScore,
    tokensEstimate: estimateTokens(fullPrompt),
  };
}

export function getModelLabel(model: ModelType): string {
  return MODEL_LABELS[model] ?? 'LLM';
}

// Legacy compatibility adapter.
export function assemblePrompt(inputs: PromptInputs): PromptResult {
  const categoryFromModel: Record<string, PromptCategory> = {
    chatgpt: 'chat_qa',
    'gpt-4o': 'code_dev',
    claude: 'research',
    gemini: 'writing',
    midjourney: 'image_art',
    sdxl: 'photography',
    comfyui: 'photography',
    runway: 'video_clip',
    pika: 'video_clip',
    sora: 'video_clip',
    video: 'video_clip',
  };

  const mappedCategory = categoryFromModel[inputs.model] ?? 'chat_qa';
  const mappedResult = generatePrompt({
    category: mappedCategory,
    goal: inputs.objective,
    quickTags: inputs.objectiveChips,
    context: {
      role: '',
      audience: inputs.audience,
      background: '',
      addChainOfThought: false,
      style: inputs.style,
      artistReference: '',
      colorPalettes: [],
      moods: [],
      cameraMovement: (inputs.cameraAngle as GenerateConfig['context']['cameraMovement']) || 'Static',
      durationSeconds: 5,
      customCategoryName: '',
    },
    finetuneOptions: {
      tone: inputs.tone,
      length: inputs.length,
      outputFormat: (inputs.outputFormat.toLowerCase() as OutputFormatType) || 'markdown',
      language: inputs.language,
      audience: inputs.audience,
      constraints: inputs.constraints,
      addExamples: false,
      examplePair: { input: '', output: '' },
      aspectRatio: (inputs.aspectRatio as GenerateConfig['finetuneOptions']['aspectRatio']) || '16:9',
      quality: 'Standard',
      negativePrompt: inputs.negativePrompt,
    },
    targetModel: inputs.model,
  });

  return {
    finalPrompt: mappedResult.fullPrompt,
    templatePrompt: mappedResult.concisePrompt,
    metadata: {
      checklist: [`Model selected: ${getModelLabel(mappedResult.model)}`],
      warnings: mappedResult.missingInfo.length > 0 ? ['Prompt can be improved with additional context.'] : [],
      questions: mappedResult.missingInfo.map((item) => item.label),
      assumptions: mappedResult.assumptions,
    },
  };
}
