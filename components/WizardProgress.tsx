import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Colors from '@/constants/colors';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

function WizardProgressComponent({ currentStep, totalSteps, stepLabels }: WizardProgressProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep + 1) / totalSteps,
      useNativeDriver: false,
      speed: 12,
      bounciness: 2,
    }).start();
  }, [currentStep, totalSteps, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>{stepLabels[currentStep]}</Text>
        <Text style={styles.stepCount}>
          {currentStep + 1}<Text style={styles.stepTotal}>/{totalSteps}</Text>
        </Text>
      </View>
      <View style={styles.trackOuter}>
        <Animated.View style={[styles.trackFill, { width: progressWidth }]}>
          <View style={styles.trackGlow} />
        </Animated.View>
      </View>
      <View style={styles.dotsRow}>
        {stepLabels.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i <= currentStep && styles.dotActive,
              i === currentStep && styles.dotCurrent,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export const WizardProgress = React.memo(WizardProgressComponent);

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  stepCount: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.accent,
  },
  stepTotal: {
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  trackOuter: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.glass,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.accent,
    position: 'relative',
  },
  trackGlow: {
    position: 'absolute',
    right: 0,
    top: -2,
    bottom: -2,
    width: 12,
    borderRadius: 6,
    backgroundColor: Colors.accentGlow,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.glass,
  },
  dotActive: {
    backgroundColor: Colors.accentDim,
  },
  dotCurrent: {
    backgroundColor: Colors.accent,
    width: 18,
    borderRadius: 4,
  },
});
