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

export const metadata: Metadata = {
  title: 'Drug Information - RxView',
  description: 'Complete prescribing information for prescription medications. FDA-approved drug information including dosage, side effects, warnings, and interactions.',
  keywords: 'prescription drugs, medication information, FDA approved, prescribing information, dosage, side effects, drug interactions',
  openGraph: {
    title: 'Drug Information - RxView',
    description: 'Complete prescribing information for prescription medications. FDA-approved drug information including dosage, side effects, warnings, and interactions.',
    type: 'article',
    siteName: 'RxView - AI-Enhanced Drug Information',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Drug Information - RxView',
    description: 'Complete prescribing information for prescription medications.',
    site: '@RxViewApp',
  },
  other: {
    'application/ld+json': JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name: 'Drug Information - RxView',
        description: 'Complete prescribing information for prescription medications. FDA-approved drug information including dosage, side effects, warnings, and interactions.',
        inLanguage: 'en-US',
        isAccessibleForFree: true,
        audience: {
          '@type': 'MedicalAudience',
          audienceType: ['Healthcare Professional', 'Patient'],
        },
        publisher: {
          '@type': 'Organization',
          name: 'RxView',
          description: 'AI-Enhanced Drug Information Platform',
        },
      }
    ]),
  },
};

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