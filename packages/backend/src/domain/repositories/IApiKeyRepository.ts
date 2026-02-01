import type { IApiKey, ICreateApiKeyData } from '../models';

export interface IApiKeyRepository {
  findByKey(key: string): Promise<IApiKey | null>;
  findBySiteId(siteId: string): Promise<IApiKey | null>;
  create(data: ICreateApiKeyData): Promise<IApiKey>;
  regenerate(siteId: string, newKey: string): Promise<IApiKey>;
}
