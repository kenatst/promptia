import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { CREATION_CATEGORIES, getCategoryById } from '@/data/gallerySeed';
import { generatePrompt } from '@/engine/promptEngine';
import {
  DEFAULT_CONTEXT,
  DEFAULT_FINETUNE_OPTIONS,
  DEFAULT_GENERATE_CONFIG,
  ExploreFilter,
  FineTuneOptions,
  GenerateConfig,
  GenerateResult,
  Prompt,
  PromptCategory,
  PromptContext,
  SavedPrompt,
  WizardStep,
} from '@/types/prompt';

type PromptVariant = 'full' | 'concise';

type CategoryFilter = 'all' | PromptCategory;

interface BuilderState {
  step: WizardStep;
  config: GenerateConfig;
  result: GenerateResult | null;
  promptVariant: PromptVariant;
}

interface LibraryState {
  items: SavedPrompt[];
  searchQuery: string;
  categoryFilter: CategoryFilter;
}

interface ExploreState {
  searchQuery: string;
  filter: ExploreFilter;
}

interface PromptStore {
  builder: BuilderState;
  library: LibraryState;
  explore: ExploreState;
  setBuilderStep: (step: WizardStep) => void;
  setPromptVariant: (variant: PromptVariant) => void;
  selectCategory: (category: PromptCategory) => void;
  updateGoal: (goal: string) => void;
  setQuickTags: (tags: string[]) => void;
  toggleQuickTag: (tag: string, appendToGoal?: boolean) => void;
  updateContext: (patch: Partial<PromptContext>) => void;
  updateFineTune: (patch: Partial<FineTuneOptions>) => void;
  setBuilderConfig: (patch: Partial<GenerateConfig>) => void;
  generateCurrentPrompt: () => GenerateResult;
  resetBuilder: () => void;
  prefillBuilderFromPrompt: (prompt: Prompt) => void;
  saveCurrentPrompt: (titleOverride?: string) => SavedPrompt | null;
  savePromptToLibrary: (prompt: Prompt) => SavedPrompt;
  deleteSavedPrompt: (id: string) => void;
  removeTagFromSavedPrompt: (id: string, tag: string) => void;
  setLibrarySearchQuery: (query: string) => void;
  setLibraryCategoryFilter: (category: CategoryFilter) => void;
  setExploreSearchQuery: (query: string) => void;
  setExploreFilter: (filter: ExploreFilter) => void;
}

function createDefaultBuilderConfig(): GenerateConfig {
  return {
    ...DEFAULT_GENERATE_CONFIG,
    context: { ...DEFAULT_CONTEXT, colorPalettes: [], moods: [] },
    finetuneOptions: { ...DEFAULT_FINETUNE_OPTIONS, examplePair: { input: '', output: '' } },
  };
}

function getAutoTitle(goal: string): string {
  const words = goal
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  if (words.length === 0) {
    return 'Untitled God-tier Prompt';
  }

  return words.join(' ');
}

function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

function autoTags(config: GenerateConfig): string[] {
  const seedTags: string[] = [];

  seedTags.push(...config.quickTags);

  const goalWords = config.goal
    .split(/\s+/)
    .map((word) => normalizeTag(word))
    .filter((word) => word.length > 3)
    .slice(0, 3);

  seedTags.push(...goalWords);
  seedTags.push(config.category.replace('_', '-'));

  const unique = Array.from(new Set(seedTags.map((value) => normalizeTag(value)).filter(Boolean)));
  return unique.slice(0, 5);
}

function inferPromptType(category: PromptCategory): SavedPrompt['type'] {
  const selected = getCategoryById(category);
  return selected.type;
}

