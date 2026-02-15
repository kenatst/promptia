import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Search, Heart, ArrowRight, Type, ImageIcon, Film, Star, X } from 'lucide-react-native';

import { useTheme } from '@/contexts/ThemeContext';
import { gallerySeed } from '@/data/gallerySeed';
import { usePromptStore } from '@/contexts/PromptContext';
import { GalleryItem } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const CARD_BG_COLORS = ['#FFF0ED', '#F0FAF6', '#F4F0FF', '#EFF6FF', '#FFF3E8', '#FFFBE8'];
const CARD_ACCENT_COLORS = ['#E8795A', '#34A77B', '#8B6FC0', '#4A8FE7', '#D4943A', '#E06B8B'];

function GalleryContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const { searchQuery, setSearchQuery } = usePromptStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [showSearch, setShowSearch] = useState(false);

  const FILTER_ITEMS = useMemo(() => [
    { key: 'All', label: t.discover.all },
    { key: 'Text', label: t.discover.text },
    { key: 'Image', label: t.discover.image },
    { key: 'Video', label: t.discover.video },
    { key: 'Editor Picks', label: t.discover.editorPicks },
  ], [t]);

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

  const getCardStyle = useCallback((index: number) => {
    const bgIdx = index % CARD_BG_COLORS.length;
    return {
      bg: isDark ? colors.card : CARD_BG_COLORS[bgIdx],
      accent: CARD_ACCENT_COLORS[bgIdx],
    };
  }, [isDark, colors]);

  const renderCard = useCallback(({ item, index }: { item: GalleryItem; index: number }) => {
    const hasThumb = Boolean(item.thumbnail);
    const cardStyle = getCardStyle(index);

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }: { pressed: boolean }) => [
          styles.card,
          { backgroundColor: cardStyle.bg },
          isDark && { borderColor: colors.cardBorder, borderWidth: 1 },
          pressed && { transform: [{ scale: 0.97 }], opacity: 0.95 },
        ]}
      >
        {hasThumb && (
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.thumbnail }} style={styles.cardImage} contentFit="cover" transition={200} />
          </View>
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={[styles.typePill, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }]}>
              {item.type === 'video' ? <Film size={11} color={cardStyle.accent} /> :
               item.type === 'image' ? <ImageIcon size={11} color={cardStyle.accent} /> :
               <Type size={11} color={cardStyle.accent} />}
              <Text style={[styles.typePillText, { color: cardStyle.accent }]}>{getModelLabel(item.model)}</Text>
            </View>
            {item.isEditorPick && (
              <View style={[styles.pickPill, { backgroundColor: isDark ? 'rgba(212,148,58,0.15)' : '#FFF5E0' }]}>
                <Star size={10} color="#D4943A" fill="#D4943A" />
              </View>
            )}
          </View>

          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>

          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.prompt.slice(0, 90)}...
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.authorRow}>
              <View style={[styles.avatarDot, { backgroundColor: cardStyle.accent }]}>
                <Text style={styles.avatarText}>{item.author[0]}</Text>
              </View>
              <Text style={[styles.cardAuthor, { color: colors.textSecondary }]}>{item.author}</Text>
            </View>

            <View style={styles.likesRow}>
              <Heart size={13} color={colors.textTertiary} />
              <Text style={[styles.likesText, { color: colors.textTertiary }]}>{item.likes}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.openRow]}>
          <Text style={[styles.openText, { color: cardStyle.accent }]}>Open</Text>
          <ArrowRight size={14} color={cardStyle.accent} />
        </View>
      </Pressable>
    );
  }, [handlePromptPress, colors, isDark, getCardStyle]);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>
        {filteredPrompts.length} {activeFilter === 'All' ? 'prompts' : activeFilter.toLowerCase()}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.discover.subtitle}</Text>
          </View>
          <Pressable
            onPress={() => { setShowSearch(!showSearch); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.searchToggle, { backgroundColor: showSearch ? colors.coral : colors.chipBg }]}
          >
            {showSearch ? <X size={18} color="#FFF" /> : <Search size={18} color={colors.textSecondary} />}
          </Pressable>
        </View>

        {showSearch && (
          <View style={[styles.searchBar, { backgroundColor: colors.searchBg }]}>
            <Search size={16} color={colors.textTertiary} />
            <TextInput
              placeholder={t.discover.searchPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
        )}

        <View style={styles.filtersRow}>
          {FILTER_ITEMS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                onPress={() => { setActiveFilter(filter.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.filterPill,
                  { backgroundColor: isActive ? (isDark ? '#E8795A' : '#1A1A1A') : colors.chipBg },
                ]}
              >
                <Text style={[
                  styles.filterText,
                  { color: isActive ? '#FFF' : colors.textSecondary },
                ]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item: GalleryItem) => item.id}
        renderItem={renderCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  header: { paddingBottom: 12, zIndex: 10 },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, marginBottom: 16,
  },
  headerTitle: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.8 },
  searchToggle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  searchBar: {
    marginHorizontal: 24, height: 44, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, gap: 10, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' as const },
  filtersRow: {
    flexDirection: 'row', paddingHorizontal: 24, gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  filterText: { fontSize: 13, fontWeight: '600' as const },
  listHeader: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600' as const },
  listContent: { paddingHorizontal: 24, paddingBottom: 120, gap: 16, paddingTop: 8 },

  card: {
    borderRadius: 24, overflow: 'hidden',
  },
  cardImageWrap: { height: 160, borderRadius: 16, margin: 12, marginBottom: 0, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  cardContent: { padding: 16, paddingBottom: 0 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  typePillText: { fontSize: 11, fontWeight: '700' as const },
  pickPill: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '800' as const, lineHeight: 24, marginBottom: 6 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 11, fontWeight: '700' as const, color: '#FFF' },
  cardAuthor: { fontSize: 13, fontWeight: '600' as const },
  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText: { fontSize: 12, fontWeight: '600' as const },
  openRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  openText: { fontSize: 13, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
});
