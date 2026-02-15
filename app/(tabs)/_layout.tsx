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
                <View style={[styles.centerButton, isDark && { backgroundColor: '#F59E0B' }]}>
                  <Plus size={24} color="#FFF" strokeWidth={3} />
                </View>
              </Pressable>
            );
          }

          const { Icon, label } = config || { Icon: Settings, label: '' };
          const activeColor = isDark ? '#F59E0B' : '#111827';
          const inactiveColor = isDark ? '#6B7280' : '#B0B5BE';

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              <Icon
                size={22}
                color={isFocused ? activeColor : inactiveColor}
                strokeWidth={isFocused ? 2.5 : 2}
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
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
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
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  centerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
