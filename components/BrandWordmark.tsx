import React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle, ViewStyle, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';

interface BrandWordmarkProps {
  size?: number;
  showSubtitle?: boolean;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  wordmarkStyle?: StyleProp<TextStyle>;
  darkColor?: string;
  orangeColor?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = React.memo(({
  size = 24,
  showSubtitle = false,
  subtitle = 'Live Culinary Companion',
  style,
  wordmarkStyle,
  darkColor = COLORS.logoDark,
  orangeColor = COLORS.logoOrange,
}) => {
  const fontStyle = {
    fontFamily: Platform.select({
      ios: 'Fredoka_700Bold',
      android: 'Fredoka_700Bold',
      web: 'Fredoka_700Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      default: 'Fredoka_700Bold',
    }),
    fontSize: size,
    letterSpacing: -0.3,
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.wordmarkRow, fontStyle, wordmarkStyle]}>
        <Text style={{ color: orangeColor }}>Yummy</Text>
        <Text style={{ color: orangeColor }}> </Text>
        <Text style={{ color: darkColor }}>Tummy</Text>
      </Text>
      {showSubtitle && (
        <Text style={[styles.subtitle, { fontSize: Math.max(10, Math.round(size * 0.42)) }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  wordmarkRow: {
    fontWeight: '700',
    includeFontPadding: false,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: 0.2,
  },
});
