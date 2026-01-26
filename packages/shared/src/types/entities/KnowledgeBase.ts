export interface IKnowledgeBase {
  id: string;
  siteId: string;
  pageUrl: string;
  content: string;
  vectorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateKnowledgeBaseData {
  siteId: string;
  pageUrl: string;
  content: string;
  vectorId: string;
}
