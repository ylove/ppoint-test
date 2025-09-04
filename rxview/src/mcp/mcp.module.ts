import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { DrugModule } from '../drug/drug.module';

@Module({
  imports: [DrugModule],
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}