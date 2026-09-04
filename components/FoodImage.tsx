import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ImageStyle, StyleProp } from 'react-native';
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

export const FoodImage: React.FC<FoodImageProps> = ({
  source,
  thumbnailSource,
  style,
  contentFit = 'cover',
  borderRadius = 0,
  priority = 'normal',
}) => {
  const [hasPrimaryError, setHasPrimaryError] = useState(false);
  const [hasThumbnailError, setHasThumbnailError] = useState(false);

  const sourceUri = typeof source === 'object' ? source?.uri : String(source);
  const thumbUri = thumbnailSource?.uri;

  // Reset error state when source URL changes
  useEffect(() => {
    setHasPrimaryError(false);
    setHasThumbnailError(false);
  }, [sourceUri, thumbUri]);

  const resolvedSource = useMemo(() => {
    // If primary failed, attempt thumbnail
    if (hasPrimaryError) {
      if (thumbUri && !hasThumbnailError) {
        return { uri: thumbUri };
      }
      return null;
    }

    // Check if valid source exists
    if (typeof source === 'object') {
      if (!source.uri || source.uri.trim() === '') {
        if (thumbUri && !hasThumbnailError) {
          return { uri: thumbUri };
        }
        return null;
      }
    }
    return source;
  }, [source, sourceUri, thumbUri, hasPrimaryError, hasThumbnailError]);

  const handleError = () => {
    if (!hasPrimaryError) {
      setHasPrimaryError(true);
    } else {
      setHasThumbnailError(true);
    }
  };

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {resolvedSource ? (
        <ExpoImage
          source={resolvedSource}
          placeholder={{ blurhash: FOOD_BLURHASH }}
          contentFit={contentFit}
          transition={200}
          cachePolicy="memory-disk"
          priority={priority}
          style={[styles.image, { borderRadius }]}
          onError={handleError}
        />
      ) : (
        <View style={[styles.missingContainer, { borderRadius }]}>
          <UtensilsCrossed size={22} color={COLORS.textMuted} />
          <Text style={styles.missingText}>No image available</Text>
        </View>
      )}
    </View>
  );
};

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
