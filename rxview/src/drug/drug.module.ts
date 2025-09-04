import { Module } from '@nestjs/common';
import { DrugController } from './drug.controller';
import { DrugService } from './drug.service';
import { OpenAIService } from './openai.service';
import { CacheService } from './cache.service';

@Module({
  controllers: [DrugController],
  providers: [DrugService, OpenAIService, CacheService],
  exports: [DrugService],
})
export class DrugModule {}