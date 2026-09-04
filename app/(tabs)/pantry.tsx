import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Trash2,
  ShoppingBag,
  Utensils,
  Check,
  Search,
  MessageSquare,
  Refrigerator,
  Filter,
  RotateCcw,
} from 'lucide-react-native';
import { useAppStore } from '../../store/useAppStore';
import { PantryItem, PantryCategory, PantryMatchGroup } from '../../types';
import { PantryMatchCard } from '../../components/PantryMatchCard';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';

const COMMON_STAPLES: { name: string; category: PantryCategory }[] = [
  { name: 'Chicken', category: 'Meat & Seafood' },
  { name: 'Rice', category: 'Pantry & Grains' },
  { name: 'Onion', category: 'Produce' },
  { name: 'Tomato', category: 'Produce' },
  { name: 'Potato', category: 'Produce' },
  { name: 'Eggs', category: 'Dairy & Eggs' },
  { name: 'Paneer', category: 'Dairy & Eggs' },
  { name: 'Garlic', category: 'Produce' },
  { name: 'Ginger', category: 'Produce' },
  { name: 'Yogurt', category: 'Dairy & Eggs' },
  { name: 'Cooking Oil', category: 'Spices & Oils' },
  { name: 'Pasta', category: 'Pantry & Grains' },
];

const CATEGORIES: PantryCategory[] = [
  'Produce',
  'Dairy & Eggs',
  'Meat & Seafood',
  'Pantry & Grains',
  'Spices & Oils',
  'Other',
];

const MATCH_TABS: { id: PantryMatchGroup | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Matches' },
  { id: 'MAKE NOW', label: 'Cook Without Shopping' },
  { id: 'ALMOST THERE', label: 'Missing 1 Ingredient' },
  { id: 'GOOD MATCH', label: 'Best Match' },
  { id: 'WORTH SHOPPING FOR', label: 'More Ideas' },
];

