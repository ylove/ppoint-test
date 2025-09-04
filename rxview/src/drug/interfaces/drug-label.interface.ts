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
  },
    highlights?: {
      dosageAndAdministration?: string
    };
}

export interface EnhancedDrugContent {
  id: string;
  drugName: string;
  genericName: string;
  slug: string;
  seoTitle: string;
  metaDescription: string;
  enhancedSummary: string;
  sections: DrugSection[];
  lastUpdated: Date;
}

export interface DrugSection {
  id: string;
  title: string;
  content: string;
  enhancedContent?: string;
  order: number;
}