import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { Search, SlidersHorizontal, Sparkles, Clock, RefreshCw } from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { RecipeSearch } from '../../components/RecipeSearch';
import { RecipeCard } from '../../components/RecipeCard';
import { RecipeCardSkeleton } from '../../components/LoadingSkeleton';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const CUISINES = [
  'All',
  'Indian',
  'Goan',
  'Italian',
  'Asian',
  'Mexican',
  'Mediterranean',
];

const DIETARY_FILTERS = [
  'Vegetarian',
  'Non-Vegetarian',
  'Vegan',
  'High-Protein',
  'Low-Calorie',
  'Gluten-Free',
];

const MEAL_TYPES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Desserts'];

const CURATED_RAILS = [
  { label: 'Trending Dishes', query: 'Trending popular dinner recipes' },
  { label: 'Indian Classics', cuisine: 'Indian', query: 'Royal Indian curries' },
  { label: 'Goan Favourites', cuisine: 'Goan', query: 'Authentic Goan seafood curries' },
  { label: 'Quick Meals', maxCookTimeMinutes: 20, query: 'Super fast weeknight meals' },
  { label: 'High Protein', dietary: ['High-Protein'], query: 'High protein fitness meals' },
  { label: 'Healthy & Clean', query: 'Healthy clean vegetable bowls' },
  { label: 'Weekend Cooking', query: 'Slow simmered gourmet weekend feast' },
];

export default function ExploreScreen() {
  const exploreRecipes = useAppStore((state) => state.exploreRecipes);
  const isExploreLoading = useAppStore((state) => state.isExploreLoading);
  const exploreError = useAppStore((state) => state.exploreError);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const selectedCuisine = useAppStore((state) => state.selectedCuisine);
  const setSelectedCuisine = useAppStore((state) => state.setSelectedCuisine);
  const selectedDietary = useAppStore((state) => state.selectedDietary);
  const toggleDietary = useAppStore((state) => state.toggleDietary);
  const searchExploreRecipes = useAppStore(
    (state) => state.searchExploreRecipes
  );

  const [activeMealType, setActiveMealType] = useState('All');
  const [activeCuratedRail, setActiveCuratedRail] = useState('Trending Dishes');

  useEffect(() => {
    if (exploreRecipes.length === 0) {
      searchExploreRecipes();
    }
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    searchExploreRecipes({ query: q });
  };

  const handleCuisineSelect = (c: string) => {
    setSelectedCuisine(c);
    searchExploreRecipes({ cuisine: c });
  };

  const handleCuratedRailSelect = (rail: (typeof CURATED_RAILS)[0]) => {
    setActiveCuratedRail(rail.label);
    searchExploreRecipes({
      query: rail.query,
      cuisine: rail.cuisine,
      dietary: rail.dietary,
      maxCookTimeMinutes: rail.maxCookTimeMinutes,
    });
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
          <Text style={styles.pretitle}>Culinary Exploration</Text>
          <Text style={styles.title}>Explore Recipes</Text>
        </View>

        {/* Search */}
        <RecipeSearch onSearch={handleSearch} showSuggestions={false} />

        {/* Curated Rails Horizon */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsList}
          >
            {CURATED_RAILS.map((rail) => {
              const isSelected = activeCuratedRail === rail.label;
              return (
                <Pressable
                  key={rail.label}
                  style={[styles.railPill, isSelected && styles.railPillSelected]}
                  onPress={() => handleCuratedRailSelect(rail)}
                >
                  <Text
                    style={[
                      styles.railPillText,
                      isSelected && styles.railPillTextSelected,
                    ]}
                  >
                    {rail.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Cuisines Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Cuisines</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsList}
          >
            {CUISINES.map((c) => {
              const isSelected = selectedCuisine === c;
              return (
                <Pressable
                  key={c}
                  style={[styles.filterPill, isSelected && styles.filterPillSelected]}
                  onPress={() => handleCuisineSelect(c)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isSelected && styles.filterPillTextSelected,
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Dietary Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Diet & Lifestyle</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsList}
          >
            {DIETARY_FILTERS.map((d) => {
              const isSelected = selectedDietary.includes(d);
              return (
                <Pressable
                  key={d}
                  style={[
                    styles.dietPill,
                    isSelected && styles.dietPillSelected,
                  ]}
                  onPress={() => {
                    toggleDietary(d);
                    searchExploreRecipes();
                  }}
                >
                  <Text
                    style={[
                      styles.dietPillText,
                      isSelected && styles.dietPillTextSelected,
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>
            {isExploreLoading
              ? 'Finding recipes...'
              : `${exploreRecipes.length} recipes found`}
          </Text>

          <Pressable
            style={styles.refreshBtn}
            onPress={() => searchExploreRecipes()}
            disabled={isExploreLoading}
          >
            <RefreshCw
              size={14}
              color={COLORS.primary}
              style={isExploreLoading ? { opacity: 0.5 } : {}}
            />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </Pressable>
        </View>

        {/* Error State */}
        {exploreError ? (
          <View style={styles.paddedContainer}>
            <ErrorState
              message={exploreError}
              onRetry={() => searchExploreRecipes()}
            />
          </View>
        ) : null}

        {/* Loading Skeletons */}
        {isExploreLoading && exploreRecipes.length === 0 ? (
          <View style={styles.paddedContainer}>
            <RecipeCardSkeleton />
            <RecipeCardSkeleton />
          </View>
        ) : null}

        {/* Recipes Feed */}
        {!isExploreLoading && exploreRecipes.length === 0 && !exploreError ? (
          <View style={styles.paddedContainer}>
            <EmptyState
              title="No recipes match this search"
              description="Try adjusting your filters or search for another delicious dish."
              actionLabel="Reset Filters"
              onAction={() => {
                setSelectedCuisine('All');
                setSearchQuery('');
                searchExploreRecipes({ cuisine: 'All', query: '' });
              }}
            />
          </View>
        ) : (
          <View style={styles.recipesList}>
            {exploreRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
        )}
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
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  pretitle: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: SPACING.md,
  },
  pillsList: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  railPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  railPillSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  railPillText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  railPillTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  filterPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  filterPillSelected: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  filterPillTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  dietPill: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  dietPillSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dietPillText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  dietPillTextSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
  },
  resultsTitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshBtnText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  paddedContainer: {
    paddingHorizontal: SPACING.md,
  },
  recipesList: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
});
