import { injectable } from 'tsyringe';
import OpenAI from 'openai';
import type { IEmbeddingService } from '../../domain/services/embedding';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const MAX_BATCH_SIZE = 100;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

@injectable()
export class OpenAIEmbeddingService implements IEmbeddingService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0];
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const allEmbeddings: number[][] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);
      const batchEmbeddings = await this.generateBatchWithRetry(batch);
      allEmbeddings.push(...batchEmbeddings);

      // Small delay between batches to avoid rate limits
      if (i + MAX_BATCH_SIZE < texts.length) {
        await this.delay(100);
      }
    }

    return allEmbeddings;
  }

  private async generateBatchWithRetry(texts: string[]): Promise<number[][]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: EMBEDDING_MODEL,
          input: texts,
        });

        return response.data.map((item) => item.embedding);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(
          `Embedding generation attempt ${attempt + 1} failed:`,
          lastError.message
        );

        if (attempt < RETRY_ATTEMPTS - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('Failed to generate embeddings');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
