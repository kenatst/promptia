import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
  accent?: boolean;
  accentColor?: string;
  variant?: 'default' | 'elevated' | 'highlighted';
}

function GlassCardComponent({ children, style, noPadding, accent, accentColor, variant = 'default' }: GlassCardProps) {
  const borderColor = accent
    ? (accentColor ? `${accentColor}40` : Colors.borderAccent)
    : variant === 'highlighted' ? Colors.glassBorderLight : Colors.glassBorder;

  const bgColors: [string, string] = accent
    ? [`${accentColor || Colors.accent}10`, 'rgba(255,255,255,0.02)']
    : variant === 'elevated'
      ? [Colors.cardGradientStart, 'rgba(255,255,255,0.03)']
      : variant === 'highlighted'
        ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']
        : [Colors.cardGradientStart, Colors.cardGradientEnd];

  return (
    <View style={[styles.wrapper, { borderColor }, style]}>
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.gradient, !noPadding && styles.padding]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

export const GlassCard = React.memo(GlassCardComponent);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  gradient: {
    width: '100%',
  },
  padding: {
    padding: 18,
  },
});
