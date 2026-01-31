import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '../constants';

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  // .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  // .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  // .regex(/\d/, 'Password must contain at least one number');

export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signInInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});


export const addCustomKnowledgeInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(50000),
});

export const chatMessageInputSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  message: z.string().min(1, 'Message is required').max(2000),
});

export const trackAnalyticsInputSchema = z.object({
  eventType: z.enum([
    'walkthrough_started',
    'walkthrough_completed',
    'walkthrough_skipped',
    'chat_message',
  ]),
  sessionId: z.string().uuid('Invalid session ID'),
  metadata: z.record(z.unknown()).optional(),
});

export type IRegisterInput = z.infer<typeof registerInputSchema>;
export type ISignInInput = z.infer<typeof signInInputSchema>;
export type IAddCustomKnowledgeInput = z.infer<typeof addCustomKnowledgeInputSchema>;
export type IChatMessageInput = z.infer<typeof chatMessageInputSchema>;
export type ITrackAnalyticsInput = z.infer<typeof trackAnalyticsInputSchema>;
