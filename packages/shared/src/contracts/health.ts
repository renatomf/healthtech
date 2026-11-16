import { z } from 'zod';

export const healthLiveResponse = z.object({ status: z.literal('ok') }).strict();

export type HealthLiveResponse = z.infer<typeof healthLiveResponse>;
