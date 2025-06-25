import { useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import { Suspense } from "react";
import VideoThumbnail from "./VideoThumbnail/VideoThumbnail";

type ThumbnailProps = {
  filename: string;
  isHovered: boolean;
}

const Thumbnail = ({ filename, isHovered }: ThumbnailProps) => {
  const texture = useTexture(ASSET_URL + `videos/${filename}/${filename}.jpg`);

  const imageMaterial = <spriteMaterial color="white" map={texture} transparent depthWrite={false} />;
  
  if (isHovered) {
    return (
      <Suspense fallback={imageMaterial}>
        <VideoThumbnail filename={filename} />
      </Suspense>
    )
  }

  return imageMaterial;
}

export default Thumbnail;