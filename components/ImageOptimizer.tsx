import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, StyleSheet, View } from 'react-native';

interface ImageOptimizerProps {
  source: any;
  style?: ImageStyle | ImageStyle[];
  placeholder?: any;
  fallback?: any;
  lazy?: boolean;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'memory' | 'disk' | 'memory-disk';
  onLoad?: () => void;
  onError?: (error: any) => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  transition?: number;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export const ImageOptimizer: React.FC<ImageOptimizerProps> = ({
  source,
  style,
  placeholder,
  fallback,
  lazy = true,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  onLoad,
  onError,
  resizeMode = 'cover',
  transition = 300,
  contentFit = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Memoized cache policy
  const cachePolicyValue = useMemo(() => {
    switch (cachePolicy) {
      case 'memory':
        return 'memory';
      case 'disk':
        return 'disk';
      case 'memory-disk':
      default:
        return 'memory-disk';
    }
  }, [cachePolicy]);

  // Memoized priority value
  const priorityValue = useMemo(() => {
    switch (priority) {
      case 'low':
        return 'low';
      case 'high':
        return 'high';
      case 'normal':
      default:
        return 'normal';
    }
  }, [priority]);

  // Handle image load start
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image load error
  const handleError = useCallback((error: any) => {
    setIsLoading(false);
    setHasError(true);
    setImageLoaded(false);
    onError?.(error);
  }, [onError]);

  // Show placeholder while loading
  if (isLoading && placeholder) {
    return (
      <View style={[style, styles.placeholderContainer]}>
        {placeholder}
        {lazy && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#207E06" />
          </View>
        )}
      </View>
    );
  }

  // Show fallback on error
  if (hasError && fallback) {
    return (
      <View style={[style, styles.fallbackContainer]}>
        {fallback}
      </View>
    );
  }

  // Use Expo Image for better performance when available
  if (typeof ExpoImage !== 'undefined') {
    return (
      <ExpoImage
        source={source}
        style={style}
        contentFit={contentFit}
        transition={transition}
        cachePolicy={cachePolicyValue}
        priority={priorityValue}
        onLoadStart={handleLoadStart}
        onLoad={handleLoad}
        onError={handleError}
        placeholder={placeholder}
        placeholderContentFit="cover"
        recyclingKey={typeof source === 'string' ? source : undefined}
      />
    );
  }

  // Fallback to React Native Image
  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onLoadStart={handleLoadStart}
      onLoad={handleLoad}
      onError={handleError}
      fadeDuration={transition}
    />
  );
};

// Optimized image with lazy loading
export const LazyImage: React.FC<ImageOptimizerProps> = (props) => (
  <ImageOptimizer {...props} lazy={true} />
);

// High priority image for above-the-fold content
export const PriorityImage: React.FC<ImageOptimizerProps> = (props) => (
  <ImageOptimizer {...props} priority="high" lazy={false} />
);

// Cached image with disk persistence
export const CachedImage: React.FC<ImageOptimizerProps> = (props) => (
  <ImageOptimizer {...props} cachePolicy="disk" />
);

// Avatar image with circular style
export const AvatarImage: React.FC<ImageOptimizerProps> = ({ style, ...props }) => (
  <ImageOptimizer
    {...props}
    style={[styles.avatar, ...(style ? (Array.isArray(style) ? style : [style]) : [])]}
    contentFit="cover"
    resizeMode="cover"
  />
);

// Thumbnail image with square aspect ratio
export const ThumbnailImage: React.FC<ImageOptimizerProps> = ({ style, ...props }) => (
  <ImageOptimizer
    {...props}
    style={[styles.thumbnail, ...(style ? (Array.isArray(style) ? style : [style]) : [])]}
    contentFit="cover"
    resizeMode="cover"
  />
);

// Background image with overlay support
export const BackgroundImage: React.FC<ImageOptimizerProps & { overlay?: React.ReactNode }> = ({ 
  overlay, 
  style, 
  ...props 
}) => (
  <View style={[styles.backgroundContainer, style]}>
    <ImageOptimizer
      {...props}
      style={styles.backgroundImage}
      contentFit="cover"
      resizeMode="cover"
    />
    {overlay && (
      <View style={styles.overlay}>
        {overlay}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  avatar: {
    borderRadius: 25,
    width: 50,
    height: 50,
  },
  thumbnail: {
    borderRadius: 8,
    width: 80,
    height: 80,
  },
  backgroundContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});

export default ImageOptimizer;
