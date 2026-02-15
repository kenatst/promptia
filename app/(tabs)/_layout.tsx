import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Bookmark, Compass, Plus, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, t } = useTheme();
  const bottomPos = insets.bottom + 8;

  const TAB_CONFIG: Record<string, { Icon: any; label: string }> = {
    'gallery': { Icon: Compass, label: t.tabs.discover },
    '(builder)': { Icon: null, label: t.tabs.create },
    'saved': { Icon: Bookmark, label: t.tabs.library },
    'profile': { Icon: Settings, label: t.tabs.settings },
  };

  return (
    <View style={[styles.tabContainer, { bottom: bottomPos, backgroundColor: colors.tabBar, borderColor: colors.tabBarBorder }]}>
      <View style={styles.pill}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];

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
                <View style={[styles.centerButton, { backgroundColor: '#E8795A' }]}>
                  <Plus size={22} color="#FFF" strokeWidth={2.5} />
                </View>
              </Pressable>
            );
          }

          const { Icon, label } = config || { Icon: Settings, label: '' };
          const activeColor = isDark ? '#E8795A' : '#1A1A1A';
          const inactiveColor = isDark ? '#6B6360' : '#B5ADA8';

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              <Icon
                size={21}
                color={isFocused ? activeColor : inactiveColor}
                strokeWidth={isFocused ? 2.5 : 1.8}
              />
              <Text style={[styles.tabLabel, { color: inactiveColor }, isFocused && { color: activeColor, fontWeight: '700' as const }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
      <Tabs.Screen name="gallery" options={{ title: 'Discover' }} />
      <Tabs.Screen name="(builder)" options={{ title: 'Create' }} />
      <Tabs.Screen name="saved" options={{ title: 'Library' }} />
      <Tabs.Screen name="profile" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 62,
    borderRadius: 31,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    borderWidth: 1,
  },
  pill: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    flex: 1,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  centerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8795A',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
