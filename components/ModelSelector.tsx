import React, { useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MessageSquare, Palette, ImageIcon, Video } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { ModelType } from '@/types/prompt';

interface ModelSelectorProps {
  selected: ModelType;
  onSelect: (model: ModelType) => void;
}

const models: { key: ModelType; label: string; icon: any }[] = [
  { key: 'chatgpt', label: 'ChatGPT', icon: MessageSquare },
  { key: 'midjourney', label: 'Midjourney', icon: Palette },
  { key: 'sdxl', label: 'SDXL', icon: ImageIcon },
  { key: 'video', label: 'Video AI', icon: Video },
];

function ModelSelectorComponent({ selected, onSelect }: ModelSelectorProps) {
  return (
    <View style={styles.container}>
      {models.map((m) => (
        <ModelItem
          key={m.key}
          model={m}
          isSelected={selected === m.key}
          onPress={() => onSelect(m.key)}
        />
      ))}
    </View>
  );
}

interface ModelItemProps {
  model: typeof models[number];
  isSelected: boolean;
  onPress: () => void;
}

function ModelItemComponent({ model, isSelected, onPress }: ModelItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const Icon = model.icon;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Animated.View style={[styles.itemWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Icon size={24} color={isSelected ? Colors.accent : Colors.textSecondary} />
        <Text style={[styles.label, isSelected && styles.labelSelected]}>
          {model.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ModelItem = React.memo(ModelItemComponent);
export const ModelSelector = React.memo(ModelSelectorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  itemWrapper: {
    flex: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 8,
  },
  itemSelected: {
    backgroundColor: Colors.accentDim,
    borderColor: Colors.accent,
  },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  labelSelected: {
    color: Colors.accent,
  },
});
