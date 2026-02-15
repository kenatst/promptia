import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface ChipGroupProps {
  chips: string[];
  selected: string[];
  onToggle: (chip: string) => void;
  multiSelect?: boolean;
  scrollable?: boolean;
  accentColor?: string;
  accentDimColor?: string;
}

function ChipGroupComponent({
  chips,
  selected,
  onToggle,
  multiSelect = true,
  scrollable = true,
  accentColor = Colors.accent,
  accentDimColor = Colors.accentDim,
}: ChipGroupProps) {
  const renderChip = useCallback((chip: string) => {
    const isSelected = selected.includes(chip);
    return (
      <ChipItem
        key={chip}
        label={chip}
        isSelected={isSelected}
        onPress={() => onToggle(chip)}
        accentColor={accentColor}
        accentDimColor={accentDimColor}
      />
    );
  }, [selected, onToggle, accentColor, accentDimColor]);

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {chips.map(renderChip)}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {chips.map(renderChip)}
    </View>
  );
}

interface ChipItemProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  accentColor: string;
  accentDimColor: string;
}

function ChipItemComponent({ label, isSelected, onPress, accentColor, accentDimColor }: ChipItemProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
    onPress();
  }, [onPress, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.chip,
          isSelected && { backgroundColor: accentDimColor, borderColor: `${accentColor}50` },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, isSelected && { color: accentColor }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ChipItem = React.memo(ChipItemComponent);
export const ChipGroup = React.memo(ChipGroupComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: 2,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
