import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  testID?: string;
  fullWidth?: boolean;
}

function GlassButtonComponent({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  style,
  disabled,
  testID,
  fullWidth,
}: GlassButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: Colors.accent, borderColor: Colors.accentGlow },
    secondary: { backgroundColor: 'rgba(0,0,0,0.04)', borderColor: Colors.glassBorder },
    ghost: { backgroundColor: 'transparent', borderColor: Colors.glassBorder },
    danger: { backgroundColor: Colors.dangerDim, borderColor: 'rgba(220, 75, 75, 0.3)' },
    accent: { backgroundColor: Colors.accentDim, borderColor: Colors.accentGlow },
    glass: { backgroundColor: Colors.glass, borderColor: Colors.glassBorder },
  };

  const textColorMap: Record<string, string> = {
    primary: Colors.textInverse,
    secondary: Colors.text,
    ghost: Colors.textSecondary,
    danger: Colors.danger,
    accent: Colors.accent,
    glass: Colors.text,
  };

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: 8, paddingHorizontal: 14 },
    md: { paddingVertical: 13, paddingHorizontal: 22 },
    lg: { paddingVertical: 16, paddingHorizontal: 28 },
  };

  const fontSizes: Record<string, number> = { sm: 13, md: 15, lg: 17 };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && { flex: 1 }]}>
      <TouchableOpacity
        style={[
          styles.base,
          variantStyles[variant],
          sizeStyles[size],
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        testID={testID}
      >
        {icon}
        <Text
          style={[
            styles.text,
            { color: textColorMap[variant], fontSize: fontSizes[size] },
          ]}
        >
          {label}
        </Text>
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </TouchableOpacity>
    </Animated.View>
  );
}

export const GlassButton = React.memo(GlassButtonComponent);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.4,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700' as const,
  },
  iconRight: {
    marginLeft: 4,
  },
});
