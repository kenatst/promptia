import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'glass' | 'solid-gradient' | 'input-container' | '3d-light';
  accentColor?: string;
  noPadding?: boolean;
}

export function GlassCard({
  children,
  style,
  variant = '3d-light', // Default to new light style
  accentColor,
  noPadding = false,
}: GlassCardProps) {

  if (variant === 'input-container') {
    // The "Crafting a recipe" massive card - Light Mode
    return (
      <View style={[styles.inputContainer, style]}>
        <LinearGradient
          colors={['#FFFFFF', '#FFFBF2']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.content, noPadding && styles.noPadding]}>
          {children}
        </View>
      </View>
    );
  }

  if (variant === 'solid-gradient') {
    return (
      <View style={[styles.solidCard, style, Boolean(accentColor) && { backgroundColor: accentColor }]}>
        <View style={[styles.content, noPadding && styles.noPadding]}>
          {children}
        </View>
      </View>
    )
  }

  // Default "3D Light" Card
  return (
    <View style={[styles.lightCard, style]}>
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    // Strong Soft Shadow for 3D effect
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  solidCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3E8FF',
  },
  lightCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    // Clean Pop Shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  content: {
    padding: 20,
  },
  noPadding: {
    padding: 0,
  },
});
