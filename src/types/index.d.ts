import type { FILTERABLE_HEADERS } from "../constants/constants"

declare global {
  interface Window {
    modelRotation: Euler
  }

  type Entry = {
    id: string
    name: string
    filename: string
    rawFilename: string
    //videoUrl: string
    memory: string
    year: string
    category: string
    stand: string
    section: string
    block: string
    thumbnail: {
      src: string
      width: number
      height: number
    }
  }

  type Database = Entry[]

  type Filter = typeof FILTERABLE_HEADERS[keyof typeof FILTERABLE_HEADERS]

  type ActiveFilters = Partial<Record<Filter, string | undefined>>

  type View = 'grid' | 'space'

  type Tier = 'lower' | 'middle' | 'upper'
  type Section = 'topSemicircle' | 'leftStraight' | 'bottomSemicircle' | 'rightStraight'
}


export type { }