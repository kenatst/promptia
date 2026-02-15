import React, { useCallback, useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Copy, Heart, Pencil, Trash2 } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import Colors from '@/constants/colors';
import { getCategoryLabel } from '@/data/gallerySeed';
import { getModelLabel } from '@/engine/promptEngine';
import { Prompt } from '@/types/prompt';
import { GlassCard } from './GlassCard';

interface PromptCardProps {
  prompt: Prompt;
  variant: 'gallery' | 'library';
  onPress: (prompt: Prompt) => void;
  onRemix?: (prompt: Prompt) => void;
  onCopy?: (prompt: Prompt) => void;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onSave?: (prompt: Prompt) => void;
  onShare?: (prompt: Prompt) => void;
  onUseInBuilder?: (prompt: Prompt) => void;
  onRemoveTag?: (prompt: Prompt, tag: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function toRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);

  if (mins < 1) {
    return 'now';
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function PromptCardComponent({
  prompt,
  variant,
  onPress,
  onRemix,
  onCopy,
  onEdit,
  onDelete,
  onSave,
  onShare,
  onUseInBuilder,
  onRemoveTag,
}: PromptCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const preview = useMemo(() => {
    const source = prompt.concisePrompt || prompt.fullPrompt;
    return source.replace(/\s+/g, ' ').trim();
  }, [prompt.concisePrompt, prompt.fullPrompt]);

  const visibleTags = useMemo(() => prompt.tags.slice(0, 4), [prompt.tags]);
  const remainingTags = useMemo(() => Math.max(0, prompt.tags.length - visibleTags.length), [prompt.tags.length, visibleTags.length]);

  const onLongPress = useCallback(() => {
    if (variant !== 'gallery') {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Prompt actions', prompt.title, [
      onUseInBuilder
        ? {
            text: 'Use in Builder',
            onPress: () => onUseInBuilder(prompt),
          }
        : undefined,
      onSave
        ? {
            text: 'Save to Library',
            onPress: () => onSave(prompt),
          }
        : undefined,
      onShare
        ? {
            text: 'Share',
            onPress: () => onShare(prompt),
          }
        : undefined,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean) as { text: string; onPress?: () => void; style?: 'cancel' | 'default' | 'destructive' }[]);
  }, [onSave, onShare, onUseInBuilder, prompt, variant]);

  const badgeColor = prompt.accentColor;

  return (
    <AnimatedPressable style={animatedStyle} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Pressable
        onPress={() => onPress(prompt)}
        onLongPress={onLongPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <GlassCard variant="interactive" noPadding>
          <View style={styles.row}>
            <View style={[styles.accentBar, { backgroundColor: badgeColor }]} />
            <View style={styles.content}>
              <View style={styles.headerRow}>
                <View style={styles.badges}>
                  <View style={[styles.categoryBadge, { borderColor: `${badgeColor}70`, backgroundColor: `${badgeColor}22` }]}>
                    <Text style={[styles.categoryBadgeText, { color: badgeColor }]}>{getCategoryLabel(prompt.category)}</Text>
                  </View>
                  <Text style={styles.modelText}>{getModelLabel(prompt.model)}</Text>
                </View>
                {variant === 'library' ? <Text style={styles.timeText}>{toRelativeTime(prompt.createdAt)}</Text> : null}
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {prompt.title}
              </Text>

              <View style={styles.previewWrap}>
                <Text style={styles.preview} numberOfLines={variant === 'gallery' ? 2 : 1}>
                  {preview}
                </Text>
                <View pointerEvents="none" style={styles.previewFade} />
              </View>

              <View style={styles.tagsRow}>
                {visibleTags.map((tag) => (
                  <Pressable
                    key={`${prompt.id}-${tag}`}
                    onLongPress={
                      variant === 'library' && onRemoveTag
                        ? () => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onRemoveTag(prompt, tag);
                          }
                        : undefined
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </Pressable>
                ))}
                {remainingTags > 0 ? (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>+{remainingTags}</Text>
                  </View>
                ) : null}
              </View>

              {variant === 'gallery' ? (
                <View style={styles.footerRow}>
                  <View style={styles.likesWrap}>
                    <Heart size={13} color={Colors.pink} fill={Colors.pink} />
                    <Text style={styles.likesText}>{prompt.likeCount.toLocaleString()}</Text>
                  </View>
                  <Pressable
                    onPress={() => onRemix?.(prompt)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.remixButton}
                  >
                    <Text style={styles.remixText}>Remix →</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.footerRow}>
                  <View style={styles.inlineActions}>
                    <Pressable onPress={() => onCopy?.(prompt)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                      <Copy size={13} color={Colors.textSecondary} />
                      <Text style={styles.actionText}>Copy</Text>
                    </Pressable>
                    <Pressable onPress={() => onEdit?.(prompt)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                      <Pencil size={13} color={Colors.textSecondary} />
                      <Text style={styles.actionText}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => onDelete?.(prompt)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actionBtn}>
                      <Trash2 size={13} color={Colors.danger} />
                      <Text style={[styles.actionText, { color: Colors.danger }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </AnimatedPressable>
  );
}

export const PromptCard = React.memo(PromptCardComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  accentBar: {
    width: 3,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modelText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  previewWrap: {
    position: 'relative',
  },
  preview: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  previewFade: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: 'rgba(8,8,8,0.65)',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tagText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likesWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  likesText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  remixButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  remixText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
  inlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
