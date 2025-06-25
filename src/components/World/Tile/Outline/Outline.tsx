import { useSpring } from "@react-spring/core";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, Sprite, SpriteMaterial } from "three";
import { canvasTextureCache } from "../../../../store/textureCache";

type OutlineProps = {
  entry: Entry;
  isHovered: boolean;
  spriteRef: React.RefObject<Sprite | null>;
} & Omit<React.ComponentPropsWithoutRef<'sprite'>, 'scale'>;

const Outline = ({ entry, isHovered, spriteRef, ...rest }: OutlineProps) => {
  const outlineRef = useRef<Sprite>(null);

  const outlineSpring = useSpring({
    opacity: isHovered ? 1 : 0,
    config: {
      tension: 300,
      friction: 10,
      clamp: true,
    }
  })

  useFrame(() => {  
    if (!outlineRef.current || !spriteRef.current) {
      return;
    }
    outlineRef.current.scale.copy(
      spriteRef.current.scale
    );
    (outlineRef.current.material as SpriteMaterial).opacity = outlineSpring.opacity.get();
  });

  const canvasTexture = useMemo(() => {
    const cachedTexture = canvasTextureCache.get(entry.id);
    if (cachedTexture) {
      return cachedTexture;
    }
    const canvas = document.createElement('canvas');
    canvas.width = entry.thumbnail.width
    canvas.height = entry.thumbnail.height;
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }
    context.fillStyle = 'transparent';
    context.lineWidth = 10;
    context.strokeStyle = 'white';
    context.strokeRect(0, 0, canvas.width, canvas.height);
    console.log('create new')
    const canvasTexture = new CanvasTexture(canvas);
    canvasTextureCache.set(entry.id, canvasTexture);
    return canvasTexture;
  }, []);

  return (
    <sprite {...rest} ref={outlineRef}  renderOrder={2} visible={isHovered}>
      <spriteMaterial
        map={canvasTexture}
        depthWrite={false}
        color="white"
        transparent
        side={DoubleSide}
      />
    </sprite>
  )
}

export default Outline;