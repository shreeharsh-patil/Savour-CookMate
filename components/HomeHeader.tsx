import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { BRAND } from '../constants/brand';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useAppStore } from '../store/useAppStore';

interface HomeHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenProfile: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onRefresh,
  isRefreshing,
  onOpenProfile,
}) => {
  const userProfile = useAppStore((state) => state.userProfile);
  const currentUser = useAppStore((state) => state.currentUser);

  const displayName = currentUser?.name || userProfile?.name || 'Food Explorer';
  const firstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftColumn}>
        <Text style={styles.greetingText}>Good food awaits, {firstName}</Text>
        <Text style={styles.wordmark}>{BRAND.WORDMARK}</Text>
      </View>

      <View style={styles.rightActions}>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            pressed && styles.iconButtonPressed,
          ]}
          onPress={onRefresh}
          disabled={isRefreshing}
          accessibilityLabel="Refresh recipes"
        >
          <RefreshCw
            size={18}
            color={isRefreshing ? COLORS.primary : COLORS.textPrimary}
          />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.avatarButton,
            pressed && styles.avatarButtonPressed,
          ]}
          onPress={onOpenProfile}
          accessibilityLabel="Open user profile"
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  leftColumn: {
    flexDirection: 'column',
  },
  greetingText: {
    fontSize: TYPOGRAPHY.sizes.subtext,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: 2,
  },
  wordmark: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontSerif,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButtonPressed: {
    backgroundColor: COLORS.surface,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonPressed: {
    backgroundColor: COLORS.primaryDark,
  },
  avatarText: {
    color: COLORS.textInverted,
    fontSize: TYPOGRAPHY.sizes.subtext,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
