import React, { useMemo, useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Search,
  Trash2,
  Copy,
  Heart,
  Shuffle,
  Check,
  Bookmark,
  Filter,
  MessageSquare,
  Code,
  PenTool,
  Palette,
  Camera,
  Film,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { usePromptStore } from '@/store/promptStore';
import { SavedPrompt, DEFAULT_INPUTS, ModelType } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
import { CREATION_CATEGORIES } from '@/data/gallerySeed';

const MODEL_COLORS: Record<ModelType, string> = {
  chatgpt: Colors.accent,
  midjourney: Colors.secondary,
  sdxl: Colors.cyan,
  video: Colors.pink,
};

const MODEL_ICONS: Record<ModelType, (size: number, color: string) => React.ReactNode> = {
  chatgpt: (s, c) => <MessageSquare size={s} color={c} />,
  midjourney: (s, c) => <Palette size={s} color={c} />,
  sdxl: (s, c) => <Camera size={s} color={c} />,
  video: (s, c) => <Film size={s} color={c} />,
};

type FilterTab = 'all' | 'favorites' | 'text' | 'image' | 'video';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'text', label: 'Text' },
  { key: 'image', label: 'Image' },
  { key: 'video', label: 'Video' },
];

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedPrompts, deletePrompt, toggleFavorite, setCurrentInputs } = usePromptStore();
  const [localSearch, setLocalSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filteredPrompts = useMemo(() => {
    let items = savedPrompts;

    if (activeFilter === 'favorites') {
      items = items.filter(p => p.isFavorite);
    } else if (activeFilter === 'text') {
      items = items.filter(p => p.type === 'text');
    } else if (activeFilter === 'image') {
      items = items.filter(p => p.type === 'image');
    } else if (activeFilter === 'video') {
      items = items.filter(p => p.type === 'video');
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return items;
  }, [savedPrompts, localSearch, activeFilter]);

  const handleCopy = useCallback(async (prompt: SavedPrompt) => {
    await Clipboard.setStringAsync(prompt.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const handleDelete = useCallback((prompt: SavedPrompt) => {
    Alert.alert(
      'Delete Prompt',
      `Are you sure you want to delete "${prompt.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePrompt(prompt.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }, [deletePrompt]);

  const handleRemix = useCallback((prompt: SavedPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentInputs({ ...DEFAULT_INPUTS, ...prompt.inputs });
    router.navigate('/(tabs)/(builder)' as any);
  }, [setCurrentInputs, router]);

  const handleOpenDetail = useCallback((prompt: SavedPrompt) => {
    router.push(`/prompt/${prompt.id}` as any);
  }, [router]);

  const getTimeAgo = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const renderItem = useCallback(({ item }: { item: SavedPrompt }) => {
    const modelColor = MODEL_COLORS[item.model] ?? Colors.accent;
    const isCopied = copiedId === item.id;
    const iconFn = MODEL_ICONS[item.model];

    return (
      <Pressable
        onPress={() => handleOpenDetail(item)}
        style={({ pressed }) => [
          styles.card,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={[styles.cardAccent, { backgroundColor: modelColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.modelIcon, { backgroundColor: `${modelColor}15` }]}>
              {iconFn ? iconFn(16, modelColor) : <MessageSquare size={16} color={modelColor} />}
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.cardMeta}>
                <Text style={[styles.modelLabel, { color: modelColor }]}>
                  {getModelLabel(item.model)}
                </Text>
                <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            </View>
            <Pressable
              onPress={() => {
                toggleFavorite(item.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                size={20}
                color={item.isFavorite ? Colors.pink : '#D1D5DB'}
                fill={item.isFavorite ? Colors.pink : 'transparent'}
              />
            </Pressable>
          </View>

          <Text style={styles.promptPreview} numberOfLines={2}>
            {item.finalPrompt}
          </Text>

          {item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: `${modelColor}08` }]}>
                  <Text style={[styles.tagText, { color: modelColor }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardActions}>
            <Pressable
              onPress={() => handleCopy(item)}
              style={[styles.actionBtn, isCopied && { backgroundColor: Colors.tertiaryDim }]}
            >
              {isCopied ? <Check size={14} color={Colors.tertiary} /> : <Copy size={14} color="#6B7280" />}
              <Text style={[styles.actionText, isCopied && { color: Colors.tertiary }]}>
                {isCopied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
            <Pressable onPress={() => handleRemix(item)} style={styles.actionBtn}>
              <Shuffle size={14} color="#6B7280" />
              <Text style={styles.actionText}>Remix</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
              <Trash2 size={14} color={Colors.danger} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [copiedId, handleCopy, handleDelete, handleRemix, handleOpenDetail, toggleFavorite, getTimeAgo]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FAFAFA', '#F5F0FF', '#FFF8EE']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Library</Text>
          {savedPrompts.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{savedPrompts.length}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search your prompts..."
            placeholderTextColor="#B0B5BE"
            style={styles.searchInput}
            value={localSearch}
            onChangeText={setLocalSearch}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => {
                setActiveFilter(tab.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Bookmark size={32} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
              {savedPrompts.length === 0 ? 'No prompts yet' : 'No results'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {savedPrompts.length === 0
                ? 'Create your first prompt and it will appear here'
                : 'Try a different search term or filter'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.8,
  },
  countBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#111827',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardAccent: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modelIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  timeText: {
    fontSize: 11,
    color: '#B0B5BE',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#111827',
    lineHeight: 21,
  },
  promptPreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: Colors.dangerDim,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 10,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#4B5563',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
