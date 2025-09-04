import { Controller, Post, Body, Logger } from '@nestjs/common';
import { McpService } from './mcp.service';
import type { McpRequest, McpResponse } from './interfaces/mcp.interface';

@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Post()
  async handleMcpRequest(@Body() request: McpRequest): Promise<McpResponse> {
    this.logger.log(`MCP Request: ${request.method}`);
    
    try {
      return await this.mcpService.handleRequest(request);
    } catch (error) {
      this.logger.error(`MCP Error for method ${request.method}:`, error);
      
      return {
        jsonrpc: '2.0',
        id: request.id || null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error.message,
        },
      };
    }
  }
}