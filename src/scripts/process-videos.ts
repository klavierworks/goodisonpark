import 'dotenv/config';
import fs from 'fs';
import {  getRawDatabase } from '../api/api';
import { getYouTubeVideo } from './_download';
import { updateGoogleSheet } from './_data';
import { reformatLocalVideo } from './_reformat';

const OUTPUT_FOLDER = 'public/videos';
const REPROCESS_ALL = true; // Set to true to reprocess all previously downloaded videos

(async () => {
  console.log('Starting video processing...');
  const entries = await getRawDatabase();
  fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  console.log(`Found ${entries.length} entries with videos to process.`);
  let index = 0;
  for await (const entry of entries) {
    index++;
    if (!entry.videoUrl || (entry.filename && !REPROCESS_ALL) || !entry.videoUrl.includes('youtube')) {
      console.log(`Skipping entry ${index} - no video URL or already processed.`, entry.videoUrl, entry.filename);
      continue;
    }

    console.log(`Processing video for ${index} of ${entries.length}`);

    const {
      filenameNoExt,
      filename,
      path,
    } = await getYouTubeVideo(entry.videoUrl, OUTPUT_FOLDER, entry.filename ?? `${Date.now()}`);

    await reformatLocalVideo(path, entry.id, entry.startTime, entry.endTime);

    entry.filename = filename;
    console.log('Updating Google Sheets....');
    await updateGoogleSheet(index + 1, entry);
  }

  console.log('All videos processed.');
})();