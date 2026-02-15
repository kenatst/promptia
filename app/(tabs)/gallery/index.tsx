import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, X, Star } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { gallerySeed, getCategoryById, EXPLORE_FILTERS, type ExploreFilter } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { Prompt } from '@/types/prompt';
import { AnimatedChip } from '@/components/AnimatedChip';
import { GlassCard } from '@/components/GlassCard';
import { PromptCard } from '@/components/PromptCard';
import { sharePromptText } from '@/utils/sharePrompt';

const AnimatedView = Animated.createAnimatedComponent(View);

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    explore,
    setExploreSearchQuery,
    setExploreFilter,
    saveToLibrary,
    prefillBuilderFromPrompt,
  } = usePromptStore();

  const searchFocused = useSharedValue(0);

  const onSearchFocus = useCallback(() => {
    searchFocused.value = withSpring(1, { damping: 18, stiffness: 260 });
  }, [searchFocused]);

  const onSearchBlur = useCallback(() => {
    searchFocused.value = withSpring(0, { damping: 18, stiffness: 260 });
  }, [searchFocused]);

  const searchStyle = useAnimatedStyle(() => ({
    borderColor: searchFocused.value > 0.5 ? Colors.accent : 'rgba(130, 90, 255, 0.18)',
  }));

  const filteredPrompts = useMemo(() => {
    let items = [...gallerySeed];

    if (explore.filter !== 'All') {
      items = items.filter((p) => getCategoryById(p.category).label === explore.filter);
    }

    if (explore.searchQuery.trim()) {
      const q = explore.searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.fullPrompt.toLowerCase().includes(q)
      );
    }

    return items;
  }, [explore.filter, explore.searchQuery]);

  const editorPicks = useMemo(() => gallerySeed.filter((p) => p.editorPick).slice(0, 3), []);

  const handlePromptPress = useCallback(
    (prompt: Prompt) => {
      router.push(`/prompt/${prompt.id}`);
    },
    [router]
  );

  const handleRemix = useCallback(
    (prompt: Prompt) => {
      prefillBuilderFromPrompt(prompt);
      router.push('/(tabs)/(builder)');
    },
    [prefillBuilderFromPrompt, router]
  );

  const handleSave = useCallback(
    (prompt: Prompt) => {
      saveToLibrary(prompt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [saveToLibrary]
  );

  const handleShare = useCallback(async (prompt: Prompt) => {
    await sharePromptText(prompt.fullPrompt, prompt.title);
  }, []);

  const handleUseInBuilder = useCallback(
    (prompt: Prompt) => {
      prefillBuilderFromPrompt(prompt);
      router.push('/(tabs)/(builder)');
    },
    [prefillBuilderFromPrompt, router]
  );

  const clearSearch = useCallback(() => {
    setExploreSearchQuery('');
  }, [setExploreSearchQuery]);

  const renderFeaturedCard = useCallback(
    (prompt: Prompt, index: number) => {
      const category = getCategoryById(prompt.category);
      return (
        <Animated.View key={prompt.id} entering={FadeInDown.delay(index * 100).duration(300)}>
          <Pressable onPress={() => handlePromptPress(prompt)}>
            <GlassCard accent accentColor={prompt.accentColor} style={styles.featuredCard}>
              <View style={styles.featuredBadge}>
                <Star size={12} color={Colors.accent} fill={Colors.accent} />
                <Text style={styles.featuredBadgeText}>Editor's Pick</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{prompt.title}</Text>
              <Text style={styles.featuredPreview} numberOfLines={2}>
                {(prompt.concisePrompt || prompt.fullPrompt).replace(/\s+/g, ' ').trim()}
              </Text>
              <View style={[styles.featuredCat, { borderColor: `${prompt.accentColor}55`, backgroundColor: `${prompt.accentColor}15` }]}>
                <Text style={[styles.featuredCatText, { color: prompt.accentColor }]}>{category.emoji} {category.label}</Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>
      );
    },
    [handlePromptPress]
  );

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
        <Text style={styles.heading}>🔮 Explore</Text>

        <AnimatedView style={[styles.searchWrap, searchStyle]}>
          <Search size={17} color="rgba(130, 90, 255, 0.50)" />
          <TextInput
            value={explore.searchQuery}
            onChangeText={setExploreSearchQuery}
            placeholder="Search prompts..."
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
          />
          {explore.searchQuery.length > 0 ? (
            <Pressable onPress={clearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={16} color={Colors.textTertiary} />
            </Pressable>
          ) : null}
        </AnimatedView>

        <FlatList
          data={EXPLORE_FILTERS as readonly ExploreFilter[]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <AnimatedChip
              label={item}
              selected={explore.filter === item}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExploreFilter(item);
              }}
              accentColor={Colors.accent}
            />
          )}
        />
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          editorPicks.length > 0 && explore.filter === 'All' && !explore.searchQuery ? (
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>⭐ Editor's Picks</Text>
              <View style={styles.featuredStack}>
                {editorPicks.map((p, i) => renderFeaturedCard(p, i))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(250)}>
            <PromptCard
              prompt={item}
              variant="gallery"
              onPress={handlePromptPress}
              onRemix={handleRemix}
              onSave={handleSave}
              onShare={handleShare}
              onUseInBuilder={handleUseInBuilder}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No prompts found</Text>
            <Text style={styles.emptySubtitle}>Try a different search or filter</Text>
          </View>
        }
      />
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
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(130, 90, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1.2,
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
  featuredSection: {
    marginBottom: 20,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  featuredStack: {
    gap: 12,
  },
  featuredCard: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 10,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '700',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  featuredPreview: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 20,
  },
  featuredCat: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredCatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.50)',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.textTertiary,
    fontSize: 13,
  },
});
