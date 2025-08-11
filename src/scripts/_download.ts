import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import progressEstimator from 'progress-estimator';
const logger = progressEstimator();

export const getYouTubeVideo = async (url: string, outputFolder: string, filename: string, rawFilename: string) => {
  console.log(url, outputFolder, filename, rawFilename);
  if ((!url.includes('youtube') && !url.includes('youtu.be')) && rawFilename && rawFilename.includes('.')) {
    console.log(`URL does not include 'youtube', using filename directly: ${rawFilename}`);
    return {
      filename: rawFilename,
      path: `${outputFolder}/raw/${rawFilename}`,
    }
  }
  // Check if file already exists
  const filePath = `${outputFolder}/raw/${filename}.mp4`;
  if (fs.existsSync(filePath)) {
    console.log(`File already exists: ${filePath}`);
    return {
      filename: `${filename}.mp4`,
      path: filePath,
    };
  }
  console.log(`Downloading video from ${url} to ${outputFolder}/raw/${filename}.mp4`);
  const promise = youtubedl(url, {
    socketTimeout: 5000,
    output: `${outputFolder}/raw/${filename}.%(ext)s`,

    mergeOutputFormat: 'mp4',
  });

  const result = await logger(promise, `Obtaining ${url}`)
  console.log('Download finished:', result);
  return {
    filename: `${filename}.mp4`,
    path: `${outputFolder}/raw/${filename}.mp4`,
  }
}
