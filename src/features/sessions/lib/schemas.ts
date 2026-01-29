import { z } from 'zod'

/**
 * New session form validation schema.
 */
export const newSessionFormSchema = z.object({
  storeId: z
    .string()
    .uuid('Select a store')
    .optional()
    .or(z.literal('')),
  gameType: z.enum(['cash', 'tournament']),
  cashGameId: z.string().uuid().optional().or(z.literal('')),
  tournamentId: z.string().uuid().optional().or(z.literal('')),
  sessionDate: z.coerce.date({ required_error: 'Enter a date' }),
  startTime: z.string().min(1, 'Enter start time'),
  endTime: z.string().optional(),
  buyIn: z
    .number({ required_error: 'Enter buy-in amount' })
    .int('Buy-in must be an integer')
    .positive('Buy-in must be at least 1'),
  cashOut: z
    .number({ required_error: 'Enter cash-out amount' })
    .int('Cash-out must be an integer')
    .min(0, 'Cash-out must be at least 0'),
  notes: z.string().optional(),
})

/**
 * Inferred type from the form schema.
 */
export type NewSessionFormInput = z.infer<typeof newSessionFormSchema>
