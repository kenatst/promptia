import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, Heart, ArrowRight, Sparkles, Type, ImageIcon, Film } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { gallerySeed, GALLERY_FILTERS, CREATION_CATEGORIES } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { GalleryItem } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';

const FILTER_ICONS: Record<string, React.ReactNode> = {
  'All': <Sparkles size={14} color="#6B7280" />,
  'Text': <Type size={14} color="#6B7280" />,
  'Image': <ImageIcon size={14} color="#6B7280" />,
  'Video': <Film size={14} color="#6B7280" />,
  'Editor Picks': <Sparkles size={14} color="#FFD700" />,
};

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = usePromptStore();
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredPrompts = useMemo(() => {
    let items = [...gallerySeed];

    if (activeFilter === 'Text') {
      items = items.filter(p => p.type === 'text');
    } else if (activeFilter === 'Image') {
      items = items.filter(p => p.type === 'image');
    } else if (activeFilter === 'Video') {
      items = items.filter(p => p.type === 'video');
    } else if (activeFilter === 'Editor Picks') {
      items = items.filter(p => p.isEditorPick);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeFilter, searchQuery]);

  const handlePromptPress = useCallback((item: GalleryItem) => {
    router.push(`/prompt/${item.id}` as any);
  }, [router]);

  const cardColors = ['#EDE9FE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#DBEAFE', '#FFEDD5'];

  const renderCard = useCallback(({ item, index }: { item: GalleryItem; index: number }) => {
    const category = CREATION_CATEGORIES.find(c => c.model === item.model) || CREATION_CATEGORIES[0];
    const cardBg = cardColors[index % cardColors.length];
    const hasThumb = Boolean(item.thumbnail);

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
      >
        {hasThumb && (
          <View style={styles.cardImageWrap}>
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
            />
            <LinearGradient
              colors={['transparent', `${cardBg}CC`, cardBg]}
              style={styles.cardImageGradient}
            />
          </View>
        )}

        <View style={[styles.cardContent, !hasThumb && { paddingTop: 20 }]}>
          <View style={styles.cardTopRow}>
            <View style={styles.modelPill}>
              <Text style={styles.modelPillText}>{getModelLabel(item.model)}</Text>
            </View>
            {item.isEditorPick && (
              <View style={styles.pickPill}>
                <Sparkles size={10} color="#D97706" />
                <Text style={styles.pickPillText}>Pick</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.cardMeta}>
              <Text style={styles.cardAuthor}>{item.author}</Text>
              <View style={styles.likesRow}>
                <Heart size={12} color="#9CA3AF" />
                <Text style={styles.likesText}>{item.likes.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.cardArrow}>
              <ArrowRight size={16} color="#FFF" />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [handlePromptPress]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#FAFAFA', '#FFFBF2']} style={StyleSheet.absoluteFill} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.greeting}>Discover</Text>
          <Text style={styles.headerTitle}>Explore Prompts</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search prompts, tags, models..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {GALLERY_FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Pressable
                key={filter}
                onPress={() => {
                  setActiveFilter(filter);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                {FILTER_ICONS[filter]}
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No prompts found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
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
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500' as const,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: '#111827',
    letterSpacing: -0.5,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  filtersRow: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardImageWrap: {
    height: 120,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  modelPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modelPillText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#4B5563',
  },
  pickPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pickPillText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#D97706',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1F2937',
    lineHeight: 26,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAuthor: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600' as const,
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500' as const,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#6B7280',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