function getNowId(): string {
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_BUILDER_STATE: BuilderState = {
  step: 1,
  config: createDefaultBuilderConfig(),
  result: null,
  promptVariant: 'full',
};

const DEFAULT_LIBRARY_STATE: LibraryState = {
  items: [],
  searchQuery: '',
  categoryFilter: 'all',
};

const DEFAULT_EXPLORE_STATE: ExploreState = {
  searchQuery: '',
  filter: 'All',
};

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      builder: { ...DEFAULT_BUILDER_STATE },
      library: { ...DEFAULT_LIBRARY_STATE },
      explore: { ...DEFAULT_EXPLORE_STATE },

      setBuilderStep: (step) => {
        set((state) => ({
          builder: { ...state.builder, step },
        }));
      },

      setPromptVariant: (variant) => {
        set((state) => ({
          builder: { ...state.builder, promptVariant: variant },
        }));
      },

      selectCategory: (category) => {
        const categoryConfig = CREATION_CATEGORIES.find((item) => item.id === category) ?? CREATION_CATEGORIES[0];

        set((state) => ({
          builder: {
            ...state.builder,
            config: {
              ...state.builder.config,
              category,
              targetModel: categoryConfig.recommendedModel,
              quickTags: [...categoryConfig.defaultQuickTags],
              context: {
                ...state.builder.config.context,
                customCategoryName: category === 'custom' ? state.builder.config.context.customCategoryName ?? '' : '',
                style: '',
                artistReference: '',
                colorPalettes: [],
                moods: [],
                cameraMovement: 'Static',
                durationSeconds: 5,
              },
              finetuneOptions: {
                ...state.builder.config.finetuneOptions,
                tone: categoryConfig.defaultTone,
                aspectRatio: '16:9',
                quality: 'Standard',
                negativePrompt: '',
              },
            },
            result: null,
          },
        }));
      },

      updateGoal: (goal) => {
        set((state) => ({
          builder: {
            ...state.builder,
            config: {
              ...state.builder.config,
              goal,
            },
            result: null,
          },
        }));
      },

      setQuickTags: (tags) => {
        set((state) => ({
          builder: {
            ...state.builder,
            config: {
              ...state.builder.config,
              quickTags: tags,
            },
            result: null,
          },
        }));
      },

      toggleQuickTag: (tag, appendToGoal = true) => {
        set((state) => {
          const hasTag = state.builder.config.quickTags.includes(tag);
          const nextTags = hasTag
            ? state.builder.config.quickTags.filter((item) => item !== tag)
            : [...state.builder.config.quickTags, tag];

          const currentGoal = state.builder.config.goal;
          const shouldAppend = appendToGoal && !hasTag && currentGoal.toLowerCase().indexOf(tag.toLowerCase()) === -1;
          const nextGoal = shouldAppend ? `${currentGoal.trim()} ${tag}`.trim() : currentGoal;

          return {
            builder: {
              ...state.builder,
              config: {
                ...state.builder.config,
                quickTags: nextTags,
                goal: nextGoal,
              },
              result: null,
            },
          };
        });
      },

      updateContext: (patch) => {
        set((state) => ({
          builder: {
            ...state.builder,
            config: {
              ...state.builder.config,
              context: {
                ...state.builder.config.context,
                ...patch,
              },
            },
            result: null,
          },
        }));
      },

      updateFineTune: (patch) => {
        set((state) => {
          const nextExamplePair = {
            input: patch.examplePair?.input ?? state.builder.config.finetuneOptions.examplePair?.input ?? '',
            output: patch.examplePair?.output ?? state.builder.config.finetuneOptions.examplePair?.output ?? '',
          };

          return {
            builder: {
              ...state.builder,
              config: {
                ...state.builder.config,
                finetuneOptions: {
                  ...state.builder.config.finetuneOptions,
                  ...patch,
                  examplePair: nextExamplePair,
                },
              },
              result: null,
            },
          };
        });
      },

      setBuilderConfig: (patch) => {
        set((state) => ({
          builder: {
            ...state.builder,
            config: {
              ...state.builder.config,
              ...patch,
            },
            result: null,
          },
        }));
      },

      generateCurrentPrompt: () => {
        const { builder } = get();
        const result = generatePrompt(builder.config);

        set((state) => ({
          builder: {
            ...state.builder,
            result,
          },
        }));

        return result;
      },

      resetBuilder: () => {
        set((state) => ({
          builder: {
            ...DEFAULT_BUILDER_STATE,
            config: createDefaultBuilderConfig(),
          },
          library: {
            ...state.library,
          },
          explore: {
            ...state.explore,
          },
        }));
      },

      prefillBuilderFromPrompt: (prompt) => {
        const categoryConfig = CREATION_CATEGORIES.find((item) => item.id === prompt.category) ?? CREATION_CATEGORIES[0];
        const generated = generatePrompt({
          category: prompt.category,
          goal: prompt.title,
          quickTags: prompt.tags,
          context: {
            ...DEFAULT_CONTEXT,
            role: prompt.sections.find((section) => section.type === 'role')?.content.replace(/^You are\s+/i, '') ?? '',
            background: prompt.sections.find((section) => section.type === 'context')?.content ?? '',
          },
          finetuneOptions: {
            ...DEFAULT_FINETUNE_OPTIONS,
            tone: categoryConfig.defaultTone,
          },
          targetModel: prompt.model,
        });

        set((state) => ({
          builder: {
            ...state.builder,
            step: 2,
            config: {
              ...state.builder.config,
              category: prompt.category,
              goal: prompt.title,
              quickTags: [...prompt.tags],
              targetModel: prompt.model,
              finetuneOptions: {
                ...state.builder.config.finetuneOptions,
                tone: categoryConfig.defaultTone,
              },
            },
            result: generated,
            promptVariant: 'full',
          },
        }));
      },

      saveCurrentPrompt: (titleOverride) => {
        const state = get();
        const result = state.builder.result ?? generatePrompt(state.builder.config);
        const now = Date.now();
        const promptTitle = titleOverride?.trim() || getAutoTitle(state.builder.config.goal);

        if (promptTitle.length === 0) {
          return null;
        }

        const entry: SavedPrompt = {
          id: getNowId(),
          source: 'library',
          title: promptTitle,
          category: state.builder.config.category,
          model: result.model,
          type: inferPromptType(state.builder.config.category),
          sections: result.sections,
          fullPrompt: result.fullPrompt,
          concisePrompt: result.concisePrompt,
          tags: autoTags(state.builder.config),
          likeCount: 0,
          isEditorPick: false,
          accentColor: getCategoryById(state.builder.config.category).accentColor,
          createdAt: now,
          updatedAt: now,
        };

        set((current) => ({
          builder: {
            ...current.builder,
            result,
          },
          library: {
            ...current.library,
            items: [entry, ...current.library.items],
          },
        }));

        return entry;
      },

      savePromptToLibrary: (prompt) => {
        const now = Date.now();
        const entry: SavedPrompt = {
          ...prompt,
          id: getNowId(),
          source: 'library',
          likeCount: 0,
          isEditorPick: false,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          library: {
            ...state.library,
            items: [entry, ...state.library.items],
          },
        }));

        return entry;
      },

      deleteSavedPrompt: (id) => {
        set((state) => ({
          library: {
            ...state.library,
            items: state.library.items.filter((item) => item.id !== id),
          },
        }));
      },

      removeTagFromSavedPrompt: (id, tag) => {
        set((state) => ({
          library: {
            ...state.library,
            items: state.library.items.map((item) => {
              if (item.id !== id) {
                return item;
              }

              return {
                ...item,
                tags: item.tags.filter((existing) => existing !== tag),
                updatedAt: Date.now(),
              };
            }),
          },
        }));
      },

      setLibrarySearchQuery: (query) => {
        set((state) => ({
          library: {
            ...state.library,
            searchQuery: query,
          },
        }));
      },

      setLibraryCategoryFilter: (category) => {
        set((state) => ({
          library: {
            ...state.library,
            categoryFilter: category,
          },
        }));
      },

      setExploreSearchQuery: (query) => {
        set((state) => ({
          explore: {
            ...state.explore,
            searchQuery: query,
          },
        }));
      },

      setExploreFilter: (filter) => {
        set((state) => ({
          explore: {
            ...state.explore,
            filter,
          },
        }));
      },
    }),
    {
      name: 'promptia-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        library: {
          items: state.library.items,
          searchQuery: state.library.searchQuery,
          categoryFilter: state.library.categoryFilter,
        },
        explore: {
          searchQuery: state.explore.searchQuery,
          filter: state.explore.filter,
        },
      }),
    }
  )
);
