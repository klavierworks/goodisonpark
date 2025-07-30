import { useTexture } from "@react-three/drei";
import { ASSET_URL } from "astro:env/client";
import { Suspense } from "react";
import VideoThumbnail from "./VideoThumbnail/VideoThumbnail";
import { thumbnailCache } from "../../../../store/textureCache";
import { DoubleSide, type Texture } from "three";

type ThumbnailProps = {
  filename: string;
  isHovered: boolean;
} & React.ComponentPropsWithoutRef<'meshBasicMaterial'>;

const Thumbnail = ({ filename, isHovered, ...rest }: ThumbnailProps) => {
  let texture: Texture;
  if (thumbnailCache.has(filename)) {
    texture = thumbnailCache.get(filename) as unknown as Texture;
  } else {
    texture = useTexture(ASSET_URL + `thumbnails/${filename}.jpg`);
    thumbnailCache.set(filename, texture);
  }

  const imageMaterial = <meshBasicMaterial color="white" map={texture} transparent depthWrite={false} side={DoubleSide} {...rest} />;
  
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