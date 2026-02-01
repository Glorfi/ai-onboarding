import { z } from 'zod';

// Widget request schemas (API key validated in middleware via X-API-Key header)

export const widgetChatRequestSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  message: z.string().min(1, 'Message is required').max(2000),
  userEmail: z.string().email('Invalid email format').optional(),
});

export const widgetRatingRequestSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  rating: z.enum(['positive', 'negative']),
  feedback: z.string().max(1000).optional(),
});

export const widgetEmailRequestSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  email: z.string().email('Invalid email format'),
});

export const chatSettingsInputSchema = z.object({
  similarityThreshold: z.number().min(0).max(1).optional(),
  allowGeneralKnowledge: z.boolean().optional(),
  maxMessagesPerSession: z.number().min(1).max(100).optional(),
});

// Types inferred from schemas
export type IWidgetChatRequest = z.infer<typeof widgetChatRequestSchema>;
export type IWidgetRatingRequest = z.infer<typeof widgetRatingRequestSchema>;
export type IWidgetEmailRequest = z.infer<typeof widgetEmailRequestSchema>;
export type IChatSettingsInput = z.infer<typeof chatSettingsInputSchema>;
