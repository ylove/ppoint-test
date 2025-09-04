import { Injectable, Logger } from '@nestjs/common';
import { DrugService } from '../drug/drug.service';
import type { McpRequest, McpResponse, McpTool, McpToolCall, McpToolResult } from './interfaces/mcp.interface';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(private readonly drugService: DrugService) {}

  async handleRequest(request: McpRequest): Promise<McpResponse> {
    switch (request.method) {
      case 'tools/list':
        return this.listTools(request.id ?? null);
      
      case 'tools/call':
        return this.callTool(request.id ?? null, request.params);
      
      case 'initialize':
        return this.initialize(request.id ?? null, request.params);
      
      default:
        return {
          jsonrpc: '2.0',
          id: request.id || null,
          error: {
            code: -32601,
            message: `Method not found: ${request.method}`,
          },
        };
    }
  }

  private initialize(id: string | number | null, params?: any): McpResponse {
    return {
      jsonrpc: '2.0',
      id,
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
    };
  }

  private listTools(id: string | number | null): McpResponse {
    const tools: McpTool[] = [
      {
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
      },
      {
        name: 'search_drugs',
        description: 'Search for drugs by name, generic name, or labeler',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to match against drug names, generic names, or labelers',
            },
            labeler: {
              type: 'string',
              description: 'Filter by specific drug manufacturer/labeler',
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)',
              default: 1,
            },
            limit: {
              type: 'number',
              description: 'Number of results per page (default: 20)',
              default: 20,
            },
          },
        },
      },
      {
        name: 'get_enhanced_sections',
        description: 'Get AI-enhanced content sections for a specific drug',
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
      },
    ];

    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools,
      },
    };
  }

  private async callTool(id: string | number | null, params: McpToolCall): Promise<McpResponse> {
    try {
      const result = await this.executeTool(params);
      
      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    } catch (error) {
      this.logger.error(`Tool execution error for ${params.name}:`, error);
      
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error executing tool: ${error.message}`,
            },
          ],
          isError: true,
        },
      };
    }
  }

  private async executeTool(toolCall: McpToolCall): Promise<McpToolResult> {
    switch (toolCall.name) {
      case 'get_drug_by_name':
        return this.getDrugByName(toolCall.arguments as { drugName: string; genericName?: string });
      
      case 'search_drugs':
        return this.searchDrugs(toolCall.arguments as { query?: string; labeler?: string; page?: number; limit?: number });
      
      case 'get_enhanced_sections':
        return this.getEnhancedSections(toolCall.arguments as { drugName: string; genericName?: string });
      
      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }
  }

  private async getDrugByName(args: { drugName: string; genericName?: string }): Promise<McpToolResult> {
    const { drugName, genericName } = args;
    
    const drug = await this.drugService.getDrugByNames(drugName, genericName);
    
    if (!drug) {
      const searchTerm = genericName ? `${drugName} (${genericName})` : drugName;
      return {
        content: [
          {
            type: 'text',
            text: `Drug not found: ${searchTerm}`,
          },
        ],
        isError: true,
      };
    }

    const enhancedContent = await this.drugService.getEnhancedContent(drug);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(enhancedContent, null, 2),
        },
      ],
    };
  }

  private async searchDrugs(args: { query?: string; labeler?: string; page?: number; limit?: number }): Promise<McpToolResult> {
    const searchResults = await this.drugService.searchDrugs(args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(searchResults, null, 2),
        },
      ],
    };
  }

  private async getEnhancedSections(args: { drugName: string; genericName?: string }): Promise<McpToolResult> {
    const { drugName, genericName } = args;
    
    const drug = await this.drugService.getDrugByNames(drugName, genericName);
    
    if (!drug) {
      const searchTerm = genericName ? `${drugName} (${genericName})` : drugName;
      return {
        content: [
          {
            type: 'text',
            text: `Drug not found: ${searchTerm}`,
          },
        ],
        isError: true,
      };
    }

    const enhancedContent = await this.drugService.getEnhancedContent(drug);
    
    const enhancedSections = enhancedContent.sections.filter(section => section.enhancedContent);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            drugName: enhancedContent.drugName,
            genericName: enhancedContent.genericName,
            enhancedSections: enhancedSections.map(section => ({
              title: section.title,
              originalContent: section.content,
              enhancedContent: section.enhancedContent,
            })),
          }, null, 2),
        },
      ],
    };
  }
}