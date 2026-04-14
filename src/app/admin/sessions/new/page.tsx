'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSession, type SessionFormData } from '../actions'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string(),
  location: z.string(),
  event_date: z.string().min(1, 'Event date is required'),
  registration_opens_at: z.string(),
  registration_closes_at: z.string(),
  capacity: z.string().min(1, 'Capacity is required'),
  waitlist_enabled: z.boolean(),
  pricing_info: z.string(),
  notes: z.string(),
  status: z.enum(['draft', 'published', 'full', 'closed', 'cancelled']),
  promotion_rank: z.string(),
})

type FormValues = z.infer<typeof schema>

export default function NewSessionPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: 'draft',
      waitlist_enabled: false,
      description: '',
      location: '',
      pricing_info: '',
      notes: '',
      registration_opens_at: '',
      registration_closes_at: '',
      promotion_rank: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    const result = await createSession(data as SessionFormData)
    if (result?.error) setServerError(result.error)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">New session</h1>
        <p className="text-gray-500 mt-1">Create a new Parkrun event session.</p>
      </div>

      {serverError && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-6"
      >
        <SessionFormFields register={register} errors={errors} />

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-green-700 px-5 py-2 text-sm font-semibold text-white hover:bg-green-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating…' : 'Create session'}
          </button>
          <a
            href="/admin/sessions"
            className="rounded-md border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}

type FieldErrors = Partial<Record<keyof FormValues, { message?: string }>>

function SessionFormFields({
  register,
  errors,
  defaults,
}: {
  register: ReturnType<typeof useForm<FormValues>>['register']
  errors: FieldErrors
  defaults?: Partial<FormValues>
}) {
  void defaults
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('slug')}
            placeholder="morning-5k-city-park"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            {...register('location')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            {...register('description')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            {...register('event_date')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {errors.event_date && (
            <p className="mt-1 text-xs text-red-600">{errors.event_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            {...register('capacity')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          {errors.capacity && (
            <p className="mt-1 text-xs text-red-600">{errors.capacity.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration opens
          </label>
          <input
            type="datetime-local"
            {...register('registration_opens_at')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration closes
          </label>
          <input
            type="datetime-local"
            {...register('registration_closes_at')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="full">Full</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            id="waitlist_enabled"
            type="checkbox"
            {...register('waitlist_enabled')}
            className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
          />
          <label htmlFor="waitlist_enabled" className="text-sm font-medium text-gray-700">
            Enable waitlist
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pricing info</label>
          <input
            type="text"
            {...register('pricing_info')}
            placeholder="e.g. Free"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Internal notes
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Promotion rank
          </label>
          <input
            type="number"
            min={1}
            {...register('promotion_rank')}
            placeholder="e.g. 1"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <p className="mt-1 text-xs text-gray-500">
            1 = visas i hero-sektionen på startsidan. Lämna tomt för ingen.
          </p>
        </div>
      </div>
    </>
  )
}

export { SessionFormFields }
