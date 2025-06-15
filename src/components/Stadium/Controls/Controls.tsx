import { OrbitControls, PresentationControls } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useEffect, useRef, type ReactNode } from "react"
import { Euler, type Group } from "three"

type ControlsProps = {
  children: ReactNode
  isController: boolean
  isTarget: boolean
}

window.modelRotation = new Euler();

const Controls = ({ children, isController, isTarget }: ControlsProps) => {
  const interactiveModelRef = useRef<Group>(null)

  const invalidate = useThree((state) => state.invalidate)
  const previousRotation = useRef<Euler>(new Euler(0, 0, 0));
  const regress = useThree((state) => state.performance.regress);
  useFrame((state) => {
    if (!isController || !interactiveModelRef.current?.parent) {
      return;
    }
    if (!interactiveModelRef.current.parent.rotation.equals(previousRotation.current)) {
      previousRotation.current.copy(interactiveModelRef.current.parent.rotation);
      window.modelRotation.copy(interactiveModelRef.current.parent.rotation);
      regress();
      invalidate();
    }
  })

  useFrame((state) => {
    if (!isTarget || !interactiveModelRef.current) {
      return;
    }
    if (!window.modelRotation.equals(interactiveModelRef.current.rotation)) {
      interactiveModelRef.current.rotation.copy(window.modelRotation);
      regress();
      invalidate();
    }
  })

  if (isTarget && !isController) {
    return (
      <group ref={interactiveModelRef}>
        {children}
      </group>
    );
  }

  return (
    <>
      <group ref={interactiveModelRef} name="contents">
        {children}
      </group>
    </>
  )  
}

export default Controls