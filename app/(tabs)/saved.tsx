import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Bookmark,
  Search,
  Plus,
  FolderHeart,
  Folder,
  Utensils,
  Zap,
  Heart,
  Layers,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { RecipeCard } from '../../components/RecipeCard';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const DEFAULT_COLLECTIONS = [
  'All Saved',
  'Want to Try',
  'Quick Meals',
  'Breakfast',
  'Healthy',
  'Favorites',
];

export default function SavedScreen() {
  const router = useRouter();
  const savedRecipes = useAppStore((state) => state.savedRecipes);
  const loadSavedRecipes = useAppStore((state) => state.loadSavedRecipes);

  const [activeCollection, setActiveCollection] = useState('All Saved');
  const [filterText, setFilterText] = useState('');
  const [customCollections, setCustomCollections] = useState<string[]>([]);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const handleAddCollection = () => {
    const trimmed = newCollectionName.trim();
    if (!trimmed) return;
    if (!DEFAULT_COLLECTIONS.includes(trimmed) && !customCollections.includes(trimmed)) {
      setCustomCollections([...customCollections, trimmed]);
      setActiveCollection(trimmed);
    }
    setNewCollectionName('');
    setIsAddingCollection(false);
  };

  const filteredRecipes = useMemo(() => {
    return savedRecipes.filter((r) => {
      // 1. Text filter
      const matchesText =
        !filterText.trim() ||
        (r.title || r.name).toLowerCase().includes(filterText.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(filterText.toLowerCase());

      if (!matchesText) return false;

      // 2. Collection filter
      if (activeCollection === 'All Saved') return true;
      if (activeCollection === 'Quick Meals') {
        const minutes = r.cookTime ?? r.totalTime;
        return minutes != null && minutes <= 25;
      }
      if (activeCollection === 'Breakfast')
        return (r.mealType || '').toLowerCase().includes('breakfast');
      if (activeCollection === 'Healthy')
        return (
          r.diet === 'Vegan' ||
          (r.tags && r.tags.some((t) => t.toLowerCase().includes('healthy')))
        );

      return true;
    });
  }, [savedRecipes, filterText, activeCollection]);

  const allCollections = [...DEFAULT_COLLECTIONS, ...customCollections];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pretitle}>Cookbook & Collections</Text>
          <Text style={styles.title}>Saved Recipes</Text>
        </View>

        {/* Filter Input */}
        {savedRecipes.length > 0 && (
          <View style={styles.searchBar}>
            <Search size={16} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search your saved cookbook..."
              placeholderTextColor={COLORS.textLight}
              value={filterText}
              onChangeText={setFilterText}
            />
          </View>
        )}

        {/* Collections Strip */}
        <View style={styles.collectionsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsList}
          >
            {allCollections.map((col) => {
              const isSelected = activeCollection === col;
              return (
                <Pressable
                  key={col}
                  style={[
                    styles.collectionPill,
                    isSelected && styles.collectionPillSelected,
                  ]}
                  onPress={() => setActiveCollection(col)}
                >
                  <Folder
                    size={13}
                    color={isSelected ? COLORS.textInverted : COLORS.textMuted}
                  />
                  <Text
                    style={[
                      styles.collectionPillText,
                      isSelected && styles.collectionPillTextSelected,
                    ]}
                  >
                    {col}
                  </Text>
                </Pressable>
              );
            })}

            {/* Add Collection Button */}
            {!isAddingCollection ? (
              <Pressable
                style={styles.addCollectionBtn}
                onPress={() => setIsAddingCollection(true)}
              >
                <Plus size={13} color={COLORS.primary} />
                <Text style={styles.addCollectionBtnText}>New</Text>
              </Pressable>
            ) : null}
          </ScrollView>

          {isAddingCollection && (
            <View style={styles.newCollectionRow}>
              <TextInput
                style={styles.newCollectionInput}
                placeholder="Collection name (e.g. Sunday Brunch)..."
                placeholderTextColor={COLORS.textLight}
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                onSubmitEditing={handleAddCollection}
                returnKeyType="done"
                autoFocus
              />
              <Pressable
                style={styles.confirmAddBtn}
                onPress={handleAddCollection}
              >
                <Text style={styles.confirmAddBtnText}>Save</Text>
              </Pressable>
              <Pressable
                style={styles.cancelAddBtn}
                onPress={() => setIsAddingCollection(false)}
              >
                <Text style={styles.cancelAddBtnText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Recipes Content */}
        {savedRecipes.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={26} color={COLORS.primary} />}
            title="Your cookbook is empty"
            description="Explore recipes and tap the bookmark icon to save your favorite dishes."
            actionLabel="Discover Recipes"
            onAction={() => router.push('/(tabs)')}
          />
        ) : filteredRecipes.length === 0 ? (
          <EmptyState
            title="No recipes in this collection"
            description={`No saved recipes match "${activeCollection}".`}
            actionLabel="View All Saved"
            onAction={() => setActiveCollection('All Saved')}
          />
        ) : (
          <View style={styles.recipesList}>
            {filteredRecipes.map((recipe) => (
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
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  },
  header: {
    gap: 2,
  },
  pretitle: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
  },
  collectionsSection: {
    gap: 8,
  },
  collectionsList: {
    gap: 8,
    paddingVertical: 2,
  },
  collectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  collectionPillSelected: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  collectionPillText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
  },
  collectionPillTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  addCollectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addCollectionBtnText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  newCollectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newCollectionInput: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textPrimary,
  },
  confirmAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  confirmAddBtnText: {
    color: COLORS.textInverted,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cancelAddBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cancelAddBtnText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  recipesList: {
    gap: SPACING.xs,
  },
});
