import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, User, Tag, Sparkles, Shuffle, Heart, Check } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { gallerySeed, CREATION_CATEGORIES } from '@/data/gallerySeed';
import { usePromptStore } from '@/store/promptStore';
import { getModelLabel } from '@/engine/promptEngine';
import { GalleryItem, SavedPrompt, ModelType, DEFAULT_INPUTS } from '@/types/prompt';
import Colors from '@/constants/colors';

const MODEL_COLORS: Record<ModelType, string> = {
  chatgpt: Colors.accent,
  midjourney: Colors.secondary,
  sdxl: Colors.cyan,
  video: Colors.pink,
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
        segments.push({
          label: currentLabel || 'Content',
          content: currentContent.join('\n').trim(),
        });
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
    segments.push({
      label: currentLabel || 'Content',
      content: currentContent.join('\n').trim(),
    });
  }

  if (segments.length === 0) {
    segments.push({ label: 'Prompt', content: prompt });
  }

  return segments;
}

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedPrompts, setCurrentInputs } = usePromptStore();
  const router = useRouter();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);
  const [fullCopied, setFullCopied] = React.useState(false);

  const item = useMemo(() => {
    const gallery = gallerySeed.find((g) => g.id === id);
    if (gallery) return { source: 'gallery' as const, data: gallery };

    const saved = savedPrompts.find((s) => s.id === id);
    if (saved) return { source: 'saved' as const, data: saved };

    return null;
  }, [id, savedPrompts]);

  const prompt = useMemo(() => (item ? getPromptText(item) : ''), [item]);
  const promptSegments = useMemo(() => parseSegments(prompt), [prompt]);

  const handleCopy = useCallback(async (text: string, index?: number) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    }
  }, []);

  const handleCopyFull = useCallback(async () => {
    await Clipboard.setStringAsync(prompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFullCopied(true);
    setTimeout(() => setFullCopied(false), 2000);
  }, [prompt]);

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
    setTimeout(() => {
      router.navigate('/(tabs)/(builder)' as any);
    }, 150);
  }, [item, setCurrentInputs, router]);

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFound}>Prompt not found</Text>
      </View>
    );
  }

  const title = item.data.title;
  const model = item.data.model;
  const tags = item.data.tags;
  const modelColor = MODEL_COLORS[model] ?? Colors.accent;
  const hasImage = item.source === 'gallery' && item.data.thumbnail;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FAFAFA', '#FEFCF8', '#FFFBF2']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {hasImage && item.source === 'gallery' && (
          <View style={styles.heroImage}>
            <Image
              source={{ uri: item.data.thumbnail }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', '#FAFAFA']}
              style={styles.heroGradient}
            />
          </View>
        )}

        <View style={styles.headerSection}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.modelBadge, { backgroundColor: `${modelColor}15`, borderColor: `${modelColor}30` }]}>
              <Text style={[styles.modelText, { color: modelColor }]}>{getModelLabel(model)}</Text>
            </View>
            {item.source === 'gallery' && (
              <View style={styles.authorRow}>
                <User size={12} color={Colors.textTertiary} />
                <Text style={styles.authorText}>{item.data.author}</Text>
              </View>
            )}
            {item.source === 'gallery' && item.data.isEditorPick && (
              <View style={styles.pickBadge}>
                <Sparkles size={10} color="#D97706" />
                <Text style={styles.pickText}>Editor Pick</Text>
              </View>
            )}
            {item.source === 'gallery' && (
              <View style={styles.likesRow}>
                <Heart size={12} color={Colors.pink} />
                <Text style={styles.likesText}>{item.data.likes.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.segmentsSection}>
          <Text style={styles.sectionTitle}>Prompt Segments</Text>
          {promptSegments.map((seg, i) => (
            <GlassCard key={i} variant="3d-light" style={styles.segmentCard}>
              <View style={styles.segmentHeader}>
                <Text style={[styles.segmentLabel, { color: modelColor }]}>{seg.label}</Text>
                <Pressable
                  onPress={() => handleCopy(seg.content, i)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.copyBtn, copiedIndex === i && { backgroundColor: Colors.tertiaryDim }]}
                >
                  {copiedIndex === i ? (
                    <Check size={14} color={Colors.tertiary} />
                  ) : (
                    <Copy size={14} color={Colors.textSecondary} />
                  )}
                </Pressable>
              </View>
              <Text style={styles.segmentContent} selectable>{seg.content}</Text>
            </GlassCard>
          ))}
        </View>

        {tags.length > 0 && (
          <View style={styles.tagsSection}>
            <View style={styles.tagHeader}>
              <Tag size={14} color={Colors.textTertiary} />
              <Text style={styles.sectionTitle}>Tags</Text>
            </View>
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Pressable
            onPress={handleCopyFull}
            style={({ pressed }) => [
              styles.primaryAction,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              fullCopied && { backgroundColor: Colors.tertiary },
            ]}
          >
            {fullCopied ? <Check size={18} color="#FFF" /> : <Copy size={18} color="#FFF" />}
            <Text style={styles.primaryActionText}>
              {fullCopied ? 'Copied!' : 'Copy Full Prompt'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleRemix}
            style={({ pressed }) => [
              styles.secondaryAction,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Shuffle size={16} color="#111827" />
            <Text style={styles.secondaryActionText}>Remix in Builder</Text>
          </Pressable>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    gap: 12,
  },
  notFound: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  heroImage: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#111827',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  modelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  modelText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  pickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  pickText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#D97706',
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600' as const,
  },
  segmentsSection: {
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  segmentCard: {
    padding: 16,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  copyBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  segmentContent: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
  },
  tagsSection: {
    marginBottom: 24,
    gap: 10,
    paddingHorizontal: 20,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  actionsSection: {
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryAction: {
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  primaryActionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  secondaryAction: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
  },
  secondaryActionText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  bottomPad: {
    height: 40,
  },
});
