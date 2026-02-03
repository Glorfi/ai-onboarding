import type { z } from 'zod';
import type { widgetEmailRequestSchema } from '../../../validation';

export type IWidgetEmailRequest = z.infer<typeof widgetEmailRequestSchema>;
