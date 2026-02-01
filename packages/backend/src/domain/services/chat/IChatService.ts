import type { IKnowledgeChunk } from '../knowledge';

export interface IChatResponse {
  response: string;
  sources: Array<{ pageUrl: string; title?: string }>;
  tokensUsed: { input: number; output: number };
}

export interface IChatService {
  generateResponse(
    question: string,
    chunks: IKnowledgeChunk[],
    allowGeneralKnowledge: boolean,
    siteName?: string
  ): Promise<IChatResponse>;
}
