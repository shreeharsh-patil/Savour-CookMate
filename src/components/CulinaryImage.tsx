import React, { useState } from 'react';

interface CulinaryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  fallbackKeywords?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';

export const CulinaryImage: React.FC<CulinaryImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[4/3]',
  fallbackKeywords,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const finalSrc = hasError || !src ? DEFAULT_FALLBACK : src;

  return (
    <div className={`relative overflow-hidden bg-[#EAE6DE] ${aspectRatio} ${className}`}>
      {/* Shimmer skeleton while loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EAE6DE] via-[#F2EFE9] to-[#EAE6DE] animate-pulse" />
      )}

      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setIsLoaded(true);
          }
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${props.className || ''}`}
        {...props}
      />
    </div>
  );
};
