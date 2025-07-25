import fs from 'fs/promises';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Type definitions
type Resolution = '1080p' | '720p' | '480p' | '240p' | '144p';

interface ResolutionConfig {
  width: number;
  height: number;
  minSourceWidth: number;
  minSourceHeight: number;
  profile: string;
  level: string;
  defaultBitrate: number;
}

interface VideoMetadata {
  width: number;
  height: number;
}

interface VideoStream {
  resolution: Resolution;
  bitrate: number;
  width: number;
  height: number;
}

// Configuration for different resolutions (no 4K, max is HD)
const resolutionConfigs: Record<Resolution, ResolutionConfig> = {
  '1080p': {
    width: 1920,
    height: 1080,
    minSourceWidth: 1920,
    minSourceHeight: 1080,
    profile: 'main',
    level: '4.1',
    defaultBitrate: 6000000
  },
  '720p': {
    width: 1280,
    height: 720,
    minSourceWidth: 1280,
    minSourceHeight: 720,
    profile: 'main',
    level: '3.1',
    defaultBitrate: 2500000
  },
  '480p': {
    width: 854,
    height: 480,
    minSourceWidth: 0,
    minSourceHeight: 0,
    profile: 'main',
    level: '3.0',
    defaultBitrate: 1000000
  },
  '240p': {
    width: 426,
    height: 240,
    minSourceWidth: 0,
    minSourceHeight: 0,
    profile: 'main',
    level: '1b',
    defaultBitrate: 500000
  },
  '144p': {
    width: 256,
    height: 144,
    minSourceWidth: 0,
    minSourceHeight: 0,
    profile: 'main',
    level: '1b',
    defaultBitrate: 200000
  }
};

const parseTimeToSeconds = (time: string): number => {
  const [minutes, seconds] = time.split(':').map(Number);
  return minutes * 60 + seconds;
};

/**
 * Reformat a local video file into HLS format with multiple resolutions
 * @param videoPath Full path to the video file
 * @param filenameNoExt Filename without extension
 * @param startTime Start time in MM:SS format (optional)
 * @param endTime End time in MM:SS format (optional)
 * @returns Path to the master playlist
 */
export const reformatLocalVideo = async (videoPath: string, filenameNoExt: string, startTime?: string, endTime?: string): Promise<string> => {
  try {
    console.log(`Processing ${path.basename(videoPath)}...`);
    
    // Create output directory structure
    const outputFolder = `./public/videos/${filenameNoExt}`;
    const thumbnailsFolder = `./public/thumbnails`;
    await fs.mkdir(outputFolder, { recursive: true });
    await fs.mkdir(thumbnailsFolder, { recursive: true });
    
    // Get source video metadata
    const metadata = await getVideoMetadata(videoPath);
    console.log(`  Source resolution: ${metadata.width}x${metadata.height}`);
    
    // Determine which resolutions to create
    const resolutionsToCreate = determineResolutions(metadata);
    logResolutionsToCreate(resolutionsToCreate);
    
    // Create MP4 files for each resolution
    const streams = await createResolutionFiles(
      videoPath, 
      outputFolder, 
      filenameNoExt, 
      resolutionsToCreate,
      startTime,
      endTime
    );
    
    // Create HLS segments for each resolution
    await createHlsSegments(outputFolder, filenameNoExt, streams);
    
    // Create master playlist
    await createMasterPlaylist(outputFolder, filenameNoExt, streams);
    
    // Clean up intermediate files
    await cleanupIntermediateFiles(outputFolder, filenameNoExt);
    
    // Extract and optimize first frame
    await extractAndOptimizeFirstFrame(videoPath, thumbnailsFolder, filenameNoExt, startTime);
    
    console.log(`✅ Completed processing ${path.basename(videoPath)}`);
    console.log(`   HLS master playlist available at: ${outputFolder}/master.m3u8`);
    
    return `${outputFolder}/master.m3u8`;
  } catch (error) {
    console.error('Error processing video:', error);
    throw error;
  }
};

/**
 * Get video metadata using ffprobe
 */
const getVideoMetadata = async (inputFile: string): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      if (!videoStream) {
        reject(new Error('No video stream found'));
        return;
      }
      
      resolve({
        width: videoStream.width || 0,
        height: videoStream.height || 0
      });
    });
  });
};

/**
 * Determine which resolutions to create based on source resolution
 */
