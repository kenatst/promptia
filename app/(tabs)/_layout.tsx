import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, Shadow } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Bookmark, Compass, Wand2, Plus, Home } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Custom Tab Bar: White Pill Layout
function FloatingTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomPos = insets.bottom + 10;

  return (
    <View style={[styles.tabContainer, { bottom: bottomPos }]}>
      <View style={styles.pill}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

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

          let Icon = Home;
          if (route.name === '(builder)') Icon = Wand2;
          if (route.name === 'gallery') Icon = Compass;
          if (route.name === 'saved') Icon = Bookmark;

          const isCenter = route.name === '(builder)';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, isCenter ? styles.centerTab : {}]}
            >
              {isCenter ? (
                <View style={styles.centerButton}>
                  <Plus size={28} color="#FFF" strokeWidth={3} />
                </View>
              ) : (
                <Icon
                  size={24}
                  // Dark Icons for Light Mode
                  color={isFocused ? '#111827' : '#9CA3AF'}
                  strokeWidth={2.5}
                />
              )}
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
        tabBarStyle: {
          display: 'none',
        }
      }}
    >
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Explore',
        }}
      />
      <Tabs.Screen
        name="(builder)"
        options={{
          title: 'Create',
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Library',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    left: 60,
    right: 60,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF', // Pure White Pill
    // Strong Shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
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
  },
  centerTab: {
    marginBottom: 0,
    zIndex: 10,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111827', // Black Center Button on White Pill
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  }
});
