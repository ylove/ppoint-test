'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, AlertTriangle, Lightbulb, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { DrugSectionComponent } from '@/components/drug/drug-section';
import type { EnhancedDrugContent, DrugSection } from '@/lib/types';
import { formatDate, stripHtml } from '@/lib/utils';
import { ApiClient } from '@/lib/api';

interface DrugDetailClientProps {
  initialDrug: Omit<EnhancedDrugContent, 'seoTitle' | 'metaDescription' | 'enhancedSummary'>;
  drugSlug: string;
  drugName: string;
  genericName: string;
}

export function DrugDetailClient({ initialDrug, drugSlug, drugName, genericName }: DrugDetailClientProps) {
  const [drug, setDrug] = useState<EnhancedDrugContent>({
    ...initialDrug,
    seoTitle: `${initialDrug.drugName} (${initialDrug.genericName}) - Prescription Info`,
    metaDescription: `Complete prescribing information for ${initialDrug.drugName} (${initialDrug.genericName}).`,
    enhancedSummary: `${initialDrug.drugName} is a prescription medication containing ${initialDrug.genericName}.`
  });
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(true);
  const [enhancedSections, setEnhancedSections] = useState<DrugSection[]>([]);

  useEffect(() => {
    const loadEnhancedContent = async () => {
      try {
        const apiClient = ApiClient.getInstance();
        const enhancedData = await apiClient.getDrugEnhanced(drugName, genericName);
        
        if (enhancedData) {
          setDrug(prevDrug => ({
            ...prevDrug,
            seoTitle: enhancedData.seoTitle,
            metaDescription: enhancedData.metaDescription,
            enhancedSummary: enhancedData.enhancedSummary,
            sections: enhancedData.sections
          }));
          setEnhancedSections(enhancedData.sections);
        }
      } catch (error) {
        console.error('Error loading enhanced content:', error);
      } finally {
        setIsLoadingEnhanced(false);
      }
    };

    loadEnhancedContent();
  }, [drugName, genericName]);
  const [activeTab, setActiveTab] = useState('overview');

  // Separate sections by category for better organization
  const criticalSections = drug.sections.filter(s => 
    ['Warnings and Precautions', 'Adverse Reactions', 'Contraindications'].includes(s.title)
  );
  
  const usageSections = drug.sections.filter(s => 
    ['Indications and Usage', 'Dosage and Administration', 'Dosage Forms and Strengths'].includes(s.title)
  );
  
  const clinicalSections = drug.sections.filter(s => 
    ['Clinical Pharmacology', 'Clinical Studies', 'Use in Specific Populations'].includes(s.title)
  );
  
  const otherSections = drug.sections.filter(s => 
    !criticalSections.includes(s) && !usageSections.includes(s) && !clinicalSections.includes(s)
  );

  return (
    <div className="drug-detail-page">
      {/* Navigation Breadcrumb */}
      <div className="drug-breadcrumb-section">
        <div className="drug-breadcrumb-container">
          <nav className="drug-breadcrumb">
            <Link href="/" className="drug-breadcrumb-link">
              Home
            </Link>
            <span className="drug-breadcrumb-separator">/</span>
            <Link href="/drugs" className="drug-breadcrumb-link">
              Drugs
            </Link>
            <span className="drug-breadcrumb-separator">/</span>
            <span className="drug-breadcrumb-current">
              {drug.drugName}
            </span>
          </nav>
        </div>
      </div>

      <div className="drug-detail-container">
        {/* Header Section - Similar to your design reference */}
        <div className="drug-header-card">
          {/* Decorative background elements */}
          <div className="drug-header-decoration-1"></div>
          <div className="drug-header-decoration-2"></div>
          
          <div className="drug-header-content">
            <div className="drug-header-main">
              {/* Left side - Drug info */}
              <div className="drug-header-info">
                {/* Drug Name - Large heading */}
                <h1 className="drug-name-title">
                  {drug.drugName}
                </h1>
                
                <div className="drug-header-details">
                  <div className="drug-generic-name">
                    <span className="drug-detail-label">Generic Name:</span>
                    <span className="drug-detail-value">{drug.genericName}</span>
                  </div>
                  
                  <div className="drug-last-updated">
                    <Calendar className="drug-calendar-icon" />
                    <span>Last updated: {formatDate(drug.lastUpdated)}</span>
                  </div>
                </div>

                {/* Enhanced Summary */}
                <div className="drug-summary-card">
                  <div className="drug-summary-header">
                    <Lightbulb className="drug-summary-icon" />
                    <h3 className="drug-summary-title">AI-Enhanced Summary</h3>
                    {isLoadingEnhanced && <Loader2 className="animate-spin" size={16} />}
                  </div>
                  <p className="drug-summary-text">
                    {stripHtml(drug.enhancedSummary)}
                  </p>
                </div>
              </div>

              {/* Right side - Key highlights */}
              <div className="drug-sidebar">
                <div className="drug-quick-facts-card">
                  <h3 className="drug-quick-facts-title">Quick Facts</h3>
                  <div className="drug-quick-facts-list">
                    <div className="drug-quick-fact drug-quick-fact-blue">
                      <span className="drug-quick-fact-label">Brand Name</span>
                      <span className="drug-quick-fact-value">{drug.drugName}</span>
                    </div>
                    
                    <div className="drug-quick-fact drug-quick-fact-green">
                      <span className="drug-quick-fact-label">Generic Name</span>
                      <span className="drug-quick-fact-value">{drug.genericName}</span>
                    </div>
                    
                    <div className="drug-quick-fact drug-quick-fact-purple">
                      <span className="drug-quick-fact-label">Sections</span>
                      <span className="drug-quick-fact-value">{drug.sections.length}</span>
                    </div>
                    
                    {drug.sections.some(s => s.enhancedContent) && (
                      <div className="drug-quick-fact drug-quick-fact-yellow">
                        <span className="drug-quick-fact-label">AI Enhanced</span>
                        <span className="drug-quick-fact-value">Yes</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning callout if warnings section exists */}
                {criticalSections.length > 0 && (
                  <div className="drug-warning-card">
                    <div className="drug-warning-header">
                      <AlertTriangle className="drug-warning-icon" />
                      <h4 className="drug-warning-title">Important Safety Information</h4>
                    </div>
                    <p className="drug-warning-text">
                      This medication has important warnings and precautions. Please review the safety information below.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="drug-tabs-container">
          <div className="drug-tabs-header">
            <nav className="drug-tabs-nav">
              {[
                { id: 'overview', label: 'Overview', count: usageSections.length },
                { id: 'safety', label: 'Safety', count: criticalSections.length },
                { id: 'clinical', label: 'Clinical Info', count: clinicalSections.length },
                { id: 'other', label: 'Additional Info', count: otherSections.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`drug-tab ${activeTab === tab.id ? 'drug-tab-active' : ''}`}
                  type="button"
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`drug-tab-count ${activeTab === tab.id ? 'drug-tab-count-active' : ''}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Sections */}
        <div className="drug-content-sections">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="drug-tab-content">
              <h2 className="drug-section-title">Usage & Administration</h2>
              {usageSections.length > 0 ? (
                <div className="drug-sections-list">
                  {usageSections.map((section, index) => (
                    <DrugSectionComponent key={section.id} section={section} />
                  ))}
                </div>
              ) : (
                <div className="drug-no-content">
                  <p className="drug-no-content-text">No usage information available for this medication.</p>
                </div>
              )}
            </div>
          )}

          {/* Safety Tab */}
          {activeTab === 'safety' && (
            <div className="drug-tab-content">
              <div className="drug-safety-header">
                <AlertTriangle className="drug-safety-icon" />
                <h2 className="drug-section-title">Safety Information</h2>
              </div>
              {criticalSections.length > 0 ? (
                <div className="drug-sections-list">
                  {criticalSections.map((section) => (
                    <DrugSectionComponent key={section.id} section={section} />
                  ))}
                </div>
              ) : (
                <div className="drug-no-content">
                  <p className="drug-no-content-text">No specific safety information available for this medication.</p>
                </div>
              )}
            </div>
          )}

          {/* Clinical Tab */}
          {activeTab === 'clinical' && (
            <div className="drug-tab-content">
              <h2 className="drug-section-title">Clinical Information</h2>
              {clinicalSections.length > 0 ? (
                <div className="drug-sections-list">
                  {clinicalSections.map((section) => (
                    <DrugSectionComponent key={section.id} section={section} />
                  ))}
                </div>
              ) : (
                <div className="drug-no-content">
                  <p className="drug-no-content-text">No clinical information available for this medication.</p>
                </div>
              )}
            </div>
          )}

          {/* Other Tab */}
          {activeTab === 'other' && (
            <div className="drug-tab-content">
              <h2 className="drug-section-title">Additional Information</h2>
              {otherSections.length > 0 ? (
                <div className="drug-sections-list">
                  {otherSections.map((section) => (
                    <DrugSectionComponent key={section.id} section={section} />
                  ))}
                </div>
              ) : (
                <div className="drug-no-content">
                  <p className="drug-no-content-text">No additional information available for this medication.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="drug-bottom-cta">         
          <div className="drug-cta-buttons">
            <Link href="/drugs" className="drug-cta-button drug-cta-button-secondary">
              <ChevronLeft className="drug-cta-icon" />
              Search More Drugs
            </Link>
            <br/>
            <a
              href="https://www.fda.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="drug-cta-button drug-cta-button-primary"
            >
              FDA Resources
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}