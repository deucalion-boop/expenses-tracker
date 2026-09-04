import { z } from 'zod'

export const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']),
  status: z.enum(['active', 'suspended']),
})

export const adminSettingsSchema = z.object({
  allowRegistration: z.boolean(),
  supportEmail: z.string().trim().email('Enter a valid support email').or(z.literal('')),
})
