import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { DrugService } from './drug.service';
import { OpenAIService } from './openai.service';
import { CacheService } from './cache.service';
import { DrugSearchDto } from './dto/drug-search.dto';
import { DrugLabel } from './interfaces/drug-label.interface';
import * as fs from 'fs';

jest.mock('fs');

describe('DrugService', () => {
  let service: DrugService;
  let openAIService: OpenAIService;
  let cacheService: CacheService;

  const mockOpenAIService = {
    generateSEOMetadata: jest.fn(),
    generateDrugSummary: jest.fn(),
    enhanceAllSections: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockDrugData: DrugLabel[] = [
    {
      drugName: 'Aspirin',
      setId: '123',
      slug: 'aspirin',
      labeler: 'Test Pharma',
      label: {
        genericName: 'acetylsalicylic-acid',
        labelerName: 'Test Pharma',
        productType: 'Human Prescription Drug',
        effectiveTime: '20240101',
        title: 'Aspirin',
        indicationsAndUsage: 'Pain relief',
        dosageAndAdministration: '325mg daily',
      },
    },
    {
      drugName: 'Ibuprofen',
      setId: '456',
      slug: 'ibuprofen',
      labeler: 'Another Pharma',
      label: {
        genericName: 'ibuprofen',
        labelerName: 'Another Pharma',
        productType: 'Human OTC Drug',
        effectiveTime: '20240201',
        title: 'Ibuprofen',
        indicationsAndUsage: 'Anti-inflammatory',
        dosageAndAdministration: '200mg as needed',
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrugService,
        {
          provide: OpenAIService,
          useValue: mockOpenAIService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<DrugService>(DrugService);
    openAIService = module.get<OpenAIService>(OpenAIService);
    cacheService = module.get<CacheService>(CacheService);

    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockDrugData));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should load drug data on initialization', async () => {
      await service.onModuleInit();
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.stringContaining('admin/labels.json'), 'utf8');
    });

    it('should handle file read errors gracefully', async () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      await service.onModuleInit();
      expect(fs.readFileSync).toHaveBeenCalled();
    });
  });

  describe('getDrugByNames', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should find drug by exact name match', async () => {
      const result = await service.getDrugByNames('Aspirin');
      expect(result).toEqual(mockDrugData[0]);
    });

    it('should find drug by generic name', async () => {
      const result = await service.getDrugByNames('acetylsalicylic-acid');
      expect(result).toEqual(mockDrugData[0]);
    });

    it('should find drug by both drug name and generic name', async () => {
      const result = await service.getDrugByNames('Aspirin', 'acetylsalicylic-acid');
      expect(result).toEqual(mockDrugData[0]);
    });

    it('should handle hyphenated names', async () => {
      const result = await service.getDrugByNames('aspirin');
      expect(result).toEqual(mockDrugData[0]);
    });

    it('should return null when drug not found', async () => {
      const result = await service.getDrugByNames('NonExistent');
      expect(result).toBeNull();
    });

    it('should return null when generic name does not match', async () => {
      const result = await service.getDrugByNames('Aspirin', 'wrong-generic');
      expect(result).toBeNull();
    });
  });

  describe('searchDrugs', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return all drugs when no query provided', async () => {
      const searchDto: DrugSearchDto = {};
      const result = await service.searchDrugs(searchDto);

      expect(result.drugs).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should filter drugs by query', async () => {
      const searchDto: DrugSearchDto = { query: 'aspirin' };
      const result = await service.searchDrugs(searchDto);

      expect(result.drugs).toHaveLength(1);
      expect(result.drugs[0].drugName).toBe('Aspirin');
    });

    it('should filter drugs by labeler', async () => {
      const searchDto: DrugSearchDto = { labeler: 'Test Pharma' };
      const result = await service.searchDrugs(searchDto);

      expect(result.drugs).toHaveLength(1);
      expect(result.drugs[0].drugName).toBe('Aspirin');
    });

    it('should handle pagination', async () => {
      const searchDto: DrugSearchDto = { page: 1, limit: 1 };
      const result = await service.searchDrugs(searchDto);

      expect(result.drugs).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle second page pagination', async () => {
      const searchDto: DrugSearchDto = { page: 2, limit: 1 };
      const result = await service.searchDrugs(searchDto);

      expect(result.drugs).toHaveLength(1);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('should use default pagination values', async () => {
      const searchDto: DrugSearchDto = {};
      const result = await service.searchDrugs(searchDto);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });
  });

  describe('getEnhancedContent', () => {
    const mockDrug = mockDrugData[0];

    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return cached content when available', async () => {
      const cachedContent = { id: '123', drugName: 'Cached Aspirin' };
      mockCacheService.get.mockResolvedValue(cachedContent);

      const result = await service.getEnhancedContent(mockDrug);

      expect(result).toEqual(cachedContent);
      expect(cacheService.get).toHaveBeenCalledWith('enhanced_content:123');
      expect(openAIService.generateSEOMetadata).not.toHaveBeenCalled();
    });

    it('should generate and cache enhanced content when not cached', async () => {
      const mockSEOMetadata = { title: 'SEO Title', description: 'SEO Description' };
      const mockSummary = 'Enhanced summary';
      const mockEnhancedSections = { indicationsAndUsage: 'Enhanced usage info' };

      mockCacheService.get.mockResolvedValue(null);
      mockOpenAIService.generateSEOMetadata.mockResolvedValue(mockSEOMetadata);
      mockOpenAIService.generateDrugSummary.mockResolvedValue(mockSummary);
      mockOpenAIService.enhanceAllSections.mockResolvedValue(mockEnhancedSections);

      const result = await service.getEnhancedContent(mockDrug);

      expect(result.seoTitle).toBe('SEO Title');
      expect(result.metaDescription).toBe('SEO Description');
      expect(result.enhancedSummary).toBe('Enhanced summary');
      expect(cacheService.set).toHaveBeenCalledWith(
        'enhanced_content:123',
        expect.objectContaining({ seoTitle: 'SEO Title' }),
        3600
      );
    });

    it('should return fallback content when AI services fail', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockOpenAIService.generateSEOMetadata.mockRejectedValue(new Error('AI service error'));

      const result = await service.getEnhancedContent(mockDrug);

      expect(result.seoTitle).toBe('Aspirin (acetylsalicylic-acid) - Drug Information');
      expect(result.enhancedSummary).toBe('Aspirin is a prescription medication containing acetylsalicylic-acid.');
      expect(result.sections).toBeDefined();
    });
  });

  describe('generateSitemap', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should generate sitemap with all drugs', async () => {
      const result = await service.generateSitemap();

      expect(result.urls).toHaveLength(2);
      expect(result.totalUrls).toBe(2);
      expect(result.urls[0]).toMatchObject({
        url: expect.stringMatching(/\/drugs\/.*-.*/),
        lastmod: expect.any(String),
        changefreq: 'monthly',
        priority: '0.8',
      });
    });

    it('should format dates correctly', async () => {
      const result = await service.generateSitemap();
      
      expect(result.urls[0].lastmod).toBe('2024-01-01');
      expect(result.urls[1].lastmod).toBe('2024-02-01');
    });
  });
});