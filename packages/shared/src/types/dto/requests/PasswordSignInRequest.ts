import { z } from 'zod';
import { signInInputSchema } from '../../../validation';

export type IPasswordSignInRequest = z.infer<typeof signInInputSchema>;
