export type AnalyticsEventType =
  | 'walkthrough_started'
  | 'walkthrough_completed'
  | 'walkthrough_skipped'
  | 'chat_message';

export interface IAnalytics {
  id: string;
  siteId: string;
  eventType: AnalyticsEventType;
  sessionId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface ICreateAnalyticsData {
  siteId: string;
  eventType: AnalyticsEventType;
  sessionId: string;
  metadata?: Record<string, unknown>;
}
