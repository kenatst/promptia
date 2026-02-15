import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Bookmark, Compass, Wand2 } from 'lucide-react-native';

import Colors from '@/constants/colors';

function TabBackground() {
  if (Platform.OS === 'web') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.tabBar }]} />
      <View style={styles.topBorder} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarBackground: () => <TabBackground />,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 74,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="(builder)"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => <Wand2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  topBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
