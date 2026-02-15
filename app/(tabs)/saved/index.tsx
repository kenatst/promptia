import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Bookmark, Search, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { CREATION_CATEGORIES, getCategoryById } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { Prompt, PromptCategory } from '@/types/prompt';
import { AnimatedChip } from '@/components/AnimatedChip';
import { GlassCard } from '@/components/GlassCard';
import { PromptCard } from '@/components/PromptCard';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    library,
    setLibrarySearchQuery,
    setLibraryCategoryFilter,
    removeFromLibrary,
    removeTagFromPrompt,
    prefillBuilderFromPrompt,
  } = usePromptStore();

  const filteredItems = useMemo(() => {
    let items = [...library.items];

    if (library.categoryFilter) {
      items = items.filter((p) => p.category === library.categoryFilter);
    }

    if (library.searchQuery.trim()) {
      const q = library.searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.fullPrompt.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }, [library.categoryFilter, library.items, library.searchQuery]);

  const availableCategories = useMemo(() => {
    const cats = new Set(library.items.map((p) => p.category));
    return CREATION_CATEGORIES.filter((c) => cats.has(c.id));
  }, [library.items]);

  const handlePromptPress = useCallback(
    (prompt: Prompt) => {
      router.push(`/prompt/${prompt.id}`);
    },
    [router]
  );

  const handleCopy = useCallback(async (prompt: Prompt) => {
    await Clipboard.setStringAsync(prompt.fullPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleEdit = useCallback(
    (prompt: Prompt) => {
      prefillBuilderFromPrompt(prompt);
      router.push('/(tabs)/(builder)');
    },
    [prefillBuilderFromPrompt, router]
  );

  const confirmDelete = useCallback(
    (prompt: Prompt) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      removeFromLibrary(prompt.id);
    },
    [removeFromLibrary]
  );

  const handleRemoveTag = useCallback(
    (prompt: Prompt, tag: string) => {
      removeTagFromPrompt(prompt.id, tag);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [removeTagFromPrompt]
  );

  const clearSearch = useCallback(() => {
    setLibrarySearchQuery('');
  }, [setLibrarySearchQuery]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientMid, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[Colors.atmospherePurple, 'rgba(11,10,26,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.atmosphereGlow}
      />

      <View style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>📚 Library</Text>
          {library.items.length > 0 ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{library.items.length}</Text>
            </View>
          ) : null}
        </View>

        {library.items.length > 0 ? (
          <>
            <View style={styles.searchWrap}>
              <Search size={17} color="rgba(130, 90, 255, 0.50)" />
              <TextInput
                value={library.searchQuery}
                onChangeText={setLibrarySearchQuery}
                placeholder="Search library..."
                placeholderTextColor={Colors.textTertiary}
                style={styles.searchInput}
              />
              {library.searchQuery.length > 0 ? (
                <Pressable onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={16} color={Colors.textTertiary} />
                </Pressable>
              ) : null}
            </View>

            {availableCategories.length > 1 ? (
              <FlatList
                data={[null, ...availableCategories.map((c) => c.id)]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item ?? 'all'}
                contentContainerStyle={styles.filterRow}
                renderItem={({ item }) => (
                  <AnimatedChip
                    label={item ? getCategoryById(item).label : 'All'}
                    selected={library.categoryFilter === item}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setLibraryCategoryFilter(item as PromptCategory | null);
                    }}
                    accentColor={Colors.accent}
                  />
                )}
              />
            ) : null}
          </>
        ) : null}
      </View>

      {library.items.length === 0 ? (
        <View style={styles.emptyState}>
          <GlassCard style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Bookmark size={36} color="rgba(130, 90, 255, 0.40)" />
            </View>
            <Text style={styles.emptyTitle}>Your library is empty</Text>
            <Text style={styles.emptySubtitle}>
              Create prompts in the Builder or save them from the Gallery. They'll appear here for easy access.
            </Text>
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
              <Swipeable
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable onPress={() => confirmDelete(item)} style={styles.deleteSwipe}>
                    <Trash2 size={18} color="#fff" />
                    <Text style={styles.deleteSwipeText}>Delete</Text>
                  </Pressable>
                )}
              >
                <PromptCard
                  prompt={item}
                  variant="library"
                  onPress={handlePromptPress}
                  onCopy={handleCopy}
                  onEdit={handleEdit}
                  onDelete={confirmDelete}
                  onRemoveTag={handleRemoveTag}
                />
              </Swipeable>
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No matching prompts</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  atmosphereGlow: {
    position: 'absolute',
    top: 0,
    left: -80,
    right: -80,
    height: 300,
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(130, 90, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(130, 90, 255, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filterRow: {
    gap: 8,
    paddingRight: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(130, 90, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(130, 90, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.50)',
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteSwipe: {
    backgroundColor: Colors.danger,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginLeft: 10,
    gap: 4,
  },
  deleteSwipeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  noResults: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  noResultsText: {
    color: Colors.textTertiary,
    fontSize: 14,
  },
});
