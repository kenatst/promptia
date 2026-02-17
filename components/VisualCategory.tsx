import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const CIRCLE_COLORS = [
  '#D1FAE5',
  '#FFEDD5',
  '#FEF3C7',
  '#EDE9FE',
  '#FCE7F3',
  '#DBEAFE',
];

interface VisualCategoryProps {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  index: number;
}

export function VisualCategory({ label, icon, selected, onPress, index }: VisualCategoryProps) {
  const scale = useSharedValue(1);
  const bgColor = CIRCLE_COLORS[index % CIRCLE_COLORS.length];

  useEffect(() => {
    scale.value = withSpring(selected ? 1.1 : 1, { damping: 12, stiffness: 200 });
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: bgColor },
          selected && styles.circleSelected,
          animatedStyle,
        ]}
      >
        {icon}
      </Animated.View>
      <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
    width: 76,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleSelected: {
    borderColor: '#111827',
  },
  emojiText: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  labelSelected: {
    color: '#111827',
    fontWeight: '700' as const,
  },
});
