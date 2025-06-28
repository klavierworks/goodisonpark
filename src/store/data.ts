import { atom } from 'nanostores'
import { getFilters } from '../api/utils';
import { $currentlyViewingSpace, $currentView, $selectedEntry } from './ui';
import { select } from 'three/tsl';

export const $allEntries = atom<Entry[]>([])
export const $entries = atom<Entry[]>([])
export const $focusedEntry = atom<string | null>(null);

export const $activeFilters = atom<ActiveFilters>({})

export const $canvasOffset = atom({ x: 0, y: 0 });

export const $isLoading = atom(false);

const setUrlSearchParams = () => {
  if (typeof window === 'undefined') {
    console.warn('setUrlSearchParams called on server side, skipping.');
    return;
  }
  const searchParams = new URLSearchParams(window.location.search);
  
  const focusedEntry = $focusedEntry.get();
  if (focusedEntry) {
    searchParams.set('focus', focusedEntry);
    console.log(`Focused entry set: ${focusedEntry}`);
  } else {
    searchParams.delete('focus');
    console.log('Focused entry cleared');
  }

  const selectedEntry = $selectedEntry.get();
  if (selectedEntry) {
    searchParams.set('selectedEntry', selectedEntry);
    console.log(`Selected entry set: ${selectedEntry}`);
  } else {
    searchParams.delete('selectedEntry');
    console.log('Selected entry cleared');
  }

  const currentView = $currentView.get();
  if (currentView) {
    searchParams.set('view', currentView);
    console.log(`Current view set: ${currentView}`);
  } else {
    searchParams.delete('view');
    console.log('Current view cleared');
  }

  const filters = getFilters();
  const activeFilters = $activeFilters.get();
  filters.forEach((key) => {
    const activeValue = activeFilters[key as keyof ActiveFilters];
    if (activeValue) {
      searchParams.set(key, activeValue);
      console.log(`Filter set: ${key} = ${activeValue}`);
    } else {
      searchParams.delete(key);
      console.log(`Filter cleared: ${key}`);
    }
  });

  const hasSearchParams = Array.from(searchParams.entries()).length > 0;
  if (hasSearchParams) {
    window.history.replaceState({}, '', `?${searchParams.toString()}`);
  } else {
    window.history.replaceState({}, '', window.location.pathname);
  }

  console.log('URL search params updated:', searchParams.toString());
}

const getUrlSearchParams = () => {
  if (typeof window === 'undefined') {
    console.warn('getUrlSearchParams called on server side, skipping.');
    return;
  }
  const searchParams = new URLSearchParams(window.location.search);
  
  const focus = searchParams.get('focus');
  if (focus) {
    $focusedEntry.set(focus);
    console.log(`Focused entry loaded: ${focus}`);
  } else {
    $focusedEntry.set(null);
    console.log('No focused entry found in URL');
  }

  const filters: ActiveFilters = {};
  for (const [key, value] of searchParams.entries()) {
    if (!getFilters().includes(key as keyof ActiveFilters)) {
      continue;
    }
    if (key !== 'focus') {
      filters[key as keyof ActiveFilters] = value;
      console.log(`Filter loaded from URL: ${key} = ${value}`);
    }
  }
  
  const view = searchParams.get('view');
  if (view) {
    $currentView.set(view as View);
    $currentlyViewingSpace.set(view as View);
    console.log(`View loaded from URL: ${view}`);
  }

  const selectedEntry = searchParams.get('selectedEntry');
  if (selectedEntry) {
    $selectedEntry.set(selectedEntry);
    console.log(`Selected entry loaded from URL: ${selectedEntry}`);
  }
  
  $activeFilters.set(filters);
}

getUrlSearchParams();
$focusedEntry.subscribe(() => {
  setUrlSearchParams();
})

const filterAllEntries = () => {
  const filterEntries = Object.entries($activeFilters.get())
    .filter(([_, value]) => value !== undefined);

  const filteredEntries = $allEntries.get().filter((entry) => filterEntries.every(([key, value]) => {
    const entryValue = entry[key as keyof Entry] ?? '';
    return entryValue.toLowerCase() === value.toLowerCase();
  }));

  $entries.set(filteredEntries)
}


$activeFilters.subscribe(() => {
  filterAllEntries();
  setUrlSearchParams();
});

export const setEntries = (parsedEntries: Entry[]) => {
  $allEntries.set(parsedEntries)
  filterAllEntries();
}


export const getOptionsByFilter = (filter: Filter): string[] => {
  const entries = $entries.get();

  const options = entries.map((entry) => entry[filter]);
  const uniqueOptionsArray: Record<string, string> = {}
  options.forEach((option) => {
    const cleanOption = option.toLowerCase().trim();
    if (!uniqueOptionsArray[cleanOption]) {
      uniqueOptionsArray[cleanOption] = option;
    }
  });
  const uniqueOptions = Object.values(uniqueOptionsArray);
  const sortedOptions = uniqueOptions.sort((a, b) => {
    const aName = a.toLowerCase();
    const bName = b.toLowerCase();
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });
  return sortedOptions;
}
