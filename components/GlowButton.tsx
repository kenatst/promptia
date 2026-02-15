import React, { ReactNode, useCallback, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import Colors from '@/constants/colors';

type GlowButtonVariant = 'primary' | 'secondary' | 'destructive';
type GlowButtonSize = 'large' | 'medium' | 'small';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  variant?: GlowButtonVariant;
  size?: GlowButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GlowButtonComponent({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  iconLeft,
  iconRight,
  disabled = false,
  fullWidth = false,
  style,
}: GlowButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled) {
      return;
    }
    scale.value = withSpring(0.95, { damping: 18, stiffness: 280 });
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled) {
      return;
    }
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });
  }, [disabled, scale]);

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeStyle = useMemo(() => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'medium':
        return styles.medium;
      default:
        return styles.large;
    }
  }, [size]);

  const textStyle = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'destructive':
        return styles.textDestructive;
      default:
        return styles.textPrimary;
    }
  }, [variant]);

  const containerStyle = useMemo(() => {
    switch (variant) {
      case 'secondary':
        return [styles.base, styles.secondaryContainer, sizeStyle] as const;
      case 'destructive':
        return [styles.base, styles.destructiveContainer, sizeStyle] as const;
      default:
        return [styles.base, styles.primaryContainer, sizeStyle] as const;
    }
  }, [sizeStyle, variant]);

  const gradientColors = useMemo(() => {
    switch (variant) {
      case 'destructive':
        return ['#EF4444', '#B91C1C'] as const;
      case 'primary':
      default:
        return ['#FBBF24', '#F59E0B', '#D97706'] as const;
    }
  }, [variant]);

  const inner = (
    <View style={[containerStyle, fullWidth && styles.fullWidth, disabled && styles.disabled]}>
      {variant === 'primary' || variant === 'destructive' ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      ) : null}
      <View style={styles.row}>
        {iconLeft}
        <Text style={[styles.text, textStyle]} numberOfLines={1}>
          {title}
        </Text>
        {iconRight}
      </View>
    </View>
  );

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[animatedStyle, fullWidth && styles.fullWidth, style]}
      disabled={disabled}
    >
      {inner}
    </AnimatedPressable>
  );
}

export const GlowButton = React.memo(GlowButtonComponent);

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  primaryContainer: {
    borderColor: 'rgba(251, 191, 36, 0.50)',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  secondaryContainer: {
    backgroundColor: 'rgba(130, 90, 255, 0.10)',
    borderColor: 'rgba(130, 90, 255, 0.22)',
  },
  destructiveContainer: {
    borderColor: 'rgba(239, 68, 68, 0.50)',
    shadowColor: '#EF4444',
    shadowOpacity: 0.40,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: '#1A0E00',
  },
  textSecondary: {
    color: Colors.text,
  },
  textDestructive: {
    color: '#fff',
  },
  large: {
    minHeight: 56,
    width: '100%',
  },
  medium: {
    minHeight: 50,
  },
  small: {
    minHeight: 40,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});
