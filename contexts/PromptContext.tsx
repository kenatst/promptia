import React, { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { SavedPrompt, PromptInputs, DEFAULT_INPUTS, PromptFolder, PromptResult } from '@/types/prompt';

const STORAGE_KEY = 'promptia-saved-prompts';
const FOLDERS_KEY = 'promptia-folders';
const ONBOARDING_KEY = 'promptia-onboarding-done';
const HISTORY_KEY = 'promptia-generation-history';
const MAX_HISTORY = 10;

export interface HistoryEntry {
  id: string;
  finalPrompt: string;
  model: string;
  objective: string;
  createdAt: number;
}

interface PromptState {
  savedPrompts: SavedPrompt[];
  folders: PromptFolder[];
  currentInputs: PromptInputs;
  searchQuery: string;
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  history: HistoryEntry[];
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
  addToHistory: (result: PromptResult, inputs: PromptInputs) => void;
  clearHistory: () => void;
}

export const [PromptProvider, usePromptStore] = createContextHook((): PromptState => {
  const queryClient = useQueryClient();
  const [currentInputs, setCurrentInputsState] = useState<PromptInputs>({ ...DEFAULT_INPUTS });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [localPrompts, setLocalPrompts] = useState<SavedPrompt[]>([]);
  const [localFolders, setLocalFolders] = useState<PromptFolder[]>([]);
  const [localHistory, setLocalHistory] = useState<HistoryEntry[]>([]);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(true);

  const promptsQuery = useQuery({
    queryKey: ['saved-prompts'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as SavedPrompt[]) : [];
      } catch {
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
      } catch {
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

  const historyQuery = useQuery({
    queryKey: ['generation-history'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(HISTORY_KEY);
        return stored ? (JSON.parse(stored) as HistoryEntry[]) : [];
      } catch {
        return [];
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

  useEffect(() => {
    if (historyQuery.data) setLocalHistory(historyQuery.data);
  }, [historyQuery.data]);

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

  const syncHistoryMutation = useMutation({
    mutationFn: async (history: HistoryEntry[]) => {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      return history;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['generation-history'], data);
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
    setLocalHistory([]);
    syncPromptsMutation.mutate([]);
    syncFoldersMutation.mutate([]);
    syncHistoryMutation.mutate([]);
  }, [syncPromptsMutation, syncFoldersMutation, syncHistoryMutation]);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      queryClient.setQueryData(['onboarding-status'], true);
    } catch {
      // Storage errors are non-fatal
    }
  }, [queryClient]);

  const addToHistory = useCallback((result: PromptResult, inputs: PromptInputs) => {
    const entry: HistoryEntry = {
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      finalPrompt: result.finalPrompt,
      model: inputs.model,
      objective: inputs.objective.slice(0, 80),
      createdAt: Date.now(),
    };
    const updated = [entry, ...localHistory].slice(0, MAX_HISTORY);
    setLocalHistory(updated);
    syncHistoryMutation.mutate(updated);
  }, [localHistory, syncHistoryMutation]);

  const clearHistory = useCallback(() => {
    setLocalHistory([]);
    syncHistoryMutation.mutate([]);
  }, [syncHistoryMutation]);

  const isLoading = promptsQuery.isLoading || foldersQuery.isLoading || onboardingQuery.isLoading;

  return {
    savedPrompts: localPrompts,
    folders: localFolders,
    currentInputs,
    searchQuery,
    hasSeenOnboarding,
    isLoading,
    history: localHistory,
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
    addToHistory,
    clearHistory,
  };
});