const determineResolutions = (metadata: VideoMetadata): Resolution[] => {
  return Object.entries(resolutionConfigs)
    .filter(([_, config]) => 
      metadata.width >= config.minSourceWidth && 
      metadata.height >= config.minSourceHeight
    )
    .map(([resolution]) => resolution as Resolution);
};

/**
 * Log which resolutions will be created
 */
const logResolutionsToCreate = (resolutions: Resolution[]): void => {
  console.log(`  Creating 1080p: ${resolutions.includes('1080p')}`);
  console.log(`  Creating 720p: ${resolutions.includes('720p')}`);
  console.log(`  Creating 480p: ${resolutions.includes('480p')}`);
  console.log(`  Keeping audio: true`);
};

/**
 * Create MP4 files for each resolution
 */
const createResolutionFiles = async (
  inputFile: string,
  outputFolder: string,
  filenameNoExt: string,
  resolutions: Resolution[],
  startTime?: string,
  endTime?: string
): Promise<VideoStream[]> => {
  const streams: VideoStream[] = [];
  
  for (const resolution of resolutions) {
    const config = resolutionConfigs[resolution];
    await fs.mkdir(`${outputFolder}/${resolution}`, { recursive: true })
    const outputFile = `${outputFolder}/${resolution}_${filenameNoExt}.mp4`;
    console.log(`  Creating ${resolution} version...`);
    
    // Create a new ffmpeg instance for this resolution
    const command = ffmpeg(inputFile);
    
    // Set start time (0 if not provided)
    const startSeconds = startTime ? parseTimeToSeconds(startTime) : 0;
    command.seekInput(startSeconds);
    
    // Set duration if endTime is provided
    if (endTime) {
      const endSeconds = parseTimeToSeconds(endTime);
      const duration = endSeconds - startSeconds;
      command.duration(duration);
    }
    
    // Set basic encoding options
    command
      .videoCodec('libx264')
      .outputOptions([
        `-preset slow`,
        `-crf 23`,
        `-profile:v ${config.profile}`,
        `-level:v ${config.level}`,
        `-pix_fmt yuv420p`,
        `-g 60`,
        `-keyint_min 60`,
        `-sc_threshold 0`,
        `-force_key_frames expr:gte(t,n_forced*2)`,
        `-movflags +faststart`,
        `-map_metadata -1`,
        `-map_chapters -1`
      ]);
    
    // Add scale filter for all resolutions
    command.size(`${config.width}x${config.height}`);
    
    // Always keep audio
    command.audioCodec('aac').audioBitrate('128k');
    
    // Wait for the file to be processed
    await new Promise<void>((resolve, reject) => {
      command
        .on('error', (err) => {
          console.error(`Error creating ${resolution} version:`, err);
          reject(err);
        })
        .on('end', () => {
          console.log(`  ${resolution} version created successfully.`);
          resolve();
        })
        .save(outputFile);
    });
    
    // Get actual bitrate
    let bitrate = config.defaultBitrate;
    try {
      const metadata = await getVideoBitrate(outputFile);
      if (metadata > 0) {
        bitrate = metadata;
      }
    } catch (error) {
      console.warn(`  Warning: Could not detect bitrate for ${resolution}, using default.`);
    }
    
    streams.push({
      resolution,
      bitrate,
      width: config.width,
      height: config.height
    });
  }
  
  return streams;
};

/**
 * Get video bitrate using ffprobe
 */
const getVideoBitrate = async (inputFile: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      
      if (!videoStream || !videoStream.bit_rate) {
        resolve(0);
        return;
      }
      
      resolve(parseInt(videoStream.bit_rate));
    });
  });
};

/**
 * Create HLS segments for each resolution
 */
const createHlsSegments = async (
  outputFolder: string,
  filenameNoExt: string,
  streams: VideoStream[]
): Promise<void> => {
  await Promise.all(streams.map(async stream => {
    const resolution = stream.resolution;
    const inputFile = `${outputFolder}/${resolution}_${filenameNoExt}.mp4`;
    const outputFile = `${outputFolder}/${resolution}/${filenameNoExt}.m3u8`;
    
    console.log(`  Creating HLS segments for ${resolution}...`);
    
    // Create a new ffmpeg instance
    const command = ffmpeg(inputFile);
    
    // Copy video/audio (no re-encoding needed)
    command.videoCodec('copy')
           .audioCodec('copy');
    
    // Set HLS options
    command.outputOptions([
      `-hls_time 2`,
      `-hls_list_size 0`,
      `-hls_segment_filename ${outputFolder}/${resolution}/segment-%03d.ts`
    ]);
    
    // Wait for the file to be processed
    await new Promise<void>((resolve, reject) => {
      command
        .on('error', (err) => {
          console.error(`Error creating HLS segments for ${resolution}:`, err);
          reject(err);
        })
        .on('end', () => {
          console.log(`  HLS segments for ${resolution} created successfully.`);
          resolve();
        })
        .save(outputFile);
    });
  }));
};

