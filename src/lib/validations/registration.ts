import { z } from 'zod'

export const guardianSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255),
  phone: z.string().max(30).optional(),
  emergencyContact: z.string().max(200).optional(),
})

export const participantSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().optional(),
  isChild: z.boolean(),
  medicalNotes: z.string().max(500).optional(),
})

export const registrationSchema = z.object({
  sessionId: z.string().uuid(),
  guardian: guardianSchema,
  participants: z
    .array(participantSchema)
    .min(1, 'At least one participant is required')
    .max(5),
  consentTerms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  consentPrivacy: z
    .boolean()
    .refine((val) => val === true, 'You must accept the privacy policy'),
  consentChildRegistration: z.boolean().optional(),
})

export type RegistrationInput = z.infer<typeof registrationSchema>
export type GuardianInput = z.infer<typeof guardianSchema>
export type ParticipantInput = z.infer<typeof participantSchema>
