import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Clock, Plus, CheckCircle, AlertCircle } from 'lucide-react-native';
import { PantryRecipeRecommendation } from '../types';
import { FoodImage } from './FoodImage';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatCookTime } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';

interface PantryMatchCardProps {
  recommendation: PantryRecipeRecommendation;
  onPress?: () => void;
}

export const PantryMatchCard: React.FC<PantryMatchCardProps> = ({
  recommendation,
  onPress,
}) => {
  const { recipe, matchPercentage, availableIngredients, missingIngredients, group } =
    recommendation;
  const setSelectedRecipe = useAppStore((state) => state.setSelectedRecipe);
  const addMissingToShoppingList = useAppStore(
    (state) => state.addMissingToShoppingList
  );

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setSelectedRecipe(recipe);
    }
  };

  const handleAddMissing = () => {
    if (missingIngredients.length > 0) {
      addMissingToShoppingList(missingIngredients, recipe.title, recipe.id);
    }
  };

  const getMatchBadgeColor = () => {
    if (matchPercentage >= 90) return COLORS.success;
    if (matchPercentage >= 65) return COLORS.warning;
    return COLORS.primary;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        SHADOWS.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.topRow}>
        <View style={styles.imageWrapper}>
          <FoodImage
            source={{ uri: recipe.imageUrl || '' }}
            style={styles.image}
            borderRadius={RADIUS.md}
          />
        </View>

        <View style={styles.infoColumn}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.matchBadge,
                { backgroundColor: `${getMatchBadgeColor()}18` },
              ]}
            >
              <Text
                style={[styles.matchBadgeText, { color: getMatchBadgeColor() }]}
              >
                {matchPercentage}% pantry match
              </Text>
            </View>

            <View style={styles.timeBadge}>
              <Clock size={11} color={COLORS.textMuted} />
              <Text style={styles.timeText}>
                {formatCookTime(recipe.cookTime || recipe.totalTime)}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {recipe.title || recipe.name}
          </Text>

          <Text style={styles.cuisineText}>{recipe.cuisine} Cuisine</Text>

          {/* Availability Status */}
          {missingIngredients.length === 0 ? (
            <View style={styles.statusRow}>
              <CheckCircle size={13} color={COLORS.success} />
              <Text style={styles.successStatusText}>
                All {availableIngredients.length} ingredients on hand!
              </Text>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <AlertCircle size={13} color={COLORS.warning} />
              <Text style={styles.missingStatusText} numberOfLines={1}>
                {missingIngredients.length} missing: {missingIngredients.join(', ')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer Action Bar if items are missing */}
      {missingIngredients.length > 0 && (
        <View style={styles.footerBar}>
          <Pressable
            style={({ pressed }) => [
              styles.addMissingButton,
              pressed && styles.addMissingButtonPressed,
            ]}
            onPress={handleAddMissing}
          >
            <Plus size={13} color={COLORS.primary} />
            <Text style={styles.addMissingText}>
              Add {missingIngredients.length} missing item{missingIngredients.length > 1 ? 's' : ''} to shopping list
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.md,
  },
  cardPressed: {
    opacity: 0.95,
  },
  topRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  imageWrapper: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cuisineText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successStatusText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  missingStatusText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  footerBar: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  addMissingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
  },
  addMissingButtonPressed: {
    backgroundColor: COLORS.primarySubtle,
  },
  addMissingText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
