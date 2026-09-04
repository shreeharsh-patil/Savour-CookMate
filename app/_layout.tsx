import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { Toast } from '../components/Toast';
import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { ActiveCookingSheet } from '../components/ActiveCookingSheet';
import { YouTubePlayerModal } from '../components/YouTubePlayerModal';
import { ShoppingListModal } from '../components/ShoppingListModal';
import { AuthModal } from '../components/AuthModal';
import { OnboardingModal } from '../components/OnboardingModal';

export default function RootLayout() {
  const loadAuthUser = useAppStore((state) => state.loadAuthUser);
  const loadPantryItems = useAppStore((state) => state.loadPantryItems);
  const loadSavedRecipes = useAppStore((state) => state.loadSavedRecipes);
  const loadShoppingList = useAppStore((state) => state.loadShoppingList);
  const selectedRecipe = useAppStore((state) => state.selectedRecipe);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);

  useEffect(() => {
    loadAuthUser();
    loadPantryItems();
    loadSavedRecipes();
    loadShoppingList();
  }, []);

  return (
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
        <ActiveCookingSheet />
        <YouTubePlayerModal />
        <ShoppingListModal />
        <AuthModal />
        <OnboardingModal />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
