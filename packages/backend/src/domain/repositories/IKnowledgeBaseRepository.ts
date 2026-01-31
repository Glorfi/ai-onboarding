import type { IKnowledgeBase, ICreateKnowledgeBaseData } from '../models';

export interface IKnowledgeBaseRepository {
  findById(id: string): Promise<IKnowledgeBase | null>;
  findBySiteId(siteId: string): Promise<IKnowledgeBase[]>;
  findByVectorIds(vectorIds: string[]): Promise<IKnowledgeBase[]>;
  create(data: ICreateKnowledgeBaseData): Promise<IKnowledgeBase>;
  createMany(data: ICreateKnowledgeBaseData[]): Promise<number>;
  deleteBySiteId(siteId: string): Promise<number>;
}
