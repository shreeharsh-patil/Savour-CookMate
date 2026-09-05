import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Star, Clock } from 'lucide-react-native';
import { Recipe } from '../types';
import { FoodImage } from './FoodImage';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatCookTime, formatRating } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';

interface CompactRecipeCardProps {
  recipe: Recipe;
  width?: number;
  onPress?: () => void;
}

export const CompactRecipeCard: React.FC<CompactRecipeCardProps> = React.memo(({
  recipe,
  width = 170,
  onPress,
}) => {
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const isVeg = recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width },
        SHADOWS.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.imageWrapper}>
        <FoodImage
          source={{ uri: recipe.imageUrl || '' }}
          style={styles.image}
        />
        <View style={styles.dietBadge}>
          <View
            style={[
              styles.dietDot,
              { backgroundColor: isVeg ? COLORS.vegGreen : COLORS.nonVegRed },
            ]}
          />
        </View>
        {recipe.averageRating && recipe.averageRating > 0 ? (
          <View style={styles.ratingBadge}>
            <Star size={10} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>
              {formatRating(recipe.averageRating)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.title || recipe.name}
        </Text>
        <View style={styles.metaRow}>
          {formatCookTime(recipe.cookTime || recipe.totalTime) ? (
            <>
              <Clock size={11} color={COLORS.textMuted} />
              <Text style={styles.metaText}>
                {formatCookTime(recipe.cookTime || recipe.totalTime)}
              </Text>
              <Text style={styles.metaDivider}>•</Text>
            </>
          ) : null}
          <Text style={styles.metaText} numberOfLines={1}>
            {recipe.cuisine}
          </Text>
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
    marginRight: SPACING.md,
  },
  cardPressed: {
    opacity: 0.94,
  },
  imageWrapper: {
    width: '100%',
    height: 110,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dietBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.85)',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  ratingText: {
    color: COLORS.textInverted,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  metaDivider: {
    fontSize: 10,
    color: COLORS.border,
  },
});
