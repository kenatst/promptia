import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
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

// Pastel backgrounds as seen in screenshot: pinkish for Reverse Prompt, greenish for Design, purplish for text.
// We map these to the models.
const MODEL_THEMES: Record<ModelType, { bg: string, iconColor: string, badgeText: string }> = {
  chatgpt: { bg: '#F2EFFF', iconColor: '#8B6FC0', badgeText: '#E8795A' }, // Purplish bg
  midjourney: { bg: '#FFF0ED', iconColor: '#8B6FC0', badgeText: '#8B6FC0' }, // Pink / Peach bg
  sdxl: { bg: '#F0FAF6', iconColor: '#34A77B', badgeText: '#34A77B' }, // Greenish bg
  video: { bg: '#FFF3E8', iconColor: '#E06B8B', badgeText: '#E06B8B' },
};

const MODEL_ICONS: Record<ModelType, (s: number, c: string) => React.ReactNode> = {
  chatgpt: (s, c) => <MessageSquare size={s} color={c} />,
  midjourney: (s, c) => <Palette size={s} color={c} />,
  sdxl: (s, c) => <Camera size={s} color={c} />,
  video: (s, c) => <Film size={s} color={c} />,
};

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

  // Folder modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movePromptId, setMovePromptId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(localSearch), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localSearch]);

  const FILTER_TABS: { key: FilterTab; label: string }[] = useMemo(() => [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'text', label: 'Text' },
    { key: 'image', label: 'Image' },
    { key: 'video', label: 'Video' },
  ], []);

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
    } catch { }
  }, []);

  const handleDelete = useCallback((prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Delete Prompt', 'Are you sure you want to delete this?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePrompt(prompt.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } },
    ]);
  }, [deletePrompt]);

  const handleRemix = useCallback((prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentInputs({ ...DEFAULT_INPUTS, ...prompt.inputs });
    router.navigate('/(tabs)/(builder)' as any);
  }, [setCurrentInputs, router]);

  const handlePromptPress = useCallback((item: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${item.id}` as any);
  }, [router]);

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

  // Use screenshot's alternating pastel colors depending on index or model to ensure it looks like the design.
  const getCardTheme = (model: ModelType, index: number) => {
    if (isDark) {
      return { bg: colors.card, iconColor: '#FFF', badgeText: '#AAA' };
    }
    // Screenshot has: Pink, Green, Purple
    const backgrounds = ['#FEF0EE', '#F2FCF7', '#F3EFFF'];
    const bgs = backgrounds[index % backgrounds.length];
    const theme = MODEL_THEMES[model] || MODEL_THEMES.chatgpt;
    return { bg: bgs, iconColor: theme.iconColor, badgeText: theme.badgeText };
  };

  const renderFolders = () => {
    return (
      <View style={styles.foldersAndFiltersContainer}>
        <View style={styles.foldersRow}>
          {/* "All" Folder Badge (Dark pill) from screenshot */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedFolderId(null); }}
            style={[
              styles.folderChip,
              !selectedFolderId ? styles.folderChipActive : { backgroundColor: colors.chipBg }
            ]}
          >
            <Folder size={16} color={!selectedFolderId ? '#FFF' : colors.textTertiary} />
            <Text style={[
              styles.folderChipText,
              !selectedFolderId ? { color: '#FFF' } : { color: colors.textSecondary }
            ]}>All</Text>
            <View style={styles.folderCountBadgeActive}>
              <Text style={styles.folderCountTextActive}>{savedPrompts.length}</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowFolderModal(true); }}
            style={[styles.addFolderBtn, { backgroundColor: colors.chipBg }]}
          >
            <FolderPlus size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        {/* Categories / Filters row */}
        <View style={styles.filterRow}>
          <FlatList
            data={FILTER_TABS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.key}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
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
      </View>
    );
  };

  const renderPromptItem = useCallback(({ item, index }: { item: SavedPrompt; index: number }) => {
    const theme = getCardTheme(item.model, index);
    const isCopied = copiedId === item.id;
    const iconFn = MODEL_ICONS[item.model];

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          { backgroundColor: theme.bg },
          isDark && { borderColor: colors.cardBorder, borderWidth: 1 },
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            {iconFn ? iconFn(20, theme.iconColor) : <MessageSquare size={20} color={theme.iconColor} />}
          </View>
          <View style={styles.titleContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <View style={styles.metaContainer}>
              <View style={styles.modelBadgePill}>
                <Text style={[styles.modelBadgeText, { color: theme.badgeText }]}>
                  {getModelLabel(item.model)}
                </Text>
              </View>
              <Text style={styles.timeAgoText}>{getTimeAgo(item.createdAt)}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => { toggleFavorite(item.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            hitSlop={12}
            style={styles.heartButton}
          >
            <Heart
              size={22}
              color={item.isFavorite ? '#E06B8B' : '#9CA3AF'}
              fill={item.isFavorite ? '#E06B8B' : 'transparent'}
            />
          </Pressable>
        </View>

        <Text style={[styles.promptBodyText, { color: '#4B5563' }]} numberOfLines={3}>
          {item.finalPrompt}
        </Text>

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagPillText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Pressable
            onPress={() => handleCopy(item)}
            style={[styles.actionButton, styles.copyButton, isCopied && styles.actionButtonActive]}
          >
            {isCopied ? <Check size={16} color="#34A77B" /> : <Copy size={16} color="#6B7280" />}
            <Text style={[styles.actionButtonText, isCopied && { color: '#34A77B' }]}>
              {isCopied ? 'Copied' : 'Copy'}
            </Text>
          </Pressable>

          <View style={styles.actionIconGroup}>
            <Pressable onPress={() => handleRemix(item)} style={styles.actionIconButton}>
              <Shuffle size={16} color="#6B7280" />
            </Pressable>
            <Pressable
              onPress={() => { setMovePromptId(item.id); setShowMoveModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={styles.actionIconButton}>
              <Folder size={16} color="#6B7280" />
            </Pressable>
            <Pressable onPress={() => handleShare(item)} style={styles.actionIconButton}>
              <Share2 size={16} color="#6B7280" />
            </Pressable>
            <Pressable onPress={() => handleDelete(item)} style={styles.deleteIconButton}>
              <Trash2 size={16} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [copiedId, activeFilter, isDark, toggleFavorite, handleCopy, handleRemix, handleDelete, handlePromptPress, handleShare]);

  return (
    <View style={[styles.container, { backgroundColor: '#FAFAFA' }]}>
      <View style={[styles.topHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.mainHeading, { color: colors.text }]}>Library</Text>
          {savedPrompts.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{savedPrompts.length}</Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => { setShowSearch(!showSearch); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={styles.searchButtonCircle}
        >
          {showSearch ? <X size={20} color="#6B7280" /> : <Search size={20} color="#6B7280" />}
        </Pressable>
      </View>

      {showSearch && (
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              placeholder="Search library..."
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={localSearch}
              onChangeText={setLocalSearch}
              autoFocus
            />
          </View>
        </View>
      )}

      {renderFolders()}

      {isLoading ? (
        <SkeletonList count={4} />
      ) : null}

      <FlatList
        data={isLoading ? [] : filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderPromptItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoading ? null : (
          <View style={styles.emptyStateContainer}>
            <View style={[styles.emptyStateIcon, { backgroundColor: isDark ? colors.bgSecondary : '#FFF0ED' }]}>
              <Bookmark size={36} color="#E8795A" />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              {savedPrompts.length === 0 ? "No prompts yet" : "No matching prompts"}
            </Text>
            <Text style={[styles.emptyStateDesc, { color: colors.textTertiary }]}>
              {savedPrompts.length === 0 ? "Your saved and generated prompts will appear here." : "Try adjusting your search or filters."}
            </Text>
          </View>
        )}
      />

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
              onPress={() => { moveToFolder(movePromptId || '', null); setShowMoveModal(false); }}
              style={[styles.moveFolderOption, { borderBottomColor: colors.separator }]}
            >
              <Folder size={18} color={colors.textSecondary} />
              <Text style={[styles.moveFolderText, { color: colors.text }]}>No Folder</Text>
            </Pressable>
            {folders.map((folder: PromptFolder) => (
              <Pressable
                key={folder.id}
                onPress={() => {
                  moveToFolder(movePromptId || '', folder.id);
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mainHeading: {
    fontSize: 34,
    fontFamily: 'Inter_900Black',
    letterSpacing: -1,
  },
  headerBadge: {
    backgroundColor: '#FFF0ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#FF6B4A',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  searchButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchSection: { paddingHorizontal: 24, marginBottom: 16 },
  searchBar: {
    height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_500Medium' },

  foldersAndFiltersContainer: {
    marginBottom: 16,
  },
  foldersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  folderChipActive: {
    backgroundColor: '#1E1E1E',
  },
  folderChipText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  folderCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  folderCountTextActive: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  addFolderBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterRow: {
    marginBottom: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterTabText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 130, // To account for floating tab bar
    gap: 16,
  },
  card: {
    borderRadius: 32,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  titleContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modelBadgePill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modelBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  timeAgoText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
  },
  heartButton: {
    paddingLeft: 12,
    paddingTop: 4,
  },

  promptBodyText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    marginBottom: 12,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagPill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagPillText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter_600SemiBold',
  },

  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(52, 167, 123, 0.1)',
  },
  copyButton: {
    // shadowColor: '#000',
    // shadowOpacity: 0.02,
    // shadowRadius: 4,
    // shadowOffset: { width: 0, height: 2 },
  },
  actionButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'Inter_600SemiBold',
  },
  actionIconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyStateContainer: { alignItems: 'center', marginTop: 80, gap: 16 },
  emptyStateIcon: {
    width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  emptyStateTitle: { fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  emptyStateDesc: { fontSize: 16, fontFamily: 'Inter_500Medium', textAlign: 'center', paddingHorizontal: 40, lineHeight: 24 },

  modalOverlay: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 50,
    backgroundColor: '#FFF',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  moveFolderOption: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 16, borderBottomWidth: 1,
  },
  moveFolderText: { fontSize: 17, fontFamily: 'Inter_500Medium', flex: 1 },
});
