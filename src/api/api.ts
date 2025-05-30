import { EXPECTED_SHEET_HEADERS, FILTERABLE_HEADERS } from "../constants/constants";

const validateHeaders = (keys: string[]) => {
  const expectedHeaders = EXPECTED_SHEET_HEADERS;
  expectedHeaders.forEach((header, index) => {
    if (header.toLowerCase().trim() !== keys[index].toLowerCase().trim()) {
      throw new Error(`Header mismatch: expected ${header} but got ${keys[index]} at column ${index + 1}`);
    }
  });
}

const KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ?? process.env.VITE_GOOGLE_SHEETS_API_KEY;

const getDataFromApi = async (): Promise<Database> => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1u3Z_-eD1AtncpZCrd0EEQTyFDni2AhSp2eId2w5lqog/values/Active?alt=json&key=${KEY}`);
  const data = await response.json() as {
    values: string[][]
  };

  const keys = data.values[0];
  validateHeaders(keys);

  const values = data.values.slice(1);

  const formatted: Entry[] = values.map((value) => ({
    id: `${Date.now() + Math.random()}`,
    filename: value[0],
    videoUrl: value[1],
    memory: value[2],
    year: value[3],
    category: value[4],
    name: value[5],
    stand: value[6],
    section: value[7],
    block: value[8],
  }));

  return formatted;
}

let cachedData: Database | null = null;
export const getDatabase = async (): Promise<Database> => {
  if (cachedData) {
    return cachedData;
  }

  const database = await getDataFromApi();
  const entriesWithVideos = database.filter((entry) => entry.filename);
  cachedData = entriesWithVideos;
  return entriesWithVideos;
}

export const getFilters = (): Filter[] => {
  return Object.values(FILTERABLE_HEADERS) as unknown as Filter[];
}

export const getOptionsByFilter = async (filter: Filter): Promise<string[]> => {
  const database = await getDatabase();

  const options = database.map((entry) => entry[filter]);
  const uniqueOptions = Array.from(new Set(options));
  return uniqueOptions;
}
