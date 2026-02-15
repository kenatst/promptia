import React, { useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Search, Heart, Copy, Trash2, Wand2, X, Bookmark } from 'lucide-react-native';
import { usePromptStore } from '@/store/promptStore';
import { SavedPrompt, ModelType } from '@/types/prompt';
import { getModelLabel } from '@/engine/promptEngine';
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

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { savedPrompts, searchQuery, setSearchQuery, toggleFavorite, deletePrompt, loadInputsFromPrompt } = usePromptStore();
  const router = useRouter();

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return savedPrompts;
    const q = searchQuery.toLowerCase();
    return savedPrompts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.finalPrompt.toLowerCase().includes(q)
    );
  }, [savedPrompts, searchQuery]);

  const handleCopy = useCallback(async (prompt: SavedPrompt) => {
    await Clipboard.setStringAsync(prompt.finalPrompt);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Prompt copied to clipboard');
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Prompt', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePrompt(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [deletePrompt]);

  const handleRemix = useCallback((prompt: SavedPrompt) => {
    loadInputsFromPrompt(prompt);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/(builder)');
  }, [loadInputsFromPrompt, router]);

  const renderItem = useCallback(({ item }: { item: SavedPrompt }) => (
    <SavedCard
      item={item}
      onCopy={handleCopy}
      onDelete={handleDelete}
      onFavorite={toggleFavorite}
      onRemix={handleRemix}
    />
  ), [handleCopy, handleDelete, toggleFavorite, handleRemix]);

  const keyExtractor = useCallback((item: SavedPrompt) => item.id, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientMid, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Library</Text>
        <Text style={styles.headerSub}>Your saved prompts</Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Search size={18} color={Colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search prompts..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.countText}>
              {filtered.length} prompt{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Bookmark size={32} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No saved prompts yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a prompt in the builder and save it here
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

interface SavedCardProps {
  item: SavedPrompt;
  onCopy: (item: SavedPrompt) => void;
  onDelete: (id: string) => void;
  onFavorite: (id: string) => void;
  onRemix: (item: SavedPrompt) => void;
}

const SavedCard = React.memo(function SavedCard({ item, onCopy, onDelete, onFavorite, onRemix }: SavedCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modelColor = MODEL_COLORS[item.model] ?? Colors.accent;

  const timeAgo = useMemo(() => {
    const diff = Date.now() - item.createdAt;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [item.createdAt]);

  const emoji = MODEL_EMOJIS[item.model] ?? '💬';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
        activeOpacity={0.9}
      >
        <View style={styles.card}>
          <View style={[styles.cardAccentLine, { backgroundColor: modelColor }]} />
          <View style={styles.cardInner}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.cardEmoji}>{emoji}</Text>
                <View style={[styles.modelTag, { backgroundColor: `${modelColor}18`, borderColor: `${modelColor}35` }]}>
                  <Text style={[styles.modelTagText, { color: modelColor }]}>{getModelLabel(item.model)}</Text>
                </View>
                <Text style={styles.timeText}>{timeAgo}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onFavorite(item.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={20}
                  color={item.isFavorite ? Colors.pink : Colors.textTertiary}
                  fill={item.isFavorite ? Colors.pink : 'none'}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardPrompt} numberOfLines={3}>{item.finalPrompt}</Text>

            {item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 4).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onCopy(item)}>
                <Copy size={14} color={Colors.accent} />
                <Text style={[styles.actionText, { color: Colors.accent }]}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onRemix(item)}>
                <Wand2 size={14} color={Colors.secondary} />
                <Text style={[styles.actionText, { color: Colors.secondary }]}>Edit</Text>
              </TouchableOpacity>
              <View style={styles.actionSpacer} />
              <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(item.id)}>
                <Trash2 size={14} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 15,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  listContent: {
    padding: 20,
  },
  separator: {
    height: 12,
  },
  searchSection: {
    marginBottom: 16,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.glass,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  countText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    maxWidth: 240,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    flexDirection: 'row',
  },
  cardAccentLine: {
    width: 3,
  },
  cardInner: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardEmoji: {
    fontSize: 16,
  },
  modelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  modelTagText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  cardPrompt: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: Colors.glassMedium,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
    paddingTop: 12,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  actionSpacer: {
    flex: 1,
  },
});
