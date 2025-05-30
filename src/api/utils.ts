export const getFilterLabel = (filter: Filter): string => {
  switch (filter) {
    case 'year':
      return 'Year';
    case 'memory':
      return 'Memory';
    case 'name':
      return 'Icon';
    case 'category':
      return 'Event';
    default:
      return 'Unknown';
  }
}