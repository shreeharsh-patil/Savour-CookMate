import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import {
  User,
  ShieldCheck,
  RotateCcw,
  LogOut,
  LogIn,
  CheckCircle2,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { PreferenceSelector } from '../../components/PreferenceSelector';
import { FoodImage } from '../../components/FoodImage';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { BRAND } from '../../constants/brand';
import {
  DietType,
  CookingLevelType,
  SpiceLevelType,
  VideoLanguageType,
} from '../../types';

export default function ProfileScreen() {
  const userProfile = useAppStore((state) => state.userProfile);
  const userPreferences = useAppStore((state) => state.userPreferences);
  const updateUserPreferences = useAppStore(
    (state) => state.updateUserPreferences
  );
  const currentUser = useAppStore((state) => state.currentUser);
  const cookingHistory = useAppStore((state) => state.cookingHistory);
  const setAuthModalOpen = useAppStore((state) => state.setAuthModalOpen);
  const setOnboardingOpen = useAppStore((state) => state.setOnboardingOpen);
  const signOut = useAppStore((state) => state.signOut);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);

  const [diet, setDiet] = useState<DietType>(userPreferences.diet as DietType);
  const [skillLevel, setSkillLevel] = useState<CookingLevelType>(
    (userPreferences.skillLevel || 'Beginner') as CookingLevelType
  );
  const [spiceTolerance, setSpiceTolerance] = useState<SpiceLevelType>(
    (userPreferences.spiceTolerance || 'Medium') as SpiceLevelType
  );
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(
    userPreferences.favoriteCuisines || []
  );
  const [videoLanguages, setVideoLanguages] = useState<VideoLanguageType[]>(
    (userPreferences.videoLanguages || ['English']) as VideoLanguageType[]
  );

  const isGuest = !currentUser || currentUser.isGuest;

  const handleDietChange = (newDiet: DietType) => {
    setDiet(newDiet);
    updateUserPreferences({ diet: newDiet });
  };

  const handleSkillChange = (newSkill: CookingLevelType) => {
    setSkillLevel(newSkill);
    updateUserPreferences({ skillLevel: newSkill });
  };

  const handleSpiceChange = (newSpice: SpiceLevelType) => {
    setSpiceTolerance(newSpice);
    updateUserPreferences({ spiceTolerance: newSpice });
  };

  const handleToggleCuisine = (cuisine: string) => {
    let updated: string[];
    if (favoriteCuisines.includes(cuisine)) {
      if (favoriteCuisines.length > 1) {
        updated = favoriteCuisines.filter((c) => c !== cuisine);
      } else {
        return;
      }
    } else {
      updated = [...favoriteCuisines, cuisine];
    }
    setFavoriteCuisines(updated);
    updateUserPreferences({ favoriteCuisines: updated });
  };

  const handleToggleLanguage = (lang: VideoLanguageType) => {
    let updated: VideoLanguageType[];
    if (videoLanguages.includes(lang)) {
      if (videoLanguages.length > 1) {
        updated = videoLanguages.filter((l) => l !== lang);
      } else {
        return;
      }
    } else {
      updated = [...videoLanguages, lang];
    }
    setVideoLanguages(updated);
    updateUserPreferences({ videoLanguages: updated });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pretitle}>Preferences & Identity</Text>
          <Text style={styles.title}>Chef Profile</Text>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, SHADOWS.card]}>
          <View style={styles.userRow}>
            <FoodImage
              source={{
                uri:
                  currentUser?.avatarUrl ||
                  userProfile?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
              }}
              style={styles.avatar}
              borderRadius={28}
            />

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {currentUser?.name || userProfile?.name || 'Home Cook'}
                </Text>
                {isGuest ? (
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>Guest</Text>
                  </View>
                ) : (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={11} color={COLORS.success} />
                    <Text style={styles.verifiedBadgeText}>Synced</Text>
                  </View>
                )}
              </View>

              <Text style={styles.userEmail} numberOfLines={1}>
                {currentUser?.email || userProfile?.email || 'Guest Chef'}
              </Text>

              {/* User-Oriented Sync Status */}
              <View style={styles.syncStatusRow}>
                <CheckCircle2 size={12} color={COLORS.success} />
                <Text style={styles.syncStatusText}>
                  Your recipes and preferences are synced.
                </Text>
              </View>
            </View>
          </View>

          {/* Auth Action */}
          <View style={styles.userActions}>
            {isGuest ? (
              <Pressable
                style={styles.signInBtn}
                onPress={() => setAuthModalOpen(true)}
              >
                <LogIn size={15} color={COLORS.textInverted} />
                <Text style={styles.signInBtnText}>
                  Sign in or Create Account
                </Text>
              </Pressable>
            ) : (
              <Pressable style={styles.signOutBtn} onPress={() => signOut()}>
                <LogOut size={15} color={COLORS.error} />
                <Text style={styles.signOutBtnText}>Sign Out</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Culinary Preferences Section */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Taste & Cooking Preferences</Text>
            <Pressable onPress={() => setOnboardingOpen(true)}>
              <Text style={styles.resetLink}>Personalize</Text>
            </Pressable>
          </View>

          <PreferenceSelector
            diet={diet}
            skillLevel={skillLevel}
            spiceTolerance={spiceTolerance}
            favoriteCuisines={favoriteCuisines}
            videoLanguages={videoLanguages}
            onChangeDiet={handleDietChange}
            onChangeSkillLevel={handleSkillChange}
            onChangeSpiceTolerance={handleSpiceChange}
            onToggleCuisine={handleToggleCuisine}
            onToggleLanguage={handleToggleLanguage}
          />
        </View>

        {/* Cooking History Section */}
        <View style={[styles.sectionCard, SHADOWS.card]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cooking History</Text>
            <Text style={styles.historyCountText}>
              {cookingHistory.length} completed
            </Text>
          </View>

          {cookingHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Clock size={20} color={COLORS.textMuted} />
              <Text style={styles.emptyHistoryText}>
                No cooking sessions yet. Tap 'Start Cooking' on any recipe to begin guided mode!
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {cookingHistory.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => item.recipeData && setSelectedRecipe(item.recipeData)}
                >
                  <View style={styles.historyItemLeft}>
                    <Text style={styles.historyDishName} numberOfLines={1}>
                      {item.recipeTitle}
                    </Text>
                    <View style={styles.historyMetaRow}>
                      {item.rating && item.rating > 0 ? (
                        <>
                          <Star size={11} color="#FBBF24" fill="#FBBF24" />
                          <Text style={styles.historyRating}>
                            {item.rating.toFixed(1)}
                          </Text>
                          <Text style={styles.historyDivider}>•</Text>
                        </>
                      ) : null}
                      <Text style={styles.historyDate}>
                        {new Date(item.cookedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* App Info Footer */}
        <View style={styles.appFooter}>
          <Text style={styles.footerAppName}>{BRAND.NAME}</Text>
          <Text style={styles.footerVersion}>Version {BRAND.VERSION}</Text>
          <Text style={styles.footerDesc}>{BRAND.DESCRIPTION}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  header: {
    gap: 2,
  },
  pretitle: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  guestBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  guestBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
    textTransform: 'uppercase',
  },
  userEmail: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  syncStatusText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  userActions: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    paddingTop: SPACING.xs,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  signInBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  signOutBtnText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  resetLink: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  historyCountText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  emptyHistory: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: 6,
  },
  emptyHistoryText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDishName: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  historyRating: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
  },
  historyDivider: {
    fontSize: 10,
    color: COLORS.border,
  },
  historyDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  appFooter: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    gap: 4,
  },
  footerAppName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  footerVersion: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  footerDesc: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
    lineHeight: 16,
  },
});
