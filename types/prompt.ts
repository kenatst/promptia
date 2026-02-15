export type ModelType = 'chatgpt' | 'midjourney' | 'sdxl' | 'video';
export type PromptType = 'text' | 'image' | 'video';
export type ToneType = 'professional' | 'casual' | 'creative' | 'technical' | 'persuasive' | 'academic';
export type LengthType = 'concise' | 'medium' | 'detailed' | 'exhaustive';

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

export interface PromptFolder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface SavedPrompt {
  id: string;
  title: string;
  finalPrompt: string;
  templatePrompt: string;
  inputs: PromptInputs;
  model: ModelType;
  type: PromptType;
  tags: string[];
  isFavorite: boolean;
  folderId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  prompt: string;
  tags: string[];
  model: ModelType;
  type: PromptType;
  style: string;
  thumbnail: string;
  author: string;
  likes: number;
  isEditorPick: boolean;
}

export const DEFAULT_INPUTS: PromptInputs = {
  objective: '',
  objectiveChips: [],
  model: 'chatgpt',
  outputFormat: 'text',
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
