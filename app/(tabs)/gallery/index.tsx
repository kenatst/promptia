import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Heart, Shuffle, Sparkles, Search, X, TrendingUp } from 'lucide-react-native';
import { gallerySeed, GALLERY_FILTERS } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { GalleryItem, ModelType, DEFAULT_INPUTS } from '@/types/prompt';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.78;

const MODEL_COLORS: Record<ModelType, string> = {
  chatgpt: Colors.accent,
  midjourney: Colors.secondary,
  sdxl: Colors.cyan,
  video: Colors.pink,
};

const MODEL_LABELS: Record<ModelType, string> = {
  chatgpt: 'LLM',
  midjourney: 'MJ',
  sdxl: 'SDXL',
  video: 'VIDEO',
};

const FILTER_EMOJIS: Record<string, string> = {
  'All': '✨',
  'Text': '✍️',
  'Image': '🎨',
  'Video': '🎬',
  'Trending': '🔥',
  'Editor Picks': '⭐',
};

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const router = useRouter();
  const { setCurrentInputs } = usePromptStore();

  const featuredItems = useMemo(() => gallerySeed.filter((i) => i.isEditorPick), []);

  const filteredItems = useMemo(() => {
    let items: GalleryItem[];
    switch (activeFilter) {
      case 'Text':
        items = gallerySeed.filter((i) => i.type === 'text');
        break;
      case 'Image':
        items = gallerySeed.filter((i) => i.type === 'image');
        break;
      case 'Video':
        items = gallerySeed.filter((i) => i.type === 'video');
        break;
      case 'Trending':
        items = [...gallerySeed].sort((a, b) => b.likes - a.likes);
        break;
      case 'Editor Picks':
        items = gallerySeed.filter((i) => i.isEditorPick);
        break;
      default:
        items = gallerySeed;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) => i.title.toLowerCase().includes(q) || i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return items;
  }, [activeFilter, searchQuery]);

  const handleRemix = useCallback((item: GalleryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentInputs({
      ...DEFAULT_INPUTS,
      objective: item.title,
      model: item.model,
      objectiveChips: item.tags.slice(0, 3),
      style: item.style,
    });
    router.push('/(tabs)/(builder)');
  }, [setCurrentInputs, router]);

  const handleDetail = useCallback((item: GalleryItem) => {
    router.push(`/prompt/${item.id}`);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: GalleryItem }) => (
    <GalleryCard item={item} onRemix={handleRemix} onPress={handleDetail} />
  ), [handleRemix, handleDetail]);

  const keyExtractor = useCallback((item: GalleryItem) => item.id, []);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <View style={styles.featuredSection}>
        <View style={styles.sectionRow}>
          <Sparkles size={16} color={Colors.accent} />
          <Text style={styles.sectionTitle}>Featured</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredScroll}
          decelerationRate="fast"
          snapToInterval={FEATURED_CARD_WIDTH + 12}
        >
          {featuredItems.map((item) => (
            <FeaturedCard
              key={item.id}
              item={item}
              onPress={() => handleDetail(item)}
              onRemix={() => handleRemix(item)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {GALLERY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(filter);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.filterEmoji}>{FILTER_EMOJIS[filter] ?? '✨'}</Text>
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.allPromptsRow}>
        <TrendingUp size={14} color={Colors.textTertiary} />
        <Text style={styles.allPromptsLabel}>All Prompts</Text>
        <Text style={styles.allPromptsCount}>{filteredItems.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientMid, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Search size={18} color={searchFocused ? Colors.accent : Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search prompts, tags..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No prompts found</Text>
            <Text style={styles.emptyDesc}>Try a different search or filter</Text>
          </View>
        }
      />
    </View>
  );
}

interface FeaturedCardProps {
  item: GalleryItem;
  onPress: () => void;
  onRemix: () => void;
}

const FeaturedCard = React.memo(function FeaturedCard({ item, onPress, onRemix }: FeaturedCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modelColor = MODEL_COLORS[item.model];

  return (
    <Animated.View style={[styles.featuredCardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        activeOpacity={0.95}
      >
        <View style={styles.featuredCard}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.featuredImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            style={styles.featuredOverlay}
          />
          <View style={styles.featuredBadge}>
            <Sparkles size={10} color="#FFD700" />
            <Text style={styles.featuredBadgeText}>Editor Pick</Text>
          </View>
          <View style={styles.featuredInfo}>
            <View style={[styles.featuredModelBadge, { backgroundColor: `${modelColor}30`, borderColor: `${modelColor}50` }]}>
              <Text style={[styles.featuredModelText, { color: modelColor }]}>{MODEL_LABELS[item.model]}</Text>
            </View>
            <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.featuredFooter}>
              <View style={styles.featuredLikes}>
                <Heart size={12} color={Colors.pink} fill={Colors.pink} />
                <Text style={styles.featuredLikesText}>{item.likes.toLocaleString()}</Text>
              </View>
              <TouchableOpacity
                style={styles.featuredRemix}
                onPress={(e) => { e.stopPropagation?.(); onRemix(); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Shuffle size={12} color={Colors.accent} />
                <Text style={styles.featuredRemixText}>Remix</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

interface GalleryCardProps {
  item: GalleryItem;
  onRemix: (item: GalleryItem) => void;
  onPress: (item: GalleryItem) => void;
}

const GalleryCard = React.memo(function GalleryCard({ item, onRemix, onPress }: GalleryCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modelColor = MODEL_COLORS[item.model];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={() => onPress(item)}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          <Image
            source={{ uri: item.thumbnail }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            locations={[0.3, 0.7, 1]}
            style={styles.cardGradient}
          />
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <View style={[styles.modelBadge, { backgroundColor: `${modelColor}25`, borderColor: `${modelColor}40` }]}>
                <Text style={[styles.modelText, { color: modelColor }]}>{MODEL_LABELS[item.model]}</Text>
              </View>
              <View style={styles.likesRow}>
                <Heart size={12} color={Colors.pink} fill={Colors.pink} />
                <Text style={styles.likesText}>{item.likes.toLocaleString()}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardPrompt} numberOfLines={2}>{item.prompt}</Text>
            <View style={styles.cardFooter}>
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.remixBtn}
                onPress={() => onRemix(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Shuffle size={13} color={Colors.accent} />
                <Text style={styles.remixText}>Remix</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchBarFocused: {
    borderColor: Colors.accentGlow,
    backgroundColor: Colors.glassMedium,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  listHeader: {
    gap: 20,
    marginBottom: 16,
  },
  featuredSection: {
    gap: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  featuredScroll: {
    gap: 12,
    paddingRight: 20,
  },
  featuredCardWrapper: {
    width: FEATURED_CARD_WIDTH,
  },
  featuredCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  featuredImage: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 6,
  },
  featuredModelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  featuredModelText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredLikesText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
  },
  featuredRemix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,159,10,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.3)',
  },
  featuredRemixText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  filterSection: {},
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.accentDim,
    borderColor: `${Colors.accent}50`,
  },
  filterEmoji: {
    fontSize: 13,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.accent,
  },
  allPromptsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  allPromptsLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    flex: 1,
  },
  allPromptsCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  separator: {
    height: 14,
  },
  card: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    position: 'relative',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.glass,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  modelText: {
    fontSize: 10,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.white,
    letterSpacing: -0.2,
  },
  cardPrompt: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600' as const,
  },
  remixBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,159,10,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.3)',
  },
  remixText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
