import { 
  Controller, 
  Get,  
  Param, 
  Query, 
  Render, 
  NotFoundException,
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { DrugService } from './drug.service';
import { DrugSearchDto } from './dto/drug-search.dto';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller()
export class DrugController {
  private readonly logger = new Logger(DrugController.name);

  constructor(private readonly drugService: DrugService) {}

  @Get('drugs')
  @ApiOperation({ summary: 'Search through available drug data.'})
  @ApiParam({name:'search', type: DrugSearchDto, description: 'Query parameters for drug search, either name or generic name by default.'})
  async searchDrugs(@Query() searchDto: DrugSearchDto) {
    try {
      return await this.drugService.searchDrugs(searchDto);
    } catch (error) {
      this.logger.error('Error searching drugs:', error);
      throw new InternalServerErrorException('Failed to search drugs');
    }
  }

  @Get('drugs/:drugIdentifier')
  @Render('drug-detail')
  @ApiOperation({ summary: 'Retrieve an individual drug by name or generic name.'})
  @ApiParam({name:'drugIdentifier', type: 'string', description: 'Unique identifier for each drug, in the format [drug name]-[generic name].'})
  async getDrugPage(
    @Param('drugIdentifier') drugIdentifier: string
  ) {
    const firstHyphenIndex = drugIdentifier.indexOf('-');
    if (firstHyphenIndex === -1) {
      throw new NotFoundException(`Invalid drug identifier format: ${drugIdentifier}`);
    }
    
    const drugName = drugIdentifier.substring(0, firstHyphenIndex);
    const genericName = drugIdentifier.substring(firstHyphenIndex + 1);
    try {
      const drug = await this.drugService.getDrugByNames(drugName, genericName);
      
      if (!drug) {
        throw new NotFoundException(`Drug not found: ${drugName}/${genericName}`);
      }

      const enhancedContent = await this.drugService.getEnhancedContent(drug);
      
      return {
        title: enhancedContent.seoTitle,
        metaDescription: enhancedContent.metaDescription,
        drug: enhancedContent,
        canonicalUrl: `/drugs/${drugName}-${genericName}`,
      };
    } catch (error) {
      this.logger.error(`Error getting drug page for ${drugName}/${genericName}:`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to load drug information');
    }
  }

  @Get('api/drugs/:drugIdentifier/basic')
  @ApiOperation({ summary: 'Retrieve basic API information for an individual drug (fast response).'})
  @ApiParam({name:'drugIdentifier', type: 'string', description: 'Unique identifier for each drug, in the format [drug name]-[generic name].'})
  async getDrugBasicApi(
    @Param('drugIdentifier') drugIdentifier: string
  ) {
    const firstHyphenIndex = drugIdentifier.indexOf('-');
    if (firstHyphenIndex === -1) {
      throw new NotFoundException(`Invalid drug identifier format: ${drugIdentifier}`);
    }
    
    const drugName = drugIdentifier.substring(0, firstHyphenIndex);
    const genericName = drugIdentifier.substring(firstHyphenIndex + 1);
    try {
      const drug = await this.drugService.getDrugByNames(drugName, genericName);

      if (!drug) {
        throw new NotFoundException(`Drug not found: ${drugName}/${genericName}`);
      }

      return await this.drugService.getBasicContent(drug);
    } catch (error) {
      this.logger.error(`Error getting basic drug API for ${drugName}/${genericName}:`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to load drug information');
    }
  }

  @Get('api/drugs/:drugIdentifier')
  @ApiOperation({ summary: 'Retrieve basic API information for an individual drug (fast response).'})
  @ApiParam({name:'drugIdentifier', type: 'string', description: 'Unique identifier for each drug, in the format [drug name]-[generic name].'})
  async getDrugApi(
    @Param('drugIdentifier') drugIdentifier: string
  ) {
    const firstHyphenIndex = drugIdentifier.indexOf('-');
    if (firstHyphenIndex === -1) {
      throw new NotFoundException(`Invalid drug identifier format: ${drugIdentifier}`);
    }
    
    const drugName = drugIdentifier.substring(0, firstHyphenIndex);
    const genericName = drugIdentifier.substring(firstHyphenIndex + 1);
    try {
      const drug = await this.drugService.getDrugByNames(drugName, genericName);

      if (!drug) {
        throw new NotFoundException(`Drug not found: ${drugName}/${genericName}`);
      }

      return await this.drugService.getBasicContent(drug);
    } catch (error) {
      this.logger.error(`Error getting drug API for ${drugName}/${genericName}:`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to load drug information');
    }
  }

  @Get('api/drugs/:drugIdentifier/enhanced')
  @ApiOperation({ summary: 'Retrieve enhanced (AI-processed) information for an individual drug.'})
  @ApiParam({name:'drugIdentifier', type: 'string', description: 'Unique identifier for each drug, in the format [drug name]-[generic name].'})
  async getDrugEnhancedApi(
    @Param('drugIdentifier') drugIdentifier: string
  ) {
    const firstHyphenIndex = drugIdentifier.indexOf('-');
    if (firstHyphenIndex === -1) {
      throw new NotFoundException(`Invalid drug identifier format: ${drugIdentifier}`);
    }
    
    const drugName = drugIdentifier.substring(0, firstHyphenIndex);
    const genericName = drugIdentifier.substring(firstHyphenIndex + 1);
    try {
      const drug = await this.drugService.getDrugByNames(drugName, genericName);

      if (!drug) {
        throw new NotFoundException(`Drug not found: ${drugName}/${genericName}`);
      }

      const basicContent = await this.drugService.getBasicContent(drug);
      const enhancedData = await this.drugService.getEnhancedContent(drug);

      return {
        seoTitle: enhancedData.seoTitle,
        metaDescription: enhancedData.metaDescription,
        enhancedSummary: enhancedData.enhancedSummary,
        sections: enhancedData.sections
      };
    } catch (error) {
      this.logger.error(`Error getting enhanced drug API for ${drugName}/${genericName}:`, error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to load enhanced drug information');
    }
  }

  @Get('sitemap')
  @ApiOperation({ summary: 'Create a JSON sitemap.'})
  async getSitemap() {
    try {
      return await this.drugService.generateSitemap();
    } catch (error) {
      this.logger.error('Error generating sitemap:', error);
      throw new InternalServerErrorException('Failed to generate sitemap');
    }
  }
}