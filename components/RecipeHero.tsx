import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Clock, Flame, Users, Bookmark, Share2 } from 'lucide-react-native';
import { Recipe } from '../types';
import { FoodImage } from './FoodImage';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { formatCookTime, formatCalories } from '../utils/formatters';
import { useAppStore } from '../store/useAppStore';

interface RecipeHeroProps { recipe: Recipe; onWatchVideo?: () => void; onShare?: () => void; }

export const RecipeHero: React.FC<RecipeHeroProps> = ({ recipe, onWatchVideo, onShare }) => {
  const { width } = useWindowDimensions();
  const toggleSaveRecipe = useAppStore((state) => state.toggleSaveRecipe);
  const isSaved = recipe.isSaved;
  const isCompact = width <= 768;
  const diet = recipe.diet === 'Vegetarian' || recipe.diet === 'Vegan' ? recipe.diet : null;

  return <View style={[styles.container, !isCompact && styles.containerDesktop]}>
    <View style={[styles.imageWrapper, !isCompact && styles.imageWrapperDesktop]}>
      <FoodImage source={{ uri: recipe.imageUrl || '' }} style={styles.heroImage} />
      <View style={styles.topBar}>
        <View style={styles.cuisineTag}><Text style={styles.cuisineText}>{recipe.cuisine}</Text></View>
        <View style={styles.topRightActions}>
          {onShare ? <Pressable style={styles.iconButton} onPress={onShare} hitSlop={8} accessibilityLabel="Share recipe"><Share2 size={17} color={COLORS.textPrimary} /></Pressable> : null}
          <Pressable style={styles.iconButton} onPress={() => toggleSaveRecipe(recipe)} hitSlop={8} accessibilityLabel={isSaved ? 'Remove from saved recipes' : 'Save recipe'}>
            <Bookmark size={17} color={isSaved ? COLORS.primary : COLORS.textPrimary} fill={isSaved ? COLORS.primary : 'transparent'} />
          </Pressable>
        </View>
      </View>
    </View>
    <View style={[styles.infoPanel, !isCompact && styles.infoPanelDesktop]}>
      <Text style={[styles.title, !isCompact && styles.titleDesktop]} numberOfLines={2}>{recipe.title || recipe.name}</Text>
      <Text style={styles.categoryLine} numberOfLines={1}>{diet ? `${recipe.cuisine}  ·  ${diet}` : recipe.cuisine}</Text>
      {recipe.tagline || recipe.description ? <Text style={styles.description} numberOfLines={1}>{recipe.tagline || recipe.description}</Text> : null}
      <View style={styles.metricsRow}>
        {formatCookTime(recipe.cookTime || recipe.totalTime) ? (
          <View style={styles.metricItem}><Clock size={14} color={COLORS.textMuted} /><Text style={styles.metricValue}>{formatCookTime(recipe.cookTime || recipe.totalTime)}</Text></View>
        ) : null}
        {formatCalories(recipe.calories) ? (
          <View style={styles.metricItem}><Flame size={14} color={COLORS.primary} /><Text style={styles.metricValue}>{formatCalories(recipe.calories)}</Text></View>
        ) : null}
        {recipe.servings ? (
          <View style={styles.metricItem}><Users size={14} color={COLORS.textMuted} /><Text style={styles.metricValue}>{recipe.servings} servings</Text></View>
        ) : null}
      </View>
      {onWatchVideo ? <Pressable style={styles.watchVideoBtn} onPress={onWatchVideo}><Text style={styles.watchVideoText}>View Recipe & Videos</Text></Pressable> : null}
    </View>
  </View>;
};

const styles = StyleSheet.create({
  container: { marginHorizontal: SPACING.md, marginBottom: SPACING.lg }, containerDesktop: { marginHorizontal: SPACING.lg },
  imageWrapper: { height: 286, borderRadius: RADIUS.lg, overflow: 'hidden', position: 'relative', backgroundColor: COLORS.surface }, imageWrapperDesktop: { height: 420, borderRadius: RADIUS.xl }, heroImage: { width: '100%', height: '100%' },
  topBar: { position: 'absolute', top: 14, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cuisineTag: { backgroundColor: 'rgba(23, 23, 23, 0.82)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.sm }, cuisineText: { color: COLORS.textInverted, fontSize: TYPOGRAPHY.sizes.caption, fontWeight: TYPOGRAPHY.weights.semibold },
  topRightActions: { flexDirection: 'row', gap: 8 }, iconButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' },
  infoPanel: { marginTop: -24, marginHorizontal: 10, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, elevation: 1 }, infoPanelDesktop: { width: '68%', maxWidth: 800, marginTop: -46, marginLeft: SPACING.lg, padding: SPACING.lg },
  title: { fontSize: 24, lineHeight: 30, fontWeight: TYPOGRAPHY.weights.bold, color: COLORS.textPrimary, letterSpacing: -0.35 }, titleDesktop: { fontSize: 34, lineHeight: 40 }, categoryLine: { marginTop: 4, fontSize: TYPOGRAPHY.sizes.subtext, fontWeight: TYPOGRAPHY.weights.medium, color: COLORS.textSecondary }, description: { marginTop: 8, fontSize: TYPOGRAPHY.sizes.body, lineHeight: 20, color: COLORS.textSecondary },
  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 }, metricItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, metricValue: { fontSize: TYPOGRAPHY.sizes.caption, color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.weights.semibold },
  watchVideoBtn: { alignSelf: 'flex-start', marginTop: SPACING.md, height: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card }, watchVideoText: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizes.body, fontWeight: TYPOGRAPHY.weights.semibold },
});
