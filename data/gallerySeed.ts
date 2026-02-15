import Colors, { CATEGORY_COLORS } from '@/constants/colors';
import {
  AspectRatioOption,
  CameraMovementOption,
  CreationCategory,
  DurationOption,
  GalleryItem,
  MoodOption,
  OutputFormatType,
  PaletteOption,
  PromptCategory,
  PromptSection,
  ToneType,
  VisualQualityOption,
} from '@/types/prompt';

const SECTION_STYLE = {
  role: { emoji: '🎭', header: 'Role & Persona', color: Colors.role },
  task: { emoji: '🎯', header: 'Objective', color: Colors.task },
  context: { emoji: '🧠', header: 'Context & Background', color: Colors.context },
  constraints: { emoji: '🔧', header: 'Constraints & Guardrails', color: Colors.constraints },
  format: { emoji: '📐', header: 'Output Specification', color: Colors.format },
  examples: { emoji: '💡', header: 'Examples', color: Colors.examples },
} as const;

type SectionKind = keyof typeof SECTION_STYLE;

type SectionInput = {
  type: SectionKind;
  content: string;
};

function buildSections(inputs: SectionInput[]): PromptSection[] {
  return inputs.map((item) => ({
    id: item.type,
    type: item.type,
    header: SECTION_STYLE[item.type].header,
    emoji: SECTION_STYLE[item.type].emoji,
    color: SECTION_STYLE[item.type].color,
    content: item.content,
  }));
}

function sectionsToMarkdown(sections: PromptSection[]): string {
  return sections.map((section) => `## ${section.header}\n${section.content}`).join('\n\n');
}

function sectionsToConcise(sections: PromptSection[]): string {
  return sections
    .filter((section) => section.type === 'role' || section.type === 'task' || section.type === 'format')
    .map((section) => `## ${section.header}\n${section.content}`)
    .join('\n\n');
}

function createTextSeed(input: {
  id: string;
  title: string;
  category: PromptCategory;
  model: GalleryItem['model'];
  tags: string[];
  likeCount: number;
  isEditorPick: boolean;
  role: string;
  task: string;
  context: string;
  constraints: string;
  format: string;
  examples?: string;
  createdAt: number;
}): GalleryItem {
  const sections = buildSections([
    { type: 'role', content: input.role },
    { type: 'task', content: input.task },
    { type: 'context', content: input.context },
    { type: 'constraints', content: input.constraints },
    { type: 'format', content: input.format },
    ...(input.examples ? [{ type: 'examples' as const, content: input.examples }] : []),
  ]);

  return {
    id: input.id,
    source: 'gallery',
    title: input.title,
    category: input.category,
    model: input.model,
    type: 'text',
    sections,
    fullPrompt: sectionsToMarkdown(sections),
    concisePrompt: sectionsToConcise(sections),
    tags: input.tags,
    likeCount: input.likeCount,
    isEditorPick: input.isEditorPick,
    accentColor: CATEGORY_COLORS[input.category],
    createdAt: input.createdAt,
  };
}

function createImageSeed(input: {
  id: string;
  title: string;
  category: PromptCategory;
  model: GalleryItem['model'];
  tags: string[];
  likeCount: number;
  isEditorPick: boolean;
  role: string;
  task: string;
  context: string;
  negative: string;
  format: string;
  concise: string;
  createdAt: number;
}): GalleryItem {
  const sections = buildSections([
    { type: 'role', content: input.role },
    { type: 'task', content: input.task },
    { type: 'context', content: input.context },
    { type: 'constraints', content: `Negative prompt: ${input.negative}` },
    { type: 'format', content: input.format },
  ]);

  return {
    id: input.id,
    source: 'gallery',
    title: input.title,
    category: input.category,
    model: input.model,
    type: 'image',
    sections,
    fullPrompt: input.format,
    concisePrompt: input.concise,
    tags: input.tags,
    likeCount: input.likeCount,
    isEditorPick: input.isEditorPick,
    accentColor: CATEGORY_COLORS[input.category],
    createdAt: input.createdAt,
  };
}

function createVideoSeed(input: {
  id: string;
  title: string;
  category: PromptCategory;
  model: GalleryItem['model'];
  tags: string[];
  likeCount: number;
  isEditorPick: boolean;
  role: string;
  task: string;
  context: string;
  constraints: string;
  format: string;
  concise: string;
  createdAt: number;
}): GalleryItem {
  const sections = buildSections([
    { type: 'role', content: input.role },
    { type: 'task', content: input.task },
    { type: 'context', content: input.context },
    { type: 'constraints', content: input.constraints },
    { type: 'format', content: input.format },
  ]);

  return {
    id: input.id,
    source: 'gallery',
    title: input.title,
    category: input.category,
    model: input.model,
    type: 'video',
    sections,
    fullPrompt: input.format,
    concisePrompt: input.concise,
    tags: input.tags,
    likeCount: input.likeCount,
    isEditorPick: input.isEditorPick,
    accentColor: CATEGORY_COLORS[input.category],
    createdAt: input.createdAt,
  };
}

