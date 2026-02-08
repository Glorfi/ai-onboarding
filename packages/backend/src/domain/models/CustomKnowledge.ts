export interface ICustomKnowledge {
  id: string;
  siteId: string;
  title: string;
  content: string;
  vectorId: string;
  createdAt: Date;
}

export interface ICreateCustomKnowledgeData {
  siteId: string;
  title: string;
  content: string;
  vectorId: string;
}
