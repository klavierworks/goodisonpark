import { getImage, Image } from "astro:assets";
import { EXPECTED_SHEET_HEADERS } from "../constants/constants";

const validateHeaders = (keys: string[]) => {
  const expectedHeaders = EXPECTED_SHEET_HEADERS;
  expectedHeaders.forEach((header, index) => {
    if (header.toLowerCase().trim() !== keys[index].toLowerCase().trim()) {
      throw new Error(`Header mismatch: expected ${header} but got ${keys[index]} at column ${index + 1}`);
    }
  });
}

const KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY ?? process.env.VITE_GOOGLE_SHEETS_API_KEY;

const getDataFromApi = async (keepVideoUrls = false): Promise<Database> => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1u3Z_-eD1AtncpZCrd0EEQTyFDni2AhSp2eId2w5lqog/values/Active?alt=json&key=${KEY}`);
  const data = await response.json() as {
    values: string[][]
  };

  const keys = data.values[0];
  validateHeaders(keys);

  const values = data.values.slice(1);

  const formatted: Entry[] = (await Promise.all(values.map(async (value) => {
    let filenameParts = value[0].trim().split('.');
    filenameParts.pop();
    const filename = filenameParts.join('.');

    if (!filename) {
      return null; // Skip entries without a filename
    }
  
    const image = await getImage({
      src: import(`../../public/videos/${filename}/${filename}.jpg`)
    });

    return {
      id: `key--${value[0].trim()}`,
      filename,
      ...(
        keepVideoUrls ? {
          videoUrl: value[1].trim()
        } : {}
      ),
      memory: value[2]?.trim(),
      year: value[3]?.trim(),
      category: value[4]?.trim(),
      name: value[5]?.trim(),
      stand: value[6]?.trim(),
      section: value[7]?.trim(),
      block: value[8]?.trim(),
      thumbnail: {
        src: image.src,
        width: image.options.width,
        height: image.options.height
      }
    }
  }))).filter((entry) => entry !== null);

  return formatted;
}

export const getRawDatabase = async (): Promise<Database> => {
  const database = await getDataFromApi(true);

  return database;
}
  
let cachedData: Database | null = null;
export const getDatabase = async (): Promise<Database> => {
  if (cachedData) {
    return cachedData;
  }

  const database = await getDataFromApi();
  // Filter out entries without minimum required fields
  const entriesWithVideos = database.filter((entry) => entry.filename && entry.block && entry.stand);
  cachedData = entriesWithVideos;
  return entriesWithVideos;
}
