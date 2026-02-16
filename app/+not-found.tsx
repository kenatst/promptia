import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={[styles.code, { color: colors.textTertiary }]}>404</Text>
        <Text style={[styles.title, { color: colors.text }]}>Page not found</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          The page you're looking for doesn't exist.
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', paddingHorizontal: 40 },
  code: { fontSize: 72, fontWeight: '800' as const, letterSpacing: -2, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700' as const, marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: 'center' as const, lineHeight: 22, marginBottom: 32 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
});
