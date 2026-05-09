'use client'

import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

L.Icon.Default.mergeOptions({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

type Props = {
  lat: number
  lng: number
  label?: string
  zoom?: number
  className?: string
}

export default function EventMap({ lat, lng, label, zoom = 15, className }: Props) {
  // react-leaflet maps don't auto-resize when their container layout settles.
  useEffect(() => {
    const id = window.setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div
      className={
        className ??
        'h-72 w-full overflow-hidden rounded-lg border border-park-border'
      }
    >
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>{label && <Popup>{label}</Popup>}</Marker>
      </MapContainer>
    </div>
  )
}
