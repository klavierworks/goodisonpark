type EntryWithCount = Entry & { count: number };

export const createColumns = (entries: EntryWithCount[]) => {
  const columns = entries.length > 0 ? Math.ceil(Math.sqrt(entries.length)) : 1;

  const shuffledEntries = entries.sort(() => Math.random() - 0.5).sort(() => Math.random() - 0.5);

  const columnedEntries: EntryWithCount[][] = Array.from({ length: columns }, () => []);
  shuffledEntries.forEach((entry, index) => {
    columnedEntries[index % columns].push(entry);
  });

  return columnedEntries;
}