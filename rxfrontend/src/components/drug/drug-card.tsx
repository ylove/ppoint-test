import Link from 'next/link';
import { ArrowRight, Building2, Calendar, Lightbulb, AlertTriangle } from 'lucide-react';
import { createDrugSlug, formatRelativeTime, truncateText } from '@/lib/utils';
import type { DrugSearchItem } from '@/lib/types';

interface DrugCardProps {
  drug: DrugSearchItem;
  showSummary?: boolean;
  showLastUpdated?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function DrugCard({ 
  drug, 
  showSummary = false,
  showLastUpdated = false,
  variant = 'default',
  className = ""
}: DrugCardProps) {
  const drugSlug = drug.slug || createDrugSlug(drug.drugName, drug.genericName);
  const href = `/drugs/${drugSlug}`;
  
  // Check if drug has AI enhancements or important warnings (based on naming patterns)
  const hasAiContent = Boolean(drug.summary);
  const isImportant = drug.drugName.toLowerCase().includes('warning') || 
                     drug.genericName.toLowerCase().includes('warning');

  if (variant === 'compact') {
    return (
      <Link 
        href={href}
        className={`drug-card drug-card-compact ${className}`}
      >
        <div className="drug-card-compact-content">
          <div className="drug-card-compact-main">
            <h3 className="drug-card-compact-title">
              {drug.drugName}
            </h3>
            <p className="drug-card-compact-generic">
              {drug.genericName}
            </p>
          </div>
          <ArrowRight className="drug-card-compact-arrow" />
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link 
        href={href}
        className={`drug-card drug-card-featured ${className}`}
      >
        <div className="drug-card-featured-header">
          {hasAiContent && (
            <div className="drug-card-featured-ai-badge">
              <Lightbulb className="drug-card-ai-icon" />
              <span>AI Enhanced</span>
            </div>
          )}
          {isImportant && (
            <div className="drug-card-featured-important-badge">
              <AlertTriangle className="drug-card-important-icon" />
              <span>Important</span>
            </div>
          )}
        </div>

        <div className="drug-card-featured-content">
          <h3 className="drug-card-featured-title">
            {drug.drugName}
          </h3>
          <p className="drug-card-featured-generic">
            Generic: {drug.genericName}
          </p>
          
          {drug.summary && (
            <p className="drug-card-featured-summary">
              {truncateText(drug.summary, 120)}
            </p>
          )}
          
          <div className="drug-card-featured-meta">
            <div className="drug-card-featured-labeler">
              <Building2 className="drug-card-meta-icon" />
              <span>{drug.labeler}</span>
            </div>
            {showLastUpdated && drug.lastUpdated && (
              <div className="drug-card-featured-updated">
                <Calendar className="drug-card-meta-icon" />
                <span>{formatRelativeTime(drug.lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="drug-card-featured-footer">
          <span className="drug-card-featured-cta">
            View Details
            <ArrowRight className="drug-card-cta-arrow" />
          </span>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link 
      href={href}
      className={`drug-card drug-card-default${hasAiContent ? ' drug-card-ai-enhanced' : ''}${isImportant ? ' drug-card-important' : ''} ${className}`}
    >
      <div className="drug-card-header">
        <div className="drug-card-badges">
          {hasAiContent && (
            <div className="drug-card-ai-badge">
              <Lightbulb className="drug-card-ai-icon" />
              <span className="drug-card-badge-text">AI</span>
            </div>
          )}
          {isImportant && (
            <div className="drug-card-important-badge">
              <AlertTriangle className="drug-card-important-icon" />
              <span className="drug-card-badge-text">!</span>
            </div>
          )}
        </div>
      </div>

      <div className="drug-card-content">
        <div className="drug-card-main">
          <h3 className="drug-card-title">
            {drug.drugName}
          </h3>
          <p className="drug-card-generic">
            Generic: {drug.genericName}
          </p>
          
          {showSummary && drug.summary && (
            <p className="drug-card-summary">
              {truncateText(drug.summary, 100)}
            </p>
          )}
        </div>
        
        <div className="drug-card-meta">
          <div className="drug-card-labeler">
            <Building2 className="drug-card-meta-icon" />
            <span className="drug-card-meta-text">
              {truncateText(drug.labeler, 30)}
            </span>
          </div>
          
          {showLastUpdated && drug.lastUpdated && (
            <div className="drug-card-updated">
              <Calendar className="drug-card-meta-icon" />
              <span className="drug-card-meta-text">
                {formatRelativeTime(drug.lastUpdated)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="drug-card-footer">
        <span className="drug-card-cta">
          <span className="drug-card-cta-text">View Details</span>
          <ArrowRight className="drug-card-cta-arrow" />
        </span>
      </div>
    </Link>
  );
}

export default DrugCard;