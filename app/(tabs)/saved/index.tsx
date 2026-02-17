import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  Share,
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
  X, ChevronRight, Share2,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePromptStore } from '@/contexts/PromptContext';
import { SavedPrompt, DEFAULT_INPUTS, ModelType, PromptFolder } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';
import { SkeletonList } from '@/components/SkeletonLoader';

const MODEL_COLORS: Record<ModelType, string> = {
  chatgpt: '#E8795A',
  midjourney: '#8B6FC0',
  sdxl: '#3B9EC4',
  video: '#E06B8B',
};

const MODEL_ICONS: Record<ModelType, (s: number, c: string) => React.ReactNode> = {
  chatgpt: (s, c) => <MessageSquare size={s} color={c} />,
  midjourney: (s, c) => <Palette size={s} color={c} />,
  sdxl: (s, c) => <Camera size={s} color={c} />,
  video: (s, c) => <Film size={s} color={c} />,
};

const CARD_BGS = ['#FFF0ED', '#F0FAF6', '#F4F0FF', '#EFF6FF', '#FFF3E8', '#FFFBE8'];
const FOLDER_COLORS = ['#E8795A', '#8B6FC0', '#34A77B', '#E06B8B', '#4A8FE7', '#3B9EC4', '#DC4B4B', '#2BA8A0'];

type FilterTab = 'all' | 'favorites' | 'text' | 'image' | 'video';

