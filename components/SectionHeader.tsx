import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

function SectionHeaderComponent({ title, subtitle, icon, rightElement }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.row}>
          {icon}
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightElement}
      </View>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export const SectionHeader = React.memo(SectionHeaderComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    paddingLeft: 28,
  },
});
