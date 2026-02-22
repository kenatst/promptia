import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

interface VisualCategoryProps {
  label: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  index: number;
}

export function VisualCategory({ label, icon, selected, onPress, index }: VisualCategoryProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  // Instead of static tailwind colors, use ThemeContext colors
  const bgColor = isDark
    ? (selected ? colors.glassBg : colors.card)
    : (selected ? colors.cardMint : colors.card);

  const selectedBorderColor = isDark ? colors.glassBorder : colors.coral;

  useEffect(() => {
    scale.value = withSpring(selected ? 1.05 : 1, { damping: 15, stiffness: 300 });
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.container}>
      {isDark ? (
        <Animated.View style={[animatedStyle, styles.circleOuter, selected && { borderColor: selectedBorderColor }]}>
          <BlurView intensity={40} tint="dark" style={[styles.circle, { backgroundColor: bgColor }]}>
            {icon}
          </BlurView>
        </Animated.View>
      ) : (
        <Animated.View
          style={[
            styles.circleOuter,
            { backgroundColor: bgColor, borderColor: colors.cardBorder },
            selected && { borderColor: selectedBorderColor },
            animatedStyle,
          ]}
        >
          <Animated.View style={styles.circle}>
            {icon}
          </Animated.View>
        </Animated.View>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }, selected && [styles.labelSelected, { color: colors.text }]]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    width: 80,
  },
  circleOuter: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  circle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  labelSelected: {
    fontWeight: '800' as const,
  },
});
