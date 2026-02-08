export type UnansweredQuestionStatus = 'new' | 'contacted' | 'resolved';

export interface IUnansweredQuestion {
  id: string;
  siteId: string;
  sessionId: string;
  userEmail?: string;
  question: string;
  bestMatchScore: number;
  timestamp: Date;
  status: UnansweredQuestionStatus;
  contactedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ICreateUnansweredQuestionData {
  siteId: string;
  sessionId: string;
  userEmail?: string;
  question: string;
  bestMatchScore: number;
  timestamp: Date;
}

export interface IUpdateUnansweredQuestionData {
  userEmail?: string;
  status?: UnansweredQuestionStatus;
  contactedAt?: Date;
  resolvedAt?: Date;
}
