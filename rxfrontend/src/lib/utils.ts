import type { DrugSectionCategory, DrugSection } from "./types";

/**
 * Create URL-friendly slug from text
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and dashes
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Create drug page slug combining drug name and generic name
 */
export function createDrugSlug(drugName: string, genericName: string): string {
  const drugSlug = createSlug(drugName);
  const genericSlug = createSlug(genericName);
  return `${drugSlug}-${genericSlug}`;
}

/**
 * Parse drug slug back to drug name and generic name
 * Note: This is a fallback for cases where the slug field isn't available
 * For accurate parsing in route handlers, use the async version that validates against API
 */
export function parseDrugSlug(drugSlug: string): { drugName: string; genericName: string } | null {
  // Split by dashes and try to guess the split point
  const parts = drugSlug.split('-');
  if (parts.length < 2) return null;
  
  // Assume the first part is the drug name and everything else is generic name
  const drugName = parts[0].replace(/-/g, ' ');
  const genericName = parts.slice(1).join('-'); // Preserve hyphens in generic name
  
  return { drugName, genericName };
}

/**
 * Strip HTML tags from content while preserving text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .trim();
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}

/**
 * Format date string to human-readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

/**
 * Format FDA date (YYYYMMDD) to readable format
 */
export function formatFdaDate(fdaDate: string): string {
  if (!fdaDate || fdaDate.length !== 8) {
    return fdaDate;
  }
  
  try {
    const year = fdaDate.substring(0, 4);
    const month = fdaDate.substring(4, 6);
    const day = fdaDate.substring(6, 8);
    const date = new Date(`${year}-${month}-${day}`);
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return fdaDate;
  }
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for scroll events
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get section category from section title
 */
export function getSectionCategory(title: string): DrugSectionCategory {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('warning') || titleLower.includes('precaution')) {
    return 'warnings';
  }
  if (titleLower.includes('adverse') || titleLower.includes('side effect')) {
    return 'safety';
  }
  if (titleLower.includes('indication') || titleLower.includes('usage')) {
    return 'usage';
  }
  if (titleLower.includes('dosage') || titleLower.includes('administration')) {
    return 'administration';
  }
  if (titleLower.includes('clinical') || titleLower.includes('pharmacology')) {
    return 'clinical';
  }
  if (titleLower.includes('interaction')) {
    return 'interactions';
  }
  
  return 'other';
}

/**
 * Sort drug sections by importance and category
 */
export function sortDrugSections(sections: DrugSection[]): DrugSection[] {
  const categoryPriority: Record<DrugSectionCategory, number> = {
    usage: 1,
    administration: 2,
    warnings: 3,
    safety: 4,
    interactions: 5,
    clinical: 6,
    other: 7,
  };

  return [...sections].sort((a, b) => {
    // First sort by category priority
    const aCategoryPriority = categoryPriority[a.category || getSectionCategory(a.title)];
    const bCategoryPriority = categoryPriority[b.category || getSectionCategory(b.title)];
    
    if (aCategoryPriority !== bCategoryPriority) {
      return aCategoryPriority - bCategoryPriority;
    }
    
    // Then by original order
    return a.order - b.order;
  });
}

/**
 * Check if section contains important safety information
 */
export function isImportantSection(title: string): boolean {
  const importantKeywords = [
    'warning',
    'precaution',
    'contraindication',
    'adverse',
    'black box',
    'boxed warning',
    'overdose',
    'toxicity'
  ];
  
  const titleLower = title.toLowerCase();
  return importantKeywords.some(keyword => titleLower.includes(keyword));
}

/**
 * Extract plain text from HTML with basic formatting preservation
 */
export function htmlToPlainText(html: string, preserveLineBreaks: boolean = true): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
    .replace(/<\/p>/gi, '\n\n') // Convert </p> to double newlines
    .replace(/<\/div>/gi, '\n') // Convert </div> to newlines
    .replace(/<\/h[1-6]>/gi, '\n\n') // Convert heading endings to double newlines
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  if (!preserveLineBreaks) {
    text = text.replace(/\n+/g, ' ');
  } else {
    text = text.replace(/\n{3,}/g, '\n\n'); // Limit to max 2 consecutive newlines
  }

  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Generate excerpt from HTML content
 */
export function generateExcerpt(html: string, maxLength: number = 200): string {
  const plainText = htmlToPlainText(html, false);
  return truncateText(plainText, maxLength);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Check if string is empty or only whitespace
 */
export function isEmpty(str: string | undefined | null): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Generate random ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(target:T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge((result[key] as Record<string, unknown>) || {}, source[key]!) as T[Extract<keyof T, string>];
    } else {
      result[key] = source[key]!;
    }
  }
  
  return result;
}
