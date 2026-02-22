import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { MessageSquare, Palette, ImageIcon, Video } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { colors } = useTheme();
  const scaleAnim = useSharedValue(1);
  const Icon = model.icon;

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    scaleAnim.value = withSpring(0.9, { damping: 10, stiffness: 300 }, () => {
      scaleAnim.value = withSpring(1);
    });
    onPress();
  }, [onPress, scaleAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Animated.View style={[styles.itemWrapper, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.item,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          isSelected && { backgroundColor: colors.coralDim, borderColor: colors.coral }
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {isSelected && (
          <LinearGradient
            colors={[colors.coral + '20', colors.coral + '00']}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <Icon size={24} color={isSelected ? colors.coral : colors.textSecondary} />
        <Text style={[
          styles.label,
          { color: colors.textTertiary },
          isSelected && { color: colors.coral }
        ]}>
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
    gap: 12,
  },
  itemWrapper: {
    flex: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  label: {
    fontSize: 11,
    fontWeight: '800' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
});
