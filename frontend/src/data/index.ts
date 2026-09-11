import type { CultureDataItem, StateCultureData } from './types'
import { northData } from './north'
import { southData } from './south'
import { eastData } from './east'
import { centralData } from './central'
import { westData } from './west'
import { northeastData } from './northeast'
import { getStateImages } from './state-images'
import { OFFICIAL_SOURCES } from './types'

export type { StateCultureData, CultureDataItem } from './types'
export { OFFICIAL_SOURCES } from './types'

function normName(s: string): string {
  return s.toLowerCase().replace(/[(),.'&-]/g, ' ').replace(/\s+/g, ' ').trim()
}

/** Ensure every ritual/tradition entry carries source attribution. */
function withDefaults(data: StateCultureData): StateCultureData {
  return {
    ...data,
    culture: data.culture.map((c) => {
      if (c.sourceName || c.source) return c
      return { ...c, sourceName: OFFICIAL_SOURCES.indianCulture }
    }),
  }
}

/** Attach licensed photographs from ./state-images.ts onto the curated records. */
function withImages(data: StateCultureData): StateCultureData {
  const imgs = getStateImages(data.code)
  if (!imgs) return data
  const cityMap = new Map(imgs.cities.map((c) => [normName(c.name), c]))
  const cities: CultureDataItem[] = data.cities.map((c) => {
    const m = cityMap.get(normName(c.name))
    return m ? { ...c, image: m.url || undefined, imageCredit: m.credit || undefined, imagePage: m.page || undefined } : c
  })
  return {
    ...data,
    image: imgs.url || undefined,
    imageCredit: imgs.credit || undefined,
    imagePage: imgs.page || undefined,
    cities,
  }
}

/** Every curated state record, keyed by ISO state code (28 states). */
export const STATE_DATA: Record<string, StateCultureData> = Object.fromEntries(
  [...northData, ...southData, ...eastData, ...centralData, ...westData, ...northeastData].map(
    (s) => [s.code, withImages(withDefaults(s))],
  ),
)

/** Lookup helpers used by the map side panel. */
export function getStateData(code?: string): StateCultureData | undefined {
  return code ? STATE_DATA[code.toUpperCase()] : undefined
}

export function getStateDataByRegion(region: string): StateCultureData[] {
  return Object.values(STATE_DATA).filter((s) => s.region === region)
}