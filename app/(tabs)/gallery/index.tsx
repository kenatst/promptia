import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Search, Bell, Heart, ChefHat, Filter } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { gallerySeed, CREATION_CATEGORIES } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { GalleryItem } from '@/types/prompt';
import { VisualCategory } from '@/components/VisualCategory';

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    searchQuery,
    setSearchQuery,
  } = usePromptStore();

  const [activeFilter, setActiveFilter] = React.useState('All');

  const filteredPrompts = useMemo(() => {
    let items = [...gallerySeed];
    if (activeFilter !== 'All') {
      const cat = CREATION_CATEGORIES.find(c => c.label === activeFilter);
      if (cat) {
        items = items.filter((p) => p.model === cat.model);
      }
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
    router.push(`/prompt/${item.id}`);
  }, [router]);

  const renderRecipeCard = useCallback(({ item, index }: { item: GalleryItem; index: number }) => {
    const category = CREATION_CATEGORIES.find(c => c.model === item.model) || CREATION_CATEGORIES[0];

    // Light Mode Pastels
    const cardBg = index % 2 === 0 ? '#EDE9FE' : '#D1FAE5'; // Light Purple / Light Green

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).springify()} style={styles.cardWrapper}>
        <Pressable onPress={() => handlePromptPress(item)}>
          {/* The "Aegean Breeze" Card Style - Light Mode */}
          <View style={[styles.recipeCard, { backgroundColor: cardBg }]}>
            {/* Subtle Inner Glow */}
            <LinearGradient
              colors={['rgba(255,255,255,0.6)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />

            {/* Content Overlay */}
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.heartBtn}>
                  <Heart size={16} color="#000" />
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>⏱️ 20 min • {category.label}</Text>
                <View style={styles.cookBtn}>
                  <ChefHat size={16} color="#FFF" />
                </View>
              </View>
            </View>

            {/* Floating Image (Emoji/Icon) */}
            <View style={styles.floatingIcon}>
              <Text style={{ fontSize: 48 }}>{category.emoji}</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }, [handlePromptPress]);

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
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.username}>Prompt Creator</Text>
        </View>
        <Pressable style={styles.bellBtn}>
          <Bell size={20} color="#111827" />
          <View style={styles.dot} />
        </Pressable>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitle}>Explore New Prompts</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              placeholder="Search prompts..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable style={styles.filterBtn}>
            <Filter size={20} color="#FFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Categories Circles */}
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
                selected={activeFilter === item.label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(item.label);
                }}
                index={index}
              />
            )}
          />
        </View>

        {/* Recipe Cards List */}
        <View style={styles.cardsList}>
          {filteredPrompts.map((item, index) => (
            <View key={item.id}>
              {renderRecipeCard({ item, index })}
            </View>
          ))}
        </View>

      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  username: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  searchSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
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
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111827', // Black Filter Btn
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  categoriesRow: {
    marginBottom: 30,
  },
  categoryList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  cardsList: {
    paddingHorizontal: 24,
    gap: 20,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  recipeCard: {
    height: 180,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    width: '75%',
    lineHeight: 28,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  cardMeta: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '600',
  },
  cookBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#111827', // Black
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
    zIndex: 1,
  }
});
