import { Tabs } from "expo-router";
import { Wand2, Compass, Bookmark } from "lucide-react-native";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          ...(Platform.OS === 'web' ? { height: 60, backgroundColor: Colors.background } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          letterSpacing: 0.3,
        },
        tabBarBackground: () =>
          Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />
          ) : (
            <View style={StyleSheet.absoluteFill}>
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.tabBar }]} />
              <View style={styles.tabBarTopBorder} />
            </View>
          ),
      }}
    >
      <Tabs.Screen
        name="(builder)"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => <Wand2 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Library",
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
});
