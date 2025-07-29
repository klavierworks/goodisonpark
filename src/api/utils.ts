import { FILTERABLE_HEADERS } from "../constants/constants";

export const getFilterLabel = (filter: Filter): string => {
  switch (filter) {
    case 'year':
      return 'Year';
    case 'memory':
      return 'Memory';
    case 'name':
      return 'Player';
    case 'category':
      return 'Event';
    default:
      return 'Unknown';
  }
}

export const getFilters = (): Filter[] => {
  return Object.values(FILTERABLE_HEADERS) as unknown as Filter[];
}