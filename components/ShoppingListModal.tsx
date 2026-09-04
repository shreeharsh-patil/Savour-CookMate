import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

export const ShoppingListModal: React.FC = () => {
  const isShoppingListOpen = useAppStore((state) => state.isShoppingListOpen);
  const setIsShoppingListOpen = useAppStore(
    (state) => state.setIsShoppingListOpen
  );
  const shoppingList = useAppStore((state) => state.shoppingList);
  const toggleShoppingListItem = useAppStore(
    (state) => state.toggleShoppingListItem
  );
  const removeShoppingListItem = useAppStore(
    (state) => state.removeShoppingListItem
  );
  const clearCheckedShoppingList = useAppStore(
    (state) => state.clearCheckedShoppingList
  );
  const moveShoppingItemToPantry = useAppStore(
    (state) => state.moveShoppingItemToPantry
  );
  const addMissingToShoppingList = useAppStore(
    (state) => state.addMissingToShoppingList
  );

  const [inputItem, setInputItem] = useState('');

  if (!isShoppingListOpen) return null;

  const handleAddItem = () => {
    if (!inputItem.trim()) return;
    addMissingToShoppingList([inputItem.trim()]);
    setInputItem('');
  };

  const checkedCount = shoppingList.filter((i) => i.checked).length;

  return (
    <Modal
      visible={isShoppingListOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsShoppingListOpen(false)}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <ShoppingBag size={18} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Shopping List</Text>
              <Text style={styles.itemCountBadge}>
                {shoppingList.length} items
              </Text>
            </View>

            <Pressable
              style={styles.closeBtn}
              onPress={() => setIsShoppingListOpen(false)}
              hitSlop={8}
            >
              <X size={18} color={COLORS.textPrimary} />
            </Pressable>
          </View>

          {/* Quick Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Add item (e.g. Soy Sauce, Fresh Basil)..."
              placeholderTextColor={COLORS.textLight}
              value={inputItem}
              onChangeText={setInputItem}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <Pressable
              style={[
                styles.addBtn,
                !inputItem.trim() && styles.addBtnDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!inputItem.trim()}
            >
              <Plus size={16} color={COLORS.textInverted} />
            </Pressable>
          </View>

          {/* Actions Subbar */}
          {checkedCount > 0 && (
            <View style={styles.actionsBar}>
              <Text style={styles.checkedCountText}>
                {checkedCount} item{checkedCount > 1 ? 's' : ''} completed
              </Text>
              <Pressable onPress={clearCheckedShoppingList}>
                <Text style={styles.clearCheckedText}>Clear Checked</Text>
              </Pressable>
            </View>
          )}

          {/* List */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {shoppingList.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <ShoppingBag size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>Shopping list is clear</Text>
                <Text style={styles.emptyDesc}>
                  Missing ingredients from recipes will automatically appear here.
                </Text>
              </View>
            ) : (
              (['Vegetables', 'Protein', 'Dairy', 'Spices', 'Grains', 'Other'] as const).map((catName) => {
                const categoryItems = shoppingList.filter((item) => {
                  const raw = (item.category || '').toLowerCase();
                  if (catName === 'Vegetables') return /vegetable|produce|greens|herb/i.test(raw);
                  if (catName === 'Protein') return /protein|meat|poultry|chicken|fish|seafood|egg|dal/i.test(raw);
                  if (catName === 'Dairy') return /dairy|milk|cheese|paneer|curd|butter|yogurt/i.test(raw);
                  if (catName === 'Spices') return /spice|masala|oil|salt|chilli/i.test(raw);
                  if (catName === 'Grains') return /grain|rice|pasta|flour|bread/i.test(raw);
                  // Other
                  return !/vegetable|produce|greens|herb|protein|meat|poultry|chicken|fish|seafood|egg|dal|dairy|milk|cheese|paneer|curd|butter|yogurt|spice|masala|oil|salt|chilli|grain|rice|pasta|flour|bread/i.test(raw);
                });

                if (categoryItems.length === 0) return null;

                return (
                  <View key={catName} style={styles.categorySection}>
                    <View style={styles.categoryHeaderRow}>
                      <Text style={styles.categoryHeaderText}>{catName}</Text>
                      <Text style={styles.categoryCountBadge}>{categoryItems.length}</Text>
                    </View>

                    {categoryItems.map((item) => (
                      <View
                        key={item.id}
                        style={[
                          styles.itemRow,
                          item.checked && styles.itemRowChecked,
                        ]}
                      >
                        <Pressable
                          style={styles.checkTouchable}
                          onPress={() => toggleShoppingListItem(item.id)}
                        >
                          {item.checked ? (
                            <CheckCircle2 size={18} color={COLORS.primary} />
                          ) : (
                            <Circle size={18} color={COLORS.textLight} />
                          )}
                          <View style={styles.itemTextCol}>
                            <Text
                              style={[
                                styles.itemName,
                                item.checked && styles.itemNameChecked,
                              ]}
                            >
                              {item.name}
                            </Text>
                            {item.recipeTitle ? (
                              <Text style={styles.recipeTag}>
                                For: {item.recipeTitle}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>

                        <View style={styles.rowRightActions}>
                          {item.checked && (
                            <Pressable
                              style={styles.moveToKitchenBtn}
                              onPress={() => moveShoppingItemToPantry(item.id)}
                              hitSlop={6}
                            >
                              <Text style={styles.moveToKitchenText}>To Kitchen</Text>
                              <ArrowRight size={11} color={COLORS.success} />
                            </Pressable>
                          )}

                          <Pressable
                            style={styles.deleteBtn}
                            onPress={() => removeShoppingListItem(item.id)}
                            hitSlop={6}
                          >
                            <Trash2 size={14} color={COLORS.textLight} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: COLORS.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  itemCountBadge: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: 8,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  input: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  checkedCountText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  clearCheckedText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
    gap: 8,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  emptyDesc: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textMuted,
    textAlign: 'center',
    maxWidth: 240,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  itemRowChecked: {
    backgroundColor: COLORS.surface,
    opacity: 0.75,
  },
  checkTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: TYPOGRAPHY.sizes.body,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textPrimary,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  recipeTag: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  rowRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moveToKitchenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    gap: 4,
  },
  moveToKitchenText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
  },
  deleteBtn: {
    padding: 4,
  },
  categorySection: {
    marginBottom: SPACING.md,
    gap: 8,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryCountBadge: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
});
