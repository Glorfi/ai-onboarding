import type { ISite, IApiKey } from '@/domain/models';
import type { ISiteDTO, IApiKeyDTO, ISiteWithApiKeyDTO } from '@ai-onboarding/shared';

export function toSiteDTO(site: ISite): ISiteDTO {
  return {
    id: site.id,
    userId: site.userId,
    url: site.url,
    domain: site.domain,
    name: site.name,
    status: site.status,
    triggerDelaySeconds: site.triggerDelaySeconds,
    additionalUrls: site.additionalUrls,
    lastCrawledAt: site.lastCrawledAt,
    errorMessage: site.errorMessage,
    createdAt: site.createdAt,
    updatedAt: site.updatedAt,
    similarityThreshold: site.similarityThreshold,
    allowGeneralKnowledge: site.allowGeneralKnowledge,
    maxMessagesPerSession: site.maxMessagesPerSession,
  };
}

export function toApiKeyDTO(apiKey: IApiKey): IApiKeyDTO {
  return {
    id: apiKey.id,
    siteId: apiKey.siteId,
    key: apiKey.key,
    isActive: apiKey.isActive,
    createdAt: apiKey.createdAt,
    lastRegeneratedAt: apiKey.lastRegeneratedAt,
  };
}

export function toSiteWithApiKeyDTO(
  site: ISite,
  apiKey: IApiKey | null,
): ISiteWithApiKeyDTO {
  return {
    ...toSiteDTO(site),
    apiKey: apiKey ? toApiKeyDTO(apiKey) : null,
  };
}
