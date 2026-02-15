import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, Star, X } from 'lucide-react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { AnimatedChip } from '@/components/AnimatedChip';
import { PromptCard } from '@/components/PromptCard';
import { EXPLORE_FILTERS, gallerySeed, getCategoryById } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { ExploreFilter, GalleryItem, Prompt } from '@/types/prompt';
import { sharePromptText } from '@/utils/sharePrompt';

const AnimatedView = Animated.createAnimatedComponent(View);

function FeaturedHero({
  item,
  onOpen,
  onRemix,
}: {
  item: GalleryItem;
  onOpen: (item: Prompt) => void;
  onRemix: (item: Prompt) => void;
}) {
  const category = getCategoryById(item.category);

  return (
    <Pressable onPress={() => onOpen(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <View style={styles.featuredCard}>
        <LinearGradient
          colors={[`${item.accentColor}B0`, `${item.accentColor}45`, 'rgba(8,8,8,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.featuredBadge}>
          <Star size={10} color="#FFD166" />
          <Text style={styles.featuredBadgeText}>Editor Pick</Text>
        </View>

        <View style={styles.featuredBottom}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.featuredMetaRow}>
            <View style={[styles.categoryPill, { borderColor: `${item.accentColor}88`, backgroundColor: `${item.accentColor}25` }]}>
              <Text style={[styles.categoryPillText, { color: '#fff' }]}>{category.label}</Text>
            </View>
            <Text style={styles.likesText}>❤️ {item.likeCount.toLocaleString()}</Text>
          </View>

          <Pressable onPress={() => onRemix(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.remixMiniBtn}>
            <Text style={styles.remixMiniText}>Remix →</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    explore,
    setExploreFilter,
    setExploreSearchQuery,
    prefillBuilderFromPrompt,
    savePromptToLibrary,
  } = usePromptStore();

  const [searchFocused, setSearchFocused] = useState(false);
  const focus = useSharedValue(0);

  const searchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(focus.value, [0, 1], [1, 1.02]) }],
    borderColor: focus.value > 0.5 ? `${Colors.accent}88` : 'rgba(255,255,255,0.10)',
  }));

  const filteredPrompts = useMemo(() => {
    let list = gallerySeed;

    if (explore.filter === 'Text') {
      list = list.filter((item) => item.type === 'text');
    }

    if (explore.filter === 'Image') {
      list = list.filter((item) => item.type === 'image');
    }

    if (explore.filter === 'Video') {
      list = list.filter((item) => item.type === 'video');
    }

    if (explore.filter === 'Code') {
      list = list.filter((item) => item.category === 'code_dev');
    }

    if (explore.filter === 'Creative') {
      const creativeCategories = new Set(['writing', 'image_art', 'photography', 'video_clip', 'ui_design', 'logo_brand', 'social_media']);
      list = list.filter((item) => creativeCategories.has(item.category));
    }

    if (explore.filter === 'Business') {
      const businessCategories = new Set(['marketing', 'email', 'business_plan', 'data_analysis', 'legal', 'productivity']);
      list = list.filter((item) => businessCategories.has(item.category));
    }

    const query = explore.searchQuery.trim().toLowerCase();
    if (query.length === 0) {
      return list;
    }

    return list.filter((item) => {
      const categoryLabel = getCategoryById(item.category).label.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        categoryLabel.includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [explore.filter, explore.searchQuery]);

  const featuredPrompts = useMemo(() => gallerySeed.filter((item) => item.isEditorPick), []);

  const handleOpenPrompt = useCallback(
    (prompt: Prompt) => {
      router.push(`/prompt/${prompt.id}`);
    },
    [router]
  );

  const handleRemixPrompt = useCallback(
    (prompt: Prompt) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      prefillBuilderFromPrompt(prompt);
      router.push('/(tabs)/(builder)');
    },
    [prefillBuilderFromPrompt, router]
  );

  const handleSavePrompt = useCallback(
    (prompt: Prompt) => {
      savePromptToLibrary(prompt);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Prompt added to Library.');
    },
    [savePromptToLibrary]
  );

  const handleSharePrompt = useCallback(async (prompt: Prompt) => {
    await sharePromptText(prompt.fullPrompt, prompt.title);
  }, []);

  const renderPrompt = useCallback(
    ({ item }: { item: GalleryItem }) => (
      <PromptCard
        prompt={item}
        variant="gallery"
        onPress={handleOpenPrompt}
        onRemix={handleRemixPrompt}
        onUseInBuilder={handleRemixPrompt}
        onSave={handleSavePrompt}
        onShare={handleSharePrompt}
      />
    ),
    [handleOpenPrompt, handleRemixPrompt, handleSavePrompt, handleSharePrompt]
  );

  const renderFeatured = useCallback(
    ({ item }: { item: GalleryItem }) => <FeaturedHero item={item} onOpen={handleOpenPrompt} onRemix={handleRemixPrompt} />,
    [handleOpenPrompt, handleRemixPrompt]
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.background, Colors.backgroundGradientMid, Colors.background]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${Colors.blue}14`, 'rgba(8,8,8,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
      />

      <View style={[styles.stickyHeader, { paddingTop: insets.top + 6 }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.headerTitle}>Explore</Text>

        <AnimatedView style={[styles.searchWrap, searchStyle]}>
          <Search size={17} color={searchFocused ? Colors.accent : Colors.textTertiary} />
          <TextInput
            value={explore.searchQuery}
            onChangeText={setExploreSearchQuery}
            onFocus={() => {
              setSearchFocused(true);
              focus.value = withTiming(1, { duration: 180 });
            }}
            onBlur={() => {
              setSearchFocused(false);
              focus.value = withTiming(0, { duration: 180 });
            }}
            placeholder="Search prompts"
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
          />
          {explore.searchQuery.length > 0 ? (
            <Pressable onPress={() => setExploreSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={16} color={Colors.textTertiary} />
            </Pressable>
          ) : null}
        </AnimatedView>

        <Text style={styles.countLabel}>{filteredPrompts.length} prompts</Text>
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        windowSize={5}
        renderItem={renderPrompt}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 170, paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <View style={styles.listHeader}> 
            <FlatList
              data={EXPLORE_FILTERS as readonly ExploreFilter[]}
              keyExtractor={(item) => item}
              horizontal
              windowSize={5}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersRow}
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

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured</Text>
            </View>

            <FlatList
              data={featuredPrompts}
              keyExtractor={(item) => item.id}
              horizontal
              windowSize={5}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
              renderItem={renderFeatured}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>All Prompts</Text>
            </View>
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
  glow: {
    position: 'absolute',
    top: 0,
    left: -80,
    right: -80,
    height: 320,
  },
  stickyHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 31,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  searchWrap: {
    borderWidth: 1,
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
  countLabel: {
    marginTop: 10,
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  listHeader: {
    gap: 14,
    marginBottom: 14,
  },
  filtersRow: {
    gap: 8,
    paddingRight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  featuredList: {
    gap: 12,
    paddingRight: 20,
  },
  featuredCard: {
    width: 310,
    height: 200,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'space-between',
  },
  featuredBadge: {
    margin: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredBottom: {
    gap: 9,
    padding: 14,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  featuredMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  likesText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  remixMiniBtn: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  remixMiniText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
