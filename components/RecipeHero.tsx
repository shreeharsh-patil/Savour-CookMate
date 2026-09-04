import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Star, Clock, Flame, Users, Bookmark, Play, Share2 } from 'lucide-react-native';
import { Recipe } from '../types';
import { FoodImage } from './FoodImage';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatCookTime, formatRating, formatCalories } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';

interface RecipeHeroProps {
  recipe: Recipe;
  onStartCooking: () => void;
  onWatchVideo?: () => void;
  onShare?: () => void;
}

export const RecipeHero: React.FC<RecipeHeroProps> = ({
  recipe,
  onStartCooking,
  onWatchVideo,
  onShare,
}) => {
  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);
  const isSaved = recipe.isSaved;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <FoodImage source={{ uri: recipe.imageUrl || '' }} style={styles.heroImage} />
        <View style={styles.gradientOverlay} />

        {/* Floating Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.cuisineTag}>
            <Text style={styles.cuisineText}>{recipe.cuisine}</Text>
          </View>

          <View style={styles.topRightActions}>
            {onShare && (
              <Pressable style={styles.circleBtn} onPress={onShare} hitSlop={8}>
                <Share2 size={16} color={COLORS.textPrimary} />
              </Pressable>
            )}
            <Pressable
              style={styles.circleBtn}
              onPress={() => toggleSaveRecipe(recipe)}
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

        {/* Floating Card overlay */}
        <View style={[styles.floatingCard, SHADOWS.card]}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {recipe.title || recipe.name}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {recipe.tagline || recipe.description}
          </Text>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            {recipe.averageRating && recipe.averageRating > 0 ? (
              <>
                <View style={styles.metricItem}>
                  <Star size={13} color="#FBBF24" fill="#FBBF24" />
                  <Text style={styles.metricValue}>{formatRating(recipe.averageRating)}</Text>
                </View>
                <View style={styles.metricDivider} />
              </>
            ) : null}
            <View style={styles.metricItem}>
              <Clock size={13} color={COLORS.textSecondary} />
              <Text style={styles.metricValue}>
                {formatCookTime(recipe.cookTime || recipe.totalTime)}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Flame size={13} color={COLORS.primary} />
              <Text style={styles.metricValue}>{formatCalories(recipe.calories)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Users size={13} color={COLORS.textSecondary} />
              <Text style={styles.metricValue}>{recipe.servings} servings</Text>
            </View>
          </View>

          {/* Primary Action Button */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.startCookingBtn,
                pressed && styles.startCookingBtnPressed,
              ]}
              onPress={onStartCooking}
            >
              <Play size={14} color={COLORS.textInverted} fill={COLORS.textInverted} />
              <Text style={styles.startCookingText}>Start Guided Cooking</Text>
            </Pressable>

            {onWatchVideo && (
              <Pressable
                style={({ pressed }) => [
                  styles.watchVideoBtn,
                  pressed && styles.watchVideoBtnPressed,
                ]}
                onPress={onWatchVideo}
              >
                <Text style={styles.watchVideoText}>Watch Video</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  imageWrapper: {
    width: '100%',
    height: 380,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  topBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  cuisineTag: {
    backgroundColor: 'rgba(23, 23, 23, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  cuisineText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  titleRow: {
    marginBottom: 4,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: TYPOGRAPHY.fontSerif,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  metricDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  startCookingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  startCookingBtnPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  startCookingText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  watchVideoBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchVideoBtnPressed: {
    backgroundColor: COLORS.surfaceHover,
  },
  watchVideoText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
