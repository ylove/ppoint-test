import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { DrugLabel, EnhancedDrugContent, DrugSection } from './interfaces/drug-label.interface';
import { DrugSearchDto } from './dto/drug-search.dto';
import { OpenAIService } from './openai.service';
import { CacheService } from './cache.service';

@Injectable()
export class DrugService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrugService.name);
  private drugs: DrugLabel[] = [];
  private db: Pool;

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly cacheService: CacheService
  ) {
    this.db = new Pool({
      host: process.env.DB_HOST ? Buffer.from(process.env.DB_HOST, 'base64').toString('utf-8') : undefined,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'drug_database',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? Buffer.from(process.env.DB_PASSWORD, 'base64').toString('utf-8') : undefined,
      ssl: process.env.DB_SSL === 'require' ? { rejectUnauthorized: false } : false,
    });
  }

  async onModuleInit() {
    await this.initializeDatabase();
    await this.loadDrugData();
  }

  private async initializeDatabase() {
    try {
      const result = await this.db.query('SELECT COUNT(*) FROM drug_information');
      const count = parseInt(result.rows[0].count);
      
      if (count === 0) {
        this.logger.log('Database is empty, initializing with data from Labels.json');
        await this.loadDataFromJson();
      } else {
        this.logger.log(`Database already contains ${count} drugs`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize database:', error);
    }
  }

  private async loadDataFromJson() {
    try {
      const labelsPath = join(process.cwd(), '/admin/Labels.json');
      const labelsData = readFileSync(labelsPath, 'utf8');
      const jsonDrugs: DrugLabel[] = JSON.parse(labelsData);
      
      for (const drug of jsonDrugs) {
        await this.db.query(
          `INSERT INTO drug_information 
           (drug_name, set_id, slug, labeler, label, highlights) 
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [
            drug.drugName,
            drug.setId,
            drug.slug,
            drug.labeler,
            JSON.stringify(drug.label),
            drug.highlights ? JSON.stringify(drug.highlights) : null
          ]
        );
      }
      
      this.logger.log(`Inserted ${jsonDrugs.length} drugs into database`);
    } catch (error) {
      this.logger.error('Failed to load data from JSON:', error);
    }
  }

  private async loadDrugData() {
    try {
      const result = await this.db.query('SELECT * FROM drug_information');
      this.drugs = result.rows.map(row => ({
        drugName: row.drug_name,
        setId: row.set_id,
        slug: row.slug,
        labeler: row.labeler,
        label: row.label,
        highlights: row.highlights
      }));
      this.logger.log(`Loaded ${this.drugs.length} drugs from database`);
    } catch (error) {
      this.logger.error('Failed to load drug data from database:', error);
      this.drugs = [];
    }
  }

  async getDrugByNames(drugName: string, genericName?: string): Promise<DrugLabel | null> {
    const normalizedDrugName = drugName.toLowerCase().replace(/-/g, ' ');

    if (genericName) {
      const normalizedGenericName = genericName.toLowerCase();
      return this.drugs.find(drug => 
        drug.drugName.toLowerCase().replace(/-/g, ' ') === normalizedDrugName &&
        drug.label.genericName.toLowerCase() === normalizedGenericName
      ) || null;
    } else {
      return this.drugs.find(drug => 
        drug.drugName.toLowerCase().replace(/-/g, ' ') === normalizedDrugName ||
        drug.label.genericName.toLowerCase().replace(/-/g, ' ') === normalizedDrugName
      ) || null;
    }
  }

  async searchDrugs(searchDto: DrugSearchDto) {
    let filteredDrugs = [...this.drugs];

    // Filter by query
    if (searchDto.query) {
      const query = searchDto.query.toLowerCase();
      filteredDrugs = filteredDrugs.filter(drug =>
        drug.drugName.toLowerCase().includes(query) ||
        drug.label.genericName.toLowerCase().includes(query) ||
        drug.labeler.toLowerCase().includes(query) ||
        drug.label.indicationsAndUsage?.toLowerCase().includes(query)
      );
    }

    // Filter by labeler
    if (searchDto.labeler) {
      const labeler = searchDto.labeler.toLowerCase();
      filteredDrugs = filteredDrugs.filter(drug =>
        drug.labeler.toLowerCase().includes(labeler)
      );
    }

    // Pagination
    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedDrugs = filteredDrugs.slice(startIndex, endIndex);

    return {
      drugs: paginatedDrugs.map(drug => ({
        drugName: drug.drugName,
        genericName: drug.label.genericName,
        labeler: drug.labeler,
        url: `/drugs/${this.createSlug(drug.drugName)}-${this.createSlug(drug.label.genericName)}`,
      })),
      pagination: {
        page,
        limit,
        total: filteredDrugs.length,
        totalPages: Math.ceil(filteredDrugs.length / limit),
        hasNext: endIndex < filteredDrugs.length,
        hasPrev: page > 1,
      },
    };
  }

  async getBasicContent(drug: DrugLabel): Promise<Omit<EnhancedDrugContent, 'seoTitle' | 'metaDescription' | 'enhancedSummary' | 'sections'> & { sections: DrugSection[] }> {
    return {
      id: drug.setId,
      drugName: drug.drugName,
      genericName: drug.label.genericName,
      slug: this.createSlug(drug.drugName),
      sections: this.buildDrugSections(drug),
      lastUpdated: new Date(),
    };
  }

  async getEnhancedContent(drug: DrugLabel): Promise<EnhancedDrugContent> {
    const cacheKey = `enhanced_content:${drug.setId}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get<EnhancedDrugContent>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Generate AI-enhanced content
      const seoMetadata = await this.openAIService.generateSEOMetadata(drug);
      const enhancedSummary = await this.openAIService.generateDrugSummary(drug);
      
      const sections = this.buildDrugSections(drug);
      // const enhancedSections = await this.enhanceSections(sections, drug);
      const enhancedSections = await this.enhanceAllSectionsAtOnce(sections, drug);

      const enhancedContent: EnhancedDrugContent = {
        id: drug.setId,
        drugName: drug.drugName,
        genericName: drug.label.genericName,
        slug: this.createSlug(drug.drugName),
        seoTitle: seoMetadata.title,
        metaDescription: seoMetadata.description,
        enhancedSummary,
        sections: enhancedSections,
        lastUpdated: new Date(),
      };

      // Cache the enhanced content
      await this.cacheService.set(cacheKey, enhancedContent, 3600); // 1 hour TTL
      
      return enhancedContent;
    } catch (error) {
      this.logger.error(`Failed to enhance content for ${drug.drugName}:`, error);
      
      // Return basic content without AI enhancements as fallback
      return {
        id: drug.setId,
        drugName: drug.drugName,
        genericName: drug.label.genericName,
        slug: this.createSlug(drug.drugName),
        seoTitle: `${drug.drugName} (${drug.label.genericName}) - Drug Information`,
        metaDescription: `Complete prescribing information for ${drug.drugName} (${drug.label.genericName}). Indications, dosage, warnings, and more.`,
        enhancedSummary: `${drug.drugName} is a prescription medication containing ${drug.label.genericName}.`,
        sections: this.buildDrugSections(drug),
        lastUpdated: new Date(),
      };
    }
  }

  private buildDrugSections(drug: DrugLabel): DrugSection[] {
    const sections: DrugSection[] = [];
    let order = 1;

    const sectionMappings = [
      { key: 'indicationsAndUsage', title: 'Indications and Usage' },
      { key: 'dosageAndAdministration', title: 'Dosage and Administration' },
      { key: 'dosageFormsAndStrengths', title: 'Dosage Forms and Strengths' },
      { key: 'warningsAndPrecautions', title: 'Warnings and Precautions' },
      { key: 'adverseReactions', title: 'Adverse Reactions' },
      { key: 'clinicalPharmacology', title: 'Clinical Pharmacology' },
      { key: 'clinicalStudies', title: 'Clinical Studies' },
      { key: 'howSupplied', title: 'How Supplied/Storage and Handling' },
      { key: 'useInSpecificPopulations', title: 'Use in Specific Populations' },
      { key: 'description', title: 'Description' },
      { key: 'nonclinicalToxicology', title: 'Nonclinical Toxicology' },
      { key: 'instructionsForUse', title: 'Instructions for Use' },
    ];

    sectionMappings.forEach(({ key, title }) => {
      const content = drug.label[key as keyof typeof drug.label];
      if (content && typeof content === 'string') {
        sections.push({
          id: `${drug.setId}-${key}`,
          title,
          content: content,
          order: order++,
        });
      }
    });

    return sections;
  }

  private async enhanceSections(sections: DrugSection[], drug: DrugLabel): Promise<DrugSection[]> {
    const enhancedSections = [...sections];
    
    // Enhance key sections with AI (limit to avoid rate limits)
    const keySection = sections.find(s => s.title === 'Indications and Usage');
    if (keySection) {
      try {
        const enhanced = await this.openAIService.enhanceSection(keySection.content, drug);
        const sectionIndex = enhancedSections.findIndex(s => s.id === keySection.id);
        if (sectionIndex !== -1) {
          enhancedSections[sectionIndex].enhancedContent = enhanced;
        }
      } catch (error) {
        this.logger.warn(`Failed to enhance section for ${drug.drugName}:`, error);
      }
    }

    return enhancedSections;
  }

  private async enhanceAllSectionsAtOnce(sections: DrugSection[], drug: DrugLabel): Promise<DrugSection[]> {
    const cacheKey = `enhanced_all_sections:${drug.setId}`;
    
    // Check cache first
    const cached = await this.cacheService.get<DrugSection[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const enhancedData = await this.openAIService.enhanceAllSections(drug);
      const enhancedSections = sections.map(section => {
        const sectionKey = this.getSectionKeyFromTitle(section.title);
        const enhancedContent = enhancedData[sectionKey as keyof typeof enhancedData];
        
        return {
          ...section,
          enhancedContent: enhancedContent || undefined
        };
      });

      // Cache the enhanced sections
      await this.cacheService.set(cacheKey, enhancedSections, 3600); // 1 hour TTL
      
      return enhancedSections;
    } catch (error) {
      this.logger.warn(`Failed to enhance all sections for ${drug.drugName}:`, error);
      return sections;
    }
  }

  private getSectionKeyFromTitle(title: string): string {
    const titleMappings: Record<string, string> = {
      'Indications and Usage': 'indicationsAndUsage',
      'Dosage and Administration': 'dosageAndAdministration',
      'Dosage Forms and Strengths': 'dosageFormsAndStrengths',
      'Warnings and Precautions': 'warningsAndPrecautions',
      'Adverse Reactions': 'adverseReactions',
      'Clinical Pharmacology': 'clinicalPharmacology',
      'Clinical Studies': 'clinicalStudies',
      'How Supplied/Storage and Handling': 'howSupplied',
      'Use in Specific Populations': 'useInSpecificPopulations',
      'Description': 'description',
      'Nonclinical Toxicology': 'nonclinicalToxicology',
      'Instructions for Use': 'instructionsForUse'
    };
    return titleMappings[title] || '';
  }

  async generateSitemap() {
    const sitemapUrls = this.drugs.map(drug => ({
      url: `/drugs/${this.createSlug(drug.drugName)}-${this.createSlug(drug.label.genericName)}`,
      lastmod: drug.label.effectiveTime ? this.formatDate(drug.label.effectiveTime) : new Date().toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: '0.8',
    }));

    return {
      urls: sitemapUrls,
      totalUrls: sitemapUrls.length,
    };
  }

  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private formatDate(dateString: string): string {
    if (dateString.length === 8) {
      // Format: YYYYMMDD
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  }

  async onModuleDestroy() {
    await this.db.end();
  }
}