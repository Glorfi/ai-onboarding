import type { z } from 'zod';
import type { widgetRatingRequestSchema } from '../../../validation';

export type IWidgetRatingRequest = z.infer<typeof widgetRatingRequestSchema>;
