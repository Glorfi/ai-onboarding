export type RatingType = 'positive' | 'negative';

export interface IChatRating {
  id: string;
  chatMessageId: string;
  siteId: string;
  sessionId: string;
  rating: RatingType;
  feedback?: string;
  createdAt: Date;
}

export interface ICreateChatRatingData {
  chatMessageId: string;
  siteId: string;
  sessionId: string;
  rating: RatingType;
  feedback?: string;
}
