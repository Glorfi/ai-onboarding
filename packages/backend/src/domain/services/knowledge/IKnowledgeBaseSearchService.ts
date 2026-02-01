export interface IKnowledgeChunk {
  content: string;
  pageUrl: string;
  score: number;
  heading?: string;
}

export interface ISearchResult {
  hasAnswer: boolean;
  chunks: IKnowledgeChunk[];
  bestScore: number;
}

export interface IKnowledgeBaseSearchService {
  search(
    siteId: string,
    question: string,
    threshold: number
  ): Promise<ISearchResult>;
}
