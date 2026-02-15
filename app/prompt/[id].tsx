import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Copy, User, Tag, Sparkles, Shuffle, Heart } from 'lucide-react-native';
import { GlassCard } from '@/components/GlassCard';
import { GlassButton } from '@/components/GlassButton';
import { gallerySeed } from '@/data/gallerySeed';
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

const MODEL_EMOJIS: Record<string, string> = {
  chatgpt: '💬',
  midjourney: '🎨',
  sdxl: '🖼️',
  video: '🎬',
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

  const item = useMemo(() => {
    const gallery = gallerySeed.find((g) => g.id === id);
    if (gallery) return { source: 'gallery' as const, data: gallery };

    const saved = savedPrompts.find((s) => s.id === id);
    if (saved) return { source: 'saved' as const, data: saved };

    return null;
  }, [id, savedPrompts]);

  const prompt = useMemo(() => (item ? getPromptText(item) : ''), [item]);
  const promptSegments = useMemo(() => parseSegments(prompt), [prompt]);

  const handleCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Copied to clipboard');
  }, []);

  const handleRemix = useCallback(() => {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentInputs({
      ...DEFAULT_INPUTS,
      objective: item.data.title,
      model: item.data.model,
      objectiveChips: item.data.tags.slice(0, 3),
      style: item.source === 'gallery' ? item.data.style : (item.data.inputs?.style ?? ''),
    });
    router.back();
    setTimeout(() => router.push('/(tabs)/(builder)'), 100);
  }, [item, setCurrentInputs, router]);

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.notFound}>Prompt not found</Text>
      </View>
    );
  }

  const title = item.data.title;
  const model = item.data.model;
  const tags = item.data.tags;
  const emoji = MODEL_EMOJIS[model] ?? '💬';
  const modelColor = MODEL_COLORS[model] ?? Colors.accent;
  const hasImage = item.source === 'gallery' && item.data.thumbnail;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientMid, Colors.backgroundGradientEnd]}
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
              colors={['transparent', Colors.background]}
              style={styles.heroGradient}
            />
          </View>
        )}

        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.titleEmoji}>{emoji}</Text>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={[styles.modelBadge, { backgroundColor: `${modelColor}18`, borderColor: `${modelColor}35` }]}>
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
                <Sparkles size={10} color="#FFD700" />
                <Text style={styles.pickText}>Editor Pick</Text>
              </View>
            )}
            {item.source === 'gallery' && (
              <View style={styles.likesRow}>
                <Heart size={12} color={Colors.pink} fill={Colors.pink} />
                <Text style={styles.likesText}>{item.data.likes.toLocaleString()}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.segmentsSection}>
          <Text style={styles.sectionTitle}>Prompt Segments</Text>
          {promptSegments.map((seg, i) => (
            <GlassCard key={i}>
              <View style={styles.segmentHeader}>
                <Text style={[styles.segmentLabel, { color: modelColor }]}>{seg.label}</Text>
                <TouchableOpacity
                  onPress={() => handleCopy(seg.content)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.copyBtn}
                >
                  <Copy size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
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
          <GlassButton
            label="Copy Full Prompt"
            onPress={() => handleCopy(prompt)}
            variant="primary"
            size="lg"
            icon={<Copy size={18} color={Colors.textInverse} />}
            fullWidth
          />
          <GlassButton
            label="Remix in Builder"
            onPress={handleRemix}
            variant="accent"
            size="md"
            icon={<Shuffle size={16} color={Colors.accent} />}
            fullWidth
          />
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 30,
    flex: 1,
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
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  pickText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
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
    backgroundColor: Colors.glassMedium,
  },
  segmentContent: {
    fontSize: 14,
    color: Colors.text,
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
    backgroundColor: Colors.glassMedium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
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
  bottomPad: {
    height: 40,
  },
});
