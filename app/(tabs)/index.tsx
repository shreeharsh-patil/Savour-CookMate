import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Refrigerator,
  ArrowRight,
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
import { CUISINE_SECTIONS } from '../../constants/categories';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Recipe } from '../../types';

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
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const pantryCount = useAppStore((state) => state.pantryItems.length);
  const setAuthModalOpen = useAppStore((state) => state.setAuthModalOpen);
  const recentlyViewedRecipes = useAppStore((state) => state.recentlyViewedRecipes);

  useEffect(() => {
    if (homeRecipes.length === 0) {
      loadHomeRecipes('Fresh picks for you', false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeMindCategory) {
      loadHomeRecipes(`Category: ${activeMindCategory}`, true, {
        query: activeMindCategory,
        category: activeMindCategory,
      });
    } else {
      loadHomeRecipes(activeHomeCategory, true);
    }
  }, [activeMindCategory, activeHomeCategory, loadHomeRecipes]);

  const handleMindCategorySelect = useCallback((catName: string) => {
    setActiveMindCategory(catName);
  }, [setActiveMindCategory]);

  const handleResetMindCategory = useCallback(() => {
    setActiveMindCategory(null);
    loadHomeRecipes('Fresh picks for you', false);
  }, [setActiveMindCategory, loadHomeRecipes]);

  const featuredRecipe = useMemo(() => homeRecipes[0], [homeRecipes]);
  const remainingRecipes = useMemo(() => homeRecipes.slice(1), [homeRecipes]);
  const quickMeals = useMemo(() => {
    return homeRecipes.filter((r) => {
      const minutes = r.cookTime ?? r.totalTime;
      return minutes != null && minutes <= 25;
    });
  }, [homeRecipes]);

  const renderRecipeItem = useCallback(
    ({ item }: { item: Recipe }) => (
      <View style={styles.recipeCardWrapper}>
        <RecipeCard recipe={item} />
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item: Recipe) => item.id, []);

  const renderListHeader = useCallback(() => (
    <View style={styles.pageContent}>
      {/* 1. Header */}
      <HomeHeader
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

      {/* 5. Spotlight Recommendation Hero */}
      {featuredRecipe && !isHomeLoading ? (
        <View style={styles.heroContainer}>
          <RecipeHero
            recipe={featuredRecipe}
            onWatchVideo={() => setSelectedRecipe(featuredRecipe)}
          />
        </View>
      ) : null}

      {/* 6. Pantry Callout Card ("Cook With What I Have") */}
      <View style={styles.paddedContainer}>
        <Pressable
          style={styles.pantryBanner}
          onPress={() => router.push('/(tabs)/pantry')}
        >
          <View style={styles.pantryIcon}>
            <Refrigerator size={20} color={COLORS.primary} />
          </View>
          <View style={styles.pantryBannerTextCol}>
            <Text style={styles.pantryBannerTitle}>
              My Kitchen
            </Text>
            <Text style={styles.pantryBannerSubtitle}>
              {pantryCount > 0
                ? `Cook with the ${pantryCount} ingredients already in your kitchen.`
                : 'Find recipes using ingredients already in your kitchen.'}
            </Text>
          </View>

          <View style={styles.pantryBannerArrow}>
            <ArrowRight size={18} color={COLORS.primary} />
          </View>
        </Pressable>
      </View>

      {/* 7. Quick Meals Carousel (Under 25 mins) */}
      {quickMeals.length > 0 ? (
        <View style={styles.carouselSection}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <View style={styles.iconHeadingRow}>
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
            {quickMeals.slice(0, 12).map((recipe) => (
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
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollList}
          >
            {recentlyViewedRecipes.slice(0, 10).map((recipe) => (
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

      {/* 9. Feed Section Header */}
      {remainingRecipes.length > 0 ? (
        <View style={styles.feedSectionHeader}>
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
        </View>
      ) : null}
    </View>
  ), [
    router,
    activeMindCategory,
    handleMindCategorySelect,
    handleResetMindCategory,
    homeError,
    handleRefresh,
    isHomeLoading,
    homeRecipes.length,
    featuredRecipe,
    setSelectedRecipe,
    pantryCount,
    quickMeals,
    recentlyViewedRecipes,
    setActiveHomeCategory,
    loadHomeRecipes,
    remainingRecipes.length,
    activeHomeCategory,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.flatList}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        data={remainingRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={<View style={{ height: SPACING.xl }} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS !== 'web'}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={isHomeLoading && homeRecipes.length > 0}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
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
  },
  pageContent: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    gap: SPACING.lg,
  },
  paddedContainer: {
    paddingHorizontal: SPACING.md,
  },
  heroContainer: {
    marginTop: -SPACING.sm,
  },
  pantryBanner: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  pantryIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryBannerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  pantryBannerTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  pantryBannerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  pantryBannerArrow: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryLight,
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
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
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
  flatList: {
    flex: 1,
  },
  feedSectionHeader: {
    marginTop: SPACING.xs,
  },
  recipeCardWrapper: {
    paddingHorizontal: SPACING.md,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
});
