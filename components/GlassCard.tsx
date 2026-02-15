import React, { ReactNode, useCallback, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Colors from '@/constants/colors';

type GlassVariant = 'default' | 'elevated' | 'interactive';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  variant?: GlassVariant;
  accent?: boolean;
  accentColor?: string;
  noPadding?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GlassCardComponent({
  children,
  style,
  contentStyle,
  variant = 'default',
  accent = false,
  accentColor,
  noPadding = false,
  onPress,
  disabled = false,
}: GlassCardProps) {
  const interactive = variant === 'interactive' || Boolean(onPress);
  const progress = useSharedValue(0);

  const onPressIn = useCallback(() => {
    if (!interactive || disabled) {
      return;
    }
    progress.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [disabled, interactive, progress]);

  const onPressOut = useCallback(() => {
    if (!interactive || disabled) {
      return;
    }
    progress.value = withSpring(0, { damping: 15, stiffness: 200 });
  }, [disabled, interactive, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [1, 0.97]);
    const opacity = interpolate(progress.value, [0, 1], [1, 0.85]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const borderColor = useMemo(() => {
    if (accentColor || accent) {
      return `${accentColor ?? Colors.accent}55`;
    }
    if (variant === 'elevated') {
      return Colors.glassBorderLight;
    }
    return Colors.glassBorder;
  }, [accent, accentColor, variant]);

  const glowStyle = useMemo(() => {
    if (variant === 'elevated' || Boolean(accentColor) || accent) {
      return {
        shadowColor: accentColor ?? Colors.purple,
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      };
    }
    return {
      shadowColor: Colors.purple,
      shadowOpacity: 0.12,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    };
  }, [accent, accentColor, variant]);

  const sharedProps = {
    onPressIn,
    onPressOut,
    onPress,
    disabled,
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
  } as const;

  const content = (
    <View style={[styles.content, noPadding ? styles.noPadding : styles.padding, contentStyle]}>
      <LinearGradient
        colors={['rgba(160, 130, 255, 0.10)', 'rgba(130, 90, 255, 0.02)', 'rgba(130, 90, 255, 0.00)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.innerHighlight}
      />
      {children}
    </View>
  );

  if (interactive) {
    return (
      <AnimatedPressable {...sharedProps} style={[styles.wrapper, { borderColor }, glowStyle, style, animatedStyle]}>
        {content}
      </AnimatedPressable>
    );
  }

  return <Animated.View style={[styles.wrapper, { borderColor }, glowStyle, style]}>{content}</Animated.View>;
}

export const GlassCard = React.memo(GlassCardComponent);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: 'rgba(20, 16, 48, 0.65)',
    elevation: 12,
  },
  content: {
    position: 'relative',
    backgroundColor: 'rgba(130, 90, 255, 0.04)',
  },
  padding: {
    padding: 18,
  },
  noPadding: {
    padding: 0,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    zIndex: 1,
  },
});