const SavedContent = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const toast = useToast();
  const {
    savedPrompts, deletePrompt, toggleFavorite, setCurrentInputs,
    folders, createFolder, deleteFolder, moveToFolder, isLoading,
  } = usePromptStore();

  const [localSearch, setLocalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolderColor, setSelectedFolderColor] = useState(FOLDER_COLORS[0]);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePromptId, setMovePromptId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(localSearch), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localSearch]);

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
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter((p: SavedPrompt) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((tag: string) => tag.toLowerCase().includes(q)) ||
        p.finalPrompt.toLowerCase().includes(q)
      );
    }
    return items;
  }, [savedPrompts, debouncedSearch, activeFilter, selectedFolderId]);

  const handleCopy = useCallback(async (prompt: SavedPrompt) => {
    await Clipboard.setStringAsync(prompt.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(prompt.id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 1500);
  }, [toast]);

  const handleShare = useCallback(async (prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const deepLink = `promptia://prompt/${prompt.id}`;
      await Share.share({
        message: `${prompt.finalPrompt}\n\n— via Promptia\n${deepLink}`,
        title: prompt.title,
      });
    } catch {
      // User cancelled
    }
  }, []);

  const handleDelete = useCallback((prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t.library.deleteTitle, t.library.deleteMsg, [
      { text: t.library.cancel, style: 'cancel' },
      { text: t.library.delete, style: 'destructive', onPress: () => { deletePrompt(prompt.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
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
    Alert.alert('Delete Folder', `Delete "${folder.name}"? Prompts inside will be moved to "All".`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteFolder(folder.id); if (selectedFolderId === folder.id) setSelectedFolderId(null); } },
    ]);
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
          data={[{ id: '__all', name: 'All', color: '#E8795A' } as PromptFolder, ...folders]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          renderItem={({ item }: { item: PromptFolder }) => {
            const isAll = item.id === '__all';
            const isActive = isAll ? !selectedFolderId : selectedFolderId === item.id;
            const count = isAll ? savedPrompts.length : savedPrompts.filter((p: SavedPrompt) => p.folderId === item.id).length;
            return (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedFolderId(isAll ? null : item.id); }}
                onLongPress={() => { if (!isAll) handleDeleteFolder(item); }}
                style={[
                  styles.folderChip,
                  { backgroundColor: isActive ? (isDark ? '#E8795A' : '#1A1A1A') : colors.chipBg },
                ]}
              >
                <Folder size={14} color={isActive ? '#FFF' : colors.textTertiary} />
                <Text style={[styles.folderChipText, { color: colors.textSecondary }, isActive && { color: '#FFF', fontWeight: '700' as const }]}>
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

  const renderPromptItem = useCallback(({ item, index }: { item: SavedPrompt; index: number }) => {
    const modelColor = MODEL_COLORS[item.model] ?? '#E8795A';
    const isCopied = copiedId === item.id;
    const iconFn = MODEL_ICONS[item.model];
    const cardBg = isDark ? colors.card : CARD_BGS[index % CARD_BGS.length];

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          { backgroundColor: cardBg },
          isDark && { borderColor: colors.cardBorder, borderWidth: 1 },
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.95 },
        ]}
        testID={`saved-card-${item.id}`}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.modelIcon, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
              {iconFn ? iconFn(18, modelColor) : <MessageSquare size={18} color={modelColor} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <View style={[styles.modelBadge, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
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
                color={item.isFavorite ? '#E06B8B' : colors.textTertiary}
                fill={item.isFavorite ? '#E06B8B' : 'transparent'}
              />
            </Pressable>
          </View>

          <Text style={[styles.promptPreview, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.finalPrompt}
          </Text>

          {item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={[styles.cardActions, { borderTopColor: isDark ? colors.separator : 'rgba(0,0,0,0.04)' }]}>
            <Pressable
              onPress={() => handleCopy(item)}
              style={[styles.actionBtn, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }, isCopied && { backgroundColor: 'rgba(52,167,123,0.12)' }]}
            >
              {isCopied ? <Check size={14} color="#34A77B" /> : <Copy size={14} color={colors.textSecondary} />}
              <Text style={[styles.actionText, { color: colors.textSecondary }, isCopied && { color: '#34A77B' }]}>
                {isCopied ? t.create.copied : t.library.copy}
              </Text>
            </Pressable>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable onPress={() => handleRemix(item)} style={[styles.actionBtn, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF', paddingHorizontal: 10 }]}>
                <Shuffle size={14} color={colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => { setMovePromptId(item.id); setShowMoveModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.actionBtn, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF', paddingHorizontal: 10 }]}>
                <Folder size={14} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleShare(item)} style={[styles.actionBtn, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF', paddingHorizontal: 10 }]} accessibilityLabel="Share prompt">
                <Share2 size={14} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => handleDelete(item)} style={[styles.deleteBtn, { backgroundColor: isDark ? 'rgba(220,75,75,0.12)' : 'rgba(220,75,75,0.08)' }]}>
                <Trash2 size={14} color="#DC4B4B" />
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [copiedId, handleCopy, handleShare, handleDelete, handleRemix, handlePromptPress, toggleFavorite, getTimeAgo, colors, t, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{t.library.title}</Text>
          {savedPrompts.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: isDark ? colors.coralDim : '#FFF0ED' }]}>
              <Text style={[styles.countText, { color: '#E8795A' }]}>{savedPrompts.length}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => { setShowSearch(!showSearch); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={[styles.searchToggle, { backgroundColor: showSearch ? colors.coral : colors.chipBg }]}
        >
          {showSearch ? <X size={18} color="#FFF" /> : <Search size={18} color={colors.textSecondary} />}
        </Pressable>
      </View>

      {showSearch && (
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
            <Search size={16} color={colors.textTertiary} />
            <TextInput
              placeholder={t.library.searchPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={localSearch}
              onChangeText={setLocalSearch}
              autoFocus
              testID="library-search-input"
            />
          </View>
        </View>
      )}

      {renderFolders()}

      <View style={styles.filterRow}>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          renderItem={({ item: tab }) => {
            const isActive = activeFilter === tab.key;
            return (
              <Pressable
                onPress={() => { setActiveFilter(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.filterTab,
                  { backgroundColor: isActive ? (isDark ? '#E8795A' : '#1A1A1A') : colors.chipBg },
                ]}
              >
                <Text style={[styles.filterTabText, { color: colors.textSecondary }, isActive && { color: '#FFFFFF' }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : null}

      <FlatList
        data={isLoading ? [] : filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderPromptItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoading ? null : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? colors.bgSecondary : '#FFF0ED' }]}>
              <Bookmark size={32} color="#E8795A" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {savedPrompts.length === 0 ? t.library.noPrompts : t.library.noResults}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
              {savedPrompts.length === 0 ? t.library.noPromptsMsg : t.library.noResultsMsg}
            </Text>
          </View>
        )}
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
              style={[styles.folderInput, { color: colors.text, backgroundColor: colors.bgSecondary }]}
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
};

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
    paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 13, fontWeight: '700' as const },
  searchToggle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  searchSection: { paddingHorizontal: 24, marginBottom: 14 },
  searchBar: {
    height: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' as const },
  foldersSection: { marginBottom: 12 },
  folderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
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
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
  },
  filterTabText: { fontSize: 13, fontWeight: '600' as const },
  listContent: { paddingHorizontal: 24, paddingBottom: 120, gap: 14 },
  card: {
    borderRadius: 24, overflow: 'hidden',
  },
  cardBody: { padding: 18, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modelIcon: {
    width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, lineHeight: 21, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modelLabel: { fontSize: 11, fontWeight: '700' as const },
  timeText: { fontSize: 11 },
  promptPreview: { fontSize: 13, lineHeight: 19 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '600' as const },
  cardActions: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 12, borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
  },
  actionText: { fontSize: 12, fontWeight: '600' as const },
  deleteBtn: { padding: 7, borderRadius: 12 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30,
  },
  modalContent: {
    width: '100%', borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, elevation: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' as const },
  folderInput: {
    borderRadius: 16, padding: 14, fontSize: 15, marginBottom: 16,
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
    height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  createFolderText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const },
  moveFolderOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1,
  },
  moveFolderText: { fontSize: 16, fontWeight: '500' as const, flex: 1 },
});
