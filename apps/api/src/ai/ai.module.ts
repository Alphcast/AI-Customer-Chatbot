import { Global, Module } from '@nestjs/common';
import { AiService } from './services/ai.service';
import { VectorService } from './services/vector.service';
import { DocumentProcessorService } from './services/document-processor.service';
import { SentimentService } from './services/sentiment.service';
import { CopilotService } from './services/copilot.service';
import { OpenaiProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { GeminiProvider } from './providers/gemini.provider';

@Global()
@Module({
  providers: [
    AiService,
    VectorService,
    DocumentProcessorService,
    SentimentService,
    CopilotService,
    OpenaiProvider,
    ClaudeProvider,
    GeminiProvider,
  ],
  exports: [
    AiService,
    VectorService,
    DocumentProcessorService,
    SentimentService,
    CopilotService,
  ],
})
export class AiModule {}
