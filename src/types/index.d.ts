import type { FILTERABLE_HEADERS } from "../constants/constants"

declare global {
  interface Window {
    modelRotation: Euler
  }

  type Entry = {
    id: string
    name: string
    filename: string
    videoUrl: string
    memory: string
    year: string
    category: string
    stand: string
    section: string
    block: string
  }

  type Database = Entry[]

  type Filter = typeof FILTERABLE_HEADERS[keyof typeof FILTERABLE_HEADERS]

  type ActiveFilters = Partial<Record<Filter, string | undefined>>
}


export type { }