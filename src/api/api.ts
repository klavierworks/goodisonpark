import { EXPECTED_SHEET_HEADERS } from "../constants/constants";

const validateHeaders = (keys: string[]) => {
  const expectedHeaders = EXPECTED_SHEET_HEADERS;
  expectedHeaders.forEach((header, index) => {
    if (header.toLowerCase().trim() !== keys[index].toLowerCase().trim()) {
      throw new Error(`Header mismatch: expected ${header} but got ${keys[index]} at column ${index + 1}`);
    }
  });
}

const getDataFromApi = async (keepVideoUrls = false, key: string): Promise<Database> => {
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/1u3Z_-eD1AtncpZCrd0EEQTyFDni2AhSp2eId2w5lqog/values/Active?alt=json&key=${key}`);
  const data = await response.json() as {
    values: string[][]
  };

  const keys = data.values[0];
  validateHeaders(keys);

  const values = data.values.slice(1);

  const formatted: Entry[] = (await Promise.all(values.map(async (value) => {
    let filename = undefined;
    if (value[13]) {
      let filenameParts = value[13]?.trim()?.split('.');
      filenameParts.pop();
      filename = filenameParts.join('.');
    }
  
    return {
      id: value[0].trim(),
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
      startTime: value[10]?.trim(),
      endTime: value[11]?.trim(),
    }
  }))).filter((entry) => entry !== null);

  return formatted;
}

export const getRawDatabase = async (): Promise<Database> => {
  if (!process.env.VITE_GOOGLE_SHEETS_API_KEY) {
    throw new Error('Google Sheets API key is not set in environment variables');
  }
  const database = await getDataFromApi(true, process.env.VITE_GOOGLE_SHEETS_API_KEY);

  return database;
}
  
let cachedData: Database | null = null;
export const getDatabase = async (): Promise<Database> => {
  if (cachedData) {
    return cachedData;
  }

  const database = await getDataFromApi(false, import.meta.env.VITE_GOOGLE_SHEETS_API_KEY);
  const {getImage} = await import('astro:assets');

  const images = import.meta.glob('../../public/videos/thumbnails/*.jpg', { eager: true });
  // Filter out entries without minimum required fields
  const entriesWithVideos = (await Promise.all(database.filter((entry) => entry.filename && entry.block && entry.stand && images[`../../public/videos/thumbnails/${entry.id}.jpg`]).map(async (entry) => {
    const image = await getImage({
      src: images[`../../public/videos/thumbnails/${entry.id}.jpg`].default,
    });
    return {
      ...entry,
      thumbnail: {
        src: image.src!,
        width: image.options.width!,
        height: image.options.height!
      }
    };
  }
  )));
  cachedData = entriesWithVideos;
  return entriesWithVideos;
}
