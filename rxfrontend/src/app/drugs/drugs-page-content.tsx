'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchInput } from '@/components/ui/search-input';
import { DrugCard } from '@/components/drug/drug-card';
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/loading';
import { ApiClient } from '@/lib/api';
import type { SearchResult } from '@/lib/types';
import { Filter, X } from 'lucide-react';

export default function DrugsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [labelerFilter, setLabelerFilter] = useState(searchParams.get('labeler') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const apiClient = ApiClient.getInstance();

  const performSearch = useCallback(async (
    query: string = searchQuery,
    labeler: string = labelerFilter,
    page: number = 1
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await apiClient.searchDrugs({
        query: query.trim() || undefined,
        labeler: labeler.trim() || undefined,
        page,
        limit: 20,
      });
      
      setSearchResults(results);
      setCurrentPage(page);
      
      // Update URL
      const params = new URLSearchParams();
      if (query.trim()) params.set('query', query.trim());
      if (labeler.trim()) params.set('labeler', labeler.trim());
      if (page > 1) params.set('page', page.toString());
      
      const newUrl = params.toString() ? `/drugs?${params.toString()}` : '/drugs';
      router.replace(newUrl, { scroll: false });
      
    } catch (err) {
      setError('Failed to search drugs. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, labelerFilter, apiClient, router]);

  const handleSearch = useCallback(() => {
    performSearch(searchQuery, labelerFilter, 1);
  }, [performSearch, searchQuery, labelerFilter]);

  const handlePageChange = useCallback((page: number) => {
    performSearch(searchQuery, labelerFilter, page);
  }, [performSearch, searchQuery, labelerFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setLabelerFilter('');
    setCurrentPage(1);
    setSearchResults(null);
    router.replace('/drugs');
  }, [router]);

  // Load initial results
  useEffect(() => {
    const query = searchParams.get('query');
    const labeler = searchParams.get('labeler');
    const page = searchParams.get('page');
    
    if (query || labeler || page) {
      performSearch(query || '', labeler || '', parseInt(page || '1'));
    }
  }, [searchParams, performSearch]);

  return (
    <div className="drugs-page">
      <div className="drugs-container">
        {/* Header */}
        <div className="drugs-header">
          <h1 className="drugs-title">
            Drug Information Search
          </h1>
          <p className="drugs-description">
            Search through thousands of FDA-approved prescription medications. 
            Find detailed prescribing information, dosages, warnings, and AI-enhanced explanations.
          </p>
        </div>

        {/* Search Section */}
        <div className="drugs-search-section">
          <div className="drugs-search-card">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search by drug name, generic name, or indication..."
              loading={loading}
              className="drugs-search-input"
            />
            
            <div className="drugs-search-controls">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="drugs-filter-toggle"
                type="button"
              >
                <Filter className="drugs-filter-icon" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              
              {(searchQuery || labelerFilter) && (
                <button
                  onClick={clearFilters}
                  className="drugs-clear-filters"
                  type="button"
                >
                  <X className="drugs-clear-icon" />
                  Clear All
                </button>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="drugs-filters">
                <div className="drugs-filters-grid">
                  <div className="drugs-filter-group">
                    <label htmlFor="labeler" className="drugs-filter-label">
                      Manufacturer
                    </label>
                    <input
                      id="labeler"
                      type="text"
                      value={labelerFilter}
                      onChange={(e) => setLabelerFilter(e.target.value)}
                      placeholder="e.g., Pfizer, Johnson & Johnson..."
                      className="drugs-filter-input"
                    />
                  </div>
                </div>
                
                <div className="drugs-filter-actions">
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="drugs-apply-filters"
                    type="button"
                  >
                    {loading ? 'Searching...' : 'Apply Filters'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && !searchResults && (
          <div className="drugs-loading">
            <LoadingSkeleton />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="drugs-error">
            <p className="drugs-error-message">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {searchResults && (
          <div className="drugs-results">
            {/* Results Header */}
            <div className="drugs-results-header">
              <div className="drugs-results-count">
                {searchResults.pagination.total === 0 ? (
                  'No drugs found'
                ) : (
                  <>
                    Showing{' '}
                    {(searchResults.pagination.page - 1) * searchResults.pagination.limit + 1}-
                    {Math.min(
                      searchResults.pagination.page * searchResults.pagination.limit,
                      searchResults.pagination.total
                    )}{' '}
                    of {searchResults.pagination.total} drugs
                  </>
                )}
              </div>
              
              {loading && <LoadingSpinner size="sm" />}
            </div>

            {/* Results Grid */}
            {searchResults.drugs.length > 0 ? (
              <div className="drugs-results-grid">
                {searchResults.drugs.map((drug, index) => (
                  <DrugCard key={`${drug.drugName}-${drug.genericName}-${index}`} drug={drug} />
                ))}
              </div>
            ) : (
              <div className="drugs-no-results">
                <div className="drugs-no-results-icon">
                  <Filter className="drugs-empty-icon" />
                </div>
                <h3 className="drugs-no-results-title">
                  No drugs found
                </h3>
                <p className="drugs-no-results-description">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={clearFilters}
                  className="drugs-no-results-button"
                  type="button"
                >
                  Clear all filters
                </button>
              </div>
            )}

          </div>
        )}

        {/* Empty State */}
        {!loading && !searchResults && !error && (
          <div className="drugs-empty-state">
            <div className="drugs-empty-icon">
              <Filter className="drugs-empty-icon-svg" />
            </div>
            <h3 className="drugs-empty-title">
              Start searching for drugs
            </h3>
            <p className="drugs-empty-description">
              Enter a drug name, generic name, or manufacturer to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}