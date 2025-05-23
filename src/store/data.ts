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

  const filteredEntries = $allEntries.get().filter((entry) => filterEntries.every(([key, value]) => {
    const entryValue = entry[key as keyof Entry] ?? '';
    return entryValue.toLowerCase() === value.toLowerCase();
  }));

  $entries.set(filteredEntries)
});