import { injectable } from 'tsyringe';
import { Pinecone } from '@pinecone-database/pinecone';
import type {
  IVectorStoreService,
  IVector,
  IVectorQueryResult,
  IVectorMetadata,
} from '../../domain/services/vector';

const BATCH_SIZE = 100;

@injectable()
export class PineconeVectorStoreService implements IVectorStoreService {
  private client: Pinecone;
  private indexName: string;

  constructor() {
    this.client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
    });
    this.indexName = process.env.PINECONE_INDEX_NAME || 'onboarding-kb';
  }

  private getIndex() {
    return this.client.index(this.indexName);
  }

  async upsert(vectors: IVector[]): Promise<void> {
    if (vectors.length === 0) return;

    const index = this.getIndex();

    for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
      const batch = vectors.slice(i, i + BATCH_SIZE);

      const siteId = batch[0].metadata.siteId;

      if (!batch.every((v) => v.metadata.siteId === siteId)) {
        throw new Error('All vectors in batch must have the same siteId');
      }

      const records = batch.map((v) => {
        const metadata: Record<string, string> = {
          pageUrl: v.metadata.pageUrl,
          content: v.metadata.content,
          siteId: v.metadata.siteId,
        };

        if (v.metadata.heading) {
          metadata.heading = v.metadata.heading;
        }

        return {
          id: v.id,
          values: v.values,
          metadata,
        };
      });

      await this.getIndex().namespace(siteId).upsert(records);
    }
  }

  async deleteBySiteId(siteId: string): Promise<void> {
    const index = this.getIndex();

    await index.namespace(siteId).deleteAll();
  }

  async query(
    vector: number[],
    topK: number,
    siteId: string,
  ): Promise<IVectorQueryResult[]> {
    const index = this.getIndex();

    const response = await index.namespace(siteId).query({
      vector,
      topK,
      includeMetadata: true,
    });

    return response.matches.map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: match.metadata as IVectorMetadata | undefined,
    }));
  }
}
