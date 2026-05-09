'use client'

import dynamic from 'next/dynamic'

const EventMap = dynamic(() => import('./event-map'), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-lg border border-park-border bg-park-cream" />
  ),
})

type Props = {
  lat: number
  lng: number
  label?: string
  zoom?: number
  className?: string
}

export default function EventMapLoader(props: Props) {
  return <EventMap {...props} />
}
