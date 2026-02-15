import React, { useMemo, useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Search, Trash2, Copy, Heart, Shuffle, Check, Bookmark,
  MessageSquare, Palette, Camera, Film, FolderPlus, Folder,
  X, ChevronRight, MoreHorizontal,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePromptStore } from '@/contexts/PromptContext';
import { SavedPrompt, DEFAULT_INPUTS, ModelType, PromptFolder } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const MODEL_COLORS: Record<ModelType, string> = {
  chatgpt: '#F59E0B',
  midjourney: '#8B5CF6',
  sdxl: '#06B6D4',
  video: '#EC4899',
};

const MODEL_ICONS: Record<ModelType, (s: number, c: string) => React.ReactNode> = {
  chatgpt: (s, c) => <MessageSquare size={s} color={c} />,
  midjourney: (s, c) => <Palette size={s} color={c} />,
  sdxl: (s, c) => <Camera size={s} color={c} />,
  video: (s, c) => <Film size={s} color={c} />,
};

const FOLDER_COLORS = ['#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#3B82F6', '#06B6D4', '#EF4444', '#14B8A6'];

type FilterTab = 'all' | 'favorites' | 'text' | 'image' | 'video';

const SavedContent = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const {
    savedPrompts, deletePrompt, toggleFavorite, setCurrentInputs,
    folders, createFolder, deleteFolder, moveToFolder,
  } = usePromptStore();

  const [localSearch, setLocalSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderColor, setSelectedFolderColor] = useState(FOLDER_COLORS[0]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePromptId, setMovePromptId] = useState<string | null>(null);

  const FILTER_TABS: { key: FilterTab; label: string }[] = useMemo(() => [
    { key: 'all', label: t.library.all },
    { key: 'favorites', label: t.library.favorites },
    { key: 'text', label: t.library.text },
    { key: 'image', label: t.library.image },
    { key: 'video', label: t.library.video },
  ], [t]);

  const filteredPrompts = useMemo(() => {
    let items = savedPrompts;

    if (selectedFolderId) {
      items = items.filter((p: SavedPrompt) => p.folderId === selectedFolderId);
    }

    if (activeFilter === 'favorites') items = items.filter((p: SavedPrompt) => p.isFavorite);
    else if (activeFilter === 'text') items = items.filter((p: SavedPrompt) => p.type === 'text');
    else if (activeFilter === 'image') items = items.filter((p: SavedPrompt) => p.type === 'image');
    else if (activeFilter === 'video') items = items.filter((p: SavedPrompt) => p.type === 'video');

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      items = items.filter((p: SavedPrompt) =>
        p.title.toLowerCase().includes(q) || p.tags.some((tag: string) => tag.toLowerCase().includes(q))
      );
    }
    return items;
  }, [savedPrompts, localSearch, activeFilter, selectedFolderId]);

  const handleCopy = useCallback(async (prompt: SavedPrompt) => {
    await Clipboard.setStringAsync(prompt.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const handleDelete = useCallback((prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t.library.deleteTitle,
      t.library.deleteMsg,
      [
        { text: t.library.cancel, style: 'cancel' },
        {
          text: t.library.delete,
          style: 'destructive',
          onPress: () => {
            deletePrompt(prompt.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [deletePrompt, t]);

  const handleRemix = useCallback((prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentInputs({ ...DEFAULT_INPUTS, ...prompt.inputs });
    router.navigate('/(tabs)/(builder)' as any);
  }, [setCurrentInputs, router]);

  const handlePromptPress = useCallback((item: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${item.id}` as any);
  }, [router]);

  const handleCreateFolder = useCallback(() => {
    if (newFolderName.trim().length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createFolder(newFolderName.trim(), selectedFolderColor);
    setNewFolderName('');
    setShowFolderModal(false);
  }, [newFolderName, selectedFolderColor, createFolder]);

  const handleDeleteFolder = useCallback((folder: PromptFolder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Folder',
      `Delete "${folder.name}"? Prompts inside will be moved to "All".`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteFolder(folder.id);
            if (selectedFolderId === folder.id) setSelectedFolderId(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [deleteFolder, selectedFolderId]);

  const handleMoveToFolder = useCallback((folderId: string | undefined) => {
    if (!movePromptId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    moveToFolder(movePromptId, folderId);
    setShowMoveModal(false);
    setMovePromptId(null);
  }, [movePromptId, moveToFolder]);

  const getTimeAgo = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }, []);

  const renderFolders = () => {
    if (folders.length === 0 && savedPrompts.length === 0) return null;

    return (
      <View style={styles.foldersSection}>
        <FlatList
          data={[{ id: '__all', name: 'All', color: isDark ? '#F59E0B' : '#64748B' } as PromptFolder, ...folders]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const isAll = item.id === '__all';
            const isActive = isAll ? !selectedFolderId : selectedFolderId === item.id;
            const count = isAll
              ? savedPrompts.length
              : savedPrompts.filter((p: SavedPrompt) => p.folderId === item.id).length;

            return (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFolderId(isAll ? null : item.id);
                }}
                onLongPress={() => {
                  if (!isAll) handleDeleteFolder(item);
                }}
                style={[
                  styles.folderChip,
                  { backgroundColor: isActive ? (isDark ? '#F59E0B' : '#0F172A') : colors.chipBg },
                ]}
              >
                <Folder size={14} color={isActive ? '#FFF' : colors.textTertiary} />
                <Text style={[
                  styles.folderChipText,
                  { color: colors.textSecondary },
                  isActive && { color: '#FFF', fontWeight: '700' as const },
                ]}>
                  {item.name}
                </Text>
                <View style={[styles.folderCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : colors.bgTertiary }]}>
                  <Text style={[styles.folderCountText, { color: isActive ? '#FFF' : colors.textTertiary }]}>{count}</Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFolderModal(true); }}
              style={[styles.addFolderBtn, { backgroundColor: colors.chipBg }]}
            >
              <FolderPlus size={16} color={colors.textTertiary} />
            </Pressable>
          }
        />
      </View>
    );
  };

  const renderPromptItem = useCallback(({ item }: { item: SavedPrompt }) => {
    const modelColor = MODEL_COLORS[item.model] ?? '#F59E0B';
    const isCopied = copiedId === item.id;
    const iconFn = MODEL_ICONS[item.model];

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
        testID={`saved-card-${item.id}`}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.modelIcon, { backgroundColor: `${modelColor}15` }]}>
              {iconFn ? iconFn(18, modelColor) : <MessageSquare size={18} color={modelColor} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <View style={[styles.modelBadge, { backgroundColor: `${modelColor}10` }]}>
                  <Text style={[styles.modelLabel, { color: modelColor }]}>{getModelLabel(item.model)}</Text>
                </View>
                <Text style={[styles.timeText, { color: colors.textTertiary }]}>{getTimeAgo(item.createdAt)}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => { toggleFavorite(item.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                size={20}
                color={item.isFavorite ? '#EC4899' : colors.textTertiary}
                fill={item.isFavorite ? '#EC4899' : 'transparent'}
              />
            </Pressable>
          </View>

          <Text style={[styles.promptPreview, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.finalPrompt}
          </Text>

          {item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.bgTertiary }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.cardActions, { borderTopColor: colors.separator }]}>
            <Pressable
              onPress={() => handleCopy(item)}
              style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }, isCopied && { backgroundColor: 'rgba(16,185,129,0.12)' }]}
            >
              {isCopied ? <Check size={14} color="#10B981" /> : <Copy size={14} color={colors.textSecondary} />}
              <Text style={[styles.actionText, { color: colors.textSecondary }, isCopied && { color: '#10B981' }]}>
                {isCopied ? t.create.copied : t.library.copy}
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={() => handleRemix(item)} style={[styles.actionBtn, { backgroundColor: colors.bgSecondary, paddingHorizontal: 10 }]}>
                <Shuffle size={14} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => { setMovePromptId(item.id); setShowMoveModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.actionBtn, { backgroundColor: colors.bgSecondary, paddingHorizontal: 10 }]}>
                <Folder size={14} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
                <Trash2 size={14} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [copiedId, handleCopy, handleDelete, handleRemix, handlePromptPress, toggleFavorite, getTimeAgo, colors, t, isDark]);

  const renderFilterTab = useCallback((tab: { key: FilterTab; label: string }) => {
    const isActive = activeFilter === tab.key;
    return (
      <Pressable
        onPress={() => { setActiveFilter(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        style={[
          styles.filterTab,
          { backgroundColor: isActive ? (isDark ? '#F59E0B' : '#0F172A') : colors.chipBg },
        ]}
      >
        <Text style={[
          styles.filterTabText,
          { color: colors.textSecondary },
          isActive && { color: '#FFFFFF' },
        ]}>
          {tab.label}
        </Text>
      </Pressable>
    );
  }, [activeFilter, isDark, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.library.title}</Text>
          {savedPrompts.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>{savedPrompts.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.searchBg, borderColor: colors.cardBorder }]}>
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            placeholder={t.library.searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={localSearch}
            onChangeText={setLocalSearch}
            testID="library-search-input"
          />
        </View>
      </View>

      {renderFolders()}

      <View style={styles.filterRow}>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => renderFilterTab(item)}
        />
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderPromptItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: colors.bgSecondary }]}>
              <Bookmark size={32} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {savedPrompts.length === 0 ? t.library.noPrompts : t.library.noResults}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              {savedPrompts.length === 0 ? t.library.noPromptsMsg : t.library.noResultsMsg}
            </Text>
          </View>
        }
      />

      <Modal visible={showFolderModal} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowFolderModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Folder</Text>
              <Pressable onPress={() => setShowFolderModal(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Folder name..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.folderInput, { color: colors.text, backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}
              autoFocus
            />
            <View style={styles.colorPicker}>
              {FOLDER_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => { setSelectedFolderColor(color); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[
                    styles.colorDot,
                    { backgroundColor: color },
                    selectedFolderColor === color && styles.colorDotActive,
                  ]}
                >
                  {selectedFolderColor === color && <Check size={14} color="#FFF" />}
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={handleCreateFolder}
              style={[styles.createFolderBtn, { backgroundColor: selectedFolderColor }]}
            >
              <Text style={styles.createFolderText}>Create Folder</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showMoveModal} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowMoveModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Move to Folder</Text>
              <Pressable onPress={() => setShowMoveModal(false)} hitSlop={8}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => handleMoveToFolder(undefined)}
              style={[styles.moveFolderOption, { borderBottomColor: colors.separator }]}
            >
              <Folder size={18} color={colors.textSecondary} />
              <Text style={[styles.moveFolderText, { color: colors.text }]}>No Folder</Text>
            </Pressable>
            {folders.map((folder: PromptFolder) => (
              <Pressable
                key={folder.id}
                onPress={() => {
                  moveToFolder(movePromptId, folder.id);
                  setShowMoveModal(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={[styles.moveFolderOption, { borderBottomColor: colors.separator }]}
              >
                <Folder size={18} color={folder.color} />
                <Text style={[styles.moveFolderText, { color: colors.text }]}>{folder.name}</Text>
                <ChevronRight size={16} color={colors.textTertiary} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                moveToFolder(movePromptId, null);
                setShowMoveModal(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              style={[styles.moveFolderOption, { borderBottomColor: colors.separator }]}
            >
              <X size={18} color={colors.textTertiary} />
              <Text style={[styles.moveFolderText, { color: colors.text }]}>{t.library.removeFromFolder}</Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function SavedScreen() {
  return (
    <ErrorBoundary fallbackTitle="Library Error">
      <SavedContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 13, fontWeight: '700' as const, color: '#FFF' },
  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  foldersSection: { marginBottom: 12 },
  folderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1.5,
  },
  folderChipText: { fontSize: 13, fontWeight: '600' as const },
  folderCount: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, marginLeft: 2 },
  folderCountText: { fontSize: 10, fontWeight: '700' as const },
  addFolderBtn: {
    width: 40, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: { marginBottom: 16 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  filterTabText: { fontSize: 13, fontWeight: '600' as const },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 14 },
  card: {
    borderRadius: 22, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3, borderWidth: 1,
  },
  cardBody: { padding: 16, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modelIcon: {
    width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, lineHeight: 21, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  modelLabel: { fontSize: 11, fontWeight: '700' as const },
  timeText: { fontSize: 11 },
  promptPreview: { fontSize: 13, lineHeight: 19 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '600' as const },
  cardActions: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 12, borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  actionText: { fontSize: 12, fontWeight: '600' as const },
  deleteBtn: { padding: 7, borderRadius: 10 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30,
  },
  modalContent: {
    width: '100%', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' as const },
  folderInput: {
    borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, marginBottom: 16,
  },
  colorPicker: {
    flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center',
  },
  colorDot: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  colorDotActive: {
    borderWidth: 3, borderColor: '#FFF',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  createFolderBtn: {
    height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  createFolderText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const },
  moveFolderOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  moveFolderText: { fontSize: 16, fontWeight: '500' as const, flex: 1 },
});