export default function PantryScreen() {
  const pantryItems = useAppStore((state) => state.pantryItems);
  const loadPantryItems = useAppStore((state) => state.loadPantryItems);
  const addPantryItem = useAppStore((state) => state.addPantryItem);
  const removePantryItem = useAppStore((state) => state.removePantryItem);
  const clearAllPantryItems = useAppStore((state) => state.clearAllPantryItems);
  const pantryRecommendations = useAppStore(
    (state) => state.pantryRecommendations
  );
  const isPantryCooking = useAppStore((state) => state.isPantryCooking);
  const pantryError = useAppStore((state) => state.pantryError);
  const findDishesICanMake = useAppStore((state) => state.findDishesICanMake);
  const naturalLanguagePantryInput = useAppStore(
    (state) => state.naturalLanguagePantryInput
  );
  const setNaturalLanguagePantryInput = useAppStore(
    (state) => state.setNaturalLanguagePantryInput
  );
  const extractAndAddIngredients = useAppStore(
    (state) => state.extractAndAddIngredients
  );
  const pantryMatchFilter = useAppStore((state) => state.pantryMatchFilter);
  const setPantryMatchFilter = useAppStore((state) => state.setPantryMatchFilter);
  const shoppingList = useAppStore((state) => state.shoppingList);
  const setIsShoppingListOpen = useAppStore(
    (state) => state.setIsShoppingListOpen
  );

  const [inputName, setInputName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PantryCategory>('Produce');
  const [inputMode, setInputMode] = useState<'quick' | 'natural'>('quick');
  const [isExtracting, setIsExtracting] = useState(false);
  const [lastRemovedItem, setLastRemovedItem] = useState<PantryItem | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadPantryItems();
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const existingSet = useMemo(() => {
    return new Set(pantryItems.map((p) => p.name.toLowerCase().trim()));
  }, [pantryItems]);

  const handleAddManual = () => {
    const trimmed = inputName.trim();
    if (!trimmed) return;

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (!existingSet.has(p.toLowerCase())) {
          addPantryItem(p, selectedCategory);
        }
      });
    } else {
      if (!existingSet.has(trimmed.toLowerCase())) {
        addPantryItem(trimmed, selectedCategory);
      }
    }
    setInputName('');
  };

  const handleRemoveItem = (item: PantryItem) => {
    removePantryItem(item.id);
    setLastRemovedItem(item);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setLastRemovedItem(null);
    }, 6000);
  };

  const handleUndoRemove = () => {
    if (lastRemovedItem) {
      addPantryItem(lastRemovedItem.name, lastRemovedItem.category);
      setLastRemovedItem(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const handleExtractNlp = async () => {
    if (!naturalLanguagePantryInput.trim()) return;
    setIsExtracting(true);
    await extractAndAddIngredients(naturalLanguagePantryInput);
    setIsExtracting(false);
  };

  const filteredRecommendations = useMemo(() => {
    return pantryRecommendations.filter((rec) => {
      if (pantryMatchFilter === 'ALL') return true;
      const group = rec.group || rec.matchGroup;
      if (pantryMatchFilter === 'WORTH SHOPPING FOR') {
        return group === 'WORTH SHOPPING FOR' || group === 'MORE IDEAS';
      }
      return group === pantryMatchFilter;
    });
  }, [pantryRecommendations, pantryMatchFilter]);

  const countByTier = useMemo(() => {
    return {
      'MAKE NOW': pantryRecommendations.filter(
        (r) => (r.group || r.matchGroup) === 'MAKE NOW'
      ).length,
      'ALMOST THERE': pantryRecommendations.filter(
        (r) => (r.group || r.matchGroup) === 'ALMOST THERE'
      ).length,
      'GOOD MATCH': pantryRecommendations.filter(
        (r) => (r.group || r.matchGroup) === 'GOOD MATCH'
      ).length,
      'WORTH SHOPPING FOR': pantryRecommendations.filter(
        (r) => (r.group || r.matchGroup) === 'WORTH SHOPPING FOR' || (r.group || r.matchGroup) === 'MORE IDEAS'
      ).length,
      'MORE IDEAS': pantryRecommendations.filter(
        (r) => (r.group || r.matchGroup) === 'MORE IDEAS'
      ).length,
    } as Record<PantryMatchGroup, number>;
  }, [pantryRecommendations]);

  const pendingShoppingCount = shoppingList.filter((i) => !i.checked).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Shopping List button */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pretitle}>Zero-Waste Kitchen</Text>
            <Text style={styles.title}>My Kitchen</Text>
          </View>

          <Pressable
            style={styles.shoppingListBtn}
            onPress={() => setIsShoppingListOpen(true)}
          >
            <ShoppingBag size={16} color={COLORS.primary} />
            <Text style={styles.shoppingListBtnText}>Shopping List</Text>
            {pendingShoppingCount > 0 && (
              <View style={styles.shoppingBadge}>
                <Text style={styles.shoppingBadgeText}>
                  {pendingShoppingCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Input Mode Toggle */}
        <View style={styles.modeToggle}>
          <Pressable
            style={[
              styles.modeToggleBtn,
              inputMode === 'quick' && styles.modeToggleBtnActive,
            ]}
            onPress={() => setInputMode('quick')}
          >
            <Search
              size={14}
              color={inputMode === 'quick' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.modeToggleText,
                inputMode === 'quick' && styles.modeToggleTextActive,
              ]}
            >
              Add Ingredients
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeToggleBtn,
              inputMode === 'natural' && styles.modeToggleBtnActive,
            ]}
            onPress={() => setInputMode('natural')}
          >
            <MessageSquare
              size={14}
              color={inputMode === 'natural' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.modeToggleText,
                inputMode === 'natural' && styles.modeToggleTextActive,
              ]}
            >
              Natural Language
            </Text>
          </Pressable>
        </View>

        {/* Mode 1: Search & Add */}
        {inputMode === 'quick' ? (
          <View style={styles.cardSection}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter ingredient (e.g. Chicken, Rice, Onion)..."
                placeholderTextColor={COLORS.textLight}
                value={inputName}
                onChangeText={setInputName}
                onSubmitEditing={handleAddManual}
                returnKeyType="done"
              />
              <Pressable
                style={[
                  styles.addBtn,
                  !inputName.trim() && styles.addBtnDisabled,
                ]}
                onPress={handleAddManual}
                disabled={!inputName.trim()}
              >
                <Plus size={16} color={COLORS.textInverted} />
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>

            {/* Category Select Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPills}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Category ${cat}`}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && styles.categoryPillTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Quick Staples */}
            <View style={styles.staplesWrapper}>
              <Text style={styles.staplesTitle}>Common Staples (Tap to add)</Text>
              <View style={styles.staplesChipsRow}>
                {COMMON_STAPLES.map((st) => {
                  const isAdded = existingSet.has(st.name.toLowerCase());
                  return (
                    <Pressable
                      key={st.name}
                      style={[
                        styles.stapleChip,
                        isAdded && styles.stapleChipAdded,
                      ]}
                      onPress={() => {
                        if (!isAdded) addPantryItem(st.name, st.category);
                      }}
                      disabled={isAdded}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      accessibilityRole="button"
                      accessibilityLabel={isAdded ? `${st.name} added` : `Add ${st.name}`}
                    >
                      {isAdded ? (
                        <Check size={11} color={COLORS.success} />
                      ) : (
                        <Plus size={11} color={COLORS.primary} />
                      )}
                      <Text
                        style={[
                          styles.stapleChipText,
                          isAdded && styles.stapleChipTextAdded,
                        ]}
                      >
                        {st.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          /* Mode 2: Natural Language description */
          <View style={styles.cardSection}>
            <Text style={styles.nlPromptLabel}>
              Describe what's in your kitchen in everyday words
            </Text>
            <TextInput
              style={styles.nlTextarea}
              placeholder="e.g. I have chicken, rice, onion and curd and want something spicy under 30 minutes..."
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={3}
              value={naturalLanguagePantryInput}
              onChangeText={setNaturalLanguagePantryInput}
            />
            <View style={styles.nlActionsRow}>
              <Pressable
                style={[
                  styles.extractBtn,
                  (!naturalLanguagePantryInput.trim() || isExtracting) &&
                    styles.extractBtnDisabled,
                ]}
                onPress={handleExtractNlp}
                disabled={!naturalLanguagePantryInput.trim() || isExtracting}
              >
                {isExtracting ? (
                  <ActivityIndicator size="small" color={COLORS.textInverted} />
                ) : (
                  <>
                    <Plus size={14} color={COLORS.textInverted} />
                    <Text style={styles.extractBtnText}>
                      Add Items to Kitchen
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Current Pantry Items Inventory */}
        <View style={styles.cardSection}>
          <View style={styles.inventoryHeader}>
            <Text style={styles.inventoryTitle}>
              Available Ingredients ({pantryItems.length})
            </Text>
            {pantryItems.length > 0 && (
              <Pressable onPress={clearAllPantryItems} hitSlop={8}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </Pressable>
            )}
          </View>

          {pantryItems.length === 0 ? (
            <View style={styles.emptyInventory}>
              <Refrigerator size={24} color={COLORS.textMuted} />
              <Text style={styles.emptyInventoryText}>
                No ingredients added yet. Add staples above or type what you have in your fridge!
              </Text>
            </View>
          ) : (
            <View style={styles.itemsGrid}>
              {pantryItems.map((item) => (
                <View key={item.id} style={styles.inventoryItem}>
                  <View style={styles.inventoryItemInfo}>
                    <Text style={styles.inventoryItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.inventoryItemCat}>{item.category}</Text>
                  </View>
                  <Pressable
                    style={styles.deleteItemBtn}
                    onPress={() => handleRemoveItem(item)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name} from kitchen`}
                  >
                    <Trash2 size={13} color={COLORS.textLight} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {lastRemovedItem && (
            <View style={styles.undoBar}>
              <Text style={styles.undoBarText} numberOfLines={1}>
                Removed <Text style={styles.undoBarItemName}>{lastRemovedItem.name}</Text>
              </Text>
              <Pressable
                style={styles.undoBtn}
                onPress={handleUndoRemove}
                accessibilityRole="button"
                accessibilityLabel={`Undo removing ${lastRemovedItem.name}`}
              >
                <RotateCcw size={13} color={COLORS.primary} />
                <Text style={styles.undoBtnText}>Undo</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Primary Feature Action Button: "Find dishes I can make" */}
        <Pressable
          style={[
            styles.findDishesBtn,
            (pantryItems.length === 0 && !naturalLanguagePantryInput.trim()) &&
              styles.findDishesBtnDisabled,
          ]}
          onPress={() => findDishesICanMake()}
          disabled={
            isPantryCooking ||
            (pantryItems.length === 0 && !naturalLanguagePantryInput.trim())
          }
        >
          {isPantryCooking ? (
            <>
              <ActivityIndicator size="small" color={COLORS.textInverted} />
              <Text style={styles.findDishesBtnText}>
                Finding delicious ideas...
              </Text>
            </>
          ) : (
            <>
              <Utensils size={18} color={COLORS.textInverted} />
              <Text style={styles.findDishesBtnText}>
                Find dishes I can make
              </Text>
            </>
          )}
        </Pressable>

        {/* Pantry Error Notification */}
        {pantryError ? (
          <ErrorState
            title="Couldn't load recipes"
            message={pantryError}
            onRetry={() => findDishesICanMake()}
          />
        ) : null}

        {/* Match Tiers Section */}
        {pantryRecommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <View style={styles.recHeaderRow}>
              <View>
                <Text style={styles.pretitle}>Zero-Waste Matches</Text>
                <Text style={styles.sectionTitle}>
                  Dishes for Your Kitchen ({pantryRecommendations.length})
                </Text>
              </View>
            </View>

            {/* Match Group Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.matchTabsList}
            >
              {MATCH_TABS.map((tab) => {
                const isActive = pantryMatchFilter === tab.id;
                const count =
                  tab.id === 'ALL'
                    ? pantryRecommendations.length
                    : countByTier[tab.id];

                return (
                  <Pressable
                    key={tab.id}
                    style={[
                      styles.matchTabPill,
                      isActive && styles.matchTabPillActive,
                    ]}
                    onPress={() => setPantryMatchFilter(tab.id)}
                  >
                    <Text
                      style={[
                        styles.matchTabPillText,
                        isActive && styles.matchTabPillTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                    <View
                      style={[
                        styles.matchTabCountBadge,
                        isActive && styles.matchTabCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.matchTabCountText,
                          isActive && styles.matchTabCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Filtered Cards */}
            {filteredRecommendations.length === 0 ? (
              <EmptyState
                title="No dishes in this tier"
                description="Select 'All Matches' to view recommendations across all match percentages."
              />
            ) : (
              filteredRecommendations.map((rec) => (
                <PantryMatchCard key={rec.recipe.id} recommendation={rec} />
              ))
            )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  shoppingListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  shoppingListBtnText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  shoppingBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shoppingBadgeText: {
    color: COLORS.textInverted,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 3,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: COLORS.card,
  },
  modeToggleText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  modeToggleTextActive: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  cardSection: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    gap: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  categoryPills: {
    gap: 6,
    paddingVertical: 2,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  categoryPillSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryPillText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  categoryPillTextSelected: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  staplesWrapper: {
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  staplesTitle: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  staplesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stapleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  stapleChipAdded: {
    backgroundColor: COLORS.successLight,
  },
  stapleChipText: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  stapleChipTextAdded: {
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  nlPromptLabel: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
  },
  nlTextarea: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textPrimary,
    height: 70,
    textAlignVertical: 'top',
  },
  nlActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  extractBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  extractBtnDisabled: {
    opacity: 0.5,
  },
  extractBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryTitle: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  clearAllText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  emptyInventory: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyInventoryText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 46,
    width: '48%',
    flexGrow: 1,
  },
  inventoryItemInfo: {
    flex: 1,
    marginRight: 4,
  },
  inventoryItemName: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  inventoryItemCat: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  deleteItemBtn: {
    padding: 6,
  },
  findDishesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginVertical: 4,
  },
  findDishesBtnDisabled: {
    opacity: 0.5,
  },
  findDishesBtnText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  recommendationsSection: {
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  recHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  matchTabsList: {
    gap: 8,
    paddingVertical: 2,
  },
  matchTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  matchTabPillActive: {
    backgroundColor: COLORS.textPrimary,
    borderColor: COLORS.textPrimary,
  },
  matchTabPillText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  matchTabPillTextActive: {
    color: COLORS.textInverted,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  matchTabCountBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  matchTabCountBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  matchTabCountText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
  },
  matchTabCountTextActive: {
    color: COLORS.textInverted,
  },
  undoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  undoBarText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  undoBarItemName: {
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
  },
  undoBtnText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
});
