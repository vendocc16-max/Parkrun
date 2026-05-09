'use client'

import { useMemo, useState, useTransition, type ChangeEvent } from 'react'
import {
  CONTENT_KEYS,
  DEFAULT_SITE_CONTENT,
  type SiteContentKey,
  type SiteContentMap,
  type SiteContentPayload,
} from '@/lib/site-content-schema'
import { updateSiteContent } from './actions'

type EditableValue =
  | string
  | { [key: string]: EditableValue }
  | EditableValue[]

type EditableRecord = { [key: string]: EditableValue }

const AREA_LABELS: Record<SiteContentKey, string> = {
  layout: 'Layout',
  home: 'Home',
  sessions: 'Sessions',
  privacy: 'Privacy',
  terms: 'Terms',
}

const TEXTAREA_FIELDS = new Set([
  'body',
  'description',
  'intro',
  'headline',
  'metadataDescription',
  'ctaBody',
  'contactBody',
  'fetchErrorBody',
  'emptyBody',
])

function labelFor(field: string) {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function cloneDefaultItem(items: EditableValue[]) {
  const first = items[0]
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    return Object.fromEntries(Object.keys(first).map((key) => [key, ''])) as EditableRecord
  }
  return ''
}

function updateAtPath(
  value: EditableValue,
  path: (string | number)[],
  nextValue: EditableValue
): EditableValue {
  if (path.length === 0) return nextValue

  const [head, ...rest] = path
  if (Array.isArray(value) && typeof head === 'number') {
    return value.map((item, index) =>
      index === head ? updateAtPath(item, rest, nextValue) : item
    )
  }

  if (value && typeof value === 'object' && !Array.isArray(value) && typeof head === 'string') {
    return {
      ...value,
      [head]: updateAtPath(value[head], rest, nextValue),
    }
  }

  return value
}

function removeAtPath(
  value: EditableValue,
  path: (string | number)[],
  indexToRemove: number
): EditableValue {
  const target = path.reduce<EditableValue | undefined>((current, segment) => {
    if (current === undefined) return undefined
    if (Array.isArray(current) && typeof segment === 'number') return current[segment]
    if (current && typeof current === 'object' && !Array.isArray(current) && typeof segment === 'string') {
      return current[segment]
    }
    return undefined
  }, value)

  if (!Array.isArray(target) || target.length <= 1) return value

  return updateAtPath(
    value,
    path,
    target.filter((_, index) => index !== indexToRemove)
  )
}

function addAtPath(value: EditableValue, path: (string | number)[]): EditableValue {
  const target = path.reduce<EditableValue | undefined>((current, segment) => {
    if (current === undefined) return undefined
    if (Array.isArray(current) && typeof segment === 'number') return current[segment]
    if (current && typeof current === 'object' && !Array.isArray(current) && typeof segment === 'string') {
      return current[segment]
    }
    return undefined
  }, value)

  if (!Array.isArray(target)) return value
  return updateAtPath(value, path, [...target, cloneDefaultItem(target)])
}

function FieldEditor({
  name,
  value,
  path,
  onChange,
  onRemove,
  onAdd,
}: {
  name: string
  value: EditableValue
  path: (string | number)[]
  onChange: (path: (string | number)[], value: EditableValue) => void
  onRemove: (path: (string | number)[], index: number) => void
  onAdd: (path: (string | number)[]) => void
}) {
  if (typeof value === 'string') {
    const commonProps = {
      value,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        onChange(path, event.target.value),
      className:
        'w-full rounded-md border border-park-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-park-green/20',
    }

    return (
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-park-dark">{labelFor(name)}</span>
        {TEXTAREA_FIELDS.has(name) ? (
          <textarea rows={3} {...commonProps} />
        ) : (
          <input type={name.toLowerCase().includes('email') ? 'email' : 'text'} {...commonProps} />
        )}
      </label>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div className="rounded-lg border border-park-border bg-park-cream p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-park-dark">{labelFor(name)}</h3>
          <button
            type="button"
            onClick={() => onAdd(path)}
            className="rounded-md border border-park-border bg-park-white px-3 py-1.5 text-xs font-semibold text-park-dark hover:bg-park-lime"
          >
            Add
          </button>
        </div>
        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className="rounded-md border border-park-border bg-park-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-park-muted/70">
                  Item {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(path, index)}
                  disabled={value.length <= 1}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
              <FieldEditor
                name={`${name} ${index + 1}`}
                value={item}
                path={[...path, index]}
                onChange={onChange}
                onRemove={onRemove}
                onAdd={onAdd}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Object.entries(value).map(([field, fieldValue]) => (
        <div
          key={field}
          className={
            typeof fieldValue === 'string' && !TEXTAREA_FIELDS.has(field)
              ? ''
              : 'sm:col-span-2'
          }
        >
          <FieldEditor
            name={field}
            value={fieldValue}
            path={[...path, field]}
            onChange={onChange}
            onRemove={onRemove}
            onAdd={onAdd}
          />
        </div>
      ))}
    </div>
  )
}

