import { Injectable, Logger } from '@nestjs/common';
import { Sentiment } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface SentimentResult {
  sentiment: Sentiment;
  score: number;
}

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('app.openai.apiKey') || '',
    });
  }

  async analyze(text: string): Promise<Sentiment> {
    const result = await this.analyzeWithConfidence(text);
    return result.sentiment;
  }

  async analyzeWithConfidence(text: string): Promise<SentimentResult> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analyzer. Analyze the sentiment of the user message and respond with ONLY a JSON object:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "ANGRY" | "FRUSTRATED",
  "score": 0.0-1.0
}

Where score represents confidence in the classification.
- POSITIVE: Satisfied, grateful, happy (score: 0.7-1.0)
- NEUTRAL: Factual, asking questions, no strong emotion (score: 0.5-0.8)
- NEGATIVE: Disappointed, unhappy (score: 0.6-0.9)
- ANGRY: Upset, demanding, hostile language (score: 0.7-1.0)
- FRUSTRATED: Repeated issues, confused, annoyed (score: 0.6-0.9)`,
          },
          { role: 'user', content: text },
        ],
        max_tokens: 100,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content || '';
      const parsed = JSON.parse(content);

      const sentiment = this.validateSentiment(parsed.sentiment);
      const score = Math.max(0, Math.min(1, parsed.score || 0.5));

      return { sentiment, score };
    } catch (error) {
      this.logger.error(
        `Sentiment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      return { sentiment: Sentiment.NEUTRAL, score: 0.5 };
    }
  }

  shouldEscalate(sentiment: Sentiment, score: number): boolean {
    const urgentSentiments: Sentiment[] = [Sentiment.ANGRY, Sentiment.FRUSTRATED];
    return urgentSentiments.includes(sentiment) && score >= 0.7;
  }

  private validateSentiment(value: string): Sentiment {
    const valid = Object.values(Sentiment);
    if (valid.includes(value as Sentiment)) {
      return value as Sentiment;
    }
    return Sentiment.NEUTRAL;
  }
}
