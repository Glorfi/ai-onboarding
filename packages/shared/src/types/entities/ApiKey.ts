export interface IApiKey {
  id: string;
  siteId: string;
  key: string;
  isActive: boolean;
  createdAt: Date;
  lastRegeneratedAt?: Date;
}

export interface ICreateApiKeyData {
  siteId: string;
  key: string;
}
