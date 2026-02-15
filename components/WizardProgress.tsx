import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import Colors from '@/constants/colors';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  accentColor?: string;
}

function WizardProgressComponent({ currentStep, totalSteps, stepLabels, accentColor = Colors.accent }: WizardProgressProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = useSharedValue(0);

  const normalizedStep = useMemo(() => {
    const min = 1;
    const max = Math.max(1, totalSteps);
    return Math.min(max, Math.max(min, currentStep));
  }, [currentStep, totalSteps]);

  const progressRatio = useMemo(() => {
    if (totalSteps <= 1) {
      return 1;
    }
    return (normalizedStep - 1) / (totalSteps - 1);
  }, [normalizedStep, totalSteps]);

  useEffect(() => {
    progress.value = withTiming(progressRatio, { duration: 250 });
  }, [progress, progressRatio]);

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const lineFillStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>{stepLabels[normalizedStep - 1] ?? 'Step'}</Text>
        <Text style={styles.headerCount}>
          {normalizedStep}
          <Text style={styles.headerTotal}>/{totalSteps}</Text>
        </Text>
      </View>

      <View style={styles.stepsWrap}>
        <View style={styles.track} onLayout={onTrackLayout}>
          <Animated.View style={[styles.trackFill, { backgroundColor: accentColor }, lineFillStyle]} />
        </View>

        <View style={styles.stepsRow}>
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < normalizedStep;
            const isActive = stepNumber === normalizedStep;

            return (
              <View style={styles.stepNode} key={`${label}-${stepNumber}`}>
                <View
                  style={[
                    styles.dot,
                    isComplete && styles.dotComplete,
                    isActive && styles.dotActive,
                    isActive && { borderColor: accentColor, shadowColor: accentColor },
                  ]}
                >
                  {isComplete ? <Text style={styles.check}>✓</Text> : null}
                </View>
                <Text style={[styles.stepLabel, isActive && { color: Colors.textSecondary }]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const WizardProgress = React.memo(WizardProgressComponent);

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerCount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accent,
  },
  headerTotal: {
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  stepsWrap: {
    position: 'relative',
    paddingTop: 2,
  },
  track: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  trackFill: {
    height: 2,
    borderRadius: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepNode: {
    width: 54,
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotComplete: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dotActive: {
    width: 14,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  check: {
    fontSize: 9,
    lineHeight: 10,
    color: '#2a1700',
    fontWeight: '900',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
