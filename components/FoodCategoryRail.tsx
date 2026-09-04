import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FoodImage } from './FoodImage';
import { WHAT_ON_YOUR_MIND, FoodCategory } from '../constants/categories';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

interface FoodCategoryRailProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string) => void;
  onResetCategory?: () => void;
}

export const FoodCategoryRail: React.FC<FoodCategoryRailProps> = ({
  selectedCategory,
  onSelectCategory,
  onResetCategory,
}) => {
  const showReset = Boolean(selectedCategory && onResetCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionPretitle}>Inspiration</Text>
          <Text style={styles.sectionTitle}>What's on your mind?</Text>
        </View>
        {showReset ? (
          <Pressable onPress={onResetCategory} hitSlop={8}>
            <Text style={styles.resetButton}>See All</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
      >
        {WHAT_ON_YOUR_MIND.map((cat: FoodCategory) => {
          const isSelected = selectedCategory === cat.name;

          return (
            <Pressable
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => onSelectCategory(cat.name)}
            >
              <View
                style={isSelected ? [styles.imageWrapper, styles.imageWrapperSelected] : styles.imageWrapper}
              >
                <View style={styles.imageContainer}>
                  <FoodImage
                    source={{ uri: cat.imageUrl }}
                    style={styles.circleImage}
                    borderRadius={30}
                    contentFit="cover"
                  />
                </View>
              </View>
              <Text
                style={isSelected ? [styles.categoryName, styles.categoryNameSelected] : styles.categoryName}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              <Text style={styles.categorySubtitle} numberOfLines={1}>
                {cat.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionPretitle: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  resetButton: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  railContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  imageWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapperSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    padding: 2,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  circleImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: COLORS.primary,
  },
  categorySubtitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },
});
