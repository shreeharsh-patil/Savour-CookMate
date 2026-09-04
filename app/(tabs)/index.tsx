import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Refrigerator,
  ArrowRight,
  Flame,
  Zap,
  Clock,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { HomeHeader } from '../../components/HomeHeader';
import { RecipeSearch } from '../../components/RecipeSearch';
import { FoodCategoryRail } from '../../components/FoodCategoryRail';
import { RecipeHero } from '../../components/RecipeHero';
import { RecipeCard } from '../../components/RecipeCard';
import { CompactRecipeCard } from '../../components/CompactRecipeCard';
import { FoodImage } from '../../components/FoodImage';
import {
  RecipeCardSkeleton,
  CategoryRailSkeleton,
  HeroSkeleton,
} from '../../components/LoadingSkeleton';
import { ErrorState } from '../../components/ErrorState';
import { CUISINE_SECTIONS, DISCOVERY_CHANNELS } from '../../constants/categories';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  const homeRecipes = useAppStore((state) => state.homeRecipes);
  const isHomeLoading = useAppStore((state) => state.isHomeLoading);
  const homeError = useAppStore((state) => state.homeError);
  const activeHomeCategory = useAppStore((state) => state.activeHomeCategory);
  const activeMindCategory = useAppStore((state) => state.activeMindCategory);
  const setActiveHomeCategory = useAppStore(
    (state) => state.setActiveHomeCategory
  );
  const setActiveMindCategory = useAppStore(
    (state) => state.setActiveMindCategory
  );
  const loadHomeRecipes = useAppStore((state) => state.loadHomeRecipes);
  const searchHomeWithPrompt = useAppStore(
    (state) => state.searchHomeWithPrompt
  );
  const startCookingMode = useAppStore((state) => state.startCookingMode);
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const pantryCount = useAppStore((state) => state.pantryItems.length);
  const setAuthModalOpen = useAppStore((state) => state.setAuthModalOpen);
  const recentlyViewedRecipes = useAppStore((state) => state.recentlyViewedRecipes);
  const isCookingMode = useAppStore((state) => state.isCookingMode);
  const selectedRecipe = useAppStore((state) => state.selectedRecipe);
  const cookingStepIndex = useAppStore((state) => state.cookingStepIndex);

  useEffect(() => {
    if (homeRecipes.length === 0) {
      loadHomeRecipes('Fresh picks for you', false);
    }
  }, []);

  const handleRefresh = () => {
    if (activeMindCategory) {
      loadHomeRecipes(`Category: ${activeMindCategory}`, true, {
        query: activeMindCategory,
        category: activeMindCategory,
      });
    } else {
      loadHomeRecipes(activeHomeCategory, true);
    }
  };

  const handleMindCategorySelect = (catName: string) => {
    setActiveMindCategory(catName);
  };

  const handleResetMindCategory = () => {
    setActiveMindCategory(null);
    loadHomeRecipes('Fresh picks for you', false);
  };

  const handleChannelSelect = (channel: string) => {
    setActiveHomeCategory(channel);
  };

  const featuredRecipe = homeRecipes[0];
  const remainingRecipes = homeRecipes.slice(1);
  const quickMeals = homeRecipes.filter(
    (r) => (r.cookTime || r.totalTime) <= 25
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isHomeLoading && homeRecipes.length > 0}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* 1. Header */}
        <HomeHeader
          onRefresh={handleRefresh}
          isRefreshing={isHomeLoading}
          onOpenProfile={() => router.push('/(tabs)/profile')}
        />

        {/* 2. Natural Language Search Bar */}
        <RecipeSearch onSearch={(q) => searchHomeWithPrompt(q)} />

        {/* 3. "What's on your mind?" Category Rail */}
        <FoodCategoryRail
          selectedCategory={activeMindCategory}
          onSelectCategory={handleMindCategorySelect}
          onResetCategory={activeMindCategory ? handleResetMindCategory : undefined}
        />

        {/* 4. Recommendation Channels Horizontal Pills */}
        <View style={styles.channelsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.channelsContent}
          >
            {DISCOVERY_CHANNELS.map((channel) => {
              const isSelected =
                !activeMindCategory && activeHomeCategory === channel;

              return (
                <Pressable
                  key={channel}
                  style={[
                    styles.channelPill,
                    isSelected && styles.channelPillSelected,
                  ]}
                  onPress={() => handleChannelSelect(channel)}
                >
                  <Text
                    style={[
                      styles.channelPillText,
                      isSelected && styles.channelPillTextSelected,
                    ]}
                  >
                    {channel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Error Notification */}
        {homeError ? (
          <View style={styles.paddedContainer}>
            <ErrorState
              message={homeError}
              onRetry={handleRefresh}
            />
          </View>
        ) : null}

        {/* Loading Skeletons */}
        {isHomeLoading && homeRecipes.length === 0 ? (
          <View style={styles.paddedContainer}>
            <HeroSkeleton />
            <View style={{ height: SPACING.md }} />
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </View>
        ) : null}

        {/* Active / Resume Cooking Session Card */}
        {isCookingMode && selectedRecipe ? (
          <View style={styles.paddedContainer}>
            <Pressable
              style={styles.resumeSessionCard}
              onPress={() => {}}
              accessibilityRole="button"
              accessibilityLabel={`Resume cooking ${selectedRecipe.title || selectedRecipe.name}`}
            >
              <View style={styles.resumeIconWrap}>
                <Flame size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resumePretitle}>ACTIVE COOKING SESSION</Text>
                <Text style={styles.resumeTitle} numberOfLines={1}>
                  {selectedRecipe.title || selectedRecipe.name}
                </Text>
                <Text style={styles.resumeSubtitle}>
                  Step {cookingStepIndex + 1} of {selectedRecipe.steps?.length || 1} in progress • Tap to continue
                </Text>
              </View>
              <ArrowRight size={18} color={COLORS.primary} />
            </Pressable>
          </View>
        ) : null}

        {/* 5. Spotlight Recommendation Hero */}
        {featuredRecipe && !isHomeLoading ? (
          <View style={styles.heroContainer}>
            <RecipeHero
              recipe={featuredRecipe}
              onStartCooking={() => startCookingMode(featuredRecipe)}
              onWatchVideo={() => setSelectedRecipe(featuredRecipe)}
            />
          </View>
        ) : null}

        {/* 6. Pantry Callout Card ("Cook With What I Have") */}
        <View style={styles.paddedContainer}>
          <Pressable
            style={[styles.pantryBanner, SHADOWS.card]}
            onPress={() => router.push('/(tabs)/pantry')}
          >
            <View style={styles.pantryBannerTextCol}>
              <View style={styles.pantryBannerPretitle}>
                <Refrigerator size={13} color={COLORS.textInverted} />
                <Text style={styles.pantryBannerPretitleText}>
                  Kitchen Pantry
                </Text>
              </View>
              <Text style={styles.pantryBannerTitle}>
                Cook with what you have
              </Text>
              <Text style={styles.pantryBannerSubtitle}>
                {pantryCount > 0
                  ? `You have ${pantryCount} items in your kitchen. Tap to find matching recipes!`
                  : 'Add ingredients from your fridge & pantry to discover effortless zero-waste dishes.'}
              </Text>
            </View>

            <View style={styles.pantryBannerArrow}>
              <ArrowRight size={18} color={COLORS.textInverted} />
            </View>
          </Pressable>
        </View>

        {/* 7. Quick Meals Carousel (Under 25 mins) */}
        {quickMeals.length > 0 ? (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <View style={styles.iconHeadingRow}>
                  <Zap size={14} color={COLORS.primary} />
                  <Text style={styles.sectionPretitle}>Quick Dinners</Text>
                </View>
                <Text style={styles.sectionTitle}>Ready in 25 Minutes</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollList}
            >
              {quickMeals.map((recipe) => (
                <CompactRecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Recently Viewed Rail */}
        {recentlyViewedRecipes.length > 0 ? (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <View style={styles.iconHeadingRow}>
                  <Clock size={14} color={COLORS.primary} />
                  <Text style={styles.sectionPretitle}>Pick Up Where You Left Off</Text>
                </View>
                <Text style={styles.sectionTitle}>Recently Viewed</Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollList}
            >
              {recentlyViewedRecipes.map((recipe) => (
                <CompactRecipeCard key={`recent-${recipe.id}`} recipe={recipe} />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* 8. Cuisine Sections Strip */}
        <View style={styles.cuisineSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionPretitle}>Explore Traditions</Text>
              <Text style={styles.sectionTitle}>Popular Cuisines</Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/explore')}
              hitSlop={8}
            >
              <Text style={styles.seeAllText}>Explore All →</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollList}
          >
            {CUISINE_SECTIONS.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.cuisineCard, SHADOWS.card]}
                onPress={() => {
                  setActiveHomeCategory(c.name);
                  loadHomeRecipes(c.name, false, {
                    query: c.query,
                    cuisine: c.name,
                  });
                }}
              >
                <FoodImage source={{ uri: c.imageUrl }} style={styles.cuisineImage} />
                <View style={styles.cuisineCardOverlay}>
                  <Text style={styles.cuisineCardTitle}>{c.name}</Text>
                  <Text style={styles.cuisineCardSubtitle}>{c.subtitle}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* 9. Feed Recipes List */}
        {remainingRecipes.length > 0 ? (
          <View style={styles.feedSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionPretitle}>Curated Selection</Text>
                <Text style={styles.sectionTitle}>
                  {activeMindCategory
                    ? `Dishes for ${activeMindCategory}`
                    : activeHomeCategory}
                </Text>
              </View>
              <Text style={styles.recipeCountBadge}>
                {remainingRecipes.length} dishes
              </Text>
            </View>

            <View style={styles.recipesList}>
              {remainingRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  paddedContainer: {
    paddingHorizontal: SPACING.md,
  },
  heroContainer: {
    marginTop: SPACING.xs,
  },
  channelsSection: {
    paddingVertical: 2,
  },
  channelsContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  channelPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  channelPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  channelPillText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  channelPillTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  pantryBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pantryBannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  pantryBannerPretitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  pantryBannerPretitleText: {
    color: COLORS.textInverted,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
  },
  pantryBannerTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textInverted,
    marginBottom: 4,
  },
  pantryBannerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
  },
  pantryBannerArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselSection: {
    gap: SPACING.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
  },
  iconHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  sectionPretitle: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  recipeCountBadge: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
  },
  horizontalScrollList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  cuisineSection: {
    gap: SPACING.sm,
  },
  cuisineCard: {
    width: 190,
    height: 120,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    marginRight: SPACING.md,
  },
  cuisineImage: {
    width: '100%',
    height: '100%',
  },
  cuisineCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    padding: 10,
  },
  cuisineCardTitle: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cuisineCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    marginTop: 2,
  },
  feedSection: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  recipesList: {
    gap: SPACING.xs,
  },
  resumeSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: `${COLORS.primary}50`,
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  resumeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumePretitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  resumeTitle: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  resumeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
