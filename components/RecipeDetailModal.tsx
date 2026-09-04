import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Share,
  SafeAreaView,
} from 'react-native';
import {
  X,
  Star,
  Clock,
  Flame,
  Users,
  Bookmark,
  Play,
  Share2,
  Lightbulb,
  Video,
  ListOrdered,
  Layers,
  UtensilsCrossed,
} from 'lucide-react-native';
import { Recipe, YouTubeVideo } from '../types';
import { FoodImage } from './FoodImage';
import { IngredientList } from './IngredientList';
import { CookingStep } from './CookingStep';
import { VideoCard } from './VideoCard';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatCookTime, formatRating, formatCalories } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';
import { youtubeService, YouTubeFilter } from '../services/youtubeService';
import { analytics } from '../services/analytics';
import { api } from '../services/api';

interface RecipeDetailModalProps {
  visible: boolean;
  recipe: Recipe | null;
  onClose: () => void;
}

type TabType = 'overview' | 'ingredients' | 'steps' | 'videos';

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  visible,
  recipe,
  onClose,
}) => {
  if (!recipe) return null;

  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);
  const startCookingMode = useAppStore((state) => state.startCookingMode);
  const pantryItems = useAppStore((state) => state.pantryItems);
  const addMissingToShoppingList = useAppStore(
    (state) => state.addMissingToShoppingList
  );
  const userPreferences = useAppStore((state) => state.userPreferences);
  const setToast = useAppStore((state) => state.setToast);
  const setActiveVideo = useAppStore((state) => state.setActiveVideo);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentServings, setCurrentServings] = useState<number>(recipe.servings || 4);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [showAllVideos, setShowAllVideos] = useState<boolean>(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);
  const [videoFilter, setVideoFilter] = useState<YouTubeFilter>('recommended');
  const [nutritionData, setNutritionData] = useState<{
    isEstimated: boolean;
    unavailable?: boolean;
    label: string;
    confidence?: string;
    disclaimer: string;
    perServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
    };
  } | null>(null);

  const baseServings = recipe.servings || 4;
  const isSaved = recipe.isSaved;

  // Build pantry lookup set
  const pantryIngredientNames = useMemo(() => {
    return new Set(pantryItems.map((p) => p.name.toLowerCase().trim()));
  }, [pantryItems]);

  // Load estimated USDA nutrition
  useEffect(() => {
    let isMounted = true;
    if (visible && recipe?.id) {
      api.nutrition
        .getRecipeNutrition(recipe.id)
        .then((res) => {
          if (isMounted && res?.data) {
            setNutritionData(res.data);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [visible, recipe?.id]);

  // Load YouTube videos when video tab is selected or recipe changes
  useEffect(() => {
    let isMounted = true;
    const loadVideos = async () => {
      setIsLoadingVideos(true);
      try {
        const results = await youtubeService.searchCookingVideos(
          recipe.title || recipe.name,
          videoFilter,
          userPreferences.videoLanguages
        );
        if (isMounted) {
          setVideos(results);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoadingVideos(false);
      }
    };

    loadVideos();
    return () => {
      isMounted = false;
    };
  }, [recipe.id, videoFilter, userPreferences.videoLanguages]);

  useEffect(() => {
    if (visible && recipe) {
      analytics.trackRecipeView(
        recipe.id,
        recipe.title || recipe.name,
        recipe.mealType,
        recipe.cuisine
      );
    }
  }, [visible, recipe?.id]);

  const handleToggleCheck = (index: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleIncrementServings = () => {
    setCurrentServings((prev) => Math.min(prev + 1, 16));
  };

  const handleDecrementServings = () => {
    setCurrentServings((prev) => Math.max(prev - 1, 1));
  };

  const handleAddAllMissing = () => {
    const missing = recipe.ingredients
      .filter((ing) => {
        const name = (ing.name || ing.item || '').toLowerCase().trim();
        const norm = (ing.normalizedName || '').toLowerCase().trim();
        const isAvailable =
          pantryIngredientNames.has(name) ||
          (norm && pantryIngredientNames.has(norm));
        return !isAvailable && !ing.optional;
      })
      .map((ing) => ing.name || ing.item || '');

    if (missing.length > 0) {
      addMissingToShoppingList(missing, recipe.title, recipe.id);
      missing.forEach((item) => analytics.trackShoppingAdd(item));
    } else {
      setToast('All ingredients are already in your kitchen!');
    }
  };

  const handleToggleSave = () => {
    if (!isSaved) {
      analytics.trackRecipeSave(recipe.id, recipe.title || recipe.name);
    } else {
      analytics.trackRecipeUnsave(recipe.id);
    }
    toggleSaveRecipe(recipe);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: recipe.title,
        message: `Check out this recipe for ${recipe.title} on Savour CookMate!`,
      });
    } catch {}
  };

  const handleStartCooking = () => {
    const stepsCount = recipe.parsedSteps?.length || recipe.instructions?.length || 0;
    analytics.trackCookingStart(recipe.id, recipe.title || recipe.name, stepsCount);
    onClose();
    startCookingMode(recipe);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          {/* Fixed Top Bar */}
          <View style={styles.topNav}>
            <Pressable
              style={styles.circleBtn}
              onPress={onClose}
              hitSlop={8}
            >
              <X size={18} color={COLORS.textPrimary} />
            </Pressable>

            <View style={styles.topNavActions}>
              <Pressable
                style={styles.circleBtn}
                onPress={handleShare}
                hitSlop={8}
              >
                <Share2 size={16} color={COLORS.textPrimary} />
              </Pressable>

              <Pressable
                style={styles.circleBtn}
                onPress={handleToggleSave}
                hitSlop={8}
              >
                <Bookmark
                  size={16}
                  color={isSaved ? COLORS.primary : COLORS.textPrimary}
                  fill={isSaved ? COLORS.primary : 'transparent'}
                />
              </Pressable>
            </View>
          </View>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentInner}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Image */}
            <View style={styles.heroWrapper}>
              <FoodImage
                source={{ uri: recipe.imageUrl || '' }}
                style={styles.heroImage}
              />
              <View style={styles.heroOverlay} />
              <View style={styles.cuisineTag}>
                <Text style={styles.cuisineTagText}>{recipe.cuisine}</Text>
              </View>
            </View>

            {/* Header Info */}
            <View style={styles.headerInfo}>
              <Text style={styles.recipeTitle}>{recipe.title || recipe.name}</Text>
              <Text style={styles.recipeTagline}>
                {recipe.tagline || recipe.description}
              </Text>

              {/* Badges Strip */}
              <View style={styles.badgesStrip}>
                {recipe.averageRating && recipe.averageRating > 0 ? (
                  <>
                    <View style={styles.badgeItem}>
                      <Star size={13} color="#FBBF24" fill="#FBBF24" />
                      <Text style={styles.badgeBold}>
                        {formatRating(recipe.averageRating)}
                      </Text>
                      {recipe.ratingCount ? (
                        <Text style={styles.badgeValue}>({recipe.ratingCount})</Text>
                      ) : null}
                    </View>
                    <View style={styles.badgeDivider} />
                  </>
                ) : null}
                <View style={styles.badgeItem}>
                  <Clock size={13} color={COLORS.textSecondary} />
                  <Text style={styles.badgeValue}>
                    {formatCookTime(recipe.cookTime || recipe.totalTime)}
                  </Text>
                </View>
                <View style={styles.badgeDivider} />
                <View style={styles.badgeItem}>
                  <Flame size={13} color={COLORS.primary} />
                  <Text style={styles.badgeValue}>
                    {recipe.calories ? `${recipe.calories} kcal` : 'Moderate'}
                  </Text>
                </View>
                <View style={styles.badgeDivider} />
                <View style={styles.badgeItem}>
                  <Text style={styles.badgeValue}>{recipe.difficulty}</Text>
                </View>
              </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabsRow}>
              <Pressable
                style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
                onPress={() => setActiveTab('overview')}
              >
                <UtensilsCrossed
                  size={14}
                  color={activeTab === 'overview' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'overview' && styles.tabBtnTextActive,
                  ]}
                >
                  Overview
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, activeTab === 'ingredients' && styles.tabBtnActive]}
                onPress={() => setActiveTab('ingredients')}
              >
                <Layers
                  size={14}
                  color={activeTab === 'ingredients' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'ingredients' && styles.tabBtnTextActive,
                  ]}
                >
                  Ingredients ({recipe.ingredients.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, activeTab === 'steps' && styles.tabBtnActive]}
                onPress={() => setActiveTab('steps')}
              >
                <ListOrdered
                  size={14}
                  color={activeTab === 'steps' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'steps' && styles.tabBtnTextActive,
                  ]}
                >
                  Steps ({recipe.instructions.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabBtn, activeTab === 'videos' && styles.tabBtnActive]}
                onPress={() => setActiveTab('videos')}
              >
                <Video
                  size={14}
                  color={activeTab === 'videos' ? COLORS.primary : COLORS.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    activeTab === 'videos' && styles.tabBtnTextActive,
                  ]}
                >
                  Videos
                </Text>
              </Pressable>
            </View>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <View style={styles.tabContent}>
                {/* Description */}
                <View style={styles.cardSection}>
                  <Text style={styles.sectionHeader}>About This Dish</Text>
                  <Text style={styles.bodyText}>{recipe.description}</Text>
                </View>

                {/* Nutrition Card */}
                <View style={styles.cardSection}>
                  <View style={styles.nutritionHeaderRow}>
                    <Text style={styles.sectionHeader}>Nutritional Highlights</Text>
                    <View
                      style={[
                        styles.nutritionEstimatedBadge,
                        nutritionData?.unavailable && styles.nutritionUnavailableBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.nutritionEstimatedBadgeText,
                          nutritionData?.unavailable && styles.nutritionUnavailableBadgeText,
                        ]}
                      >
                        {nutritionData?.unavailable ? 'Nutrition unavailable' : 'Estimated nutrition'}
                      </Text>
                    </View>
                  </View>

                  {nutritionData?.unavailable ? (
                    <Text style={styles.nutritionDisclaimerText}>
                      Standard USDA nutritional breakdown is currently unavailable for this recipe.
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.nutritionDisclaimerText}>
                        Per serving • USDA FoodData Central reference
                        {nutritionData?.confidence ? ` (${nutritionData.confidence} confidence)` : ''}
                      </Text>
                      <View style={styles.nutritionGrid}>
                        <View style={styles.nutritionCell}>
                          <Text style={styles.nutritionLabel}>Calories</Text>
                          <Text style={styles.nutritionVal}>
                            {nutritionData?.perServing?.calories ?? recipe.calories ?? '--'} kcal
                          </Text>
                        </View>
                        <View style={styles.nutritionCell}>
                          <Text style={styles.nutritionLabel}>Protein</Text>
                          <Text style={styles.nutritionVal}>
                            {nutritionData?.perServing?.protein !== undefined
                              ? `${nutritionData.perServing.protein}g`
                              : recipe.proteinGrams !== undefined
                              ? `${recipe.proteinGrams}g`
                              : '--'}
                          </Text>
                        </View>
                        <View style={styles.nutritionCell}>
                          <Text style={styles.nutritionLabel}>Carbs</Text>
                          <Text style={styles.nutritionVal}>
                            {nutritionData?.perServing?.carbs !== undefined
                              ? `${nutritionData.perServing.carbs}g`
                              : recipe.carbsGrams !== undefined
                              ? `${recipe.carbsGrams}g`
                              : '--'}
                          </Text>
                        </View>
                        <View style={styles.nutritionCell}>
                          <Text style={styles.nutritionLabel}>Fat</Text>
                          <Text style={styles.nutritionVal}>
                            {nutritionData?.perServing?.fat !== undefined
                              ? `${nutritionData.perServing.fat}g`
                              : recipe.fatGrams !== undefined
                              ? `${recipe.fatGrams}g`
                              : '--'}
                          </Text>
                        </View>
                        {nutritionData?.perServing?.fiber !== undefined && (
                          <View style={styles.nutritionCell}>
                            <Text style={styles.nutritionLabel}>Fiber</Text>
                            <Text style={styles.nutritionVal}>
                              {nutritionData.perServing.fiber}g
                            </Text>
                          </View>
                        )}
                      </View>
                      {currentServings > 1 && (nutritionData?.perServing?.calories || recipe.calories) ? (
                        <Text style={styles.nutritionTotalSubtext}>
                          Total for all {currentServings} servings:{' '}
                          {Math.round(
                            (nutritionData?.perServing?.calories ?? recipe.calories ?? 0) *
                              currentServings
                          )}{' '}
                          kcal
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>

                {/* Chef Tips */}
                {recipe.tips && recipe.tips.length > 0 && (
                  <View style={styles.cardSection}>
                    <Text style={styles.sectionHeader}>Masterclass Secrets</Text>
                    {recipe.tips.map((tip, index) => (
                      <View key={index} style={styles.tipRow}>
                        <Lightbulb size={15} color="#D97706" style={styles.tipIcon} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Substitutions */}
                {recipe.substitutions && recipe.substitutions.length > 0 && (
                  <View style={styles.cardSection}>
                    <Text style={styles.sectionHeader}>Smart Substitutions</Text>
                    {recipe.substitutions.map((sub, idx) => (
                      <View key={idx} style={styles.subRow}>
                        <Text style={styles.subIngredient}>{sub.ingredient}:</Text>
                        <Text style={styles.substitute}>{sub.substitute}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Tab 2: Ingredients */}
            {activeTab === 'ingredients' && (
              <View style={styles.tabContent}>
                <IngredientList
                  ingredients={recipe.ingredients}
                  baseServings={baseServings}
                  currentServings={currentServings}
                  pantryIngredientNames={pantryIngredientNames}
                  checkedItems={checkedIngredients}
                  onToggleCheck={handleToggleCheck}
                  onIncrementServings={handleIncrementServings}
                  onDecrementServings={handleDecrementServings}
                  onAddMissingToShoppingList={handleAddAllMissing}
                />
              </View>
            )}

            {/* Tab 3: Steps */}
            {activeTab === 'steps' && (
              <View style={styles.tabContent}>
                {recipe.parsedSteps && recipe.parsedSteps.length > 0 ? (
                  recipe.parsedSteps.map((step) => (
                    <CookingStep
                      key={step.stepNumber}
                      step={step}
                      totalSteps={recipe.instructions.length}
                    />
                  ))
                ) : (
                  recipe.instructions.map((inst, index) => (
                    <CookingStep
                      key={index}
                      step={{
                        stepNumber: index + 1,
                        title: `Step ${index + 1}`,
                        text: inst,
                      }}
                      totalSteps={recipe.instructions.length}
                    />
                  ))
                )}
              </View>
            )}

            {/* Tab 4: Videos */}
            {activeTab === 'videos' && (
              <View style={styles.tabContent}>
                <Text style={styles.sectionHeader}>Watch How It's Made</Text>
                <Text style={styles.videoSubtext}>
                  Curated tutorials matching authentic preparation methods.
                </Text>

                {/* Language Filter */}
                <View style={styles.languagePillsRow}>
                  {(['recommended', 'hindi', 'english', 'quick'] as YouTubeFilter[]).map(
                    (filter) => (
                      <Pressable
                        key={filter}
                        style={[
                          styles.langPill,
                          videoFilter === filter && styles.langPillActive,
                        ]}
                        onPress={() => setVideoFilter(filter)}
                      >
                        <Text
                          style={[
                            styles.langPillText,
                            videoFilter === filter && styles.langPillTextActive,
                          ]}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>

                {videos.length > 0 ? (
                  <>
                    {(showAllVideos ? videos : videos.slice(0, 3)).map((vid) => (
                      <VideoCard
                        key={vid.id}
                        video={vid}
                        onPress={(v) => {
                          analytics.trackYoutubeOpen(v.id, v.title, recipe.id);
                          setActiveVideo(v);
                        }}
                      />
                    ))}

                    {videos.length > 3 && (
                      <Pressable
                        style={styles.showMoreVideosBtn}
                        onPress={() => setShowAllVideos(!showAllVideos)}
                      >
                        <Text style={styles.showMoreVideosText}>
                          {showAllVideos
                            ? 'Show Top 3 Only'
                            : `View All ${videos.length} Tutorials`}
                        </Text>
                      </Pressable>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyVideos}>
                    <Text style={styles.emptyVideosText}>
                      {isLoadingVideos
                        ? 'Finding authentic cooking tutorials...'
                        : 'No videos available for this recipe.'}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View style={styles.bottomBar}>
            <Pressable
              style={styles.startCookingBtn}
              onPress={handleStartCooking}
            >
              <Play size={16} color={COLORS.textInverted} fill={COLORS.textInverted} />
              <Text style={styles.startCookingText}>Start Cooking</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    zIndex: 10,
  },
  topNavActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingBottom: 90,
  },
  heroWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  cuisineTag: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    backgroundColor: 'rgba(23, 23, 23, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  cuisineTagText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  headerInfo: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  recipeTitle: {
    fontSize: TYPOGRAPHY.sizes.h1,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: TYPOGRAPHY.fontSerif,
    color: COLORS.textPrimary,
    lineHeight: 30,
    marginBottom: 6,
  },
  recipeTagline: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  badgesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeBold: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  badgeValue: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  badgeDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  tabContent: {
    padding: SPACING.md,
  },
  cardSection: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  nutritionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nutritionEstimatedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  nutritionEstimatedBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionUnavailableBadge: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.borderSubtle,
  },
  nutritionUnavailableBadgeText: {
    color: COLORS.textMuted,
  },
  nutritionDisclaimerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    fontStyle: 'italic',
  },
  nutritionTotalSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bodyText: {
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  nutritionCell: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  nutritionVal: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: '#92400E',
    lineHeight: 18,
  },
  subRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 6,
  },
  subIngredient: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  substitute: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  videoSubtext: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  languagePillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.md,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  langPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  langPillTextActive: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  emptyVideos: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyVideosText: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textMuted,
  },
  showMoreVideosBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginTop: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  showMoreVideosText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  startCookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 8,
  },
  startCookingText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
