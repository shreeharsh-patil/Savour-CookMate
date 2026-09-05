import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Star, Clock, Bookmark } from 'lucide-react-native';
import { Recipe } from '../types';
import { FoodImage } from './FoodImage';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatCookTime, formatRating } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = React.memo(({ recipe, onPress }) => {
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);

  const isSaved = recipe.isSaved;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const isVeg =
    recipe.diet === 'Vegetarian' ||
    recipe.diet === 'Vegan';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <FoodImage
          source={{ uri: recipe.imageUrl || '' }}
          style={styles.image}
        />

        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          {/* Diet Indicator (clean Swiggy/Zomato green/red square dot) */}
          <View style={styles.dietBadge}>
            <View
              style={[
                styles.dietDot,
                { backgroundColor: isVeg ? COLORS.vegGreen : COLORS.nonVegRed },
              ]}
            />
          </View>

          {/* Bookmark Button */}
          <Pressable
            style={styles.bookmarkButton}
            onPress={() => toggleSaveRecipe(recipe)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove from saved recipes" : "Save recipe"}
          >
            <Bookmark
              size={18}
              color={isSaved ? COLORS.primary : COLORS.textPrimary}
              fill={isSaved ? COLORS.primary : 'transparent'}
            />
          </Pressable>
        </View>

        {/* Rating Floating Chip (Only real ratings shown) */}
        {recipe.averageRating && recipe.averageRating > 0 ? (
          <View style={styles.ratingChip}>
            <Star size={12} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{formatRating(recipe.averageRating)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {recipe.title || recipe.name}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {recipe.tagline || recipe.description}
        </Text>

        <View style={styles.metaRow}>
          {formatCookTime(recipe.cookTime || recipe.totalTime) ? (
            <>
              <View style={styles.metaItem}>
                <Clock size={13} color={COLORS.textMuted} />
                <Text style={styles.metaText}>{formatCookTime(recipe.cookTime || recipe.totalTime)}</Text>
              </View>
              <Text style={styles.metaDivider}>•</Text>
            </>
          ) : null}
          {recipe.difficulty ? (
            <>
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
              <Text style={styles.metaDivider}>•</Text>
            </>
          ) : null}
          <Text style={styles.metaText}>{recipe.cuisine}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.detailsLink}
            onPress={handlePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`View ${recipe.title || recipe.name}`}
          >
            <Text style={styles.detailsLinkText}>View Recipe →</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  cardPressed: {
    opacity: 0.96,
  },
  imageContainer: {
    height: 210,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBadgesRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dietBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bookmarkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingChip: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.85)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 4,
  },
  ratingText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  metaDivider: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.border,
    marginHorizontal: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  detailsLink: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  detailsLinkText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