export function ContentEditor({ initialContent }: { initialContent: SiteContentMap }) {
  const [selectedKey, setSelectedKey] = useState<SiteContentKey>('home')
  const [content, setContent] = useState<SiteContentMap>(initialContent)
  const [savedContent, setSavedContent] = useState<SiteContentMap>(initialContent)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const selectedContent = content[selectedKey] as EditableRecord

  const hasChanges = useMemo(
    () =>
      JSON.stringify(content[selectedKey]) !==
      JSON.stringify(savedContent[selectedKey]),
    [content, savedContent, selectedKey]
  )

  const handleChange = (path: (string | number)[], value: EditableValue) => {
    setResult(null)
    setContent((current) => ({
      ...current,
      [selectedKey]: updateAtPath(current[selectedKey] as EditableValue, path, value),
    }))
  }

  const handleRemove = (path: (string | number)[], index: number) => {
    setResult(null)
    setContent((current) => ({
      ...current,
      [selectedKey]: removeAtPath(current[selectedKey] as EditableValue, path, index),
    }))
  }

  const handleAdd = (path: (string | number)[]) => {
    setResult(null)
    setContent((current) => ({
      ...current,
      [selectedKey]: addAtPath(current[selectedKey] as EditableValue, path),
    }))
  }

  const handleReset = () => {
    setResult(null)
    setContent((current) => ({
      ...current,
      [selectedKey]: DEFAULT_SITE_CONTENT[selectedKey],
    }))
  }

  const handleSave = () => {
    setResult(null)
    startTransition(async () => {
      const response = await updateSiteContent(selectedKey, content[selectedKey] as SiteContentPayload)
      if (response.error) {
        setResult({ error: response.error })
      } else {
        setSavedContent((current) => ({
          ...current,
          [selectedKey]: content[selectedKey],
        }))
        setResult({ ok: true })
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[12rem_1fr]">
      <div className="rounded-lg border border-park-border bg-park-white p-2 shadow-sm lg:self-start">
        {CONTENT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setSelectedKey(key)
              setResult(null)
            }}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm font-medium ${
              selectedKey === key
                ? 'bg-park-lime text-park-dark'
                : 'text-park-muted hover:bg-park-cream hover:text-park-dark'
            }`}
          >
            {AREA_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-park-border bg-park-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col justify-between gap-4 border-b border-park-border pb-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-park-dark">{AREA_LABELS[selectedKey]}</h2>
            <p className="mt-1 text-sm text-park-muted">
              Changes are published immediately when saved.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-md border border-park-border px-4 py-2 text-sm font-semibold text-park-dark hover:bg-park-cream"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="rounded-md bg-park-green px-5 py-2 text-sm font-semibold text-white hover:bg-park-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {result?.error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {result.error}
          </div>
        )}
        {result?.ok && (
          <div className="mb-5 rounded-md border border-park-green/20 bg-park-lime px-4 py-3 text-sm text-park-green">
            Content saved.
          </div>
        )}

        <div className="space-y-5">
          <FieldEditor
            name={selectedKey}
            value={selectedContent}
            path={[]}
            onChange={handleChange}
            onRemove={handleRemove}
            onAdd={handleAdd}
          />
        </div>
      </div>
    </div>
  )
}
