import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  Home,
  Compass,
  Refrigerator,
  Bookmark,
  User,
} from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useAppStore } from '../../store/useAppStore';

export default function TabsLayout() {
  const pantryItems = useAppStore((state) => state.pantryItems);
  const pantryCount = pantryItems.length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.pantryIconContainer}>
              <View
                style={[
                  styles.pantryIconWrapper,
                  focused && styles.pantryIconFocused,
                ]}
              >
                <Refrigerator
                  size={size}
                  color={focused ? COLORS.textInverted : color}
                />
              </View>
              {pantryCount > 0 && (
                <View style={styles.pantryBadge}>
                  <Text style={styles.pantryBadgeText}>
                    {pantryCount > 9 ? '9+' : pantryCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.medium,
    marginTop: 2,
  },
  pantryIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryIconWrapper: {
    padding: 2,
    borderRadius: RADIUS.full,
  },
  pantryIconFocused: {
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: RADIUS.full,
    marginTop: -4,
  },
  pantryBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: COLORS.primary,
    borderRadius: 9,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryBadgeText: {
    color: COLORS.textInverted,
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});
