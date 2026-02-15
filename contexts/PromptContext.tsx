import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { SavedPrompt, PromptInputs, DEFAULT_INPUTS, PromptFolder } from '@/types/prompt';

const STORAGE_KEY = 'promptia-saved-prompts';
const FOLDERS_KEY = 'promptia-folders';
const ONBOARDING_KEY = 'promptia-onboarding-done';

interface PromptState {
  savedPrompts: SavedPrompt[];
  folders: PromptFolder[];
  currentInputs: PromptInputs;
  searchQuery: string;
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  setCurrentInputs: (inputs: Partial<PromptInputs>) => void;
  resetInputs: () => void;
  loadInputsFromPrompt: (prompt: SavedPrompt) => void;
  savePrompt: (prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deletePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  moveToFolder: (promptId: string, folderId: string | undefined) => void;
  searchQuery_: string;
  setSearchQuery: (query: string) => void;
  createFolder: (name: string, color: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  clearAllData: () => void;
  completeOnboarding: () => void;
}

// @ts-ignore
export const [PromptProvider, usePromptStore] = createContextHook<PromptState>(() => {
  const queryClient = useQueryClient();
  const [currentInputs, setCurrentInputsState] = useState<PromptInputs>({ ...DEFAULT_INPUTS });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localPrompts, setLocalPrompts] = useState<SavedPrompt[]>([]);
  const [localFolders, setLocalFolders] = useState<PromptFolder[]>([]);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(true);

  const promptsQuery = useQuery({
    queryKey: ['saved-prompts'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as SavedPrompt[]) : [];
      } catch (e) {
        console.log('[PromptContext] Failed to load prompts', e);
        return [];
      }
    },
  });

  const foldersQuery = useQuery({
    queryKey: ['prompt-folders'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(FOLDERS_KEY);
        return stored ? (JSON.parse(stored) as PromptFolder[]) : [];
      } catch (e) {
        console.log('[PromptContext] Failed to load folders', e);
        return [];
      }
    },
  });

  const onboardingQuery = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: async () => {
      try {
        const val = await AsyncStorage.getItem(ONBOARDING_KEY);
        return val === 'true';
      } catch {
        return false;
      }
    },
  });

  useEffect(() => {
    if (promptsQuery.data) setLocalPrompts(promptsQuery.data);
  }, [promptsQuery.data]);

  useEffect(() => {
    if (foldersQuery.data) setLocalFolders(foldersQuery.data);
  }, [foldersQuery.data]);

  useEffect(() => {
    if (onboardingQuery.data !== undefined) setHasSeenOnboarding(onboardingQuery.data);
  }, [onboardingQuery.data]);

  const syncPromptsMutation = useMutation({
    mutationFn: async (prompts: SavedPrompt[]) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
      return prompts;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['saved-prompts'], data);
    },
  });

  const syncFoldersMutation = useMutation({
    mutationFn: async (folders: PromptFolder[]) => {
      await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      return folders;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['prompt-folders'], data);
    },
  });

  const setCurrentInputs = useCallback((inputs: Partial<PromptInputs>) => {
    setCurrentInputsState(prev => ({ ...prev, ...inputs }));
  }, []);

  const resetInputs = useCallback(() => {
    setCurrentInputsState({ ...DEFAULT_INPUTS });
  }, []);

  const loadInputsFromPrompt = useCallback((prompt: SavedPrompt) => {
    setCurrentInputsState({ ...prompt.inputs });
  }, []);

  const savePrompt = useCallback((prompt: Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newPrompt: SavedPrompt = {
      ...prompt,
      id: `p_${now}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newPrompt, ...localPrompts];
    setLocalPrompts(updated);
    syncPromptsMutation.mutate(updated);
  }, [localPrompts, syncPromptsMutation]);

  const deletePrompt = useCallback((id: string) => {
    const updated = localPrompts.filter(p => p.id !== id);
    setLocalPrompts(updated);
    syncPromptsMutation.mutate(updated);
  }, [localPrompts, syncPromptsMutation]);

  const toggleFavorite = useCallback((id: string) => {
    const updated = localPrompts.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() } : p
    );
    setLocalPrompts(updated);
    syncPromptsMutation.mutate(updated);
  }, [localPrompts, syncPromptsMutation]);

  const moveToFolder = useCallback((promptId: string, folderId: string | undefined) => {
    const updated = localPrompts.map(p =>
      p.id === promptId ? { ...p, folderId, updatedAt: Date.now() } : p
    );
    setLocalPrompts(updated);
    syncPromptsMutation.mutate(updated);
  }, [localPrompts, syncPromptsMutation]);

  const createFolder = useCallback((name: string, color: string) => {
    const newFolder: PromptFolder = {
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      color,
      createdAt: Date.now(),
    };
    const updated = [...localFolders, newFolder];
    setLocalFolders(updated);
    syncFoldersMutation.mutate(updated);
  }, [localFolders, syncFoldersMutation]);

  const renameFolder = useCallback((id: string, name: string) => {
    const updated = localFolders.map(f => f.id === id ? { ...f, name } : f);
    setLocalFolders(updated);
    syncFoldersMutation.mutate(updated);
  }, [localFolders, syncFoldersMutation]);

  const deleteFolder = useCallback((id: string) => {
    const updatedFolders = localFolders.filter(f => f.id !== id);
    setLocalFolders(updatedFolders);
    syncFoldersMutation.mutate(updatedFolders);

    const updatedPrompts = localPrompts.map(p =>
      p.folderId === id ? { ...p, folderId: undefined } : p
    );
    setLocalPrompts(updatedPrompts);
    syncPromptsMutation.mutate(updatedPrompts);
  }, [localFolders, localPrompts, syncFoldersMutation, syncPromptsMutation]);

  const clearAllData = useCallback(() => {
    setLocalPrompts([]);
    setLocalFolders([]);
    syncPromptsMutation.mutate([]);
    syncFoldersMutation.mutate([]);
  }, [syncPromptsMutation, syncFoldersMutation]);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      queryClient.setQueryData(['onboarding-status'], true);
    } catch (e) {
      console.log('[PromptContext] Failed to save onboarding status', e);
    }
  }, [queryClient]);

  const isLoading = promptsQuery.isLoading || foldersQuery.isLoading || onboardingQuery.isLoading;

  return {
    savedPrompts: localPrompts,
    folders: localFolders,
    currentInputs,
    searchQuery,
    hasSeenOnboarding,
    isLoading,
    setCurrentInputs,
    resetInputs,
    loadInputsFromPrompt,
    savePrompt,
    deletePrompt,
    toggleFavorite,
    moveToFolder,
    searchQuery_: searchQuery,
    setSearchQuery,
    createFolder,
    renameFolder,
    deleteFolder,
    clearAllData,
    completeOnboarding,
  };
});
