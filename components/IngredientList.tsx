import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CheckCircle2, Circle, Plus, Minus, AlertCircle } from 'lucide-react-native';
import { Ingredient } from '../types';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { scaleIngredientQuantity } from '../utils/formatters';

interface IngredientListProps {
  ingredients: Ingredient[];
  baseServings: number;
  currentServings: number;
  pantryIngredientNames: Set<string>;
  checkedItems: Record<number, boolean>;
  onToggleCheck: (index: number) => void;
  onIncrementServings: () => void;
  onDecrementServings: () => void;
  onAddMissingToShoppingList?: () => void;
}

export const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  baseServings,
  currentServings,
  pantryIngredientNames,
  checkedItems,
  onToggleCheck,
  onIncrementServings,
  onDecrementServings,
  onAddMissingToShoppingList,
}) => {
  const missingCount = ingredients.filter((ing) => {
    const name = (ing.name || ing.item || '').toLowerCase().trim();
    const norm = (ing.normalizedName || '').toLowerCase().trim();
    const isAvailable =
      pantryIngredientNames.has(name) || (norm && pantryIngredientNames.has(norm));
    return !isAvailable && !ing.optional;
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

        <View style={styles.servingsControl}>
          <Pressable
            style={styles.servingsBtn}
            onPress={onDecrementServings}
            hitSlop={8}
          >
            <Minus size={14} color={COLORS.textPrimary} />
          </Pressable>
          <Text style={styles.servingsValue}>{currentServings} servings</Text>
          <Pressable
            style={styles.servingsBtn}
            onPress={onIncrementServings}
            hitSlop={8}
          >
            <Plus size={14} color={COLORS.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Missing Notice Bar */}
      {missingCount > 0 && onAddMissingToShoppingList && (
        <View style={styles.missingNoticeBar}>
          <View style={styles.missingNoticeLeft}>
            <AlertCircle size={15} color={COLORS.warning} />
            <Text style={styles.missingNoticeText}>
              {missingCount} ingredient{missingCount > 1 ? 's' : ''} missing from your kitchen
            </Text>
          </View>
          <Pressable
            style={styles.addMissingBtn}
            onPress={onAddMissingToShoppingList}
          >
            <Text style={styles.addMissingBtnText}>Add All</Text>
          </Pressable>
        </View>
      )}

      {/* Ingredient Items */}
      <View style={styles.list}>
        {ingredients.map((ing, idx) => {
          const isChecked = Boolean(checkedItems[idx]);
          const name = (ing.name || ing.item || '').toLowerCase().trim();
          const norm = (ing.normalizedName || '').toLowerCase().trim();
          const inPantry =
            pantryIngredientNames.has(name) ||
            (norm && pantryIngredientNames.has(norm));

          const scaledQty = scaleIngredientQuantity(
            ing.quantity || ing.amount || '1',
            baseServings,
            currentServings
          );

          return (
            <Pressable
              key={`${ing.name}-${idx}`}
              style={({ pressed }) => [
                styles.itemRow,
                isChecked && styles.itemRowChecked,
                pressed && styles.itemRowPressed,
              ]}
              onPress={() => onToggleCheck(idx)}
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

                <View style={styles.itemMeta}>
                  <Text style={styles.itemQty}>
                    {scaledQty} {ing.unit || ''}
                  </Text>
                  <Text style={styles.metaDivider}>•</Text>
                  <Text style={styles.itemCategory}>{ing.category}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.pantryStatusTag,
                  inPantry ? styles.pantryTagHave : styles.pantryTagMissing,
                ]}
              >
                <Text
                  style={[
                    styles.pantryStatusText,
                    inPantry ? styles.pantryTextHave : styles.pantryTextMissing,
                  ]}
                >
                  {inPantry ? 'In Kitchen' : 'Missing'}
                </Text>
              </View>
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
  pantryTextMissing: {
    color: COLORS.textMuted,
  },
});
