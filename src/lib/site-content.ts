import { createClient } from '@/lib/supabase/server'
import {
  CONTENT_KEYS,
  DEFAULT_SITE_CONTENT,
  parseSiteContent,
  type SiteContentKey,
  type SiteContentMap,
} from '@/lib/site-content-schema'

export async function getSiteContent<K extends SiteContentKey>(
  key: K
): Promise<SiteContentMap[K]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('site_content')
      .select('payload')
      .eq('key', key)
      .maybeSingle()

    if (error || !data) return DEFAULT_SITE_CONTENT[key]
    return parseSiteContent(key, data.payload)
  } catch {
    return DEFAULT_SITE_CONTENT[key]
  }
}

export async function getAllSiteContent(): Promise<SiteContentMap> {
  const entries = await Promise.all(
    CONTENT_KEYS.map(async (key) => [key, await getSiteContent(key)] as const)
  )

  return Object.fromEntries(entries) as SiteContentMap
}
