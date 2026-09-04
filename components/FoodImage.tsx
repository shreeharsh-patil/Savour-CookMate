import React, { useState } from 'react';
import { Image, StyleSheet, View, ActivityIndicator, ImageStyle, StyleProp } from 'react-native';
import { COLORS } from '../constants/theme';

interface FoodImageProps {
  source: { uri: string } | number;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
  borderRadius?: number;
}

export const FoodImage: React.FC<FoodImageProps> = ({
  source,
  style,
  borderRadius = 0,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fallbackUri =
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';

  const imageSource =
    hasError || (typeof source === 'object' && !source.uri)
      ? { uri: fallbackUri }
      : source;

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <Image
        source={imageSource}
        style={[styles.image, { borderRadius }]}
        resizeMode="cover"
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
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
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(250, 248, 245, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
