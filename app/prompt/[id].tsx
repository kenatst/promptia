import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, User, Tag, Star, Shuffle, Heart, Check, Share2 } from 'lucide-react-native';
import { gallerySeed } from '@/data/gallerySeed';
import { usePromptStore } from '@/contexts/PromptContext';
import { getModelLabel } from '@/engine/promptEngine';
import { GalleryItem, SavedPrompt, ModelType, DEFAULT_INPUTS } from '@/types/prompt';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/Toast';

const MODEL_COLORS: Record<ModelType, string> = {
  chatgpt: '#E8795A',
  midjourney: '#8B6FC0',
  sdxl: '#3B9EC4',
  video: '#E06B8B',
};

function getPromptText(item: { source: 'gallery'; data: GalleryItem } | { source: 'saved'; data: SavedPrompt }): string {
  if (item.source === 'gallery') return item.data.prompt;
  return item.data.finalPrompt;
}

function parseSegments(prompt: string): { label: string; content: string }[] {
  const lines = prompt.split('\n');
  const segments: { label: string; content: string }[] = [];
  let currentLabel = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith('##') || line.startsWith('Scene:') || line.startsWith('Camera:') ||
      line.startsWith('Lighting:') || line.startsWith('Style:') || line.startsWith('Positive:') ||
      line.startsWith('Negative:') || line.startsWith('Duration:') || line.startsWith('Motion:') ||
      line.startsWith('Aspect Ratio:')) {
      if (currentLabel || currentContent.length > 0) {
        segments.push({ label: currentLabel || 'Content', content: currentContent.join('\n').trim() });
      }
      const colonIdx = line.indexOf(':');
      if (line.startsWith('##')) {
        currentLabel = line.replace(/^#+\s*/, '');
        currentContent = [];
      } else if (colonIdx > -1) {
        currentLabel = line.substring(0, colonIdx).trim();
        currentContent = [line.substring(colonIdx + 1).trim()];
      } else {
        currentLabel = line;
        currentContent = [];
      }
    } else {
      currentContent.push(line);
    }
  }

  if (currentLabel || currentContent.length > 0) {
    segments.push({ label: currentLabel || 'Content', content: currentContent.join('\n').trim() });
  }

  if (segments.length === 0) {
    segments.push({ label: 'Prompt', content: prompt });
  }

  return segments;
}

function PromptDetailContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedPrompts, setCurrentInputs } = usePromptStore();
  const router = useRouter();
  const { colors, t, isDark } = useTheme();
  const toast = useToast();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [fullCopied, setFullCopied] = React.useState(false);

  const item = useMemo(() => {
    const gallery = gallerySeed.find((g) => g.id === id);
    if (gallery) return { source: 'gallery' as const, data: gallery };
    const saved = savedPrompts.find((s: SavedPrompt) => s.id === id);
    if (saved) return { source: 'saved' as const, data: saved };
    return null;
  }, [id, savedPrompts]);

  const prompt = useMemo(() => (item ? getPromptText(item) : ''), [item]);
  const promptSegments = useMemo(() => parseSegments(prompt), [prompt]);

  const handleCopy = useCallback(async (text: string, index?: number) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success('Copied!');
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  }, [toast]);

  const handleCopyFull = useCallback(async () => {
    await Clipboard.setStringAsync(prompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFullCopied(true);
    toast.success(t.create.copied);
    setTimeout(() => setFullCopied(false), 2000);
  }, [prompt, toast, t]);

  const handleShare = useCallback(async () => {
    if (!prompt) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: prompt,
        title: item?.data.title || 'Prompt from Promptia',
      });
    } catch {
      // User cancelled
    }
  }, [prompt, item]);

  const handleRemix = useCallback(() => {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newInputs = {
      ...DEFAULT_INPUTS,
      objective: item.source === 'gallery' ? item.data.prompt : item.data.finalPrompt,
      model: item.data.model,
      objectiveChips: item.data.tags.slice(0, 3),
    };
    if (item.source === 'gallery') {
      newInputs.style = item.data.style;
    } else if (item.data.inputs?.style) {
      newInputs.style = item.data.inputs.style;
    }
    setCurrentInputs(newInputs);
    router.dismiss();
    setTimeout(() => { router.navigate('/(tabs)/(builder)' as any); }, 150);
  }, [item, setCurrentInputs, router]);

  if (!item) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.bg }]}>
        <Text style={[styles.notFound, { color: colors.textTertiary, fontFamily: 'Inter_500Medium' }]}>
          {t.detail.notFound}
        </Text>
      </View>
    );
  }

  const title = item.data.title;
  const model = item.data.model;
  const tags = item.data.tags;
  const modelColor = MODEL_COLORS[model as ModelType] ?? '#E8795A';
  const hasImage = item.source === 'gallery' && item.data.thumbnail;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {hasImage && item.source === 'gallery' && (
          <View style={styles.heroImage}>
            <Image source={{ uri: item.data.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          </View>
        )}

        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_800ExtraBold' }]}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.modelBadge, { backgroundColor: isDark ? `${modelColor}20` : `${modelColor}12` }]}>
              <Text style={[styles.modelText, { color: modelColor, fontFamily: 'Inter_700Bold' }]}>{getModelLabel(model)}</Text>
            </View>
            {item.source === 'gallery' && (
              <View style={styles.authorRow}>
                <User size={12} color={colors.textTertiary} />
                <Text style={[styles.authorText, { color: colors.textTertiary }]}>{item.data.author}</Text>
              </View>
            )}
            {item.source === 'gallery' && item.data.isEditorPick && (
              <View style={[styles.pickBadge, { backgroundColor: isDark ? 'rgba(212,148,58,0.15)' : '#FFF5E0' }]}>
                <Star size={10} color="#D4943A" fill="#D4943A" />
                <Text style={[styles.pickText, { fontFamily: 'Inter_700Bold' }]}>{t.detail.editorPick}</Text>
              </View>
            )}
            {item.source === 'gallery' && (
              <View style={styles.likesRow}>
                <Heart size={12} color="#E06B8B" />
                <Text style={[styles.likesText, { color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>
                  {item.data.likes.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.segmentsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: 'Inter_700Bold' }]}>
            {t.detail.promptSegments}
          </Text>
          {promptSegments.map((seg, i) => {
            const segBgs = ['#FFF0ED', '#F0FAF6', '#F4F0FF', '#EFF6FF', '#FFF3E8'];
            const segBg = isDark ? colors.card : segBgs[i % segBgs.length];
            return (
              <View key={i} style={[styles.segmentCard, { backgroundColor: segBg }, isDark && { borderColor: colors.cardBorder, borderWidth: 1 }]}>
                <View style={styles.segmentHeader}>
                  <Text style={[styles.segmentLabel, { color: modelColor, fontFamily: 'Inter_700Bold' }]}>{seg.label}</Text>
                  <Pressable
                    onPress={() => handleCopy(seg.content, i)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={[styles.copyBtn, { backgroundColor: isDark ? colors.bgTertiary : '#FFFFFF' }, copiedIndex === i && { backgroundColor: 'rgba(52,167,123,0.12)' }]}
                    accessibilityLabel="Copy segment"
                  >
                    {copiedIndex === i ? <Check size={14} color="#34A77B" /> : <Copy size={14} color={colors.textSecondary} />}
                  </Pressable>
                </View>
                <Text style={[styles.segmentContent, { color: colors.text, fontFamily: 'Inter_400Regular' }]} selectable>
                  {seg.content}
                </Text>
              </View>
            );
          })}
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.tagHeader}>
              <Tag size={14} color={colors.textTertiary} />
              <Text style={[styles.sectionTitle, { color: colors.textTertiary, fontFamily: 'Inter_700Bold' }]}>{t.detail.tags}</Text>
            </View>
            <View style={styles.tagRow}>
              {tags.map((tag: string) => (
                <View key={tag} style={[styles.tag, { backgroundColor: isDark ? colors.bgSecondary : '#FFF5EE' }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Pressable
            onPress={handleCopyFull}
            style={({ pressed }: { pressed: boolean }) => [
              styles.primaryAction,
              { backgroundColor: isDark ? '#E8795A' : '#1A1A1A' },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              fullCopied && { backgroundColor: '#34A77B' },
            ]}
            accessibilityLabel="Copy full prompt"
            accessibilityRole="button"
          >
            {fullCopied ? <Check size={18} color="#FFF" /> : <Copy size={18} color="#FFF" />}
            <Text style={[styles.primaryActionText, { fontFamily: 'Inter_700Bold' }]}>
              {fullCopied ? t.create.copied : t.detail.copyFull}
            </Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }: { pressed: boolean }) => [
                styles.secondaryAction,
                { backgroundColor: isDark ? colors.bgSecondary : '#EBF3FE', flex: 1 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityLabel="Share prompt"
            >
              <Share2 size={16} color="#4A8FE7" />
              <Text style={[styles.secondaryActionText, { color: '#4A8FE7', fontFamily: 'Inter_700Bold' }]}>Share</Text>
            </Pressable>

            <Pressable
              onPress={handleRemix}
              style={({ pressed }: { pressed: boolean }) => [
                styles.secondaryAction,
                { backgroundColor: isDark ? colors.bgSecondary : '#FFF0ED', flex: 1 },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityLabel="Remix in builder"
            >
              <Shuffle size={16} color="#E8795A" />
              <Text style={[styles.secondaryActionText, { color: '#E8795A', fontFamily: 'Inter_700Bold' }]}>
                {t.detail.remixBuilder}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

export default function PromptDetailScreen() {
  return (
    <ErrorBoundary fallbackTitle="Detail Error">
      <PromptDetailContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 16 },
  heroImage: { width: '100%', height: 220, position: 'relative' },
  headerSection: { paddingHorizontal: 20, marginBottom: 24, gap: 12, marginTop: 8 },
  title: { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  modelBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  modelText: { fontSize: 12, letterSpacing: 0.3 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorText: { fontSize: 12 },
  pickBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pickText: { fontSize: 11, color: '#D4943A' },
  likesRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likesText: { fontSize: 12 },
  segmentsSection: { gap: 12, marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8 },
  segmentCard: { padding: 18, borderRadius: 20 },
  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  segmentLabel: { fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  copyBtn: { padding: 8, borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  segmentContent: { fontSize: 14, lineHeight: 22 },
  tagsSection: { marginBottom: 24, gap: 10, paddingHorizontal: 20 },
  tagHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 },
  tagText: { fontSize: 13 },
  actionsSection: { gap: 10, paddingHorizontal: 20 },
  primaryAction: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#FFF', fontSize: 16 },
  secondaryActions: { flexDirection: 'row', gap: 10 },
  secondaryAction: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionText: { fontSize: 15 },
  bottomPad: { height: 40 },
});
