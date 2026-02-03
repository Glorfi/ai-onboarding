export interface IChatResult {
  response: string;
  responseTime: number;
  messageId?: string;
  sources?: Array<{ pageUrl: string; title?: string }>;
  canProvideEmail?: boolean;
  unansweredQuestionId?: string;
}

export type IWidgetChatResponse = IChatResult;
