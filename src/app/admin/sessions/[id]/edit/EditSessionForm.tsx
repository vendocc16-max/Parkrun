'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateSession, type SessionFormData } from '../../actions'
import { parseOsmUrl } from '@/lib/osm'
import type { Session } from '../../../../../../supabase/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string(),
  location: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  event_date: z.string().min(1, 'Event date is required'),
  registration_opens_at: z.string(),
  registration_closes_at: z.string(),
  capacity: z.string().min(1, 'Capacity is required'),
  waitlist_enabled: z.boolean(),
  pricing_info: z.string(),
  notes: z.string(),
  status: z.enum(['draft', 'published', 'full', 'closed', 'cancelled']),
})

type FormValues = z.infer<typeof schema>

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16)
}

export function EditSessionForm({ session }: { session: Session }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [osmUrl, setOsmUrl] = useState('')
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: session.title,
      slug: session.slug,
      description: session.description ?? '',
      location: session.location ?? '',
      latitude: session.latitude != null ? String(session.latitude) : '',
      longitude: session.longitude != null ? String(session.longitude) : '',
      event_date: toDatetimeLocal(session.event_date),
      registration_opens_at: toDatetimeLocal(session.registration_opens_at),
      registration_closes_at: toDatetimeLocal(session.registration_closes_at),
      capacity: String(session.capacity),
      waitlist_enabled: session.waitlist_enabled,
      pricing_info: session.pricing_info ?? '',
      notes: session.notes ?? '',
      status: session.status,
    },
  })

  const onSubmit = async (data: FormValues) => {
    setServerError(null)
    const result = await updateSession(session.id, data as SessionFormData)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-lg border border-park-border bg-park-white p-6 shadow-sm space-y-6"
    >
      {serverError && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-park-dark mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('title')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('slug')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">Location</label>
          <input
            type="text"
            {...register('location')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
        </div>

        <div className="sm:col-span-2 rounded-md border border-dashed border-park-border bg-park-cream/40 p-4">
          <p className="text-sm font-medium text-park-dark">Karta</p>
          <p className="mt-1 text-xs text-park-muted">
            Klistra in en länk från openstreetmap.org (t.ex.{' '}
            <code>#map=17/59.310975/18.074643</code>) och klicka &quot;Fyll i&quot; — eller skriv
            koordinaterna direkt.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={osmUrl}
              onChange={(e) => setOsmUrl(e.target.value)}
              placeholder="https://www.openstreetmap.org/#map=17/59.310975/18.074643"
              className="flex-1 rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
            />
            <button
              type="button"
              onClick={() => {
                const coords = parseOsmUrl(osmUrl)
                if (!coords) {
                  setServerError('Kunde inte tolka OpenStreetMap-länken.')
                  return
                }
                setServerError(null)
                setValue('latitude', String(coords.lat), { shouldDirty: true })
                setValue('longitude', String(coords.lng), { shouldDirty: true })
              }}
              className="rounded-md border border-park-border bg-park-white px-4 py-2 text-sm font-semibold text-park-dark hover:bg-park-cream"
            >
              Fyll i
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-park-muted mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                {...register('latitude')}
                className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-park-muted mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                {...register('longitude')}
                className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
              />
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-park-dark mb-1">Description</label>
          <textarea
            rows={3}
            {...register('description')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">
            Event date <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            {...register('event_date')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
          {errors.event_date && (
            <p className="mt-1 text-xs text-red-600">{errors.event_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">
            Capacity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            {...register('capacity')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
          {errors.capacity && (
            <p className="mt-1 text-xs text-red-600">{errors.capacity.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">
            Registration opens
          </label>
          <input
            type="datetime-local"
            {...register('registration_opens_at')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">
            Registration closes
          </label>
          <input
            type="datetime-local"
            {...register('registration_closes_at')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-park-dark mb-1">Status</label>
          <select
            {...register('status')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
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
            className="h-4 w-4 rounded border-park-border text-park-green focus:ring-park-green/20"
          />
          <label htmlFor="waitlist_enabled" className="text-sm font-medium text-park-dark">
            Enable waitlist
          </label>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-park-dark mb-1">Pricing info</label>
          <input
            type="text"
            {...register('pricing_info')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-park-dark mb-1">
            Internal notes
          </label>
          <textarea
            rows={2}
            {...register('notes')}
            className="w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-park-green px-5 py-2 text-sm font-semibold text-white hover:bg-park-dark transition-[background-color,border-color,color,box-shadow,opacity] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </button>
        <a
          href={`/admin/sessions/${session.id}`}
          className="rounded-md border border-park-border px-5 py-2 text-sm font-semibold text-park-dark hover:bg-park-cream transition-[background-color,border-color,color,box-shadow,opacity]"
        >
          Cancel
        </a>
      </div>
    </form>
  )
}
