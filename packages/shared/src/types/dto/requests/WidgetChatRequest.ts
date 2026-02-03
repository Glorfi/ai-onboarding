import type { z } from 'zod';
import type { widgetChatRequestSchema } from '../../../validation';

export type IWidgetChatRequest = z.infer<typeof widgetChatRequestSchema>;
