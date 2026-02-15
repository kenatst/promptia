import React, { useMemo, useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  Search, Trash2, Copy, Heart, Shuffle, Check, Bookmark,
  MessageSquare, Palette, Camera, Film,
} from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { usePromptStore } from '@/store/promptStore';
import { SavedPrompt, DEFAULT_INPUTS, ModelType } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';

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

type FilterTab = 'all' | 'favorites' | 'text' | 'image' | 'video';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const { savedPrompts, deletePrompt, toggleFavorite, setCurrentInputs } = usePromptStore();
  const [localSearch, setLocalSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const FILTER_TABS: { key: FilterTab; label: string }[] = useMemo(() => [
    { key: 'all', label: t.library.all },
    { key: 'favorites', label: t.library.favorites },
    { key: 'text', label: t.library.text },
    { key: 'image', label: t.library.image },
    { key: 'video', label: t.library.video },
  ], [t]);

  const filteredPrompts = useMemo(() => {
    let items = savedPrompts;
    if (activeFilter === 'favorites') items = items.filter(p => p.isFavorite);
    else if (activeFilter === 'text') items = items.filter(p => p.type === 'text');
    else if (activeFilter === 'image') items = items.filter(p => p.type === 'image');
    else if (activeFilter === 'video') items = items.filter(p => p.type === 'video');

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      items = items.filter((p) =>
        p.title.toLowerCase().includes(q) || p.tags.some((tag) => tag.toLowerCase().includes(q))
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

  const handleOpenDetail = useCallback((prompt: SavedPrompt) => {
    router.push(`/prompt/${prompt.id}` as any);
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

  const renderItem = useCallback(({ item }: { item: SavedPrompt }) => {
    const modelColor = MODEL_COLORS[item.model] ?? '#F59E0B';
    const isCopied = copiedId === item.id;
    const iconFn = MODEL_ICONS[item.model];

    return (
      <Pressable
        onPress={() => handleOpenDetail(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={[styles.modelIcon, { backgroundColor: `${modelColor}15` }]}>
              {iconFn ? iconFn(18, modelColor) : <MessageSquare size={18} color={modelColor} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <View style={[styles.modelBadge, { backgroundColor: `${modelColor}12` }]}>
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
                <View key={tag} style={[styles.tag, { backgroundColor: `${modelColor}08` }]}>
                  <Text style={[styles.tagText, { color: modelColor }]}>#{tag}</Text>
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
            <Pressable onPress={() => handleRemix(item)} style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}>
              <Shuffle size={14} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.textSecondary }]}>{t.library.remix}</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => handleDelete(item)} style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}>
              <Trash2 size={14} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [copiedId, handleCopy, handleDelete, handleRemix, handleOpenDetail, toggleFavorite, getTimeAgo, colors, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.library.title}</Text>
          {savedPrompts.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.countText}>{savedPrompts.length}</Text>
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
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          data={FILTER_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item: tab }) => {
            const isActive = activeFilter === tab.key;
            return (
              <Pressable
                onPress={() => { setActiveFilter(tab.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.filterTab,
                  { backgroundColor: colors.chipBg },
                  isActive && { backgroundColor: isDark ? '#F59E0B' : '#111827' },
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
          }}
        />
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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
    </View>
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
});
