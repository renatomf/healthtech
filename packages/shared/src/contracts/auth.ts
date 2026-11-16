import { z } from 'zod';

export const role = z.enum(['CLINIC', 'PATIENT']);
export type Role = z.infer<typeof role>;

export const loginRequest = z.strictObject({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});
export type LoginRequest = z.infer<typeof loginRequest>;

export const userResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role,
});
export type UserResponse = z.infer<typeof userResponse>;
