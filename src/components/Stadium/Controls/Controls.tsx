import { PresentationControls, Sphere } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { type Group } from "three"

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

  useFrame(() => {
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

  useFrame((state) => {
    if (isController || !interactiveModelRef.current) {
      return;
    }
    interactiveModelRef.current.rotation.set(
      0,
      window.modelRotation.x + Math.PI / -2,
      0,
    )
  })

  const [speed, setSpeed] = useState(4)


  useFrame((state) => {
    setSpeed(window.innerWidth < 768 ? 1 : 3)
  })


  return (
    <>
      <PresentationControls global={true} speed={speed} polar={[0, 1]} rotation={[0, Math.PI / 3, 0]}>
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