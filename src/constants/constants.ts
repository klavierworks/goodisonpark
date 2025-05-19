export const FILTERABLE_HEADERS = {
  memory: 'memory',
  year: 'year',
  category: 'category',
  stand: 'stand',
  section: 'section',
  block: 'block',
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