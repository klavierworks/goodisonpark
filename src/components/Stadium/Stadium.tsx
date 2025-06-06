import { AdaptiveDpr, AdaptiveEvents, Bvh, Preload } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Model from './Model/Model'
import styles from './Stadium.module.pcss'
import Controls from './Controls/Controls'
import { useEffect, useState } from 'react'
import { $entries } from '../../store/data'
import { CAMERA_DISTANCE } from './constants'
import World from './World/World'

export default function Stadium({ isController, isTarget }: { isController: boolean, isTarget: boolean }) {
  return (
    <>
      <Canvas flat className={styles.canvas} camera={{ position: [0, 0, CAMERA_DISTANCE] }}>
        <directionalLight position={[0, 10, 0]} intensity={1} />
        <ambientLight intensity={0.5} />
        <World />
      </Canvas>
    </>
  )
}
