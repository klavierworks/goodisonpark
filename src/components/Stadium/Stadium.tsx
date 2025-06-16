import { AdaptiveDpr, AdaptiveEvents, Bvh, Preload } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Model from './Model/Model'
import styles from './Stadium.module.pcss'
import Controls from './Controls/Controls'
import { useEffect, useState } from 'react'
import { $entries, $isLoading } from '../../store/data'
import { CAMERA_DISTANCE } from './constants'
import World from './World/World'

export default function Stadium({ isController, isTarget, ...rest }: { isController: boolean, isTarget: boolean }) {
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = $isLoading.subscribe((newValue) => {
      setIsLoading(newValue);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  
  return (
    <>
      <Canvas flat className={styles.canvas} camera={{ position: [0, 0, CAMERA_DISTANCE] }} {...rest}>
        <directionalLight position={[0, 0, 400]} intensity={1} />
        <directionalLight position={[0, 0, -400]} intensity={1} />
        <ambientLight intensity={50} />
        <World />
      </Canvas>
      <div className={`${styles.loader} ${isLoading ? styles.isLoading : ''}`} />
    </>
  )
}
