import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppStore } from "../store/useAppStore";
import { Toast } from "../components/Toast";
import { RecipeDetailModal } from "../components/RecipeDetailModal";
import { YouTubePlayerModal } from "../components/YouTubePlayerModal";
import { ShoppingListModal } from "../components/ShoppingListModal";
import { AuthModal } from "../components/AuthModal";
import { OnboardingModal } from "../components/OnboardingModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const loadAuthUser = useAppStore((state) => state.loadAuthUser);
  const selectedRecipe = useAppStore((state) => state.selectedRecipe);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);

  useEffect(() => {
    loadAuthUser();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>

          {/* Global Overlays & Modals */}
          <Toast />
          <RecipeDetailModal
            visible={Boolean(selectedRecipe)}
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
          <YouTubePlayerModal />
          <ShoppingListModal />
          <AuthModal />
          <OnboardingModal />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
