export const FILTERABLE_HEADERS = {
  year: 'year',
  memory: 'memory',
  name: 'name',
  category: 'category',
} as const;

export const EXPECTED_SHEET_HEADERS = [
  'filename',
  'link',
  'memory',
  'year',
  'categories',
  'name',
  'stand',
  'section',
  'block',
] as const