import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { DrugController } from './drug.controller';
import { DrugService } from './drug.service';
import { DrugSearchDto } from './dto/drug-search.dto';

describe('DrugController', () => {
  let controller: DrugController;
  let drugService: DrugService;

  const mockDrugService = {
    searchDrugs: jest.fn(),
    getDrugByNames: jest.fn(),
    getEnhancedContent: jest.fn(),
    generateSitemap: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DrugController],
      providers: [
        {
          provide: DrugService,
          useValue: mockDrugService,
        },
      ],
    }).compile();

    controller = module.get<DrugController>(DrugController);
    drugService = module.get<DrugService>(DrugService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchDrugs', () => {
    it('should return search results', async () => {
      const searchDto: DrugSearchDto = { query: 'aspirin' };
      const mockResults = {
        drugs: [{ drugName: 'Aspirin', genericName: 'acetylsalicylic acid' }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
      };

      mockDrugService.searchDrugs.mockResolvedValue(mockResults);

      const result = await controller.searchDrugs(searchDto);

      expect(result).toEqual(mockResults);
      expect(drugService.searchDrugs).toHaveBeenCalledWith(searchDto);
    });

    it('should handle service errors', async () => {
      const searchDto: DrugSearchDto = { query: 'aspirin' };
      mockDrugService.searchDrugs.mockRejectedValue(new Error('Database error'));

      await expect(controller.searchDrugs(searchDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getDrugPage', () => {
    it('should return drug page data', async () => {
      const drugIdentifier = 'aspirin-acetylsalicylic-acid';
      const mockDrug = { setId: '123', drugName: 'Aspirin', label: { genericName: 'acetylsalicylic-acid' } };
      const mockEnhancedContent = {
        seoTitle: 'Aspirin Information',
        metaDescription: 'Complete information about Aspirin',
        drugName: 'Aspirin',
        genericName: 'acetylsalicylic acid'
      };

      mockDrugService.getDrugByNames.mockResolvedValue(mockDrug);
      mockDrugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent);

      const result = await controller.getDrugPage(drugIdentifier);

      expect(result).toEqual({
        title: 'Aspirin Information',
        metaDescription: 'Complete information about Aspirin',
        drug: mockEnhancedContent,
        canonicalUrl: '/drugs/aspirin-acetylsalicylic-acid',
      });
      expect(drugService.getDrugByNames).toHaveBeenCalledWith('aspirin', 'acetylsalicylic-acid');
      expect(drugService.getEnhancedContent).toHaveBeenCalledWith(mockDrug);
    });

    it('should throw NotFoundException for invalid drug identifier format', async () => {
      const drugIdentifier = 'invalid';

      await expect(controller.getDrugPage(drugIdentifier)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when drug is not found', async () => {
      const drugIdentifier = 'unknown-drug';
      mockDrugService.getDrugByNames.mockResolvedValue(null);

      await expect(controller.getDrugPage(drugIdentifier)).rejects.toThrow(NotFoundException);
    });

    it('should handle service errors', async () => {
      const drugIdentifier = 'aspirin-acetylsalicylic-acid';
      mockDrugService.getDrugByNames.mockRejectedValue(new Error('Database error'));

      await expect(controller.getDrugPage(drugIdentifier)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getDrugApi', () => {
    it('should return drug API data', async () => {
      const drugIdentifier = 'aspirin-acetylsalicylic-acid';
      const mockDrug = { setId: '123', drugName: 'Aspirin', label: { genericName: 'acetylsalicylic-acid' } };
      const mockEnhancedContent = {
        drugName: 'Aspirin',
        genericName: 'acetylsalicylic acid',
        sections: []
      };

      mockDrugService.getDrugByNames.mockResolvedValue(mockDrug);
      mockDrugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent);

      const result = await controller.getDrugApi(drugIdentifier);

      expect(result).toEqual(mockEnhancedContent);
      expect(drugService.getDrugByNames).toHaveBeenCalledWith('aspirin', 'acetylsalicylic-acid');
      expect(drugService.getEnhancedContent).toHaveBeenCalledWith(mockDrug);
    });

    it('should throw NotFoundException for invalid format', async () => {
      const drugIdentifier = 'invalid';

      await expect(controller.getDrugApi(drugIdentifier)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when drug not found', async () => {
      const drugIdentifier = 'unknown-drug';
      mockDrugService.getDrugByNames.mockResolvedValue(null);

      await expect(controller.getDrugApi(drugIdentifier)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSitemap', () => {
    it('should return sitemap data', async () => {
      const mockSitemap = {
        urls: [{ url: '/drugs/aspirin-acetylsalicylic-acid' }],
        totalUrls: 1
      };

      mockDrugService.generateSitemap.mockResolvedValue(mockSitemap);

      const result = await controller.getSitemap();

      expect(result).toEqual(mockSitemap);
      expect(drugService.generateSitemap).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockDrugService.generateSitemap.mockRejectedValue(new Error('Service error'));

      await expect(controller.getSitemap()).rejects.toThrow(InternalServerErrorException);
    });
  });
});