import { injectable, inject } from 'tsyringe';
import type {
  IKnowledgeBaseSearchService,
  ISearchResult,
  IKnowledgeChunk,
} from '@/domain/services/knowledge';
import type { IEmbeddingService } from '@/domain/services/embedding';
import type { IVectorStoreService } from '@/domain/services/vector';

const TOP_K = 5;
const MAX_CHUNKS_RETURNED = 3;

@injectable()
export class KnowledgeBaseSearchService implements IKnowledgeBaseSearchService {
  constructor(
    @inject('IEmbeddingService') private embeddingService: IEmbeddingService,
    @inject('IVectorStoreService') private vectorStore: IVectorStoreService
  ) {}

  async search(
    siteId: string,
    question: string,
    threshold: number
  ): Promise<ISearchResult> {
    // 1. Generate embedding for the question
    const questionEmbedding =
      await this.embeddingService.generateEmbedding(question);

    // 2. Query Pinecone
    const results = await this.vectorStore.query(
      questionEmbedding,
      TOP_K,
      siteId
    );
    console.log(results);
    

    // 3. Filter by threshold
    const relevantChunks = results.filter((match) => match.score >= threshold);

    if (relevantChunks.length === 0) {
      return {
        hasAnswer: false,
        chunks: [],
        bestScore: results[0]?.score || 0,
      };
    }

    // 4. Map to IKnowledgeChunk and take top chunks
    const chunks: IKnowledgeChunk[] = relevantChunks
      .slice(0, MAX_CHUNKS_RETURNED)
      .map((match) => ({
        content: match.metadata?.content || '',
        pageUrl: match.metadata?.pageUrl || '',
        score: match.score,
        heading: match.metadata?.heading,
      }));

    return {
      hasAnswer: true,
      chunks,
      bestScore: chunks[0].score,
    };
  }
}
