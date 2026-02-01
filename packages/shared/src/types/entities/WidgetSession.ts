export interface IWidgetSession {
  id: string;
  siteId: string;
  ipAddressHash: string;
  userEmail?: string;
  messagesCount: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface ICreateWidgetSessionData {
  id: string;
  siteId: string;
  ipAddressHash: string;
  userEmail?: string;
}

export interface IUpdateWidgetSessionData {
  userEmail?: string;
  messagesCount?: number;
  lastSeenAt?: Date;
}
