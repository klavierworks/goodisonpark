import { atom } from 'nanostores'

export const $allEntries = atom<Entry[]>([])
export const $entries = atom<Entry[]>([])

$entries.subscribe((entries) => {
  console.log('Entries updated:', entries)
});

export const $activeFilters = atom<ActiveFilters>({})

export const setEntries = (entriesJson: string) => {
  const parsedEntries = JSON.parse(entriesJson) as Entry[]
  $entries.set(parsedEntries)
  $allEntries.set(parsedEntries)
}

$activeFilters.subscribe((activeFilters) => {
  const filterEntries = Object.entries(activeFilters).filter(([_, value]) => value !== undefined);

  const searchParams = new URLSearchParams();
  filterEntries.forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  window.history.replaceState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

  const filteredEntries = $allEntries.get().filter((entry) => filterEntries.every(([key, value]) => {
    const entryValue = entry[key as keyof Entry] ?? '';
    return entryValue.toLowerCase() === value.toLowerCase();
  }));

  $entries.set(filteredEntries)
});

export const $isFiltering = atom(false);


export const $canvasOffset = atom({ x: 0, y: 0 });