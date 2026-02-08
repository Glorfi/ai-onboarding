import type { IKnowledgeChunk } from '../knowledge';

export interface IChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
    siteName?: string,
    chatHistory?: IChatHistoryMessage[]
  ): Promise<IChatResponse>;
}
