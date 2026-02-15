import React, { useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import { BookText, Search, Trash2, X } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { AnimatedChip } from '@/components/AnimatedChip';
import { GlassCard } from '@/components/GlassCard';
import { GlowButton } from '@/components/GlowButton';
import { PromptCard } from '@/components/PromptCard';
import { CREATION_CATEGORIES } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { Prompt, PromptCategory, SavedPrompt } from '@/types/prompt';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    library,
    setLibrarySearchQuery,
    setLibraryCategoryFilter,
    deleteSavedPrompt,
    prefillBuilderFromPrompt,
    removeTagFromSavedPrompt,
  } = usePromptStore();

  const filteredPrompts = useMemo(() => {
    let list = library.items;

    if (library.categoryFilter !== 'all') {
      list = list.filter((item) => item.category === library.categoryFilter);
    }

    const query = library.searchQuery.trim().toLowerCase();
    if (!query) {
      return list;
    }

    return list.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        item.fullPrompt.toLowerCase().includes(query)
      );
    });
  }, [library.categoryFilter, library.items, library.searchQuery]);

  const handleOpenDetail = useCallback(
    (prompt: Prompt) => {
      router.push(`/prompt/${prompt.id}`);
    },
    [router]
  );

  const handleCopy = useCallback(async (prompt: Prompt) => {
    await Clipboard.setStringAsync(prompt.fullPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Prompt copied to clipboard.');
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
      Alert.alert('Delete prompt?', prompt.title, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSavedPrompt(prompt.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]);
    },
    [deleteSavedPrompt]
  );

  const handleRemoveTag = useCallback((prompt: Prompt, tag: string) => {
    removeTagFromSavedPrompt(prompt.id, tag);
  }, [removeTagFromSavedPrompt]);

  const renderItem = useCallback(
    ({ item }: { item: SavedPrompt }) => {
      return (
        <Swipeable
          overshootRight={false}
          renderRightActions={() => (
            <Pressable
              onPress={() => confirmDelete(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.deleteSwipe}
            >
              <Trash2 size={18} color="#fff" />
              <Text style={styles.deleteSwipeText}>Delete</Text>
            </Pressable>
          )}
        >
          <PromptCard
            prompt={item}
            variant="library"
            onPress={handleOpenDetail}
            onCopy={handleCopy}
            onEdit={handleEdit}
            onDelete={confirmDelete}
            onRemoveTag={handleRemoveTag}
          />
        </Swipeable>
      );
    },
    [confirmDelete, handleCopy, handleEdit, handleOpenDetail, handleRemoveTag]
  );

  const filters = useMemo(() => ['all', ...CREATION_CATEGORIES.map((item) => item.id)] as const, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundGradientMid, Colors.background]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${Colors.accent}12`, 'rgba(8,8,8,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Library</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{library.items.length}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Search size={17} color={Colors.textTertiary} />
          <TextInput
            value={library.searchQuery}
            onChangeText={setLibrarySearchQuery}
            placeholder="Search saved prompts"
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
          />
          {library.searchQuery.length > 0 ? (
            <Pressable onPress={() => setLibrarySearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={16} color={Colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={filters}
          keyExtractor={(item) => item}
          horizontal
          windowSize={5}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const selected = library.categoryFilter === item;
            const label = item === 'all' ? 'All' : CREATION_CATEGORIES.find((category) => category.id === item)?.label ?? item;
            const accent = item === 'all' ? Colors.accent : CREATION_CATEGORIES.find((category) => category.id === item)?.accentColor ?? Colors.accent;
            return (
              <AnimatedChip
                label={label}
                selected={selected}
                onPress={() => setLibraryCategoryFilter(item as 'all' | PromptCategory)}
                accentColor={accent}
              />
            );
          }}
        />
      </View>

      {filteredPrompts.length === 0 ? (
        <View style={[styles.emptyWrap, { paddingBottom: insets.bottom + 120 }]}> 
          <GlassCard style={styles.emptyCard}>
            <BookText size={48} color="rgba(255,255,255,0.30)" />
            <Text style={styles.emptyTitle}>No prompts yet</Text>
            <Text style={styles.emptySubtitle}>Build your first god-tier prompt</Text>
            <GlowButton title="Start Building →" onPress={() => router.push('/(tabs)/(builder)')} />
          </GlassCard>
        </View>
      ) : (
        <FlatList
          data={filteredPrompts}
          keyExtractor={(item) => item.id}
          windowSize={5}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 206,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
  glow: {
    position: 'absolute',
    top: 0,
    left: -80,
    right: -80,
    height: 320,
  },
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(8,8,8,0.86)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 31,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  searchWrap: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  filterRow: {
    gap: 8,
    paddingTop: 12,
    paddingRight: 20,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 210,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 26,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.textTertiary,
    fontSize: 15,
    marginBottom: 8,
  },
  deleteSwipe: {
    marginLeft: 8,
    marginVertical: 4,
    width: 92,
    borderRadius: 16,
    backgroundColor: '#B91C1C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteSwipeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
