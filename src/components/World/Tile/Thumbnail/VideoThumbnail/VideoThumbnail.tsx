import { useVideoTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";

type VideoThumbnailProps = {
  filename: string;
}

const VideoThumbnail = ({ filename }: VideoThumbnailProps) => {
  const videoTexture = useVideoTexture(ASSET_URL + `videos/${filename}/master.m3u8`);

  return <spriteMaterial color="white" map={videoTexture} toneMapped={false} transparent depthWrite={false} />;
}

export default VideoThumbnail;