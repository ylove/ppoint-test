import type { EnhancedDrugContent, SearchResult, DrugSection } from './types';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001';

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public response?: ApiErrorResponse
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  
  private constructor() {
    this.baseUrl = API_BASE;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchWithErrorHandling<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    try { console.log(`Fetching ${url}`);
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      // Handle different response types
      if (!response.ok) {
        let errorResponse: ApiErrorResponse;
        
        try {
          errorResponse = await response.json();
        } catch {
          // If JSON parsing fails, create a generic error response
          errorResponse = {
            statusCode: response.status,
            message: response.statusText || 'Unknown error occurred',
          };
        }

        throw new ApiError(response.status, response.statusText, errorResponse);
      }

      // Handle empty responses (204 No Content, etc.)
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors, timeout, etc.
      if (error instanceof TypeError) {
        throw new ApiError(
          0,
          'Network Error',
          {
            statusCode: 0,
            message: 'Failed to connect to the server. Please check your internet connection.',
          }
        );
      }

      // Handle other unexpected errors
      throw new ApiError(
        500,
        'Unknown Error',
        {
          statusCode: 500,
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        }
      );
    }
  }

  /**
   * Get basic drug information (fast response without AI enhancements)
   */
  async getDrugBasic(drugName: string, genericName: string): Promise<Omit<EnhancedDrugContent, 'seoTitle' | 'metaDescription' | 'enhancedSummary'> | null> {
    try {
      const url = `${this.baseUrl}/api/drugs/${encodeURIComponent(drugName)}-${encodeURIComponent(genericName)}/basic`;

      const response = await this.fetchWithErrorHandling<Omit<EnhancedDrugContent, 'seoTitle' | 'metaDescription' | 'enhancedSummary'>>(url, {
        next: { revalidate: 3600 },
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      
      console.error('Error fetching basic drug info:', error);
      throw error;
    }
  }

  /**
   * Get enhanced drug information (AI-processed content)
   */
  async getDrugEnhanced(drugName: string, genericName: string): Promise<{ seoTitle: string; metaDescription: string; enhancedSummary: string; sections: DrugSection[] } | null> {
    try {
      const url = `${this.baseUrl}/api/drugs/${encodeURIComponent(drugName)}-${encodeURIComponent(genericName)}/enhanced`;

      const response = await this.fetchWithErrorHandling<{ seoTitle: string; metaDescription: string; enhancedSummary: string; sections: DrugSection[] }>(url, {
        next: { revalidate: 3600 },
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      
      console.error('Error fetching enhanced drug info:', error);
      throw error;
    }
  }

  /**
   * Get drug information by drug name and generic name (legacy - now returns enhanced content)
   */
  async getDrug(drugName: string, genericName: string): Promise<EnhancedDrugContent | null> {
    try {
      const url = `${this.baseUrl}/api/drugs/${encodeURIComponent(drugName)}-${encodeURIComponent(genericName)}`;

      const response = await this.fetchWithErrorHandling<EnhancedDrugContent>(url, {
        next: { revalidate: 3600 }, // ISR: revalidate every hour for Next.js
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      
      console.error('Error fetching drug:', error);
      throw error;
    }
  }

  /**
   * Search for drugs with pagination and filters
   */
  async searchDrugs(params: {
    query?: string;
    labeler?: string;
    page?: number;
    limit?: number;
  }): Promise<SearchResult> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.query?.trim()) {
        searchParams.append('query', params.query.trim());
      }
      if (params.labeler?.trim()) {
        searchParams.append('labeler', params.labeler.trim());
      }
      if (params.page && params.page > 1) {
        searchParams.append('page', params.page.toString());
      }
      if (params.limit && params.limit !== 20) {
        searchParams.append('limit', params.limit.toString());
      }

      const url = `${this.baseUrl}/drugs${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      
      const response = await this.fetchWithErrorHandling<SearchResult>(url, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      return response;
    } catch (error) {
      console.error('Error searching drugs:', error);
      throw error;
    }
  }

  /**
   * Get sitemap data for all drug pages
   */
  async getSitemap(): Promise<{ urls: Array<{ url: string; lastmod: string }> }> {
    try {
      const url = `${this.baseUrl}/sitemap`;
      
      const response = await this.fetchWithErrorHandling<{ urls: Array<{ url: string; lastmod: string }> }>(url, {
        next: { revalidate: 86400 }, // Cache for 24 hours
      });

      return response;
    } catch (error) {
      console.error('Error fetching sitemap:', error);
      throw error;
    }
  }

  /**
   * Get server health status
   */
  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      const url = `${this.baseUrl}/health`;
      
      const response = await this.fetchWithErrorHandling<{ status: string; timestamp: string }>(url, {
        cache: 'no-store', // Always fetch fresh for health checks
      });

      return response;
    } catch (error) {
      console.error('Error checking server health:', error);
      throw error;
    }
  }

  /**
   * Get popular or featured drugs (if endpoint exists)
   */
  async getPopularDrugs(limit: number = 10): Promise<SearchResult> {
    try {
      const url = `${this.baseUrl}/drugs/popular?limit=${limit}`;
      
      const response = await this.fetchWithErrorHandling<SearchResult>(url, {
        next: { revalidate: 1800 }, // Cache for 30 minutes
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // If popular endpoint doesn't exist, return empty result
        return {
          drugs: [],
          pagination: {
            page: 1,
            limit: limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        };
      }
      
      console.error('Error fetching popular drugs:', error);
      throw error;
    }
  }

  /**
   * Get drug suggestions for autocomplete
   */
  async getDrugSuggestions(query: string, limit: number = 5): Promise<Array<{
    drugName: string;
    genericName: string;
    labeler: string;
  }>> {
    try {
      if (!query.trim() || query.trim().length < 2) {
        return [];
      }

      const searchParams = new URLSearchParams({
        query: query.trim(),
        limit: limit.toString(),
      });

      const url = `${this.baseUrl}/drugs/suggestions?${searchParams.toString()}`;
      
      const response = await this.fetchWithErrorHandling<Array<{
        drugName: string;
        genericName: string;
        labeler: string;
      }>>(url, {
        next: { revalidate: 600 }, // Cache for 10 minutes
      });

      return response;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // If suggestions endpoint doesn't exist, return empty array
        return [];
      }
      
      console.error('Error fetching drug suggestions:', error);
      return []; // Return empty array on error for autocomplete
    }
  }

  /**
   * Validate API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      await this.getHealthStatus();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API configuration and status
   */
  getConfig(): {
    baseUrl: string;
    environment: string;
  } {
    return {
      baseUrl: this.baseUrl,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

// Export singleton instance for convenience
export const apiClient = ApiClient.getInstance();

// Export types for external use
export type { EnhancedDrugContent, SearchResult } from './types';