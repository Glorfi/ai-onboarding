import type { IChatRating, ICreateChatRatingData } from '../models';

export interface IChatRatingRepository {
  findById(id: string): Promise<IChatRating | null>;
  findByMessageId(messageId: string): Promise<IChatRating | null>;
  findBySiteId(siteId: string): Promise<IChatRating[]>;
  create(data: ICreateChatRatingData): Promise<IChatRating>;
}