export const CREATION_CATEGORIES: CreationCategory[] = [
  {
    id: 'chat_qa',
    emoji: '💬',
    label: 'Chat & QA',
    subtitle: 'Ask, explain, discuss',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'friendly',
    defaultQuickTags: ['Explain', 'Compare', 'Simplify'],
    accentColor: CATEGORY_COLORS.chat_qa,
  },
  {
    id: 'code_dev',
    emoji: '💻',
    label: 'Code & Dev',
    subtitle: 'Generate, debug, review',
    type: 'text',
    recommendedModel: 'gpt-4o',
    defaultTone: 'technical',
    defaultQuickTags: ['Debug', 'Refactor', 'Optimize'],
    accentColor: CATEGORY_COLORS.code_dev,
  },
  {
    id: 'writing',
    emoji: '✍️',
    label: 'Writing',
    subtitle: 'Articles, stories, copy',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'creative',
    defaultQuickTags: ['Write', 'Expand', 'Rewrite'],
    accentColor: CATEGORY_COLORS.writing,
  },
  {
    id: 'marketing',
    emoji: '📣',
    label: 'Marketing',
    subtitle: 'Ads, campaigns, positioning',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'authoritative',
    defaultQuickTags: ['Plan', 'Optimize', 'Create'],
    accentColor: CATEGORY_COLORS.marketing,
  },
  {
    id: 'email',
    emoji: '📧',
    label: 'Email',
    subtitle: 'Outreach, newsletters, replies',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'professional',
    defaultQuickTags: ['Write', 'Format', 'Critique'],
    accentColor: CATEGORY_COLORS.email,
  },
  {
    id: 'data_analysis',
    emoji: '📊',
    label: 'Data & Analysis',
    subtitle: 'Analyze, visualize, summarize',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'technical',
    defaultQuickTags: ['Analyze', 'Compare', 'Extract'],
    accentColor: CATEGORY_COLORS.data_analysis,
  },
  {
    id: 'image_art',
    emoji: '🎨',
    label: 'Image Art',
    subtitle: 'AI image generation',
    type: 'image',
    recommendedModel: 'midjourney',
    defaultTone: 'creative',
    defaultQuickTags: ['Create', 'Design', 'Expand'],
    accentColor: CATEGORY_COLORS.image_art,
  },
  {
    id: 'photography',
    emoji: '📷',
    label: 'Photography',
    subtitle: 'Photo descriptions & styles',
    type: 'image',
    recommendedModel: 'sdxl',
    defaultTone: 'technical',
    defaultQuickTags: ['Create', 'Optimize', 'Format'],
    accentColor: CATEGORY_COLORS.photography,
  },
  {
    id: 'video_clip',
    emoji: '🎬',
    label: 'Video Clip',
    subtitle: 'Runway, Pika, Sora',
    type: 'video',
    recommendedModel: 'runway',
    defaultTone: 'creative',
    defaultQuickTags: ['Create', 'Design', 'Plan'],
    accentColor: CATEGORY_COLORS.video_clip,
  },
  {
    id: 'logo_brand',
    emoji: '🔷',
    label: 'Logo & Brand',
    subtitle: 'Identity, visual direction',
    type: 'image',
    recommendedModel: 'midjourney',
    defaultTone: 'authoritative',
    defaultQuickTags: ['Design', 'Compare', 'Create'],
    accentColor: CATEGORY_COLORS.logo_brand,
  },
  {
    id: 'social_media',
    emoji: '📱',
    label: 'Social Media',
    subtitle: 'Posts, threads, captions',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'casual',
    defaultQuickTags: ['Create', 'Rewrite', 'Expand'],
    accentColor: CATEGORY_COLORS.social_media,
  },
  {
    id: 'education',
    emoji: '🎓',
    label: 'Education',
    subtitle: 'Lessons, quizzes, explanations',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'empathetic',
    defaultQuickTags: ['Teach', 'Explain', 'Simplify'],
    accentColor: CATEGORY_COLORS.education,
  },
  {
    id: 'seo_content',
    emoji: '🔍',
    label: 'SEO & Content',
    subtitle: 'Rankings, keywords, meta',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'technical',
    defaultQuickTags: ['Research', 'Optimize', 'Plan'],
    accentColor: CATEGORY_COLORS.seo_content,
  },
  {
    id: 'translation',
    emoji: '🌍',
    label: 'Translation',
    subtitle: 'Localize, adapt, transcreate',
    type: 'text',
    recommendedModel: 'gemini',
    defaultTone: 'professional',
    defaultQuickTags: ['Translate', 'Rewrite', 'Format'],
    accentColor: CATEGORY_COLORS.translation,
  },
  {
    id: 'business_plan',
    emoji: '📋',
    label: 'Business Plan',
    subtitle: 'Strategy, pitches, roadmaps',
    type: 'text',
    recommendedModel: 'claude',
    defaultTone: 'authoritative',
    defaultQuickTags: ['Plan', 'Analyze', 'Compare'],
    accentColor: CATEGORY_COLORS.business_plan,
  },
  {
    id: 'ui_design',
    emoji: '🖼️',
    label: 'UI Design',
    subtitle: 'Wireframes, design systems',
    type: 'image',
    recommendedModel: 'midjourney',
    defaultTone: 'technical',
    defaultQuickTags: ['Design', 'Refactor', 'Critique'],
    accentColor: CATEGORY_COLORS.ui_design,
  },
  {
    id: 'research',
    emoji: '🔬',
    label: 'Research',
    subtitle: 'Deep dives, literature, synthesis',
    type: 'text',
    recommendedModel: 'claude',
    defaultTone: 'technical',
    defaultQuickTags: ['Research', 'Extract', 'Compare'],
    accentColor: CATEGORY_COLORS.research,
  },
  {
    id: 'legal',
    emoji: '⚖️',
    label: 'Legal',
    subtitle: 'Contracts, policies, summaries',
    type: 'text',
    recommendedModel: 'claude',
    defaultTone: 'professional',
    defaultQuickTags: ['Summarize', 'Extract', 'Critique'],
    accentColor: CATEGORY_COLORS.legal,
  },
  {
    id: 'productivity',
    emoji: '⚡',
    label: 'Productivity',
    subtitle: 'SOPs, templates, workflows',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'concise',
    defaultQuickTags: ['Automate', 'Plan', 'Format'],
    accentColor: CATEGORY_COLORS.productivity,
  },
  {
    id: 'custom',
    emoji: '✨',
    label: 'Custom',
    subtitle: 'Anything else',
    type: 'text',
    recommendedModel: 'chatgpt',
    defaultTone: 'professional',
    defaultQuickTags: ['Brainstorm', 'Roleplay', 'Format'],
    accentColor: CATEGORY_COLORS.custom,
  },
];

