import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ApiClient } from '@/lib/api';
import { DrugDetailClient } from './drug-detail-client';
import type { EnhancedDrugContent } from '@/lib/types';
import { stripHtml } from '@/lib/utils';

interface DrugPageProps {
  params: Promise<{
    drugSlug: string;
  }>;
}

// Helper function to parse drug slug
async function parseDrugSlug(drugSlug: string): Promise<{ drugName: string; genericName: string } | null> {
  // Split by dashes and try different combinations
  const parts = drugSlug.split('-');
  if (parts.length < 2) return null;
  
  const apiClient = ApiClient.getInstance();
  
  // Try different split points, starting from the most likely (after first word)
  for (let i = 1; i < parts.length; i++) {
    const drugName = parts.slice(0, i).join(' ');
    const genericName = parts.slice(i).join('-'); // Keep hyphens in generic name
    
    try {
      const drug = await apiClient.getDrug(drugName, genericName);
      if (drug) {
        return { drugName, genericName };
      }
    } catch {
      // Continue trying other splits
    }
  }
  
  return null;
}

export async function generateMetadata({ params }: DrugPageProps): Promise<Metadata> {
  const { drugSlug } = await params;
  const parsed = await parseDrugSlug(drugSlug);
  
  if (!parsed) {
    return {
      title: 'Drug Not Found',
      description: 'The requested drug information could not be found.',
    };
  }

  try {
    const apiClient = ApiClient.getInstance();
    // Use basic drug info for immediate metadata - don't wait for AI enhancements
    const basicDrug = await apiClient.getDrugBasic(parsed.drugName, parsed.genericName);

    if (!basicDrug) {
      return {
        title: 'Drug Not Found',
        description: 'The requested drug information could not be found.',
      };
    }

    const fallbackTitle = `${basicDrug.drugName} (${basicDrug.genericName}) - Prescription Info`;
    const fallbackDescription = `Complete prescribing information for ${basicDrug.drugName} (${basicDrug.genericName}). Dosage, side effects, warnings & more.`;

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Drug',
      name: basicDrug.drugName,
      activeIngredient: basicDrug.genericName,
      description: fallbackDescription.substring(0, 200),
      manufacturer: {
        '@type': 'Organization',
        name: 'Various',
      },
    };

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      keywords: [
        basicDrug.drugName,
        basicDrug.genericName,
        'prescription drug',
        'medication information',
        'drug label',
        'FDA approved'
      ],
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        type: 'article',
        publishedTime: basicDrug.lastUpdated,
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
        description: fallbackDescription,
      },
      other: {
        'application/ld+json': JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    return {
      title: 'Drug Information',
      description: 'Prescription drug information and details.',
    };
  }
}

export default async function DrugPage({ params }: DrugPageProps) {
  const { drugSlug } = await params;
  const parsed = await parseDrugSlug(drugSlug);
  
  if (!parsed) {
    notFound();
  }

  const apiClient = ApiClient.getInstance();
  
  try {
    // Load basic content immediately for fast initial render
    const basicDrug = await apiClient.getDrugBasic(parsed.drugName, parsed.genericName);
    
    if (!basicDrug) {
      notFound();
    }

    return <DrugDetailClient drugSlug={drugSlug} initialDrug={basicDrug} drugName={parsed.drugName} genericName={parsed.genericName} />;
  } catch (error) {
    console.error('Error loading basic drug info:', error);
    notFound();
  }
}