import youtubedl from 'youtube-dl-exec';

export const getYouTubeVideo = async (url: string, outputFolder: string, filename: string) => {
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
