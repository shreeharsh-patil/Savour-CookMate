import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ImageStyle, StyleProp, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { UtensilsCrossed } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

interface FoodImageProps {
  source: { uri: string } | number;
  thumbnailSource?: { uri: string };
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  priority?: 'low' | 'normal' | 'high';
}

const FOOD_BLURHASH = 'L5PZfSi_.AyE_3t7t7R**0o#DgR4';

export const FoodImage: React.FC<FoodImageProps> = React.memo(({
  source,
  thumbnailSource,
  style,
  contentFit = 'cover',
  borderRadius = 0,
  priority = 'normal',
}) => {
  const [hasError, setHasError] = useState(false);

  const sourceUri = typeof source === 'object' ? source?.uri : String(source);
  const thumbUri = thumbnailSource?.uri;

  // Reset error state only when source URL changes and if error was set
  useEffect(() => {
    if (hasError) {
      setHasError(false);
    }
  }, [sourceUri]);

  const resolvedUri = hasError ? thumbUri : sourceUri;

  return (
    <View style={[styles.container, borderRadius ? { borderRadius } : null, style]}>
      {resolvedUri && resolvedUri.trim() !== '' ? (
        <ExpoImage
          source={{ uri: resolvedUri }}
          placeholder={{ blurhash: FOOD_BLURHASH }}
          contentFit={contentFit}
          transition={Platform.OS === 'web' ? 0 : 50}
          cachePolicy="memory-disk"
          priority={priority}
          recyclingKey={resolvedUri}
          style={[styles.image, borderRadius ? { borderRadius } : null]}
          onError={() => {
            if (!hasError && thumbUri) {
              setHasError(true);
            }
          }}
        />
      ) : (
        <View style={[styles.missingContainer, borderRadius ? { borderRadius } : null]}>
          <UtensilsCrossed size={22} color={COLORS.textMuted} />
          <Text style={styles.missingText}>No image available</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F5EFEB',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  missingContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4EFEA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  missingText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
});
