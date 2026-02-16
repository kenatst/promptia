import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { PromptProvider, usePromptStore } from "@/contexts/PromptContext";
import { PurchasesProvider } from "@/contexts/PurchasesContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar} />;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { hasSeenOnboarding, isLoading } = usePromptStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasSeenOnboarding) {
      router.replace('/onboarding' as any);
    }
  }, [isLoading, hasSeenOnboarding, router]);

  return <>{children}</>;
}

function RootLayoutNav() {
  const { colors } = useTheme();

  return (
    <OnboardingGate>
      <Stack
        screenOptions={{
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="prompt/[id]"
          options={{
            presentation: "modal",
            headerTitle: "Prompt Detail",
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </OnboardingGate>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PromptProvider>
          <PurchasesProvider>
            <ErrorBoundary fallbackTitle="Promptia encountered an error">
              <GestureHandlerRootView>
                <ThemedStatusBar />
                <RootLayoutNav />
              </GestureHandlerRootView>
            </ErrorBoundary>
          </PurchasesProvider>
        </PromptProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
