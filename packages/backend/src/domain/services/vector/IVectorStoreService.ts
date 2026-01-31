export interface IVectorMetadata {
  siteId: string;
  pageUrl: string;
  content: string;
  heading?: string;
}

export interface IVector {
  id: string;
  values: number[];
  metadata: IVectorMetadata;
}

export interface IVectorQueryResult {
  id: string;
  score: number;
  metadata?: IVectorMetadata;
}

export interface IVectorStoreService {
  upsert(vectors: IVector[]): Promise<void>;
  deleteBySiteId(siteId: string): Promise<void>;
  query(
    vector: number[],
    topK: number,
    siteId: string
  ): Promise<IVectorQueryResult[]>;
}
