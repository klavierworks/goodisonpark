import fs from 'fs';
import { getDatabase } from '../api/api';
import { getYouTubeVideo } from './_download';
import { updateGoogleSheet } from './_data';
import { reformatLocalVideo } from './_reformat';

const OUTPUT_FOLDER = 'public/videos';

(async () => {
  const entries = await getDatabase();
  fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
  
  let hasMadeChanges = false;
  let index = 0;
  for await (const entry of entries) {
    index++;
    if (!entry.videoUrl || entry.filename) {
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
    hasMadeChanges = true;
  }

  if (hasMadeChanges) {
    console.log('Updating Google Sheets....');
    await updateGoogleSheet(entries);
  }


  return entries;
})();