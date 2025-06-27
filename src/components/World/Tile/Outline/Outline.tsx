import { useSpring } from "@react-spring/core";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, MeshBasicMaterial, Sprite, SpriteMaterial } from "three";
import { canvasTextureCache } from "../../../../store/textureCache";

type OutlineProps = {
  entry: Entry;
  isHovered: boolean;
  spriteRef: React.RefObject<Sprite | null>;
} & Omit<React.ComponentPropsWithoutRef<'sprite'>, 'scale'>;

const canvas = document.createElement('canvas');
canvas.width = 512;
canvas.height = 512;
const context = canvas.getContext('2d')!;
context.fillStyle = 'transparent';
context.lineWidth = 10;
context.strokeStyle = 'white';
context.strokeRect(0, 0, canvas.width, canvas.height);
const canvasTexture = new CanvasTexture(canvas);

const Outline = ({ entry, isHovered, spriteRef, ...rest }: OutlineProps) => {
  const outlineRef = useRef<Sprite>(null);

  const invalidate = useThree((state) => state.invalidate);
  const outlineSpring = useSpring({
    opacity: isHovered ? 1 : 0,
    config: {
      tension: 300,
      friction: 10,
      clamp: true,
    },
    onChange: () => {
      invalidate();
    }
  })

  useFrame(() => {  
    if (!outlineRef.current || !spriteRef.current) {
      return;
    }
    outlineRef.current.scale.copy(
      spriteRef.current.scale
    );
    (outlineRef.current.material as MeshBasicMaterial).opacity = outlineSpring.opacity.get();
  });

  return (
    <mesh {...rest} ref={outlineRef}  renderOrder={2} visible={isHovered}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={canvasTexture}
        depthWrite={false}
        color="white"
        transparent
        side={DoubleSide}
      />
    </mesh>
  )
}

export default Outline;