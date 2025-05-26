import { AdaptiveDpr, Bvh, Preload } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import Model from './Model/Model'
import styles from './Stadium.module.pcss'
import Controls from './Controls/Controls'
import { useEffect, useState } from 'react'
import { $entries } from '../../store/data'
import { CAMERA_DISTANCE } from './constants'

export default function Stadium({ isController, isTarget }: { isController: boolean, isTarget: boolean }) {
  const [entries, setEntries] = useState($entries.get());
  console.log(entries)
  useEffect(() => {
    const unsubscribe = $entries.subscribe((newEntries) => {
      console.log('New entries received:', newEntries);
      setEntries(newEntries as Entry[]);
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <>
      <Canvas flat className={styles.canvas} camera={{ position: [0, 0, CAMERA_DISTANCE] }}>
        <Bvh>
          <AdaptiveDpr />
          <Preload all />
          <Controls isController={isController} isTarget={isTarget}>
            <Model entries={entries} />
          </Controls>
        </Bvh>
      </Canvas>
    </>
  )
}
