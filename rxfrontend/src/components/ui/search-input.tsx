'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { debounce } from '@/lib/utils';
import type { DrugSuggestion } from '@/lib/types';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
  suggestions?: DrugSuggestion[];
  onSuggestionClick?: (suggestion: DrugSuggestion) => void;
  showSuggestions?: boolean;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  placeholder = "Search drugs...",
  loading = false,
  suggestions = [],
  onSuggestionClick,
  showSuggestions = true,
  className = "",
  disabled = false,
  autoFocus = false
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce(() => {
      if (value.trim()) {
        onSearch();
      }
    }, 300),
    [value, onSearch]
  );

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedSuggestionIndex(-1);
    
    // Show suggestions if we have a value and suggestions are enabled
    if (showSuggestions && newValue.trim().length > 1) {
      setShowSuggestionsDropdown(true);
      debouncedSearch();
    } else {
      setShowSuggestionsDropdown(false);
    }
  }, [onChange, showSuggestions, debouncedSearch]);

  // Handle key press events
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // If a suggestion is selected, use it
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        const suggestion = suggestions[selectedSuggestionIndex];
        onChange(suggestion.drugName);
        onSuggestionClick?.(suggestion);
        setShowSuggestionsDropdown(false);
      } else {
        // Otherwise, perform regular search
        onSearch();
        setShowSuggestionsDropdown(false);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.blur();
    }
  }, [selectedSuggestionIndex, suggestions, onChange, onSuggestionClick, onSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: DrugSuggestion) => {
    onChange(suggestion.drugName);
    onSuggestionClick?.(suggestion);
    setShowSuggestionsDropdown(false);
    setSelectedSuggestionIndex(-1);
  }, [onChange, onSuggestionClick]);

  // Clear search
  const clearSearch = useCallback(() => {
    onChange('');
    setShowSuggestionsDropdown(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (showSuggestions && value.trim().length > 1 && suggestions.length > 0) {
      setShowSuggestionsDropdown(true);
    }
  }, [showSuggestions, value, suggestions.length]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestionsDropdown(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestionsDropdown(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const shouldShowSuggestions = showSuggestionsDropdown && suggestions.length > 0 && showSuggestions;

  return (
    <div className={`search-input-container ${className}`}>
      <div className="search-input-wrapper">
        {/* Search Icon */}
        <div className="search-input-icon-left">
          {loading ? (
            <Loader2 className="search-input-spinner" />
          ) : (
            <Search className="search-input-search-icon" />
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || loading}
          autoFocus={autoFocus}
          className={`search-input-field${isFocused ? ' search-input-field-focused' : ''}${disabled ? ' search-input-field-disabled' : ''}`}
          aria-label={placeholder}
          aria-expanded={shouldShowSuggestions}
          aria-haspopup="listbox"
          role="combobox"
          autoComplete="off"
        />

        {/* Clear Button */}
        {value && !loading && (
          <button
            onClick={clearSearch}
            className="search-input-clear-button"
            aria-label="Clear search"
            type="button"
          >
            <X className="search-input-clear-icon" />
          </button>
        )}

        {/* Search Button */}
        <button
          onClick={onSearch}
          disabled={disabled || loading || !value.trim()}
          className="search-input-search-button"
          aria-label="Search"
          type="button"
        >
          {loading ? (
            <Loader2 className="search-input-button-spinner" />
          ) : (
            <Search className="search-input-button-icon" />
          )}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {shouldShowSuggestions && (
        <div ref={dropdownRef} className="search-suggestions-dropdown">
          <ul className="search-suggestions-list" role="listbox">
            {suggestions.map((suggestion, index) => (
              <li key={`${suggestion.drugName}-${suggestion.genericName}-${index}`}>
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`search-suggestion-item${index === selectedSuggestionIndex ? ' search-suggestion-item-selected' : ''}`}
                  role="option"
                  aria-selected={index === selectedSuggestionIndex}
                  type="button"
                >
                  <div className="search-suggestion-content">
                    <div className="search-suggestion-main">
                      <span className="search-suggestion-drug-name">
                        {suggestion.drugName}
                      </span>
                      <span className="search-suggestion-generic">
                        ({suggestion.genericName})
                      </span>
                    </div>
                    <div className="search-suggestion-meta">
                      <span className="search-suggestion-labeler">
                        {suggestion.labeler}
                      </span>
                      <span className={`search-suggestion-type search-suggestion-type-${suggestion.type}`}>
                        {suggestion.type}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}