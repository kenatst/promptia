import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.code, { color: colors.textTertiary }]}>404</Text>
        <Text style={[styles.title, { color: colors.text }]}>Page not found</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </Text>
        <Pressable
          onPress={() => router.replace('/')}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Home size={18} color="#FFF" />
          <Text style={styles.buttonText}>Go Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  code: {
    fontSize: 72,
    fontWeight: '800' as const,
    letterSpacing: -2,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  button: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    backgroundColor: '#E8795A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
