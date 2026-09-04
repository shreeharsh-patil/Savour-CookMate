import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../constants/theme';

export const RecipeCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.contentPlaceholder}>
        <View style={styles.badgePlaceholder} />
        <View style={styles.titlePlaceholder} />
        <View style={styles.descPlaceholder} />
        <View style={styles.footerPlaceholder} />
      </View>
    </View>
  );
};

export const CategoryRailSkeleton: React.FC = () => {
  return (
    <View style={styles.railSkeleton}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.circlePlaceholder} />
      ))}
    </View>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <View style={styles.heroSkeleton}>
      <View style={styles.heroContent}>
        <View style={styles.badgePlaceholder} />
        <View style={[styles.titlePlaceholder, { width: '80%', height: 24 }]} />
        <View style={[styles.descPlaceholder, { width: '60%' }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  imagePlaceholder: {
    height: 180,
    backgroundColor: COLORS.surface,
  },
  contentPlaceholder: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  badgePlaceholder: {
    width: 60,
    height: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    marginBottom: 4,
  },
  titlePlaceholder: {
    width: '70%',
    height: 18,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
  },
  descPlaceholder: {
    width: '90%',
    height: 12,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    marginTop: 4,
  },
  footerPlaceholder: {
    width: '40%',
    height: 14,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xs,
    marginTop: 8,
  },
  railSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  circlePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.surface,
  },
  heroSkeleton: {
    height: 320,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.md,
    justifyContent: 'flex-end',
    padding: SPACING.lg,
  },
  heroContent: {
    gap: SPACING.xs,
  },
});
