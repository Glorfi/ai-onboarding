export interface IChatMessage {
  id: string;
  siteId: string;
  sessionId: string;
  message: string;
  response: string;
  responseTimeMs: number;
  createdAt: Date;
}

export interface ICreateChatMessageData {
  siteId: string;
  sessionId: string;
  message: string;
  response: string;
  responseTimeMs: number;
}
