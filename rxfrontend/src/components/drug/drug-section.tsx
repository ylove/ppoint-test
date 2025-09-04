'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, Info } from 'lucide-react';
import { getSectionCategory, isImportantSection, htmlToPlainText, generateExcerpt } from '@/lib/utils';
import type { DrugSection } from '@/lib/types';

interface DrugSectionProps {
  section: DrugSection;
  isDefaultExpanded?: boolean;
  showExcerpt?: boolean;
  className?: string;
}

export function DrugSectionComponent({ 
  section, 
  isDefaultExpanded = false,
  showExcerpt = true,
  className = ""
}: DrugSectionProps) {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);
  const [showEnhanced, setShowEnhanced] = useState(false);

  const category = section.category || getSectionCategory(section.title);
  const isImportant = section.isImportant || isImportantSection(section.title);
  const hasAiContent = Boolean(section.enhancedContent);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const toggleEnhanced = useCallback(() => {
    setShowEnhanced(prev => !prev);
  }, []);

  // Generate excerpt for collapsed view
  const excerpt = showExcerpt && !isExpanded ? generateExcerpt(section.content, 150) : null;

  // Get appropriate icon for section category
  const getSectionIcon = () => {
    if (isImportant) {
      return <AlertTriangle className="drug-section-category-icon drug-section-icon-warning" />;
    }
    if (hasAiContent) {
      return <Lightbulb className="drug-section-category-icon drug-section-icon-ai" />;
    }
    return <Info className="drug-section-category-icon drug-section-icon-info" />;
  };

  return (
    <div className={`drug-section drug-section-category-${category}${isImportant ? ' drug-section-important' : ''}${hasAiContent ? ' drug-section-ai-enhanced' : ''}${isExpanded ? ' drug-section-expanded' : ''} ${className}`}>
      {/* Section Header - Always Visible */}
      <button
        onClick={toggleExpanded}
        className="drug-section-header"
        type="button"
        aria-expanded={isExpanded}
        aria-controls={`section-content-${section.id}`}
      >
        <div className="drug-section-header-main">
          <div className="drug-section-header-left">
            {getSectionIcon()}
            <h3 className="drug-section-title">
              {section.title}
            </h3>
          </div>
          
          <div className="drug-section-header-right">
            {/* AI Enhancement Badge */}
            {hasAiContent && (
              <div className="drug-section-ai-badge">
                <Lightbulb className="drug-section-ai-badge-icon" />
                <span className="drug-section-ai-badge-text">AI Enhanced</span>
              </div>
            )}
            
            {/* Important Section Badge */}
            {isImportant && (
              <div className="drug-section-important-badge">
                <AlertTriangle className="drug-section-important-badge-icon" />
                <span className="drug-section-important-badge-text">Important</span>
              </div>
            )}
            
            {/* Expand/Collapse Icon */}
            <div className="drug-section-toggle-icon">
              {isExpanded ? (
                <ChevronUp className="drug-section-chevron" />
              ) : (
                <ChevronDown className="drug-section-chevron" />
              )}
            </div>
          </div>
        </div>

        {/* Excerpt for collapsed sections */}
        {excerpt && !isExpanded && (
          <div className="drug-section-excerpt">
            <p className="drug-section-excerpt-text">
              {excerpt}
            </p>
          </div>
        )}
      </button>

      {/* Section Content - Expandable */}
      {isExpanded && (
        <div 
          className="drug-section-content"
          id={`section-content-${section.id}`}
        >
          {/* Original Content */}
          <div className="drug-section-original">
            <div 
              className="drug-section-html-content"
              dangerouslySetInnerHTML={{ __html: section.content.replace(/<h1/g, '<h4').replace(/<\/h1>/g, '</h4>') }}
            />
          </div>

          {/* AI Enhanced Content */}
          {hasAiContent && (
            <div className="drug-section-ai-content">
              <button
                onClick={toggleEnhanced}
                className="drug-section-ai-toggle"
                type="button"
                aria-expanded={showEnhanced}
                aria-controls={`enhanced-content-${section.id}`}
              >
                <Lightbulb className="drug-section-ai-toggle-icon" />
                <span className="drug-section-ai-toggle-text">
                  What do I tell my patients?
                </span>
                <div className="drug-section-ai-toggle-chevron">
                  {showEnhanced ? (
                    <ChevronUp className="drug-section-chevron-small" />
                  ) : (
                    <ChevronDown className="drug-section-chevron-small" />
                  )}
                </div>
              </button>
              
              {showEnhanced && (
                <div 
                  className="drug-section-enhanced-content"
                  id={`enhanced-content-${section.id}`}
                >
                  <div className="drug-section-enhanced-header">
                    <Lightbulb className="drug-section-enhanced-icon" />
                    <h4 className="drug-section-enhanced-title">
                      Simplified explanation
                    </h4>
                  </div>
                  <div className="drug-section-enhanced-text">
                    {section.enhancedContent}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section Footer with Metadata */}
          <div className="drug-section-footer">
            <div className="drug-section-meta">
              <span className="drug-section-category-label">
                Category: {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
              {hasAiContent && (
                <span className="drug-section-ai-label">
                  Enhanced with AI
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DrugSectionComponent;