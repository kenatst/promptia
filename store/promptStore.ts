import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedPrompt, PromptInputs, DEFAULT_INPUTS } from '@/types/prompt';

interface PromptStore {
  savedPrompts: SavedPrompt[];
  currentInputs: PromptInputs;
  setCurrentInputs: (inputs: Partial<PromptInputs>) => void;
  resetInputs: () => void;
  loadInputsFromPrompt: (prompt: SavedPrompt) => void;
  savePrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deletePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      savedPrompts: [],
      currentInputs: { ...DEFAULT_INPUTS },
      searchQuery: '',

      setCurrentInputs: (inputs) =>
        set((state) => ({
          currentInputs: { ...state.currentInputs, ...inputs },
        })),

      resetInputs: () =>
        set({ currentInputs: { ...DEFAULT_INPUTS } }),

      loadInputsFromPrompt: (prompt) =>
        set({ currentInputs: { ...prompt.inputs } }),

      savePrompt: (prompt) => {
        const now = Date.now();
        const newPrompt: SavedPrompt = {
          ...prompt,
          id: `p_${now}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          savedPrompts: [newPrompt, ...state.savedPrompts],
        }));
      },

      deletePrompt: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.map((p) =>
            p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() } : p
          ),
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'promptia-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedPrompts: state.savedPrompts,
      }),
    }
  )
);
