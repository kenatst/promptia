import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Sparkles, Wand2 } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Colors from '@/constants/colors';
import {
  CREATION_CATEGORIES,
  getCategoryById,
} from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { PromptCategory } from '@/types/prompt';
import { AnimatedChip } from '@/components/AnimatedChip';
import { GlassCard } from '@/components/GlassCard';
import { VisualCategory } from '@/components/VisualCategory';

export default function BuilderScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    builder,
    selectCategory,
    updateGoal,
    generateCurrentPrompt,
  } = usePromptStore();

  const selectedCategory = useMemo(() => getCategoryById(builder.config.category), [builder.config.category]);

  const handleCategorySelect = useCallback(
    (category: PromptCategory) => {
      selectCategory(category);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [selectCategory]
  );

  const handleGenerate = useCallback(() => {
    if (builder.config.goal.trim().length === 0) {
      Alert.alert('Empty Prompt', 'Please describe what you want to create.');
      return;
    }
    generateCurrentPrompt();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [builder.config.goal, generateCurrentPrompt]);


  return (
    <View style={styles.container}>
      {/* Light Cream Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FAFAFA', '#FFFBF2']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            // Increased padding bottom to avoid overlap with tab bar/buttons
            { paddingTop: insets.top + 20, paddingBottom: 160 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>AI Prompt</Text>
            <View style={styles.badge}>
              <Sparkles size={14} color="#F59E0B" />
              <Text style={styles.badgeText}>Pro</Text>
            </View>
          </View>

          {/* Horizontal Circular Categories */}
          <View style={styles.categorySection}>
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
                  selected={selectedCategory.id === item.id}
                  onPress={() => handleCategorySelect(item.id)}
                  index={index}
                />
              )}
            />
          </View>

          {/* Massive Input Card (Light 3D Style) */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GlassCard variant="input-container" style={styles.mainInputCard}>

              {/* Header inside card */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${selectedCategory.accentColor}10` }]}>
                  <Wand2 size={24} color={selectedCategory.accentColor} />
                </View>
                <Text style={styles.cardTitle}>
                  Crafting a {selectedCategory.label.toLowerCase()}...
                </Text>
              </View>

              {/* Text Input Area */}
              <TextInput
                value={builder.config.goal}
                onChangeText={updateGoal}
                placeholder="Describe your idea in detail..."
                placeholderTextColor="#9CA3AF"
                multiline
                style={styles.input}
                textAlignVertical="top"
              />

              {/* Generate Button (Black, Full Width) */}
              <Pressable
                onPress={handleGenerate}
                style={({ pressed }) => [styles.generateBtn, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
              >
                <Wand2 size={18} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.generateBtnText}>Generate Prompt</Text>
              </Pressable>

            </GlassCard>

            {/* Recent Creations / History */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent Creations</Text>
              </View>

              {/* Example History Item 1 */}
              <GlassCard variant="3d-light" style={styles.historyCard} noPadding>
                <View style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: '#FFEDD5' }]}>
                    <Text style={{ fontSize: 24 }}>🍕</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>Pizza Cooking Guide</Text>
                    <Text style={styles.historyMeta}>🔥 975 tokens • 20 min ago</Text>
                  </View>
                </View>
              </GlassCard>

              {/* Example History Item 2 */}
              <GlassCard variant="3d-light" style={[styles.historyCard, { marginTop: 16 }]} noPadding>
                <View style={styles.historyRow}>
                  <View style={[styles.historyIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={{ fontSize: 24 }}>🥗</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyName}>Healthy Salad Blog</Text>
                    <Text style={styles.historyMeta}>✍️ 1.2k tokens • 2 hours ago</Text>
                  </View>
                </View>
              </GlassCard>
            </View>

          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827', // Almost Black
    letterSpacing: -1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Pale Yellow
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#F59E0B',
    fontWeight: '700',
    fontSize: 12,
  },
  categorySection: {
    marginHorizontal: -24,
    marginBottom: 30,
  },
  categoryList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  mainInputCard: {
    minHeight: 320,
    padding: 24,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    lineHeight: 28,
  },
  input: {
    fontSize: 18,
    color: '#1F2937',
    minHeight: 120,
    marginBottom: 24,
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  generateBtn: {
    backgroundColor: '#111827', // Pitch black
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  historySection: {
    marginTop: 0,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  historyCard: {
    padding: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  historyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyMeta: {
    color: '#6B7280',
    fontSize: 13,
  }
});
