import youtubedl from 'youtube-dl-exec';
import fs from 'fs';

export const getYouTubeVideo = async (url: string, outputFolder: string, filename: string) => {
  // Check if file already exists
  const filePath = `${outputFolder}/raw/${filename}.mp4`;
  if (fs.existsSync(filePath)) {
    console.log(`File already exists: ${filePath}`);
    return {
      filenameNoExt: filename,
      filename: `${filename}.mp4`,
      path: filePath,
    };
  }
  console.log(`Downloading video from ${url} to ${outputFolder}/raw/${filename}.mp4`);
   await youtubedl(url, {
    socketTimeout: 5000,
    output: `${outputFolder}/raw/${filename}.%(ext)s`,

    mergeOutputFormat: 'mp4',
    noWarnings: true,
  });

  return {
    filenameNoExt: filename,
    filename: `${filename}.mp4`,
    path: `${outputFolder}/raw/${filename}.mp4`,
  }
}
