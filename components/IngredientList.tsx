import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CheckCircle2, Circle, Plus, Minus, AlertCircle, Copy } from 'lucide-react-native';
import { Ingredient, PantryItem, IngredientAvailability } from '../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { scaleIngredientQuantity } from '../utils/formatters';
import { computeAvailability } from '../utils/pantryAvailability';

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServings: number;
  currentServings: number;
  pantryIngredientNames: Set<string>;
  pantryItems?: PantryItem[];
  checkedItems: Record<number, boolean>;
  onToggleCheck: (index: number) => void;
  onIncrementServings: () => void;
  onDecrementServings: () => void;
  onAddMissingToShoppingList?: () => void;
  onCopyIngredients?: () => void;
  onAddSingleMissing?: (name: string) => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  baseServings,
  currentServings,
  pantryIngredientNames,
  pantryItems = [],
  checkedItems,
  onToggleCheck,
  onIncrementServings,
  onDecrementServings,
  onAddMissingToShoppingList,
  onCopyIngredients,
  onAddSingleMissing,
}) => {
  const missingCount = ingredients.filter((ing) => {
    const { status } = computeAvailability(ing, '', pantryItems, pantryIngredientNames);
    return (status === 'MISSING' || status === 'PARTIAL') && !ing.optional;
  }).length;

  return (
    <View style={styles.container}>
      {/* Servings Control Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          <Text style={styles.subtitle}>
            {ingredients.length} items • Adjust servings to scale
          </Text>
        </View>

        <View style={styles.headerActionsRight}>
          {onCopyIngredients ? (
            <Pressable
              style={styles.copyBtn}
              onPress={onCopyIngredients}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel="Copy ingredients list"
            >
              <Copy size={13} color={COLORS.primary} />
              <Text style={styles.copyBtnText}>Copy</Text>
            </Pressable>
          ) : null}

          <View style={styles.servingsControl}>
            <Pressable
              style={styles.servingsBtn}
              onPress={onDecrementServings}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Decrease servings"
            >
              <Minus size={14} color={COLORS.textPrimary} />
            </Pressable>
            <Text style={styles.servingsValue}>{currentServings} servings</Text>
            <Pressable
              style={styles.servingsBtn}
              onPress={onIncrementServings}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Increase servings"
            >
              <Plus size={14} color={COLORS.textPrimary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Missing Notice Bar */}
      {missingCount > 0 && onAddMissingToShoppingList && (
        <View style={styles.missingNoticeBar}>
          <View style={styles.missingNoticeLeft}>
            <AlertCircle size={15} color={COLORS.warning} />
            <Text style={styles.missingNoticeText}>
              {missingCount} ingredient{missingCount > 1 ? 's' : ''} missing or running low
            </Text>
          </View>
          <Pressable
            style={styles.addMissingBtn}
            onPress={onAddMissingToShoppingList}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Add all missing ingredients to shopping list"
          >
            <Text style={styles.addMissingBtnText}>Add All</Text>
          </Pressable>
        </View>
      )}

      {/* Ingredient Items */}
      <View style={styles.list}>
        {ingredients.map((ing, idx) => {
          const isChecked = Boolean(checkedItems[idx]);
          const rawQty = ing.quantity || ing.amount || '';
          const scaledQty = rawQty
            ? scaleIngredientQuantity(rawQty, baseServings, currentServings)
            : '';

          const { status, label } = computeAvailability(
            ing,
            scaledQty,
            pantryItems,
            pantryIngredientNames
          );

          const isAvailable = status === 'ENOUGH' || status === 'UNKNOWN_QUANTITY';
          const isActionable = status === 'MISSING' || status === 'PARTIAL';

          return (
            <Pressable
              key={`${ing.name}-${idx}`}
              style={({ pressed }) => [
                styles.itemRow,
                isChecked && styles.itemRowChecked,
                pressed && styles.itemRowPressed,
              ]}
              onPress={() => onToggleCheck(idx)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              accessibilityLabel={`${ing.name || ing.item}${scaledQty ? `, ${scaledQty}` : ''}${ing.unit ? ` ${ing.unit}` : ''}`}
            >
              <View style={styles.checkIcon}>
                {isChecked ? (
                  <CheckCircle2 size={18} color={COLORS.primary} />
                ) : (
                  <Circle size={18} color={COLORS.textLight} />
                )}
              </View>

              <View style={styles.itemDetails}>
                <Text
                  style={[
                    styles.itemName,
                    isChecked && styles.itemNameChecked,
                  ]}
                >
                  {ing.name || ing.item}
                  {ing.optional ? (
                    <Text style={styles.optionalText}> (Optional)</Text>
                  ) : null}
                </Text>

                {(scaledQty || ing.unit || ing.category) ? (
                  <View style={styles.itemMeta}>
                    {scaledQty || ing.unit ? (
                      <Text style={styles.itemQty}>
                        {scaledQty ? `${scaledQty} ` : ''}{ing.unit || ''}
                      </Text>
                    ) : null}
                    {ing.category && (scaledQty || ing.unit) ? (
                      <Text style={styles.metaDivider}>•</Text>
                    ) : null}
                    {ing.category ? (
                      <Text style={styles.itemCategory}>{ing.category}</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <Pressable
                style={[
                  styles.pantryStatusTag,
                  isAvailable
                    ? styles.pantryTagHave
                    : status === 'PARTIAL'
                    ? styles.pantryTagPartial
                    : styles.pantryTagMissing,
                ]}
                onPress={() => {
                  if (isActionable && onAddSingleMissing) {
                    onAddSingleMissing(ing.name || ing.item || '');
                  }
                }}
                disabled={!isActionable || !onAddSingleMissing}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={
                  isAvailable
                    ? `${ing.name} in kitchen`
                    : status === 'PARTIAL'
                    ? `${ing.name} partial in kitchen, add more`
                    : `Add ${ing.name} to shopping list`
                }
              >
                <Text
                  style={[
                    styles.pantryStatusText,
                    isAvailable
                      ? styles.pantryTextHave
                      : status === 'PARTIAL'
                      ? styles.pantryTextPartial
                      : styles.pantryTextMissing,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
      </View>
    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  servingsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 4,
    paddingVertical: 3,
    gap: 8,
  },
  servingsBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsValue: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
  },
  missingNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  missingNoticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  missingNoticeText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: '#92400E',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  addMissingBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.xs,
  },
  addMissingBtnText: {
    color: COLORS.textInverted,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  list: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  itemRowChecked: {
    backgroundColor: COLORS.surface,
  },
  itemRowPressed: {
    backgroundColor: COLORS.surfaceHover,
  },
  checkIcon: {
    marginRight: 10,
  },
  itemDetails: {
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
  optionalText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  itemQty: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  metaDivider: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.border,
  },
  itemCategory: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  pantryStatusTag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  pantryTagHave: {
    backgroundColor: COLORS.successLight,
  },
  pantryTagPartial: {
    backgroundColor: '#FEF3C7',
  },
  pantryTagMissing: {
    backgroundColor: COLORS.surface,
  },
  pantryStatusText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  pantryTextHave: {
    color: COLORS.success,
  },
  pantryTextPartial: {
    color: '#D97706',
  },
  pantryTextMissing: {
    color: COLORS.textMuted,
  },
});
