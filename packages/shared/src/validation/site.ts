import { z } from 'zod';
import { DEFAULTS } from '../constants';

export const createSiteInputSchema = z.object({
  url: z.string().url('Invalid URL format'),
  additionalUrls: z
    .array(z.string().url('Invalid URL format'))
    .max(
      DEFAULTS.MAX_ADDITIONAL_URLS,
      `Maximum ${DEFAULTS.MAX_ADDITIONAL_URLS} additional URLs allowed`
    )
    .optional(),
  name: z.string().max(100).optional(),
});

export const updateSiteInputSchema = z.object({
  name: z.string().max(100).optional(),
  triggerDelaySeconds: z.number().int().min(0).max(60).optional(),
});

export type ICreateSiteInput = z.infer<typeof createSiteInputSchema>;
export type IUpdateSiteInput = z.infer<typeof updateSiteInputSchema>;
