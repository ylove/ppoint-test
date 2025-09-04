// ====== src/lib/types.ts ======

/**
 * Core drug label interface matching the backend data structure
 */
export interface DrugLabel {
  drugName: string;
  setId: string;
  slug: string;
  labeler: string;
  label: {
    genericName: string;
    labelerName: string;
    productType: string;
    effectiveTime: string;
    title: string;
    indicationsAndUsage?: string;
    dosageAndAdministration?: string;
    dosageFormsAndStrengths?: string;
    warningsAndPrecautions?: string;
    adverseReactions?: string;
    clinicalPharmacology?: string;
    clinicalStudies?: string;
    howSupplied?: string;
    useInSpecificPopulations?: string;
    description?: string;
    nonclinicalToxicology?: string;
    instructionsForUse?: string;
    contraindications?: string;
    drugInteractions?: string;
    overdosage?: string;
    references?: string;
    patientCounselingInformation?: string;
  };
}

/**
 * Enhanced drug content with AI-powered improvements
 */
export interface EnhancedDrugContent {
  id: string;
  drugName: string;
  genericName: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  enhancedSummary: string;
  sections: DrugSection[];
  lastUpdated: string;
  labeler?: string;
  productType?: string;
  effectiveTime?: string;
}

/**
 * Individual drug section with optional AI enhancement
 */
export interface DrugSection {
  id: string;
  title: string;
  content: string;
  enhancedContent?: string;
  order: number;
  category?: DrugSectionCategory;
  isImportant?: boolean;
}

/**
 * Categories for organizing drug sections
 */
export type DrugSectionCategory = 
  | 'usage'
  | 'safety' 
  | 'clinical'
  | 'administration'
  | 'warnings'
  | 'interactions'
  | 'other';

/**
 * Search result container with pagination
 */
export interface SearchResult {
  drugs: DrugSearchItem[];
  pagination: PaginationInfo;
  query?: SearchQuery;
}

/**
 * Individual drug item in search results
 */
export interface DrugSearchItem {
  drugName: string;
  genericName: string;
  labeler: string;
  url: string;
  slug?: string;
  setId?: string;
  summary?: string;
  lastUpdated?: string;
}

/**
 * Pagination information for search results
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  query?: string;
  labeler?: string;
  page?: number;
  limit?: number;
  sortBy?: DrugSortOption;
  category?: DrugSectionCategory;
}

/**
 * Sorting options for drug search
 */
export type DrugSortOption = 
  | 'name'
  | 'generic'
  | 'labeler'
  | 'updated'
  | 'relevance';

/**
 * Drug suggestion for autocomplete
 */
export interface DrugSuggestion {
  drugName: string;
  genericName: string;
  labeler: string;
  slug: string;
  type: 'brand' | 'generic' | 'labeler';
}

/**
 * Sitemap URL entry
 */
export interface SitemapUrl {
  url: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

/**
 * API response for sitemap generation
 */
export interface SitemapResponse {
  urls: SitemapUrl[];
  totalUrls: number;
  lastGenerated: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'maintenance';
  timestamp: string;
  version?: string;
  uptime?: number;
  environment?: string;
}

/**
 * Loading states for UI components
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Generic API error response structure
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
  details?: Record<string, unknown>;
}

/**
 * Component props for drug-related components
 */
export interface DrugCardProps {
  drug: DrugSearchItem;
  showSummary?: boolean;
  className?: string;
}

export interface DrugSectionProps {
  section: DrugSection;
  isExpanded?: boolean;
  onToggle?: (sectionId: string) => void;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  loading?: boolean;
  suggestions?: DrugSuggestion[];
  onSuggestionClick?: (suggestion: DrugSuggestion) => void;
  className?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

/**
 * Filter options for drug search
 */
export interface DrugFilters {
  labelers: string[];
  categories: DrugSectionCategory[];
  hasAiContent: boolean;
  lastUpdatedRange: {
    from?: string;
    to?: string;
  };
}

/**
 * Navigation breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

/**
 * Tab configuration for drug detail pages
 */
export interface DrugTab {
  id: string;
  label: string;
  count: number;
  sections: DrugSection[];
  icon?: string;
}

/**
 * Drug statistics for dashboard/analytics
 */
export interface DrugStats {
  totalDrugs: number;
  totalLabelers: number;
  aiEnhancedCount: number;
  lastUpdated: string;
  popularSearches: string[];
  recentlyAdded: DrugSearchItem[];
}

/**
 * User preferences (if auth is added later)
 */
export interface UserPreferences {
  favoriteLabelers: string[];
  bookmarkedDrugs: string[];
  searchHistory: string[];
  displayOptions: {
    showAiContent: boolean;
    defaultPageSize: number;
    sortPreference: DrugSortOption;
  };
}

/**
 * Enhanced search options with advanced filters
 */
export interface AdvancedSearchOptions extends SearchQuery {
  indication?: string;
  activeIngredient?: string;
  dosageForm?: string;
  strength?: string;
  route?: string;
  ageGroup?: 'adult' | 'pediatric' | 'geriatric' | 'all';
  pregnancyCategory?: string;
  hasBlackBoxWarning?: boolean;
  isGeneric?: boolean;
}

/**
 * Drug comparison interface (future feature)
 */
export interface DrugComparison {
  drugs: EnhancedDrugContent[];
  comparisonFields: string[];
  similarities: string[];
  differences: Array<{
    field: string;
    values: Record<string, string>;
  }>;
}

/**
 * Export utility types
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Generic response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

/**
 * Form validation types
 */
export interface FormError {
  field: string;
  message: string;
  code?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: FormError[];
}

/**
 * Route parameters for dynamic pages
 */
export interface DrugPageParams {
  drugSlug: string;
}

export interface SearchPageParams {
  query?: string;
  page?: string;
  limit?: string;
  labeler?: string;
}

/**
 * Component state interfaces
 */
export interface SearchPageState {
  query: string;
  filters: DrugFilters;
  results: SearchResult | null;
  loading: LoadingState;
  error: string | null;
  currentPage: number;
}

export interface DrugDetailState {
  drug: EnhancedDrugContent | null;
  loading: LoadingState;
  error: string | null;
  activeTab: string;
  expandedSections: string[];
}

/**
 * Constants and enums
 */
export const DRUG_SECTION_CATEGORIES = {
  USAGE: 'usage',
  SAFETY: 'safety',
  CLINICAL: 'clinical',
  ADMINISTRATION: 'administration',
  WARNINGS: 'warnings',
  INTERACTIONS: 'interactions',
  OTHER: 'other',
} as const;

export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export const SORT_OPTIONS = {
  NAME: 'name',
  GENERIC: 'generic',
  LABELER: 'labeler',
  UPDATED: 'updated',
  RELEVANCE: 'relevance',
} as const;