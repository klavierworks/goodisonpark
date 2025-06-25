import { PresentationControls, Sphere } from "@react-three/drei"
import { invalidate, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Euler, type Group } from "three"
import { TILE_Y_DEPTH } from "../../World/Space/constants"

type ControlsProps = {
  children: ReactNode
  isController: boolean
  isTarget: boolean
}

window.modelRotation = {
  x: 0,
  y: 0,
}

const Controls = ({ children, isController, isTarget }: ControlsProps) => {
  const controlsTargetRef = useRef<Group>(null)
  const interactiveModelRef = useRef<Group>(null)

  const [initialRotation, setInitialRotation] = useState([0, 0, 0] as [number, number, number])
  const [hasFoundInitialRotation, setHasFoundInitialRotation] = useState(false);
  useFrame(({scene}) => {
    if (hasFoundInitialRotation) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const selectedTileId = searchParams.get('selectedTileId');

    scene.traverse((child) => {
      if (child.name === 'GoodisonFull') {
        setHasFoundInitialRotation(true);
        return;
      }
      if (child.name === selectedTileId) {
        const point = child.userData.point;

        const normalized = point / 1.12;
        setInitialRotation([
          0,
          (normalized * (Math.PI * 2)) + (Math.PI / 5.5),
          0
        ]);

        window.modelRotation.x = initialRotation[1];

        setHasFoundInitialRotation(true);
      }
    });

  });

  useFrame(() => {
    if (!hasFoundInitialRotation) {
      return;
    }
    if (!isController || !controlsTargetRef.current?.parent) {
      return;
    } 

    window.modelRotation = {
      x: controlsTargetRef.current.parent.rotation.y % (Math.PI * 2),
      y: controlsTargetRef.current.parent.rotation.x,
    }
    if (window.modelRotation.x < 0) {
      window.modelRotation.x = window.modelRotation.x + (Math.PI * 2);
    }
  })

  const previousRotation = useRef(0);
  useFrame((state) => {
    if (!hasFoundInitialRotation) {
      return;
    }
    if (!isTarget || !interactiveModelRef.current) {
      return;
    }

    const newRotation = window.modelRotation.x + Math.PI / -2;
    if (previousRotation.current === newRotation) {
      return;
    }

    previousRotation.current = newRotation;
    interactiveModelRef.current.rotation.set(
      0,
      newRotation,
      0,
    )
    state.invalidate();
  })

  const [speed, setSpeed] = useState(4)

  useFrame(() => {
    setSpeed(window.innerWidth < 768 ? 1 : 3)
  })

  if (!hasFoundInitialRotation) {
    return <group visible={false}>{children}</group>
  }

  return (
    <>
      <PresentationControls
        global={true}
        speed={speed}
        polar={[0, 1]}
        rotation={initialRotation}
      >
        <group ref={controlsTargetRef}>
          <Sphere args={[1, 1, 1]} scale={1} visible={false} />
        </group>
      </PresentationControls>
      <group ref={interactiveModelRef} name="contents">
        {children}
      </group>
    </>
  )  
}

export default Controls