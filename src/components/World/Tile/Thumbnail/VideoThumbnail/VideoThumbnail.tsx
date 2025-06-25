import { useVideoTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import { videoTextureCache } from "../../../../../store/textureCache";
import type { VideoTexture } from "three";

type VideoThumbnailProps = {
  filename: string;
}

const VideoThumbnail = ({ filename }: VideoThumbnailProps) => {
  let videoTexture: VideoTexture;
  if (videoTextureCache.has(filename)) {
    videoTexture = videoTextureCache.get(filename) as unknown as VideoTexture;
  } else {
    videoTexture = useVideoTexture(ASSET_URL + `videos/${filename}/master.m3u8`);
    videoTextureCache.set(filename, videoTexture);
  }

  return <spriteMaterial color="white" map={videoTexture} toneMapped={false} transparent depthWrite={false} />;
}

export default VideoThumbnail;