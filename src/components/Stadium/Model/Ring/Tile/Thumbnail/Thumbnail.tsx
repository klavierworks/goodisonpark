import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ASSET_URL } from "astro:env/client";
import { Suspense, useEffect, type RefObject } from "react";
import type { Mesh, Sprite } from "three";
import { lerp } from "three/src/math/MathUtils.js";
import VideoThumbnail from "./VideoThumbnail/VideoThumbnail";
import { TILE_SCALE } from "../../../../constants";

type ThumbnailProps = {
  filename: string;
  isHovered: boolean;
  spriteRef: RefObject<Sprite | null>
  scale: number
}

const Thumbnail = ({ filename, isHovered, spriteRef, scale }: ThumbnailProps) => {
  const texture = useTexture(ASSET_URL + `videos/${filename}/${filename}.jpg`);
  let [width, height] = [1, texture.image.height / texture.image.width];
  if (height > width) {
    width = texture.image.width / texture.image.height;
    height = 1;
  }

  useFrame(() => {
    if (!spriteRef.current) {
      return;
    }
    const currentScale = spriteRef.current.scale;
    currentScale.x = lerp(currentScale.x, width * TILE_SCALE * scale, 0.1);
    currentScale.y = lerp(currentScale.y, height * TILE_SCALE * scale, 0.1);
    currentScale.z = 0.001;
    spriteRef.current.updateMatrix();
  });

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