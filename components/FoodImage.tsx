import React, { useState } from 'react';
import { StyleSheet, View, ImageStyle, StyleProp } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants/theme';

interface FoodImageProps {
  source: { uri: string } | number;
  thumbnailSource?: { uri: string };
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
  borderRadius?: number;
  priority?: 'low' | 'normal' | 'high';
}

const FALLBACK_CULINARY_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

// Universal warm food blurhash for instant visual feedback
const FOOD_BLURHASH = 'L5PZfSi_.AyE_3t7t7R**0o#DgR4';

export const FoodImage: React.FC<FoodImageProps> = ({
  source,
  thumbnailSource,
  style,
  contentFit = 'cover',
  borderRadius = 0,
  priority = 'normal',
}) => {
  const [hasError, setHasError] = useState(false);

  const resolvedSource = React.useMemo(() => {
    if (hasError) {
      return { uri: FALLBACK_CULINARY_IMAGE };
    }
    if (typeof source === 'object' && (!source.uri || source.uri.trim() === '')) {
      if (thumbnailSource && thumbnailSource.uri) {
        return thumbnailSource;
      }
      return { uri: FALLBACK_CULINARY_IMAGE };
    }
    return source;
  }, [source, thumbnailSource, hasError]);

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <ExpoImage
        source={resolvedSource}
        placeholder={{ blurhash: FOOD_BLURHASH }}
        contentFit={contentFit}
        transition={200}
        cachePolicy="memory-disk"
        priority={priority}
        style={[styles.image, { borderRadius }]}
        onError={() => {
          if (!hasError) setHasError(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
