import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Trash2 } from 'lucide-react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { usePromptStore } from '@/store/promptStore';
import { Prompt } from '@/types/prompt';
import { PromptCard } from '@/components/PromptCard';
import { VisualCategory } from '@/components/VisualCategory';
// We use VisualCategory for filtering here too? Or pills? Let's use VisualCategory for consistency.
import { CREATION_CATEGORIES } from '@/data/gallerySeed';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { savedPrompts, libraryFilter, librarySearchQuery, setLibraryFilter, setLibrarySearchQuery, removeSavedPrompt } =
    usePromptStore();

  const filteredPrompts = useMemo(() => {
    let items = savedPrompts;
    if (libraryFilter !== 'All') {
      const cat = CREATION_CATEGORIES.find(c => c.label === libraryFilter);
      if (cat) {
        items = items.filter((p) => p.category === cat.id);
      }
    }
    if (librarySearchQuery.trim()) {
      const q = librarySearchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return items;
  }, [savedPrompts, libraryFilter, librarySearchQuery]);

  const renderItem = ({ item, index }: { item: Prompt; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Swipeable
        overshootRight={false}
        renderRightActions={() => (
          <Pressable onPress={() => removeSavedPrompt(item.id)} style={styles.deleteSwipe}>
            <Trash2 size={20} color="#fff" />
          </Pressable>
        )}
      >
        <PromptCard
          prompt={item}
          variant="library"
          style={styles.card}
        />
      </Swipeable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Light Cream Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FAFAFA', '#FFFBF2']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>Your Library</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{savedPrompts.length}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search your library..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={librarySearchQuery}
            onChangeText={setLibrarySearchQuery}
          />
        </View>
      </View>

      {/* Horizontal Categories for Library */}
      <View style={styles.categoriesRow}>
        <FlatList
          data={CREATION_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item, index }) => (
            <VisualCategory
              label={item.label}
              emoji={item.emoji}
              selected={libraryFilter === item.label}
              onPress={() => setLibraryFilter(item.label)}
              index={index}
            />
          )}
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
            <Text style={styles.emptyText}>No prompts found.</Text>
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
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  countBadge: {
    backgroundColor: '#FDE047', // Yellow Badge
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchBar: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 16,
  },
  categoriesRow: {
    marginBottom: 24,
  },
  categoryList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    marginBottom: 0,
  },
  deleteSwipe: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 24,
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});
