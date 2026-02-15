import React, { useMemo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Search, Trash2, Copy, Heart, Shuffle, Check } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { usePromptStore } from '@/store/promptStore';
import { SavedPrompt, DEFAULT_INPUTS } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
import { CREATION_CATEGORIES } from '@/data/gallerySeed';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedPrompts, deletePrompt, toggleFavorite, setCurrentInputs } = usePromptStore();
  const [localSearch, setLocalSearch] = React.useState('');
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const filteredPrompts = useMemo(() => {
    let items = savedPrompts;
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return items;
  }, [savedPrompts, localSearch]);

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
    setCurrentInputs({
      ...DEFAULT_INPUTS,
      ...prompt.inputs,
    });
    router.navigate('/(tabs)/(builder)' as any);
  }, [setCurrentInputs, router]);

  const handleOpenDetail = useCallback((prompt: SavedPrompt) => {
    router.push(`/prompt/${prompt.id}` as any);
  }, [router]);

  const getTimeAgo = useCallback((timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const renderItem = useCallback(({ item }: { item: SavedPrompt }) => {
    const category = CREATION_CATEGORIES.find(c => c.model === item.model) || CREATION_CATEGORIES[0];
    const isCopied = copiedId === item.id;

    return (
      <Pressable
        onPress={() => handleOpenDetail(item)}
        style={({ pressed }) => [
          styles.card,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.cardMeta}>
                <View style={[styles.modelPill, { backgroundColor: `${category.color}12` }]}>
                  <Text style={[styles.modelPillText, { color: category.color }]}>
                    {getModelLabel(item.model)}
                  </Text>
                </View>
                <Text style={styles.timeText}>{getTimeAgo(item.createdAt)}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            </View>
          </View>

          <Text style={styles.promptPreview} numberOfLines={2}>
            {item.finalPrompt}
          </Text>

          {item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.cardActions}>
            <Pressable
              onPress={() => handleCopy(item)}
              style={[styles.actionBtn, isCopied && { backgroundColor: Colors.tertiaryDim }]}
            >
              {isCopied ? <Check size={15} color={Colors.tertiary} /> : <Copy size={15} color="#6B7280" />}
              <Text style={[styles.actionText, isCopied && { color: Colors.tertiary }]}>
                {isCopied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>
            <Pressable onPress={() => handleRemix(item)} style={styles.actionBtn}>
              <Shuffle size={15} color="#6B7280" />
              <Text style={styles.actionText}>Remix</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                toggleFavorite(item.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.actionBtn}
            >
              <Heart
                size={15}
                color={item.isFavorite ? Colors.pink : '#6B7280'}
                fill={item.isFavorite ? Colors.pink : 'transparent'}
              />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
              <Trash2 size={15} color={Colors.danger} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }, [copiedId, handleCopy, handleDelete, handleRemix, handleOpenDetail, toggleFavorite, getTimeAgo]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#FAFAFA', '#FFFBF2']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Library</Text>
        {savedPrompts.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{savedPrompts.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search your prompts..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={localSearch}
            onChangeText={setLocalSearch}
          />
        </View>
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {savedPrompts.length === 0 ? 'No prompts yet' : 'No results'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {savedPrompts.length === 0
                ? 'Create your first prompt in the builder'
                : 'Try a different search term'}
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
    gap: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.8,
  },
  countBadge: {
    backgroundColor: '#111827',
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
    marginBottom: 20,
  },
  searchBar: {
    height: 48,
    borderRadius: 24,
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  cardContent: {
    padding: 16,
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  modelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modelPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#111827',
    lineHeight: 22,
  },
  promptPreview: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500' as const,
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
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#6B7280',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
