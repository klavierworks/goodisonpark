import { atom } from 'nanostores'

export const $allEntries = atom<Entry[]>([])
export const $entries = atom<Entry[]>([])

$entries.subscribe((entries) => {
  console.log('Entries updated:', entries)
});

export const $activeFilters = atom<ActiveFilters>({})

if (typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  let newFilters: ActiveFilters = {};
  urlParams.forEach((value, key) => {
    if (value) {
      newFilters[key as keyof ActiveFilters] = value;
      console.log(`Filter loaded from URL: ${key} = ${value}.`);
    }
  });
  $activeFilters.set(newFilters);
}

const filterAllEntries = () => {
  const filterEntries = Object.entries($activeFilters.get()).filter(([_, value]) => value !== undefined);

  const filteredEntries = $allEntries.get().filter((entry) => filterEntries.every(([key, value]) => {
    const entryValue = entry[key as keyof Entry] ?? '';
    return entryValue.toLowerCase() === value.toLowerCase();
  }));

  $entries.set(filteredEntries)
}

export const setEntries = (entriesJson: string) => {
  const parsedEntries = JSON.parse(entriesJson) as Entry[]
  $allEntries.set(parsedEntries)
  filterAllEntries();
}

$activeFilters.subscribe((activeFilters) => {
  const filterEntries = Object.entries(activeFilters).filter(([_, value]) => value !== undefined);

  const searchParams = new URLSearchParams();
  filterEntries.forEach(([key, value]) => {
    searchParams.set(key, value);
    console.log(`Filter set: ${key} = ${value}`);
  });
  console.log('Clearing URL search params', filterEntries, activeFilters);
  window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

  filterAllEntries();
});

export const $isFiltering = atom(false);


export const $canvasOffset = atom({ x: 0, y: 0 });