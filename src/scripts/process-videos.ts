import 'dotenv/config';
import fs from 'fs';
import { getDatabase, getRawDatabase } from '../api/api';
import { getYouTubeVideo } from './_download';
import { updateGoogleSheet } from './_data';
import { reformatLocalVideo } from './_reformat';

const OUTPUT_FOLDER = 'public/videos';

(async () => {
  const entries = await getRawDatabase();
  fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  console.log(`Found ${entries.length} entries with videos to process.`);
  let index = 0;
  for await (const entry of entries) {
    index++;
    if (!entry.videoUrl || entry.filename || !entry.videoUrl.includes('youtube')) {
      console.log(`Skipping entry ${index} - no video URL or already processed.`, entry.videoUrl, entry.filename);
      continue;
    }

    console.log(`Processing video for ${index} of ${entries.length}`);

    const {
      filenameNoExt,
      filename,
      path,
    } = await getYouTubeVideo(entry.videoUrl, OUTPUT_FOLDER, `${Date.now()}`);

    await reformatLocalVideo(path, filenameNoExt);

    entry.filename = filename;
    console.log('Updating Google Sheets....');
    await updateGoogleSheet(index + 1, entry);
  }

  console.log('All videos processed.');
})();