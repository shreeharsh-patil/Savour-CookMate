import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { Search, X, Compass } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { BRAND } from '../constants/brand';
import { NATURAL_SEARCH_SUGGESTIONS } from '../constants/categories';
import { analytics } from '../services/analytics';

interface RecipeSearchProps {
  onSearch: (query: string) => void;
  showSuggestions?: boolean;
}

export const RecipeSearch: React.FC<RecipeSearchProps> = ({
  onSearch,
  showSuggestions = true,
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    analytics.trackSearch(trimmed);
    onSearch(trimmed);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    analytics.trackSearch(suggestion);
    onSearch(suggestion);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={BRAND.SEARCH_PLACEHOLDER}
          placeholderTextColor={COLORS.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={handleClear} hitSlop={8} style={styles.clearButton}>
            <X size={16} color={COLORS.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {showSuggestions && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContainer}
        >
          <View style={styles.suggestionLabel}>
            <Compass size={12} color={COLORS.primary} />
            <Text style={styles.suggestionLabelText}>Try:</Text>
          </View>
          {NATURAL_SEARCH_SUGGESTIONS.map((item) => (
            <Pressable
              key={item}
              style={({ pressed }) => [
                styles.suggestionChip,
                pressed && styles.suggestionChipPressed,
              ]}
              onPress={() => handleSuggestionPress(item)}
            >
              <Text style={styles.suggestionChipText}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.textPrimary,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  suggestionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 2,
  },
  suggestionLabelText: {
    fontSize: TYPOGRAPHY.sizes.tiny,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  suggestionChip: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  suggestionChipPressed: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  suggestionChipText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
});
