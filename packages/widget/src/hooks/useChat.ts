import { useState, useCallback, useMemo } from 'preact/hooks';
import { createApiClient, ApiError } from '@/services/api';
import type { Message, WidgetConfig } from '@/types';
import { generateUUID } from '@/utils/uuid';

interface UseChatParams {
  config: WidgetConfig;
  sessionId: string;
  userEmail: string | null;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isRateLimited: boolean;
  error: string | null;
  sendMessage: (content: string) => void;
  submitRating: (messageId: string, rating: 'positive' | 'negative', feedback?: string) => void;
  submitEmail: (questionId: string, email: string) => Promise<void>;
  clearError: () => void;
}

export function useChat({ config, sessionId, userEmail }: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'bot',
      content: `Hi! I'm here to help you${config.companyName ? ` with ${config.companyName}` : ''}. Ask me anything!`,
      timestamp: new Date(),
      status: 'sent',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = useMemo(
    () => createApiClient(config.apiUrl, config.apiKey),
    [config.apiUrl, config.apiKey],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (isRateLimited || isLoading) return;

      const userMsgId = generateUUID();
      const userMessage: Message = {
        id: userMsgId,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'sending',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.sendMessage(sessionId, content, userEmail ?? undefined);

        // Mark user message as sent
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, status: 'sent' as const } : m)),
        );

        // Build bot message
        const botMessage: Message = {
          id: generateUUID(),
          role: 'bot',
          content: response.response,
          timestamp: new Date(),
          status: 'sent',
        };

        if (response.messageId) {
          botMessage.messageId = response.messageId;
          botMessage.sources = response.sources;
        }
        if (response.canProvideEmail && response.unansweredQuestionId) {
          botMessage.canProvideEmail = true;
          botMessage.unansweredQuestionId = response.unansweredQuestionId;
        }

        setMessages((prev) => [...prev, botMessage]);
      } catch (err) {
        // Mark user message as error
        setMessages((prev) =>
          prev.map((m) => (m.id === userMsgId ? { ...m, status: 'error' as const } : m)),
        );

        if (err instanceof ApiError && err.status === 429) {
          setIsRateLimited(true);
          setError(
            "You've reached the message limit. Would you like to leave your email so we can continue helping?",
          );
        } else {
          setError('Failed to send message. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [api, sessionId, userEmail, isRateLimited, isLoading],
  );

  const submitRating = useCallback(
    async (messageId: string, rating: 'positive' | 'negative', feedback?: string) => {
      try {
        await api.submitRating(messageId, rating, feedback);
        setMessages((prev) =>
          prev.map((m) => (m.messageId === messageId ? { ...m, rating } : m)),
        );
      } catch {
        setError('Failed to submit rating.');
      }
    },
    [api],
  );

  const submitEmail = useCallback(
    async (questionId: string, email: string) => {
      await api.submitEmail(questionId, email);
      setMessages((prev) =>
        prev.map((m) =>
          m.unansweredQuestionId === questionId
            ? { ...m, emailSubmitted: true }
            : m,
        ),
      );
      // Add a thank-you bot message
      setMessages((prev) => [
        ...prev,
        {
          id: generateUUID(),
          role: 'bot' as const,
          content: 'Thank you! Our team will reach out to you soon. Is there anything else I can help with?',
          timestamp: new Date(),
          status: 'sent' as const,
        },
      ]);
    },
    [api],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isLoading,
    isRateLimited,
    error,
    sendMessage,
    submitRating,
    submitEmail,
    clearError,
  };
}
