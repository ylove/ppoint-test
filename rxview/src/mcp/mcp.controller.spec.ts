import { Test, TestingModule } from '@nestjs/testing';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import type { McpRequest, McpResponse } from './interfaces/mcp.interface';

describe('McpController', () => {
  let controller: McpController;
  let mcpService: McpService;

  const mockMcpService = {
    handleRequest: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        {
          provide: McpService,
          useValue: mockMcpService,
        },
      ],
    }).compile();

    controller = module.get<McpController>(McpController);
    mcpService = module.get<McpService>(McpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMcpRequest', () => {
    it('should handle successful MCP request', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: '123',
      };

      const mockResponse: McpResponse = {
        jsonrpc: '2.0',
        id: '123',
        result: {
          tools: [],
        },
      };

      mockMcpService.handleRequest.mockResolvedValue(mockResponse);

      const result = await controller.handleMcpRequest(request);

      expect(result).toEqual(mockResponse);
      expect(mcpService.handleRequest).toHaveBeenCalledWith(request);
    });

    it('should handle MCP request with null id', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        id: null,
      };

      const mockResponse: McpResponse = {
        jsonrpc: '2.0',
        id: null,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'rxview-drug-server', version: '1.0.0' },
        },
      };

      mockMcpService.handleRequest.mockResolvedValue(mockResponse);

      const result = await controller.handleMcpRequest(request);

      expect(result).toEqual(mockResponse);
    });

    it('should handle MCP request without id', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
      };

      const mockResponse: McpResponse = {
        jsonrpc: '2.0',
        id: null,
        result: {
          content: [{ type: 'text', text: 'Tool result' }],
        },
      };

      mockMcpService.handleRequest.mockResolvedValue(mockResponse);

      const result = await controller.handleMcpRequest(request);

      expect(result).toEqual(mockResponse);
    });

    it('should handle service errors and return error response', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: '456',
        params: {
          name: 'unknown_tool',
          arguments: {},
        },
      };

      const error = new Error('Tool execution failed');
      mockMcpService.handleRequest.mockRejectedValue(error);

      const result = await controller.handleMcpRequest(request);

      expect(result).toEqual({
        jsonrpc: '2.0',
        id: '456',
        error: {
          code: -32603,
          message: 'Internal error',
          data: 'Tool execution failed',
        },
      });
      expect(mcpService.handleRequest).toHaveBeenCalledWith(request);
    });

    it('should handle service errors with null id', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'invalid_method',
        id: null,
      };

      const error = new Error('Method not found');
      mockMcpService.handleRequest.mockRejectedValue(error);

      const result = await controller.handleMcpRequest(request);

      expect(result).toEqual({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: 'Method not found',
        },
      });
    });

    it('should handle service errors without id in request', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
      };

      const error = new Error('Service unavailable');
      mockMcpService.handleRequest.mockRejectedValue(error);

      const result = await controller.handleMcpRequest(request);

      expect(result).toEqual({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: 'Service unavailable',
        },
      });
    });

    it('should log request method', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: '789',
      };

      const mockResponse: McpResponse = {
        jsonrpc: '2.0',
        id: '789',
        result: { tools: [] },
      };

      mockMcpService.handleRequest.mockResolvedValue(mockResponse);
      const loggerSpy = jest.spyOn(controller['logger'], 'log');

      await controller.handleMcpRequest(request);

      expect(loggerSpy).toHaveBeenCalledWith('MCP Request: tools/list');
    });

    it('should log errors with method name', async () => {
      const request: McpRequest = {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: '999',
      };

      const error = new Error('Test error');
      mockMcpService.handleRequest.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(controller['logger'], 'error');

      await controller.handleMcpRequest(request);

      expect(loggerSpy).toHaveBeenCalledWith('MCP Error for method tools/call:', error);
    });
  });
});