export type OsmCoords = { lat: number; lng: number }

export function parseOsmUrl(input: string): OsmCoords | null {
  if (!input) return null
  const trimmed = input.trim()

  const hashMatch = trimmed.match(/[#&?]map=-?\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/)
  if (hashMatch) {
    return toCoords(hashMatch[1], hashMatch[2])
  }

  const queryMatch = trimmed.match(/[?&]mlat=(-?\d+(?:\.\d+)?)[^#]*[?&]mlon=(-?\d+(?:\.\d+)?)/)
  if (queryMatch) {
    return toCoords(queryMatch[1], queryMatch[2])
  }

  const pairMatch = trimmed.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (pairMatch) {
    return toCoords(pairMatch[1], pairMatch[2])
  }

  return null
}

function toCoords(latRaw: string, lngRaw: string): OsmCoords | null {
  const lat = Number(latRaw)
  const lng = Number(lngRaw)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}
