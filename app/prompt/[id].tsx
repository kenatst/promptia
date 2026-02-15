import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Share2 } from 'lucide-react-native';

import Colors from '@/constants/colors';
import { GlowButton } from '@/components/GlowButton';
import { SectionBlock } from '@/components/SectionBlock';
import { getCategoryById, gallerySeed } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { Prompt } from '@/types/prompt';
import { sharePromptText } from '@/utils/sharePrompt';

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { library, prefillBuilderFromPrompt } = usePromptStore();
  const [toast, setToast] = useState<string | null>(null);

  const prompt = useMemo<Prompt | null>(() => {
    const fromGallery = gallerySeed.find((item) => item.id === id);
    if (fromGallery) {
      return fromGallery;
    }

    const fromLibrary = library.items.find((item) => item.id === id);
    return fromLibrary ?? null;
  }, [id, library.items]);

  const category = useMemo(() => (prompt ? getCategoryById(prompt.category) : null), [prompt]);

  const handleCopySection = useCallback(async (content: string) => {
    await Clipboard.setStringAsync(content);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast('Copied!');
    setTimeout(() => setToast(null), 1200);
  }, []);

  const handleShare = useCallback(async () => {
    if (!prompt) {
      return;
    }
    await sharePromptText(prompt.fullPrompt, prompt.title);
  }, [prompt]);

  const handleRemix = useCallback(() => {
    if (!prompt) {
      return;
    }
    prefillBuilderFromPrompt(prompt);
    router.push('/(tabs)/(builder)');
  }, [prefillBuilderFromPrompt, prompt, router]);

  if (!prompt || !category) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Prompt not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.backgroundGradientStart, Colors.backgroundGradientMid, Colors.backgroundGradientEnd]} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={[`${prompt.accentColor}16`, Colors.atmospherePurple, 'rgba(11,10,26,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.glow}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.iconBtn}>
          <ArrowLeft size={20} color="rgba(255,255,255,0.70)" />
        </Pressable>
        <Pressable onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.iconBtn}>
          <Share2 size={18} color="rgba(255,255,255,0.70)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 66, paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerWrap}>
          <Text style={styles.title}>{prompt.title}</Text>
          <View style={[styles.categoryBadge, { borderColor: `${prompt.accentColor}55`, backgroundColor: `${prompt.accentColor}15` }]}>
            <Text style={[styles.categoryBadgeText, { color: prompt.accentColor }]}>
              {category.emoji} {category.label}
            </Text>
          </View>
        </View>

        <View style={styles.sectionsWrap}>
          {prompt.sections.map((section) => (
            <SectionBlock key={`${prompt.id}-${section.id}-${section.header}`} section={section} onCopied={() => handleCopySection(section.content)} />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 10 }]}>
        <GlowButton title="✨ Remix in Builder" onPress={handleRemix} />
      </View>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 92 }]}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
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
    left: -70,
    right: -70,
    height: 350,
  },
  topBar: {
    position: 'absolute',
    zIndex: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(130, 90, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(130, 90, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWrap: {
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    color: Colors.text,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionsWrap: {
    gap: 14,
  },
  bottomCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(130, 90, 255, 0.10)',
    backgroundColor: 'rgba(11, 10, 26, 0.92)',
  },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(130, 90, 255, 0.20)',
    backgroundColor: 'rgba(16, 14, 36, 0.95)',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toastText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emptyTitle: {
    color: Colors.textTertiary,
    fontSize: 16,
  },
});
