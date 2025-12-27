"use client";

import { useState, useEffect } from "react";

interface CeltraFrameProps {
  width: number;
  height: number;
  previewUrl: string;
  onReady?: () => void;
  onError?: (error: string) => void;
}

/**
 * CeltraFrame - Renders Celtra ads using their preview sandbox
 *
 * Celtra ads have their own SDK that doesn't play nice with MRAID mocks.
 * Instead, we load their preview sandbox URL directly.
 */
export function CeltraFrame({
  width,
  height,
  previewUrl,
  onReady,
  onError,
}: CeltraFrameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
  }, [previewUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    onReady?.();
  };

  const handleError = () => {
    const errorMsg = "Failed to load Celtra preview";
    setIsLoading(false);
    setError(errorMsg);
    onError?.(errorMsg);
  };

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">
              Loading Celtra preview...
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10 z-10">
          <div className="text-center px-4">
            <p className="text-destructive font-medium">Error</p>
            <p className="text-sm text-destructive/80">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Try pasting a Celtra preview URL instead of a raw tag
            </p>
          </div>
        </div>
      )}

      <iframe
        src={previewUrl}
        width={width}
        height={height}
        style={{
          border: "none",
          display: "block",
        }}
        allow="autoplay; fullscreen; encrypted-media"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
