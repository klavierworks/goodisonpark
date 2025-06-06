export type EntryWithCount = Entry & { count: number };

export const getEntriesWithCount = (entries: readonly Entry[]): EntryWithCount[] => {
  let memoryCounts = new Map<string, number>();
  entries.forEach(entry => {
    const memory = entry.memory;
    if (memoryCounts.has(memory)) {
      memoryCounts.set(memory, memoryCounts.get(memory)! + 1);
    } else {
      memoryCounts.set(memory, 1);
    }
  });

  const entriesWithCount = entries.map(entry => {
    const memory = entry.memory;
    const count = memoryCounts.get(memory);
    return {
      ...entry,
      count: count ?? 0,
    };
  });
  return entriesWithCount;
}
export const createColumns = (entries: readonly Entry[]) => {
  const columns = entries.length > 0 ? Math.ceil(Math.sqrt(entries.length)) : 1;

  const shuffledEntries = entries.sort(() => Math.random() - 0.5).sort(() => Math.random() - 0.5);

  const columnedEntries: Entry[][] = Array.from({ length: columns }, () => []);
  shuffledEntries.forEach((entry, index) => {
    columnedEntries[index % columns].push(entry);
  });

  return columnedEntries;
}