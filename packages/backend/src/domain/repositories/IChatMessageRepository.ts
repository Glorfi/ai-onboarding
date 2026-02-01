import type { IChatMessage, ICreateChatMessageData } from '../models';

export interface IChatMessageRepository {
  findById(id: string): Promise<IChatMessage | null>;
  findBySiteId(
    siteId: string,
    limit?: number,
    offset?: number
  ): Promise<IChatMessage[]>;
  findBySessionId(sessionId: string): Promise<IChatMessage[]>;
  create(data: ICreateChatMessageData): Promise<IChatMessage>;
  countBySiteId(siteId: string): Promise<number>;
}
