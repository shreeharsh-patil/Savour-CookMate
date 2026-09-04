import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { MobileFrame } from './components/MobileFrame';
import { BottomNavBar } from './components/BottomNavBar';
import { HomeView } from './components/views/HomeView';
import { ExploreView } from './components/views/ExploreView';
import { PantryView } from './components/views/PantryView';
import { SavedView } from './components/views/SavedView';
import { ProfileView } from './components/views/ProfileView';
import { RecipeDetailModal } from './components/RecipeDetailModal';
import { ActiveCookingSheet } from './components/ActiveCookingSheet';
import { YouTubePlayerModal } from './components/YouTubePlayerModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const activeTab = useAppStore((state) => state.activeTab);
  const selectedRecipe = useAppStore((state) => state.selectedRecipe);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const isCookingMode = useAppStore((state) => state.isCookingMode);
  const activeVideo = useAppStore((state) => state.activeVideo);
  const isOnboardingOpen = useAppStore((state) => state.isOnboardingOpen);
  const isAuthModalOpen = useAppStore((state) => state.isAuthModalOpen);
  const loadAuthUser = useAppStore((state) => state.loadAuthUser);

  useEffect(() => {
    loadAuthUser();
  }, [loadAuthUser]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'explore':
        return <ExploreView />;
      case 'pantry':
        return <PantryView />;
      case 'saved':
        return <SavedView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <MobileFrame>
      <main className="min-h-full">
        {renderActiveView()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavBar />

      {/* Recipe Detail Modal Sheet */}
      {selectedRecipe && !isCookingMode && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Active Kitchen Cooking Mode Fullscreen Sheet */}
      {isCookingMode && <ActiveCookingSheet />}

      {/* Real YouTube Video Player Modal */}
      {activeVideo && <YouTubePlayerModal />}

      {/* Onboarding Flow for Diet, Skill Level, Languages, Cuisines */}
      {isOnboardingOpen && <OnboardingModal />}

      {/* Authentication Modal (Google, Email, Guest Browsing) */}
      {isAuthModalOpen && <AuthModal />}
    </MobileFrame>
  );
}
