import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Bookmark, ScanSearch, Plus, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, t } = useTheme();
  const bottomPos = insets.bottom + 8;

  const TAB_CONFIG: Record<string, { Icon: any; label: string }> = {
    'reverse': { Icon: ScanSearch, label: t.tabs?.reverse || 'Reverse' },
    '(builder)': { Icon: null, label: t.tabs?.create || 'Create' },
    'saved': { Icon: Bookmark, label: t.tabs?.library || 'Library' },
    'profile': { Icon: Settings, label: t.tabs?.settings || 'Settings' },
  };

  return (
    <View style={[styles.tabContainer, { bottom: bottomPos }]}>
      <BlurView intensity={isDark ? 60 : 80} tint={isDark ? 'dark' : 'light'} style={[styles.blurOuter, { backgroundColor: colors.glassBg, borderColor: colors.glassBorder }]}>
        <View style={styles.pill}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const config = TAB_CONFIG[route.name];

            if (!config) return null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const isCenter = route.name === '(builder)';

            if (isCenter) {
              return (
                <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
                  <LinearGradient
                    colors={colors.primaryGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.centerButton}
                  >
                    <Plus size={24} color="#FFF" strokeWidth={2.5} />
                  </LinearGradient>
                </Pressable>
              );
            }

            const { Icon, label } = config || { Icon: Settings, label: '' };
            const activeColor = colors.coral;
            const inactiveColor = colors.textTertiary;

            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
                <Icon
                  size={24}
                  color={isFocused ? activeColor : inactiveColor}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                <Text style={[
                  styles.tabLabel,
                  { color: inactiveColor, fontFamily: 'Inter_500Medium' },
                  isFocused && { color: activeColor, fontFamily: 'Inter_700Bold' },
                ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="reverse" options={{ title: 'Reverse' }} />
      <Tabs.Screen name="(builder)" options={{ title: 'Create' }} />
      <Tabs.Screen name="saved" options={{ title: 'Library' }} />
      <Tabs.Screen name="profile" options={{ title: 'Settings' }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 70,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  blurOuter: {
    flex: 1,
    borderRadius: 35,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4757',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginTop: -4,
  },
});