export const OBJECTIVE_QUICK_TAGS = [
  'Write',
  'Analyze',
  'Generate',
  'Explain',
  'Summarize',
  'Translate',
  'Design',
  'Create',
  'Review',
  'Brainstorm',
  'Debug',
  'Optimize',
  'Compare',
  'Research',
  'Plan',
  'Refactor',
  'Convert',
  'Automate',
  'Teach',
  'Critique',
  'Simplify',
  'Expand',
  'Extract',
  'Roleplay',
  'Format',
  'Rewrite',
] as const;

export const TONE_OPTIONS: ToneType[] = [
  'professional',
  'casual',
  'creative',
  'technical',
  'friendly',
  'authoritative',
  'empathetic',
  'concise',
];

export const LENGTH_OPTIONS = [
  { label: '⚡ Concise (~150w)', value: 'concise' },
  { label: '📄 Medium (~500w)', value: 'medium' },
  { label: '📚 Detailed (~1000w)', value: 'detailed' },
] as const;

export const OUTPUT_FORMAT_OPTIONS: OutputFormatType[] = [
  'text',
  'markdown',
  'json',
  'html',
  'csv',
  'code',
  'step-by-step',
  'table',
  'bullet points',
];

export const LANGUAGE_OPTIONS = [
  'English',
  'French',
  'Spanish',
  'German',
  'Chinese',
  'Japanese',
  'Portuguese',
  'Arabic',
  'Italian',
  'Dutch',
  'Korean',
  'Hindi',
  'Turkish',
  'Polish',
  'Russian',
  'Swedish',
  'Vietnamese',
  'Thai',
  'Indonesian',
  'Hebrew',
] as const;

export const COLOR_PALETTE_OPTIONS: PaletteOption[] = ['Warm', 'Cool', 'Monochrome', 'Vibrant', 'Pastel', 'Dark', 'Neon', 'Natural'];
export const MOOD_OPTIONS: MoodOption[] = ['Dramatic', 'Peaceful', 'Mysterious', 'Energetic', 'Melancholic', 'Epic', 'Playful', 'Minimal'];
export const CAMERA_MOVEMENT_OPTIONS: CameraMovementOption[] = ['Static', 'Pan left', 'Pan right', 'Zoom in', 'Zoom out', 'Dolly', 'Crane', 'Handheld'];
export const VIDEO_DURATION_OPTIONS: DurationOption[] = [3, 5, 10, 15];
export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = ['1:1', '16:9', '9:16', '4:3', '3:2', '2:3'];
export const VISUAL_QUALITY_OPTIONS: VisualQualityOption[] = ['Draft', 'Standard', 'Ultra'];

export const EXPLORE_FILTERS = ['All', 'Text', 'Image', 'Video', 'Code', 'Creative', 'Business'] as const;

const now = Date.now();

