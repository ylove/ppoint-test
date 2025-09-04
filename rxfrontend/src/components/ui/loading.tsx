import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'muted';
}

export function LoadingSpinner({ 
  size = "default", 
  className = "",
  color = "primary"
}: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner-container ${className}`}>
      <Loader2 className={`loading-spinner loading-spinner-${size} loading-spinner-${color}`} />
    </div>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function LoadingDots({ size = "default", className = "" }: LoadingDotsProps) {
  return (
    <div className={`loading-dots-container loading-dots-${size} ${className}`}>
      <div className="loading-dot loading-dot-1"></div>
      <div className="loading-dot loading-dot-2"></div>
      <div className="loading-dot loading-dot-3"></div>
    </div>
  );
}

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'avatar' | 'button' | 'drug-card' | 'drug-section';
  width?: string;
  height?: string;
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ 
  variant = "text",
  width,
  height,
  className = "",
  lines = 3
}: LoadingSkeletonProps) {
  if (variant === 'drug-card') {
    return (
      <div className={`loading-skeleton-drug-card ${className}`}>
        <div className="loading-skeleton-drug-card-header">
          <div className="loading-skeleton-drug-title"></div>
          <div className="loading-skeleton-drug-generic"></div>
        </div>
        <div className="loading-skeleton-drug-card-content">
          <div className="loading-skeleton-line loading-skeleton-line-short"></div>
          <div className="loading-skeleton-line loading-skeleton-line-medium"></div>
        </div>
        <div className="loading-skeleton-drug-card-footer">
          <div className="loading-skeleton-badge"></div>
          <div className="loading-skeleton-arrow"></div>
        </div>
      </div>
    );
  }

  if (variant === 'drug-section') {
    return (
      <div className={`loading-skeleton-drug-section ${className}`}>
        <div className="loading-skeleton-section-header">
          <div className="loading-skeleton-section-icon"></div>
          <div className="loading-skeleton-section-title"></div>
          <div className="loading-skeleton-section-chevron"></div>
        </div>
      </div>
    );
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`loading-skeleton-text-block ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`loading-skeleton-line${index === lines - 1 ? ' loading-skeleton-line-short' : ''}`}
            style={{ width }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`loading-skeleton loading-skeleton-${variant} ${className}`}
      style={{ width, height }}
    />
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
  className?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  message = "Loading...",
  className = ""
}: LoadingOverlayProps) {
  return (
    <div className={`loading-overlay-container ${className}`}>
      {children}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-overlay-content">
            <LoadingSpinner size="lg" />
            {message && (
              <p className="loading-overlay-message">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingPageProps {
  message?: string;
  description?: string;
  className?: string;
}

export function LoadingPage({ 
  message = "Loading...",
  description,
  className = ""
}: LoadingPageProps) {
  return (
    <div className={`loading-page ${className}`}>
      <div className="loading-page-content">
        <LoadingSpinner size="xl" />
        <h2 className="loading-page-message">{message}</h2>
        {description && (
          <p className="loading-page-description">{description}</p>
        )}
      </div>
    </div>
  );
}