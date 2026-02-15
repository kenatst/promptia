import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, Heart, ArrowRight, Type, ImageIcon, Film, Star, Sparkles } from 'lucide-react-native';

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
    { key: 'All', label: t.discover.all, icon: <Sparkles size={14} color={activeFilter === 'All' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Text', label: t.discover.text, icon: <Type size={14} color={activeFilter === 'Text' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Image', label: t.discover.image, icon: <ImageIcon size={14} color={activeFilter === 'Image' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Video', label: t.discover.video, icon: <Film size={14} color={activeFilter === 'Video' ? '#FFF' : colors.textSecondary} /> },
    { key: 'Editor Picks', label: t.discover.editorPicks, icon: <Star size={14} color={activeFilter === 'Editor Picks' ? '#FFF' : '#F59E0B'} /> },
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

  const renderCard = useCallback(({ item }: { item: GalleryItem }) => {
    const hasThumb = Boolean(item.thumbnail);

    // Vibrant accent colors for badges based on model
    const accentColor = item.type === 'image' ? '#8B5CF6' : item.type === 'video' ? '#EC4899' : '#3B82F6';

    return (
      <Pressable
        onPress={() => handlePromptPress(item)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        {hasThumb && (
          <View style={styles.cardImageWrap}>
            <Image source={{ uri: item.thumbnail }} style={styles.cardImage} contentFit="cover" transition={200} />
            <View style={styles.cardOverlay} />
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }]}>
              {item.type === 'video' ? <Film size={12} color="#FFF" /> : <ImageIcon size={12} color="#FFF" />}
              <Text style={styles.typeBadgeText}>{getModelLabel(item.model)}</Text>
            </View>
          </View>
        )}

        <View style={[styles.cardContent, !hasThumb && { paddingTop: 20 }]}>
          {!hasThumb && (
            <View style={[styles.textIconBadge, { backgroundColor: `${accentColor}15` }]}>
              <Type size={16} color={accentColor} />
              <Text style={[styles.textIconLabel, { color: accentColor }]}>{getModelLabel(item.model)}</Text>
            </View>
          )}

          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>

          <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description || item.prompt.slice(0, 80)}...
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.authorRow}>
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.bgTertiary }]}>
                <Text style={[styles.avatarText, { color: colors.textSecondary }]}>{item.author[0]}</Text>
              </View>
              <Text style={[styles.cardAuthor, { color: colors.textSecondary }]}>{item.author}</Text>
            </View>

            <View style={styles.likesRow}>
              <Heart size={14} color={colors.textTertiary} />
              <Text style={[styles.likesText, { color: colors.textTertiary }]}>{item.likes}</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }, [handlePromptPress, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.stickyHeader, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.greeting, { color: colors.textTertiary }]}>{t.discover.title}</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.discover.subtitle}</Text>
          </View>
          <Pressable style={[styles.profileBtn, { backgroundColor: colors.bgTertiary }]}>
            <Text>👤</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.searchBg, borderColor: colors.cardBorder }]}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              placeholder={t.discover.searchPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {FILTER_ITEMS.map((filter) => {
              const isActive = activeFilter === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => { setActiveFilter(filter.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[
                    styles.filterPill,
                    { backgroundColor: isActive ? '#0F172A' : colors.chipBg },
                    isActive && isDark && { backgroundColor: '#F8FAFC' }
                  ]}
                >
                  {filter.icon}
                  <Text style={[
                    styles.filterText,
                    { color: isActive ? '#FFF' : colors.textSecondary },
                    isActive && isDark && { color: '#0F172A' }
                  ]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredPrompts}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={[styles.listContent]}
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
  stickyHeader: { paddingBottom: 16, zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  greeting: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  profileBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  searchRow: { paddingHorizontal: 20, marginBottom: 16 },
  searchBar: {
    height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },

  filtersSection: {},
  filtersContent: { paddingHorizontal: 20, gap: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24,
  },
  filterText: { fontSize: 13, fontWeight: '600' },

  listContent: { paddingHorizontal: 20, paddingBottom: 100, gap: 20 },

  card: {
    borderRadius: 24, overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 }, elevation: 3,
  },
  cardImageWrap: { height: 180, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  typeBadge: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, overflow: 'hidden'
  },
  typeBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  cardContent: { padding: 20 },
  textIconBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginBottom: 12
  },
  textIconLabel: { fontSize: 11, fontWeight: '700' },

  cardTitle: { fontSize: 18, fontWeight: '700', lineHeight: 24, marginBottom: 6 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarPlaceholder: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '700' },
  cardAuthor: { fontSize: 13, fontWeight: '600' },

  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText: { fontSize: 12, fontWeight: '600' },
});