export const gallerySeed: GalleryItem[] = [
  createTextSeed({
    id: 'g01',
    title: 'Socratic Calculus Tutor With Confidence Checks',
    category: 'chat_qa',
    model: 'chatgpt',
    tags: ['education', 'math', 'socratic', 'clarity'],
    likeCount: 4820,
    isEditorPick: true,
    role: 'You are a patient calculus professor with 15 years of teaching first-year STEM students.',
    task: 'Help the user solve integration problems by asking one clarifying question first, then guiding in compact steps before giving the final solution.',
    context: 'Audience: university students preparing for exams. Context: they often memorize formulas without understanding substitution strategy.',
    constraints: 'DO: explain method choice before algebra steps. DO: verify final answer by differentiation. DON\'T: skip intermediate transformations. TONE: friendly and confident.',
    format: 'Format: markdown. Length: 250-400 words. Language: English. Structure: Clarify, Solve, Verify, Recap.',
    examples: 'Input: Integrate x*cos(x^2). Output: explain substitution u=x^2, compute, then differentiate to check.',
    createdAt: now - 1000 * 60 * 43,
  }),
  createTextSeed({
    id: 'g02',
    title: 'Type-Safe React Query Refactor Plan',
    category: 'code_dev',
    model: 'gpt-4o',
    tags: ['react-query', 'typescript', 'refactor', 'architecture'],
    likeCount: 4511,
    isEditorPick: true,
    role: 'You are a staff TypeScript engineer with deep React Query and domain-driven architecture experience.',
    task: 'Refactor a legacy data layer to typed query keys, isolated API clients, and resilient mutation flows with rollback behavior.',
    context: 'Audience: 4-person frontend team shipping weekly. Context: flaky cache invalidation and duplicated fetch logic across 18 screens.',
    constraints: 'DO: propose incremental migration steps with risk notes. DO: include codemod-friendly naming conventions. DON\'T: require a full rewrite. TONE: technical.',
    format: 'Format: markdown with code blocks. Length: ~900 words. Language: English. Structure: audit findings, migration phases, sample code, test checklist.',
    examples: 'Input: legacy useEffect fetch flow. Output: typed useQuery/useMutation pattern with queryKey factory.',
    createdAt: now - 1000 * 60 * 68,
  }),
  createTextSeed({
    id: 'g03',
    title: 'Founder Story Long-Form Editorial Blueprint',
    category: 'writing',
    model: 'chatgpt',
    tags: ['storytelling', 'editorial', 'long-form', 'brand'],
    likeCount: 2760,
    isEditorPick: false,
    role: 'You are an award-winning long-form editor for startup and leadership publications.',
    task: 'Write a narrative feature about a founder pivoting from failed hardware to profitable B2B software.',
    context: 'Audience: operators and investors. Context: article should feel personal yet analytical, balancing vulnerability and strategic lessons.',
    constraints: 'DO: open with a cinematic scene. DO: include tension arc and one data-backed turning point. DON\'T: use motivational clichés. TONE: creative but precise.',
    format: 'Format: markdown. Length: 1,000 words. Language: English. Structure: Hook, Conflict, Turning Point, Framework, Closing reflection.',
    createdAt: now - 1000 * 60 * 97,
  }),
  createTextSeed({
    id: 'g04',
    title: 'AIDA Landing Page for Cybersecurity SaaS',
    category: 'marketing',
    model: 'chatgpt',
    tags: ['aida', 'landing-page', 'b2b', 'conversion'],
    likeCount: 3988,
    isEditorPick: true,
    role: 'You are a growth copywriter focused on enterprise cybersecurity funnels.',
    task: 'Create conversion-focused landing page copy using AIDA for a SaaS that reduces mean time to detect cloud threats.',
    context: 'Audience: security leads and CTOs in 200-2000 employee companies. Context: skeptical buyers, long sales cycle, high risk aversion.',
    constraints: 'DO: include quantified outcomes and trust indicators. DO: map pain points to capability. DON\'T: overpromise zero-risk claims. TONE: authoritative.',
    format: 'Format: markdown. Length: ~700 words. Language: English. Structure: hero, proof, capabilities, objections, CTA.',
    createdAt: now - 1000 * 60 * 123,
  }),
  createTextSeed({
    id: 'g05',
    title: 'High-Reply B2B Outreach Email Sequence',
    category: 'email',
    model: 'chatgpt',
    tags: ['outreach', 'sequence', 'b2b', 'sales'],
    likeCount: 3160,
    isEditorPick: false,
    role: 'You are a lifecycle email strategist with strong deliverability and copy performance expertise.',
    task: 'Draft a 4-email outbound sequence for discovery calls with engineering leaders at fintech companies.',
    context: 'Audience: busy VPs Engineering. Context: first touch is cold, value proposition is developer productivity analytics.',
    constraints: 'DO: provide 5 subject line variants per email. DO: keep each email under 140 words. DON\'T: use manipulative urgency. TONE: professional and concise.',
    format: 'Format: markdown table. Length: medium. Language: English. Columns: email goal, subject options, body, CTA.',
    createdAt: now - 1000 * 60 * 145,
  }),
  createTextSeed({
    id: 'g06',
    title: 'Quarterly Churn Root-Cause Diagnostic',
    category: 'data_analysis',
    model: 'chatgpt',
    tags: ['churn', 'retention', 'analysis', 'kpi'],
    likeCount: 2498,
    isEditorPick: false,
    role: 'You are a senior product analyst with specialization in SaaS retention and causal inference.',
    task: 'Analyze churn patterns and deliver a prioritized action plan for reducing churn over the next quarter.',
    context: 'Audience: CPO and Growth team. Context: churn rose from 4.2% to 6.1% after onboarding changes and price packaging update.',
    constraints: 'DO: separate correlation from plausible causation. DO: include confidence level for each insight. DON\'T: recommend tactics without metric linkage. TONE: technical.',
    format: 'Format: markdown. Length: detailed. Language: English. Structure: executive summary, diagnostics, hypotheses, experiments, KPI targets.',
    createdAt: now - 1000 * 60 * 171,
  }),
  createImageSeed({
    id: 'g07',
    title: 'Neo-Noir Alley Portrait With Rain Reflections',
    category: 'image_art',
    model: 'midjourney',
    tags: ['neo-noir', 'portrait', 'cinematic', 'lighting'],
    likeCount: 503,
    isEditorPick: false,
    role: 'You are a cinematic concept artist crafting editorial-level visual prompts.',
    task: 'Generate a close portrait in a neon-lit alley after rain with reflective puddles and atmospheric haze.',
    context: 'Style: neo-noir cinematic, subtle grain. Artist reference: Roger Deakins lighting and Syd Mead color mood. Palette: cool neon cyan + magenta. Mood: mysterious.',
    negative: 'blurry face, extra fingers, low-detail skin, flat lighting, watermark, text',
    format:
      'portrait of a lone detective in a rain-soaked alley, wet asphalt reflections, volumetric mist, neon cyan and magenta signage, cinematic rim light, shallow depth of field, ultra-detailed skin texture, neo-noir mood --ar 2:3 --style raw --v 6.1 --q 2 --no blurry face, extra fingers, low-detail skin, flat lighting, watermark, text',
    concise: 'neo-noir detective portrait in rainy neon alley, cinematic rim light --ar 2:3 --style raw --v 6.1 --q 2',
    createdAt: now - 1000 * 60 * 210,
  }),
  createImageSeed({
    id: 'g08',
    title: 'Luxury Watch Macro Studio Composition',
    category: 'photography',
    model: 'sdxl',
    tags: ['macro', 'product', 'luxury', 'studio'],
    likeCount: 1822,
    isEditorPick: false,
    role: 'You are a luxury product photographer specialized in macro composition and reflective surfaces.',
    task: 'Create a macro hero shot of a skeleton mechanical watch with brushed titanium textures and controlled highlights.',
    context: 'Style: ultra-real studio product photography. Reference: Hasselblad ad campaigns. Palette: monochrome graphite with warm highlights. Mood: premium minimal.',
    negative: 'warped geometry, noisy reflections, soft focus, watermark, text, over-sharpened edges',
    format:
      'Positive: macro shot of a skeleton mechanical watch, brushed titanium case, polished bevels, specular highlight control, dramatic top softbox, black acrylic base reflection, masterpiece, best quality, ultra-detailed\nNegative: warped geometry, noisy reflections, soft focus, watermark, text, over-sharpened edges\nSteps: 32, CFG: 7, Sampler: DPM++ 2M Karras',
    concise: 'Positive: macro luxury watch on black acrylic, controlled studio light. Negative: blur, noise, watermark. Steps: 30, CFG: 7.',
    createdAt: now - 1000 * 60 * 235,
  }),
  createVideoSeed({
    id: 'g09',
    title: 'Drone Reveal of Eco-City at Sunrise',
    category: 'video_clip',
    model: 'runway',
    tags: ['drone', 'city', 'cinematic', 'future'],
    likeCount: 2960,
    isEditorPick: true,
    role: 'You are a cinematic director building shot-ready prompts for generative video models.',
    task: 'Create a 10-second reveal from dense forest canopy to a sustainable floating city at sunrise.',
    context: 'Opening scene: low fog over treetops with dew particles. Visual style: premium cinematic realism. Mood: epic but serene.',
    constraints: 'Camera movement: dolly up then crane forward. Main action: city emerges as sunlight hits solar facades. Transition: lens flare bridge to wide skyline. Audio: soft wind and distant birds.',
    format:
      'Dense forest canopy at dawn with mist and dew particles. Dolly up through branches, then crane forward to reveal a floating eco-city reflecting sunrise light. Main action centers on solar facades activating as light sweeps across towers. Smooth flare transition into wide skyline hero shot. Ambient audio: wind, birds, subtle low synth. Visual style: cinematic realism. Duration: 10s.',
    concise: 'Forest dawn to floating eco-city reveal, dolly+crane cinematic move, 10s.',
    createdAt: now - 1000 * 60 * 263,
  }),
  createImageSeed({
    id: 'g10',
    title: 'Minimal Fintech Logo Exploration Set',
    category: 'logo_brand',
    model: 'midjourney',
    tags: ['logo', 'brand', 'minimal', 'fintech'],
    likeCount: 2410,
    isEditorPick: false,
    role: 'You are a brand identity designer crafting scalable logo systems.',
    task: 'Generate 4 logo concepts for a fintech app focused on trust, velocity, and clarity.',
    context: 'Style: geometric minimalism, Swiss grid influence. Reference: modern fintech brand systems. Palette: monochrome with amber accent. Mood: confident and clean.',
    negative: 'complex gradients, skeuomorphism, random symbols, illegible forms, watermark, text blocks',
    format:
      'minimal fintech logo concept sheet, geometric icon-first marks, grid-based alignment, high contrast monochrome with subtle amber accent, clean negative space, brand system thinking, vector-like clarity --ar 1:1 --style raw --v 6.1 --q 2 --no complex gradients, skeuomorphism, random symbols, illegible forms, watermark, text blocks',
    concise: 'minimal geometric fintech logo concepts, monochrome + amber accent --ar 1:1 --v 6.1 --q 2',
    createdAt: now - 1000 * 60 * 290,
  }),
  createTextSeed({
    id: 'g11',
    title: '7-Day TikTok Product Launch Plan',
    category: 'social_media',
    model: 'chatgpt',
    tags: ['tiktok', 'launch', 'creator', 'engagement'],
    likeCount: 3377,
    isEditorPick: false,
    role: 'You are a social growth strategist focused on short-form video hooks and retention.',
    task: 'Create a 7-day TikTok launch plan for a nutrition app targeting students and junior professionals.',
    context: 'Audience: budget-conscious, time-poor users. Context: app differentiates with 15-minute meal plans and auto-generated grocery lists.',
    constraints: 'DO: include hook script, shot list, caption, CTA, and retention tactic per day. DON\'T: rely on trend audio only. TONE: casual and energetic.',
    format: 'Format: table. Length: medium. Language: English. Columns: Day, Hook, Visual beats, Caption, CTA, KPI target.',
    createdAt: now - 1000 * 60 * 321,
  }),
  createTextSeed({
    id: 'g12',
    title: 'Adaptive Photosynthesis Lesson + Quiz',
    category: 'education',
    model: 'chatgpt',
    tags: ['lesson-plan', 'science', 'quiz', 'teaching'],
    likeCount: 2211,
    isEditorPick: false,
    role: 'You are an instructional designer creating adaptive science lessons for mixed-ability classrooms.',
    task: 'Build a 35-minute photosynthesis lesson with differentiated activities and a short mastery quiz.',
    context: 'Audience: 13-year-old learners with varied reading levels. Context: class recently covered cell structure.',
    constraints: 'DO: include starter, guided activity, independent practice, and formative check. DON\'T: use jargon without plain-language explanation. TONE: empathetic.',
    format: 'Format: markdown. Length: ~700 words. Language: English. Include answer key and rubric.',
    createdAt: now - 1000 * 60 * 349,
  }),
  createTextSeed({
    id: 'g13',
    title: 'Programmatic SEO Cluster for HR SaaS',
    category: 'seo_content',
    model: 'chatgpt',
    tags: ['seo', 'keywords', 'content-strategy', 'saas'],
    likeCount: 1750,
    isEditorPick: false,
    role: 'You are an SEO lead with experience scaling B2B content hubs through topic clustering.',
    task: 'Design a programmatic SEO plan for an HR SaaS targeting performance review workflows.',
    context: 'Audience: content and growth team. Context: domain authority is mid-tier, budget favors scalable templates over manual writing.',
    constraints: 'DO: map primary and supporting keywords by intent. DO: include internal linking graph logic. DON\'T: suggest thin pages without value depth. TONE: technical.',
    format: 'Format: markdown. Length: detailed. Language: English. Structure: cluster map, template architecture, production workflow, KPI tracking.',
    createdAt: now - 1000 * 60 * 376,
  }),
  createTextSeed({
    id: 'g14',
    title: 'Luxury Skincare EN→FR Transcreation',
    category: 'translation',
    model: 'gemini',
    tags: ['translation', 'french', 'luxury', 'transcreation'],
    likeCount: 1488,
    isEditorPick: false,
    role: 'You are a senior FR localization specialist for premium beauty brands.',
    task: 'Transcreate English campaign copy into French while preserving aspiration and premium tone.',
    context: 'Audience: francophone women 28-45 in urban markets. Context: original copy uses idiomatic US expressions that feel too casual in luxury positioning.',
    constraints: 'DO: preserve emotional intent and product claims accuracy. DO: provide 2 alternatives for culturally sensitive phrases. DON\'T: literal word-for-word translation. TONE: refined and elegant.',
    format: 'Format: markdown table. Length: medium. Language: French output with English notes. Columns: Source, Primary FR, Alternate FR, Rationale.',
    createdAt: now - 1000 * 60 * 401,
  }),
  createTextSeed({
    id: 'g15',
    title: 'Investor-Ready Climate SaaS Business Plan',
    category: 'business_plan',
    model: 'claude',
    tags: ['business-plan', 'investor', 'saas', 'climate'],
    likeCount: 4265,
    isEditorPick: true,
    role: 'You are a strategy consultant preparing Series A-ready business plans for climate tech ventures.',
    task: 'Draft a business plan for a SaaS platform that helps manufacturing plants optimize energy usage in real time.',
    context: 'Audience: venture investors and potential pilot customers. Context: early traction with 3 pilots, ARR not yet scaled, strong technical moat in edge analytics.',
    constraints: 'DO: include TAM/SAM/SOM logic, GTM sequence, and risk mitigation. DO: model assumptions transparently. DON\'T: inflate unit economics. TONE: authoritative.',
    format: 'Format: markdown with tables. Length: detailed. Language: English. Sections: thesis, market, product, GTM, financial model, milestones, risks.',
    createdAt: now - 1000 * 60 * 430,
  }),
  createImageSeed({
    id: 'g16',
    title: 'Mobile Banking UI Hero Concepts',
    category: 'ui_design',
    model: 'midjourney',
    tags: ['ui', 'mobile', 'fintech', 'design-system'],
    likeCount: 2610,
    isEditorPick: true,
    role: 'You are a principal mobile product designer building polished interface concept prompts.',
    task: 'Generate premium mobile banking UI hero screens emphasizing budgeting and savings automation.',
    context: 'Style: iOS-native glassmorphism with strong hierarchy. Reference: high-end fintech visual systems. Palette: deep charcoal + amber + cool blue accents. Mood: trustworthy minimal.',
    negative: 'cluttered layout, tiny text, inaccessible contrast, random iconography, watermark, lorem ipsum blocks',
    format:
      'premium mobile banking app UI concept, dashboard + insights + transfer flows, clear typographic hierarchy, spacious cards, subtle glass surfaces, deep charcoal background with amber accent and cool blue highlights, modern iOS style, pixel-precise interfaces --ar 9:16 --style raw --v 6.1 --q 2 --no cluttered layout, tiny text, inaccessible contrast, random iconography, watermark, lorem ipsum blocks',
    concise: 'premium mobile banking UI concepts, clear hierarchy, glass cards --ar 9:16 --v 6.1 --q 2',
    createdAt: now - 1000 * 60 * 458,
  }),
  createTextSeed({
    id: 'g17',
    title: 'LLM Safety Research Synthesis Brief',
    category: 'research',
    model: 'claude',
    tags: ['research', 'llm-safety', 'synthesis', 'literature'],
    likeCount: 1921,
    isEditorPick: false,
    role: 'You are a research analyst synthesizing AI safety literature for policy and product teams.',
    task: 'Produce a synthesis of recent work on prompt injection defenses for agentic systems.',
    context: 'Audience: applied AI engineering and governance teams. Context: team needs practical threat models and mitigation patterns, not just abstract taxonomy.',
    constraints: 'DO: separate empirical findings from speculation. DO: identify consensus and open disagreements. DON\'T: overstate limited studies. TONE: technical and balanced.',
    format: 'Format: markdown. Length: ~900 words. Language: English. Sections: scope, findings, evidence quality, implications, open questions.',
    createdAt: now - 1000 * 60 * 483,
  }),
  createTextSeed({
    id: 'g18',
    title: 'MSA Contract Risk Scanner Prompt',
    category: 'legal',
    model: 'claude',
    tags: ['legal', 'contract', 'risk', 'compliance'],
    likeCount: 3105,
    isEditorPick: false,
    role: 'You are a contract analyst trained to summarize legal risk for business stakeholders (not legal advice).',
    task: 'Review a Master Services Agreement and identify high-risk clauses, negotiation leverage points, and missing protections.',
    context: 'Audience: startup COO and procurement lead. Context: vendor lock-in concerns and liability exposure on security incidents.',
    constraints: 'DO: flag limitation of liability, indemnity, data processing, and termination. DO: provide plain-language impact summary. DON\'T: draft jurisdiction-specific legal advice. TONE: professional.',
    format: 'Format: markdown table + summary. Length: medium. Language: English. Columns: Clause, Risk level, Why it matters, Suggested revision.',
    createdAt: now - 1000 * 60 * 508,
  }),
  createTextSeed({
    id: 'g19',
    title: 'Weekly Operating Cadence SOP Builder',
    category: 'productivity',
    model: 'chatgpt',
    tags: ['sop', 'operations', 'workflow', 'team'],
    likeCount: 2040,
    isEditorPick: false,
    role: 'You are an operations chief designing lightweight systems for high-velocity teams.',
    task: 'Create a weekly operating cadence SOP for a 12-person product organization.',
    context: 'Audience: PM, design, and engineering managers. Context: too many meetings, unclear handoffs, and weak accountability loops.',
    constraints: 'DO: define meeting purpose, owner, prep artifacts, and success criteria. DON\'T: create process overhead without clear payoff. TONE: concise.',
    format: 'Format: markdown checklist + table. Length: medium. Language: English.',
    createdAt: now - 1000 * 60 * 531,
  }),
  createTextSeed({
    id: 'g20',
    title: 'Custom Prompt Chain for Grant Writing',
    category: 'custom',
    model: 'chatgpt',
    tags: ['custom', 'grant', 'prompt-chain', 'workflow'],
    likeCount: 1677,
    isEditorPick: false,
    role: 'You are a nonprofit funding strategist with expertise in grant narrative architecture.',
    task: 'Design a 4-step prompt chain to draft a grant proposal from rough notes to final submission-ready narrative.',
    context: 'Audience: small nonprofit teams with limited grant writing bandwidth. Context: must align with funder outcomes, evidence, and budget logic.',
    constraints: 'DO: define inputs and outputs for each chain step. DO: include quality gate criteria between steps. DON\'T: skip measurable impact framing. TONE: professional.',
    format: 'Format: markdown. Length: detailed. Language: English. Structure: Step map, prompts, handoff checklist, common failure modes.',
    createdAt: now - 1000 * 60 * 560,
  }),
  createTextSeed({
    id: 'g21',
    title: 'PostgreSQL Query Optimization Reviewer',
    category: 'code_dev',
    model: 'gpt-4o',
    tags: ['postgres', 'performance', 'sql', 'debug'],
    likeCount: 3598,
    isEditorPick: true,
    role: 'You are a database performance engineer specializing in PostgreSQL execution plans.',
    task: 'Review slow analytical SQL queries and propose index, schema, and query rewrite improvements.',
    context: 'Audience: backend engineers supporting customer-facing dashboards. Context: several 95th percentile endpoints exceed 3.5s under concurrency.',
    constraints: 'DO: explain why each optimization helps based on planner behavior. DO: include expected trade-offs. DON\'T: suggest speculative indexes without workload context. TONE: technical.',
    format: 'Format: markdown + SQL blocks. Length: ~800 words. Language: English. Include before/after query patterns.',
    createdAt: now - 1000 * 60 * 585,
  }),
  createImageSeed({
    id: 'g22',
    title: 'Retro-Futuristic Festival Poster Concept',
    category: 'image_art',
    model: 'midjourney',
    tags: ['poster', 'retro-future', 'typography', 'design'],
    likeCount: 1290,
    isEditorPick: false,
    role: 'You are a poster designer blending retro print language with futuristic composition.',
    task: 'Create a retro-futuristic music festival poster with bold hierarchy and kinetic shapes.',
    context: 'Style: 70s print textures meets modern neon gradients. Reference: Swiss layout discipline + synthwave atmosphere. Palette: neon orange, deep navy, electric cyan. Mood: energetic.',
    negative: 'muddy type, over-crowded composition, weak contrast, watermark, blurry lines',
    format:
      'retro-futuristic music festival poster, bold typographic hierarchy, diagonal composition, textured grain, neon orange and electric cyan on deep navy, dynamic geometric elements, high-contrast print aesthetic, collectible design quality --ar 2:3 --style raw --v 6.1 --q 2 --no muddy type, over-crowded composition, weak contrast, watermark, blurry lines',
    concise: 'retro-futuristic festival poster, bold typography, neon palette --ar 2:3 --v 6.1 --q 2',
    createdAt: now - 1000 * 60 * 610,
  }),
  createTextSeed({
    id: 'g23',
    title: 'PAS Re-Engagement Campaign for Dormant Users',
    category: 'marketing',
    model: 'chatgpt',
    tags: ['pas', 'retention', 'campaign', 'email'],
    likeCount: 2712,
    isEditorPick: false,
    role: 'You are a retention marketer experienced in lifecycle reactivation for subscription products.',
    task: 'Build a Problem-Agitate-Solution campaign to reactivate users inactive for 45+ days.',
    context: 'Audience: users who signed up but never completed onboarding. Context: product is a project management tool for freelancers.',
    constraints: 'DO: personalize by inactivity reason segments. DO: include one low-friction comeback action. DON\'T: guilt-trip language. TONE: empathetic and persuasive.',
    format: 'Format: markdown table. Length: medium. Language: English. Include segment, trigger, message, offer, KPI.',
    createdAt: now - 1000 * 60 * 638,
  }),
  createTextSeed({
    id: 'g24',
    title: 'LinkedIn Thought-Leadership Thread System',
    category: 'social_media',
    model: 'chatgpt',
    tags: ['linkedin', 'thread', 'authority', 'b2b'],
    likeCount: 1875,
    isEditorPick: false,
    role: 'You are a B2B personal brand strategist specializing in LinkedIn authority growth.',
    task: 'Generate a repeatable template for weekly thought-leadership threads for a SaaS CTO.',
    context: 'Audience: engineering leaders and technical founders. Context: goal is to increase qualified inbound demos through expertise signaling.',
    constraints: 'DO: use pattern interrupts in first two lines. DO: include one practical framework and one contrarian insight per thread. DON\'T: write generic motivational content. TONE: authoritative but human.',
    format: 'Format: markdown. Length: ~500 words. Language: English. Include template + 5 complete thread examples.',
    createdAt: now - 1000 * 60 * 661,
  }),
  createTextSeed({
    id: 'g25',
    title: 'Fantasy Novel Chapter Outline Architect',
    category: 'writing',
    model: 'chatgpt',
    tags: ['novel', 'fantasy', 'outline', 'story'],
    likeCount: 1442,
    isEditorPick: false,
    role: 'You are a developmental fiction editor specializing in epic fantasy structure and pacing.',
    task: 'Plan a 12-chapter arc for a fantasy novel where a reluctant archivist becomes a resistance leader.',
    context: 'Audience: aspiring fiction writer with strong worldbuilding but weak pacing. Context: needs clear escalation and emotional stakes.',
    constraints: 'DO: assign conflict, revelation, and emotional beat for each chapter. DO: thread one subplot with payoff by chapter 10. DON\'T: use generic chosen-one tropes. TONE: creative.',
    format: 'Format: table. Length: detailed. Language: English. Columns: chapter objective, conflict, character shift, cliffhanger.',
    createdAt: now - 1000 * 60 * 689,
  }),
  createTextSeed({
    id: 'g26',
    title: 'A/B Test Readout Narrative Builder',
    category: 'data_analysis',
    model: 'chatgpt',
    tags: ['ab-test', 'stats', 'product', 'readout'],
    likeCount: 2380,
    isEditorPick: false,
    role: 'You are an experimentation lead translating test outcomes into product decisions.',
    task: 'Turn raw A/B test metrics into an executive narrative with recommendation confidence levels.',
    context: 'Audience: product leadership and design managers. Context: one variant improves conversion but reduces downstream retention.',
    constraints: 'DO: include statistical validity checks and practical significance. DO: state what to test next. DON\'T: recommend rollout without segment breakdown. TONE: technical and concise.',
    format: 'Format: markdown. Length: medium. Language: English. Sections: result, interpretation, risk, recommendation, next experiment.',
    createdAt: now - 1000 * 60 * 711,
  }),
  createVideoSeed({
    id: 'g27',
    title: 'Slow-Motion Perfume Cinematic Ad',
    category: 'video_clip',
    model: 'sora',
    tags: ['perfume', 'slow-motion', 'luxury', 'commercial'],
    likeCount: 3290,
    isEditorPick: true,
    role: 'You are a luxury commercial director creating high-end fragrance visuals.',
    task: 'Produce a 5-second slow-motion perfume ad with liquid motion and sculptural lighting.',
    context: 'Opening scene: crystal bottle suspended in black void with drifting gold particles. Style: ultra-premium cinematic macro. Mood: mysterious and elegant.',
    constraints: 'Camera movement: slow zoom in with subtle orbit. Action: atomized mist wraps around bottle and catches rim light. Transition: fade through particle bloom. Audio: deep ambient pulse.',
    format:
      'Black void with suspended crystal perfume bottle, drifting gold particles and fine mist. Slow zoom-in plus gentle orbit while atomized fragrance curls around the bottle, catching warm rim light. Transition through luminous particle bloom to close-up logo frame. Ambient audio: deep cinematic pulse and airy texture. Style: luxury macro realism. Duration: 5s.',
    concise: 'Luxury perfume macro shot, slow zoom + orbit, gold particles, 5s.',
    createdAt: now - 1000 * 60 * 735,
  }),
  createTextSeed({
    id: 'g28',
    title: 'Decision Memo Coach for Product Bets',
    category: 'chat_qa',
    model: 'chatgpt',
    tags: ['decision-memo', 'strategy', 'product', 'framework'],
    likeCount: 2688,
    isEditorPick: false,
    role: 'You are a product strategy advisor helping teams write sharp decision memos.',
    task: 'Guide the user to produce a one-page decision memo comparing two roadmap bets.',
    context: 'Audience: product leadership meeting with engineering and finance stakeholders. Context: limited capacity, high uncertainty, need explicit trade-off language.',
    constraints: 'DO: force explicit assumptions and reversibility assessment. DO: provide a recommendation plus alternative path. DON\'T: hide uncertainty behind generic phrasing. TONE: professional.',
    format: 'Format: markdown. Length: concise to medium. Language: English. Sections: context, options, trade-offs, recommendation, risks, next checkpoint.',
    createdAt: now - 1000 * 60 * 759,
  }),
  createImageSeed({
    id: 'g29',
    title: 'Design System Token Visualization Board',
    category: 'ui_design',
    model: 'midjourney',
    tags: ['design-system', 'tokens', 'ui-kit', 'documentation'],
    likeCount: 1108,
    isEditorPick: false,
    role: 'You are a UI systems designer creating clear design-token documentation visuals.',
    task: 'Generate a visual board showing color, spacing, typography, and component token relationships.',
    context: 'Style: modern product design documentation, high legibility. Reference: enterprise design system showcases. Palette: near-black canvas with amber and blue token accents. Mood: structured minimal.',
    negative: 'visual clutter, low contrast, decorative noise, unreadable labels, watermark',
    format:
      'design system token board, modular grid layout, typography scale ladder, spacing ramps, semantic color swatches, component anatomy callouts, polished enterprise documentation aesthetic, high contrast dark background with amber and blue accents --ar 16:9 --style raw --v 6.1 --q 2 --no visual clutter, low contrast, decorative noise, unreadable labels, watermark',
    concise: 'design token documentation board, modular grid, high contrast --ar 16:9 --v 6.1 --q 2',
    createdAt: now - 1000 * 60 * 783,
  }),
  createTextSeed({
    id: 'g30',
    title: '12-Month GTM Roadmap for EdTech SaaS',
    category: 'business_plan',
    model: 'claude',
    tags: ['gtm', 'roadmap', 'edtech', 'strategy'],
    likeCount: 4140,
    isEditorPick: true,
    role: 'You are a GTM strategist focused on education technology growth and institutional sales.',
    task: 'Create a 12-month go-to-market roadmap for an AI tutoring platform selling to K-12 districts and after-school programs.',
    context: 'Audience: founder, sales lead, and product marketing. Context: limited sales team, long procurement cycles, need pilot-to-contract conversion engine.',
    constraints: 'DO: split roadmap by quarter with owner and KPI per initiative. DO: include demand gen and sales enablement dependencies. DON\'T: ignore procurement and compliance bottlenecks. TONE: authoritative and practical.',
    format: 'Format: markdown table + narrative. Length: detailed. Language: English. Sections: ICP, channel strategy, quarterly initiatives, KPI scorecard, risks.',
    createdAt: now - 1000 * 60 * 809,
  }),
];

export function getCategoryById(category: PromptCategory): CreationCategory {
  return CREATION_CATEGORIES.find((item) => item.id === category) ?? CREATION_CATEGORIES[0];
}

export function getCategoryLabel(category: PromptCategory): string {
  return getCategoryById(category).label;
}
