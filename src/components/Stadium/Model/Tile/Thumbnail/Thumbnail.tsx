import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { ASSET_URL } from "astro:env/client";
import { useEffect, type RefObject } from "react";
import type { Mesh } from "three";
import { lerp } from "three/src/math/MathUtils.js";

type ThumbnailProps = {
  filename: string;
  pointRef: RefObject<Mesh | null>
}

const Thumbnail = ({ filename, pointRef }: ThumbnailProps) => {
  const texture = useTexture(ASSET_URL + `videos/${filename}/${filename}.jpg`);
  let [width, height] = [1, texture.image.height / texture.image.width];
  if (height > width) {
    width = texture.image.width / texture.image.height;
    height = 1;
  }

  useFrame(() => {
    if (!pointRef.current) {
      return;
    }
    const scale = pointRef.current.scale;
    scale.x = lerp(scale.x, width, 0.1);
    scale.y = lerp(scale.y, height, 0.1);
    scale.z = 0.001;
    pointRef.current.updateMatrix();
  });

  return <meshBasicMaterial color="white" map={texture} />;
}

export default Thumbnail;