/**
 * Create master playlist
 */
const createMasterPlaylist = async (
  outputFolder: string,
  filenameNoExt: string,
  streams: VideoStream[]
): Promise<void> => {
  console.log(" Building master playlist based on enabled resolutions...");
  
  let masterPlaylist = "#EXTM3U\n#EXT-X-VERSION:3";
  
  // Add each stream to the master playlist
  for (const stream of streams) {
    console.log(` - ${stream.resolution} stream added to manifest, bitrate: ${stream.bitrate} bps`);
    
    masterPlaylist += `\n#EXT-X-STREAM-INF:BANDWIDTH=${stream.bitrate},RESOLUTION=${stream.width}x${stream.height}`;
    masterPlaylist += `\n${stream.resolution}/${filenameNoExt}.m3u8`;
  }
  
  // Write master playlist file
  console.log(" Creating master playlist...");
  await fs.writeFile(`${outputFolder}/master.m3u8`, masterPlaylist);
  console.log(` Master playlist created at ${outputFolder}/master.m3u8`);
  
  // Validate the playlist has at least one entry
  if (streams.length === 0) {
    console.error(" ERROR: No resolution files were found! Master playlist will be empty.");
    throw new Error("No resolution files were found");
  }
};

/**
 * Clean up intermediate MP4 files
 */
const cleanupIntermediateFiles = async (
  outputFolder: string,
  filenameNoExt: string
): Promise<void> => {
  console.log("  Cleaning up intermediate MP4 files...");
  
  const resolutions: Resolution[] = ['1080p', '720p', '480p', '240p', '144p'];
  
  await Promise.all(
    resolutions.map(resolution => 
      fs.unlink(`${outputFolder}/${resolution}_${filenameNoExt}.mp4`)
        .catch(() => {/* Ignore if file doesn't exist */})
    )
  );
};

/**
 * Extract and optimize first frame as JPEG
 */
const extractAndOptimizeFirstFrame = async (
  inputFile: string,
  outputFolder: string,
  filenameNoExt: string,
  startTime?: string
): Promise<void> => {
  console.log("Extracting first frame...");
  
  const tempJpegPath = `${filenameNoExt}.jpg`;
  
  // Create a new ffmpeg instance
  const command = ffmpeg(inputFile);
  
  // Seek to start time if provided, otherwise use beginning of video
  if (startTime) {
    const startSeconds = parseTimeToSeconds(startTime);
    command.seekInput(startSeconds);
  }
  
  // Extract first frame
  command
    .frames(1)
    .output(tempJpegPath);
  
  // Wait for the frame to be extracted
  await new Promise<void>((resolve, reject) => {
    command
      .on('error', (err) => {
        console.error('Error extracting first frame:', err);
        reject(err);
      })
      .on('end', () => {
        console.log('Frame extracted successfully.');
        resolve();
      })
      .run();
  });
  
  console.log("Optimizing JPEG with Sharp...");
  
  try {
    // Read the image file
    const imageBuffer = await fs.readFile(tempJpegPath);
    
    // Process with sharp
    const optimizedImage = await sharp(imageBuffer)
      .resize(512) // Resize to 512px width, maintain aspect ratio
      .jpeg({
        quality: 80,
        progressive: true,
        optimizeCoding: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        optimizeScans: true
      })
      .toBuffer();
    
    // Save the optimized image
    await fs.writeFile(`${outputFolder}/${filenameNoExt}.jpg`, optimizedImage);
    
    // Clean up the temp file
    await fs.unlink(tempJpegPath);
    
    console.log(`Thumbnail saved to ${outputFolder}/${filenameNoExt}.jpg`);
  } catch (error) {
    console.error("Error optimizing image:", error);
    
    // If optimization fails, just move the unoptimized image
    await fs.rename(tempJpegPath, `${outputFolder}/${filenameNoExt}.jpg`);
  }
};