import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, Heart, ArrowRight, Type, ImageIcon, Film, Star } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { gallerySeed } from '@/data/gallerySeed';
import { usePromptStore } from '@/contexts/PromptContext';
import { GalleryItem } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function GalleryContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const { searchQuery, setSearchQuery } = usePromptStore();
  const [activeFilter, setActiveFilter] = useState('All');

  const FILTER_ITEMS = useMemo(() => [
    { key: 'All', label: t.discover.all, icon: <Star size={14} color={activeFilter === 'All' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Text', label: t.discover.text, icon: <Type size={14} color={activeFilter === 'Text' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Image', label: t.discover.image, icon: <ImageIcon size={14} color={activeFilter === 'Image' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Video', label: t.discover.video, icon: <Film size={14} color={activeFilter === 'Video' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Editor Picks', label: t.discover.editorPicks, icon: <Star size={14} color={activeFilter === 'Editor Picks' ? '#FFF' : '#D97706'} /> },
  ], [t, activeFilter, colors]);

  const filteredPrompts = useMemo(() => {
    let items = [...gallerySeed];
    if (activeFilter === 'Text') items = items.filter(p => p.type === 'text');
    else if (activeFilter === 'Image') items = items.filter(p => p.type === 'image');
    else if (activeFilter === 'Video') items = items.filter(p => p.type === 'video');
    else if (activeFilter === 'Editor Picks') items = items.filter(p => p.isEditorPick);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (p) => p.title.toLowerCase().includes(q) || p.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeFilter, searchQuery]);

  const handlePromptPress = useCallback((item: GalleryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/prompt/${item.id}` as any);
  }, [router]);

  const cardColors = isDark
    ? ['#1E1B2E', '#1B2E24', '#2E2B1B', '#2E1B28', '#1B232E', '#2E251B']
    : ['#EDE9FE', '#D1FAE5', '#FEF3C7', '#FCE7F3', '#DBEAFE', '#FFEDD5'];

  const renderCard = useCallback(({ item, index }: { item: GalleryItem; index: number }) => {
    const cardBg = cardColors[index % cardColors.length];
    const hasThumb = Boolean(item.thumbnail);

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg, transform: [{ scale: pressed ? 0.97 : 1 }] },
        ]}
        testID={`gallery-card-${item.id}`}
      >
        {hasThumb && (
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.thumbnail }} style={styles.cardImage} contentFit="cover" transition={200} />
            <LinearGradient colors={['transparent', `${cardBg}CC`, cardBg]} style={styles.cardImageGradient} />
          </View>
        )}

        <View style={[styles.cardContent, !hasThumb && { paddingTop: 20 }]}>
          <View style={styles.cardTopRow}>
            <View style={styles.modelPill}>
              <Text style={[styles.modelPillText, isDark && { color: '#D1D5DB' }]}>{getModelLabel(item.model)}</Text>
            </View>
            {item.isEditorPick && (
              <View style={styles.pickPill}>
                <Star size={10} color="#D97706" />
                <Text style={styles.pickPillText}>{t.discover.pick}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, isDark && { color: '#F1F1F4' }]} numberOfLines={2}>{item.title}</Text>

          <View style={styles.cardFooter}>
            <View style={styles.cardMeta}>
              <Text style={[styles.cardAuthor, isDark && { color: '#9CA3B0' }]}>{item.author}</Text>
              <View style={styles.likesRow}>
                <Heart size={12} color={isDark ? '#9CA3B0' : '#9CA3AF'} />
                <Text style={[styles.likesText, isDark && { color: '#9CA3B0' }]}>{item.likes.toLocaleString()}</Text>
              </View>
            </View>
            <View style={[styles.cardArrow, isDark && { backgroundColor: '#F1F1F4' }]}>
              <ArrowRight size={16} color={isDark ? '#0F0F14' : '#FFF'} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [handlePromptPress, isDark, cardColors, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientMid]} style={StyleSheet.absoluteFill} />
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.textTertiary }]}>{t.discover.title}</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.discover.subtitle}</Text>
        </View>
      </View>

      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.searchBg, borderColor: colors.cardBorder }]}>
          <Search size={18} color={colors.textTertiary} />
          <TextInput
            placeholder={t.discover.searchPlaceholder}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            testID="gallery-search-input"
          />
        </View>
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTER_ITEMS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => { setActiveFilter(filter.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.filterPill, { backgroundColor: colors.chipBg }, isActive && styles.filterPillActive]}
              >
                {filter.icon}
                <Text style={[styles.filterText, { color: colors.textSecondary }, isActive && styles.filterTextActive]}>
                  {filter.label}
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
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t.discover.noPrompts}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>{t.discover.adjustSearch}</Text>
          </View>
        }
      />
    </View>
  );
}

export default function GalleryScreen() {
  return (
    <ErrorBoundary fallbackTitle="Gallery Error">
      <GalleryContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontSize: 14, fontWeight: '500' as const },
  headerTitle: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
  searchSection: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    height: 48, borderRadius: 24, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, elevation: 2, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filtersRow: { marginBottom: 16 },
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  filterPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterText: { fontSize: 13, fontWeight: '600' as const },
  filterTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, gap: 16 },
  card: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cardImageWrap: { height: 120, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  cardContent: { padding: 16, paddingTop: 0 },
  cardTopRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  modelPill: { backgroundColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modelPillText: { fontSize: 11, fontWeight: '600' as const, color: '#4B5563' },
  pickPill: {
    backgroundColor: 'rgba(217,119,6,0.1)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  pickPillText: { fontSize: 11, fontWeight: '700' as const, color: '#D97706' },
  cardTitle: { fontSize: 20, fontWeight: '800' as const, color: '#1F2937', lineHeight: 26, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardAuthor: { fontSize: 13, color: '#6B7280', fontWeight: '600' as const },
  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' as const },
  cardArrow: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#111827',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700' as const },
  emptySubtitle: { fontSize: 14 },
});
