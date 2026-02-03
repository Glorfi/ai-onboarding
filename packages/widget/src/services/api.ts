import type {
  IWidgetChatResponse,
  IWidgetSaveEmailResponse,
  IWidgetRatingResponse,
} from '@/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        let errorBody: { message?: string; code?: string } = {};
        try {
          errorBody = await response.json();
        } catch {
          // ignore parse error
        }

        const apiError = new ApiError(
          errorBody.message ?? `HTTP ${response.status}`,
          response.status,
          errorBody.code,
        );

        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw apiError;
        }

        lastError = apiError;
      } else {
        return (await response.json()) as T;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      lastError = error as Error;
    }

    // Exponential backoff before retry (1s, 2s, 4s)
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError ?? new Error('Request failed after retries');
}

export function createApiClient(baseUrl: string, apiKey: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
  };

  return {
    sendMessage(
      sessionId: string,
      message: string,
      userEmail?: string,
    ): Promise<IWidgetChatResponse> {
      return fetchWithRetry<IWidgetChatResponse>(
        `${baseUrl}/api/widget/chat`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionId, message, userEmail }),
        },
      );
    },

    submitEmail(
      questionId: string,
      email: string,
    ): Promise<IWidgetSaveEmailResponse> {
      return fetchWithRetry<IWidgetSaveEmailResponse>(
        `${baseUrl}/api/widget/unanswered/email`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ questionId, email }),
        },
      );
    },

    submitRating(
      messageId: string,
      rating: 'positive' | 'negative',
      feedback?: string,
    ): Promise<IWidgetRatingResponse> {
      return fetchWithRetry<IWidgetRatingResponse>(
        `${baseUrl}/api/widget/rating`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ messageId, rating, feedback }),
        },
      );
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
