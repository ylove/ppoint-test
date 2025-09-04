import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { DrugService } from '../drug/drug.service';
import type { McpRequest, McpToolCall } from './interfaces/mcp.interface';

describe('McpService', () => {
  let service: McpService;
  let drugService: jest.Mocked<DrugService>;

  beforeEach(async () => {
    const mockDrugService = {
      getDrugByNames: jest.fn(),
      searchDrugs: jest.fn(),
      getEnhancedContent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: DrugService,
          useValue: mockDrugService,
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
    drugService = module.get<DrugService>(DrugService) as jest.Mocked<DrugService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should handle initialize method', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        id: 1,
      };

      const response = await service.handleRequest(request);

      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'rxview-drug-server',
            version: '1.0.0',
          },
        },
      });
    });

    it('should handle tools/list method', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 2,
      };

      const response = await service.handleRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(2);
      expect(response.result?.tools).toHaveLength(3);
      expect(response.result?.tools[0]).toHaveProperty('name', 'get_drug_by_name');
      expect(response.result?.tools[1]).toHaveProperty('name', 'search_drugs');
      expect(response.result?.tools[2]).toHaveProperty('name', 'get_enhanced_sections');
    });

    it('should handle tools/call method', async () => {
      const mockDrug = { id: 1, name: 'Test Drug' };
      const mockEnhancedContent = { drugName: 'Test Drug', sections: [] };
      
      drugService.getDrugByNames.mockResolvedValue(mockDrug as any);
      drugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent as any);

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 3,
        params: {
          name: 'get_drug_by_name',
          arguments: { drugName: 'Test Drug' },
        },
      };

      const response = await service.handleRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(3);
      expect(response.result).toBeDefined();
      expect(drugService.getDrugByNames).toHaveBeenCalledWith('Test Drug', undefined);
      expect(drugService.getEnhancedContent).toHaveBeenCalledWith(mockDrug);
    });

    it('should handle unknown method', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'unknown/method',
        id: 4,
      };

      const response = await service.handleRequest(request);

      expect(response).toEqual({
        jsonrpc: '2.0',
        id: 4,
        error: {
          code: -32601,
          message: 'Method not found: unknown/method',
        },
      });
    });

    it('should handle request without id', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
      };

      const response = await service.handleRequest(request);

      expect(response.id).toBeNull();
    });
  });

  describe('getDrugByName tool', () => {
    it('should return drug data when drug is found', async () => {
      const mockDrug = { id: 1, name: 'Aspirin' };
      const mockEnhancedContent = { 
        drugName: 'Aspirin', 
        genericName: 'acetylsalicylic acid',
        sections: [{ title: 'Usage', content: 'Pain relief' }]
      };
      
      drugService.getDrugByNames.mockResolvedValue(mockDrug as any);
      drugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent as any);

      const toolCall: McpToolCall = {
        name: 'get_drug_by_name',
        arguments: { drugName: 'Aspirin' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe(JSON.stringify(mockEnhancedContent, null, 2));
      expect(drugService.getDrugByNames).toHaveBeenCalledWith('Aspirin', undefined);
    });

    it('should handle drug not found', async () => {
      drugService.getDrugByNames.mockResolvedValue(null);

      const toolCall: McpToolCall = {
        name: 'get_drug_by_name',
        arguments: { drugName: 'Unknown Drug' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe('Drug not found: Unknown Drug');
      expect(response.result?.isError).toBe(true);
    });

    it('should handle drug with generic name', async () => {
      const mockDrug = { id: 1, name: 'Tylenol' };
      const mockEnhancedContent = { drugName: 'Tylenol', sections: [] };
      
      drugService.getDrugByNames.mockResolvedValue(mockDrug as any);
      drugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent as any);

      const toolCall: McpToolCall = {
        name: 'get_drug_by_name',
        arguments: { drugName: 'Tylenol', genericName: 'acetaminophen' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      await service.handleRequest(request);

      expect(drugService.getDrugByNames).toHaveBeenCalledWith('Tylenol', 'acetaminophen');
    });
  });

  describe('searchDrugs tool', () => {
    it('should search drugs with query parameter', async () => {
      const mockSearchResults = {
        drugs: [{ id: 1, name: 'Test Drug' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      
      drugService.searchDrugs.mockResolvedValue(mockSearchResults as any);

      const toolCall: McpToolCall = {
        name: 'search_drugs',
        arguments: { query: 'aspirin' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe(JSON.stringify(mockSearchResults, null, 2));
      expect(drugService.searchDrugs).toHaveBeenCalledWith({ query: 'aspirin' });
    });

    it('should search drugs with all parameters', async () => {
      const mockSearchResults = { drugs: [], total: 0 };
      drugService.searchDrugs.mockResolvedValue(mockSearchResults as any);

      const toolCall: McpToolCall = {
        name: 'search_drugs',
        arguments: { 
          query: 'ibuprofen',
          labeler: 'Pfizer',
          page: 2,
          limit: 10,
        },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      await service.handleRequest(request);

      expect(drugService.searchDrugs).toHaveBeenCalledWith({
        query: 'ibuprofen',
        labeler: 'Pfizer',
        page: 2,
        limit: 10,
      });
    });
  });

  describe('getEnhancedSections tool', () => {
    it('should return enhanced sections when drug is found', async () => {
      const mockDrug = { id: 1, name: 'Viagra' };
      const mockEnhancedContent = {
        drugName: 'Viagra',
        genericName: 'sildenafil',
        sections: [
          { 
            title: 'Indications',
            content: 'Original content',
            enhancedContent: 'Enhanced content'
          },
          {
            title: 'Dosage',
            content: 'Dosage info'
          },
        ],
      };
      
      drugService.getDrugByNames.mockResolvedValue(mockDrug as any);
      drugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent as any);

      const toolCall: McpToolCall = {
        name: 'get_enhanced_sections',
        arguments: { drugName: 'Viagra', genericName: 'sildenafil' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      const expectedResult = {
        drugName: 'Viagra',
        genericName: 'sildenafil',
        enhancedSections: [
          {
            title: 'Indications',
            originalContent: 'Original content',
            enhancedContent: 'Enhanced content',
          },
        ],
      };

      expect(response.result?.content[0].text).toBe(JSON.stringify(expectedResult, null, 2));
    });

    it('should handle drug not found for enhanced sections', async () => {
      drugService.getDrugByNames.mockResolvedValue(null);

      const toolCall: McpToolCall = {
        name: 'get_enhanced_sections',
        arguments: { drugName: 'Unknown Drug', genericName: 'unknown' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe('Drug not found: Unknown Drug (unknown)');
      expect(response.result?.isError).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle tool execution errors', async () => {
      drugService.getDrugByNames.mockRejectedValue(new Error('Database connection failed'));

      const toolCall: McpToolCall = {
        name: 'get_drug_by_name',
        arguments: { drugName: 'Test Drug' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe('Error executing tool: Database connection failed');
      expect(response.result?.isError).toBe(true);
    });

    it('should handle unknown tool name', async () => {
      const toolCall: McpToolCall = {
        name: 'unknown_tool',
        arguments: {},
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe('Error executing tool: Unknown tool: unknown_tool');
      expect(response.result?.isError).toBe(true);
    });
  });

  describe('tool definitions', () => {
    it('should return correct tool schemas in tools/list', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      };

      const response = await service.handleRequest(request);
      const tools = response.result?.tools;

      expect(tools).toHaveLength(3);

      const getDrugTool = tools.find((t: any) => t.name === 'get_drug_by_name');
      expect(getDrugTool).toMatchObject({
        name: 'get_drug_by_name',
        description: 'Get detailed drug information by drug name and optional generic name',
        inputSchema: {
          type: 'object',
          properties: {
            drugName: {
              type: 'string',
              description: 'The brand name of the drug',
            },
            genericName: {
              type: 'string',
              description: 'The generic name of the drug (optional)',
            },
          },
          required: ['drugName'],
        },
      });

      const searchTool = tools.find((t: any) => t.name === 'search_drugs');
      expect(searchTool).toMatchObject({
        name: 'search_drugs',
        description: 'Search for drugs by name, generic name, or labeler',
      });

      const enhancedSectionsTool = tools.find((t: any) => t.name === 'get_enhanced_sections');
      expect(enhancedSectionsTool).toMatchObject({
        name: 'get_enhanced_sections',
        description: 'Get AI-enhanced content sections for a specific drug',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty search results', async () => {
      const mockSearchResults = { drugs: [], total: 0, page: 1, limit: 20 };
      drugService.searchDrugs.mockResolvedValue(mockSearchResults as any);

      const toolCall: McpToolCall = {
        name: 'search_drugs',
        arguments: { query: 'nonexistent' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      expect(response.result?.content[0].text).toBe(JSON.stringify(mockSearchResults, null, 2));
    });

    it('should handle enhanced sections with no enhanced content', async () => {
      const mockDrug = { id: 1, name: 'Test Drug' };
      const mockEnhancedContent = {
        drugName: 'Test Drug',
        sections: [
          { title: 'Basic Info', content: 'Basic content' },
          { title: 'Usage', content: 'Usage content' },
        ],
      };
      
      drugService.getDrugByNames.mockResolvedValue(mockDrug as any);
      drugService.getEnhancedContent.mockResolvedValue(mockEnhancedContent as any);

      const toolCall: McpToolCall = {
        name: 'get_enhanced_sections',
        arguments: { drugName: 'Test Drug' },
      };

      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 1,
        params: toolCall,
      };

      const response = await service.handleRequest(request);

      const result = JSON.parse(response.result?.content[0].text);
      expect(result.enhancedSections).toHaveLength(0);
    });

    it('should handle null request id', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        id: null,
      };

      const response = await service.handleRequest(request);
      expect(response.id).toBeNull();
    });
  });
});