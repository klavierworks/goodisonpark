import * as React from 'react'
import { MathUtils } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import { damp } from 'maath/easing';

export type SimpleRotationControlsRef = {
  setRotation: (x: number, y: number) => void
  x: number
  y: number
} | null;

export type SimpleRotationControlsProps = {
  cursor?: boolean
  speedX?: number
  speedY?: number
  initialRotation?: [number, number]
  xLimits?: [number, number]
  yLimits?: [number, number]
  damping?: number
  enabled?: boolean
  children?: React.ReactNode
  controlsRef?: React.RefObject<SimpleRotationControlsRef>
}


function SimpleRotationControls({
  enabled = true,
  cursor = true,
  speedX = 1,
  speedY = 1,
  damping = 0.25,
  xLimits,
  yLimits = [-Math.PI / 2, Math.PI / 2],
  controlsRef
}: SimpleRotationControlsProps) {
  const invalidate = useThree((state) => state.invalidate)
  const regress = useThree((state) => state.performance.regress)

  const [animation] = React.useState({
    x: 0,
    y: 0,
    damping
  })

  const localRef = React.useRef<SimpleRotationControlsRef>({
    x: 0,
    y: 0,
    setRotation: (x: number, y: number) => null
  });
  

  const ref = controlsRef || localRef

  const setRotation = React.useCallback((x: number, y: number) => {
    if (!ref.current) {
      return;
    }
    ref.current.x = x;
    ref.current.y = y;
    animation.x = x;
    animation.y = y;
  }, [ref])

  const events = useThree((state) => state.events)
  const gl = useThree((state) => state.gl)
  const explDomElement = events.connected || gl.domElement

  const { size } = useThree()

  React.useEffect(() => {
    if (cursor && enabled) {
      explDomElement.style.cursor = 'grab'
      gl.domElement.style.cursor = ''
      return () => {
        explDomElement.style.cursor = 'default'
        gl.domElement.style.cursor = 'default'
      }
    }
  }, [cursor, explDomElement, enabled])
  
  useFrame((state, delta) => {
    if (!ref.current) {
      ref.current = localRef.current;
    }
    
    if (!ref.current) {
      return;
    }

    if (ref.current) {
      ref.current.setRotation = setRotation;
    }

    damp(
      ref.current,
      'x',
      animation.x,
      damping,
      delta
    )

    damp(
      ref.current,
      'y',
      animation.y,
      damping,
      delta
    )
  })

  useGesture(
    {
      onDrag: ({ down, delta: [x, y], first, memo: [oldX, oldY] = [animation.x, animation.y] }) => {
        if (!enabled) return [x, y]
        if (cursor) explDomElement.style.cursor = down ? 'grabbing' : 'grab'

        x = oldX + (x / size.width) * Math.PI * speedX;
        if (xLimits) {
          x = MathUtils.clamp(x, ...xLimits)
        }
        y = oldY + (y / size.height) * Math.PI * speedY
        if (yLimits) {
          y = MathUtils.clamp(y, ...yLimits)
        }

        animation.x = x
        animation.y = y

        animation.damping = damping

        if (down) {
          regress()
          invalidate()
        }
        return [x, y]
      },
    },
    { target: explDomElement }
  )
  return null;
}

export default SimpleRotationControls;