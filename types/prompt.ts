export type PromptType = 'text' | 'image' | 'video';

export type ModelType =
  | 'chatgpt'
  | 'gpt-4o'
  | 'claude'
  | 'gemini'
  | 'midjourney'
  | 'sdxl'
  | 'comfyui'
  | 'runway'
  | 'pika'
  | 'sora'
  | 'video';

export type ToneType =
  | 'professional'
  | 'casual'
  | 'creative'
  | 'technical'
  | 'friendly'
  | 'authoritative'
  | 'empathetic'
  | 'concise';

export type LengthType = 'concise' | 'medium' | 'detailed';

export type OutputFormatType =
  | 'text'
  | 'markdown'
  | 'json'
  | 'html'
  | 'csv'
  | 'code'
  | 'step-by-step'
  | 'table'
  | 'bullet points';

export type PromptCategory =
  | 'chat_qa'
  | 'code_dev'
  | 'writing'
  | 'marketing'
  | 'email'
  | 'data_analysis'
  | 'image_art'
  | 'photography'
  | 'video_clip'
  | 'logo_brand'
  | 'social_media'
  | 'education'
  | 'seo_content'
  | 'translation'
  | 'business_plan'
  | 'ui_design'
  | 'research'
  | 'legal'
  | 'productivity'
  | 'custom';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type PaletteOption =
  | 'Warm'
  | 'Cool'
  | 'Monochrome'
  | 'Vibrant'
  | 'Pastel'
  | 'Dark'
  | 'Neon'
  | 'Natural';

export type MoodOption =
  | 'Dramatic'
  | 'Peaceful'
  | 'Mysterious'
  | 'Energetic'
  | 'Melancholic'
  | 'Epic'
  | 'Playful'
  | 'Minimal';

export type CameraMovementOption =
  | 'Static'
  | 'Pan left'
  | 'Pan right'
  | 'Zoom in'
  | 'Zoom out'
  | 'Dolly'
  | 'Crane'
  | 'Handheld';

export type DurationOption = 3 | 5 | 10 | 15;
export type AspectRatioOption = '1:1' | '16:9' | '9:16' | '4:3' | '3:2' | '2:3';
export type VisualQualityOption = 'Draft' | 'Standard' | 'Ultra';

export interface CreationCategory {
  id: PromptCategory;
  emoji: string;
  label: string;
  subtitle: string;
  type: PromptType;
  recommendedModel: ModelType;
  defaultTone: ToneType;
  defaultQuickTags: string[];
  accentColor: string;
}

export interface PromptContext {
  customCategoryName?: string;
  role?: string;
  audience?: string;
  background?: string;
  addChainOfThought?: boolean;
  style?: string;
  artistReference?: string;
  colorPalettes?: PaletteOption[];
  moods?: MoodOption[];
  cameraMovement?: CameraMovementOption;
  durationSeconds?: DurationOption;
}

export interface ExamplePair {
  input: string;
  output: string;
}

export interface FineTuneOptions {
  tone: ToneType;
  length: LengthType;
  outputFormat: OutputFormatType;
  language: string;
  audience?: string;
  constraints?: string;
  addExamples?: boolean;
  examplePair?: ExamplePair;
  aspectRatio?: AspectRatioOption;
  quality?: VisualQualityOption;
  negativePrompt?: string;
}

export interface GenerateConfig {
  category: PromptCategory;
  goal: string;
  quickTags: string[];
  context: PromptContext;
  finetuneOptions: FineTuneOptions;
  targetModel?: ModelType;
}

export type PromptSectionType =
  | 'role'
  | 'task'
  | 'context'
  | 'constraints'
  | 'format'
  | 'examples';

export interface PromptSection {
  id: string;
  type: PromptSectionType;
  header: string;
  emoji: string;
  color: string;
  content: string;
}

export interface MissingInfoItem {
  id: string;
  label: string;
  stepToGoBack: 2 | 3 | 4;
}

export interface GenerateResult {
  model: ModelType;
  sections: PromptSection[];
  fullPrompt: string;
  concisePrompt: string;
  assumptions: string[];
  missingInfo: MissingInfoItem[];
  improvementSuggestions: string[];
  qualityScore: number;
  tokensEstimate: number;
}

export interface Prompt {
  id: string;
  title: string;
  category: PromptCategory;
  model: ModelType;
  type: PromptType;
  sections: PromptSection[];
  fullPrompt: string;
  concisePrompt: string;
  tags: string[];
  likeCount: number;
  isEditorPick: boolean;
  accentColor: string;
  createdAt: number;
  updatedAt?: number;
}

export interface SavedPrompt extends Prompt {
  source: 'library';
}

export interface GalleryItem extends Prompt {
  source: 'gallery';
}

export type ExploreFilter =
  | 'All'
  | 'Text'
  | 'Image'
  | 'Video'
  | 'Code'
  | 'Creative'
  | 'Business';

export const DEFAULT_CONTEXT: PromptContext = {
  customCategoryName: '',
  role: '',
  audience: '',
  background: '',
  addChainOfThought: false,
  style: '',
  artistReference: '',
  colorPalettes: [],
  moods: [],
  cameraMovement: 'Static',
  durationSeconds: 5,
};

export const DEFAULT_FINETUNE_OPTIONS: FineTuneOptions = {
  tone: 'professional',
  length: 'medium',
  outputFormat: 'markdown',
  language: 'English',
  audience: '',
  constraints: '',
  addExamples: false,
  examplePair: { input: '', output: '' },
  aspectRatio: '16:9',
  quality: 'Standard',
  negativePrompt: '',
};

export const DEFAULT_GENERATE_CONFIG: GenerateConfig = {
  category: 'chat_qa',
  goal: '',
  quickTags: [],
  context: { ...DEFAULT_CONTEXT },
  finetuneOptions: { ...DEFAULT_FINETUNE_OPTIONS },
  targetModel: 'chatgpt',
};

// Legacy compatibility for previously generated files/components.
export interface PromptInputs {
  objective: string;
  objectiveChips: string[];
  model: ModelType;
  outputFormat: string;
  tone: ToneType;
  audience: string;
  language: string;
  constraints: string;
  length: LengthType;
  variables: string[];
  style?: string;
  negativePrompt?: string;
  aspectRatio?: string;
  cameraAngle?: string;
  lighting?: string;
}

export interface PromptResult {
  finalPrompt: string;
  templatePrompt: string;
  metadata: {
    checklist: string[];
    warnings: string[];
    questions: string[];
    assumptions: string[];
  };
}

export const DEFAULT_INPUTS: PromptInputs = {
  objective: '',
  objectiveChips: [],
  model: 'chatgpt',
  outputFormat: 'markdown',
  tone: 'professional',
  audience: '',
  language: 'English',
  constraints: '',
  length: 'medium',
  variables: [],
  style: '',
  negativePrompt: '',
  aspectRatio: '16:9',
  cameraAngle: '',
  lighting: '',
};
