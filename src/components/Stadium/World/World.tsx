import { AdaptiveDpr, AdaptiveEvents, Bvh, Preload, useTrail } from '@react-three/drei'
import Model from '../Model/Model'
import Controls from '../Controls/Controls'
import { Suspense, useEffect, useRef, useState } from 'react';
import { $entries } from '../../../store/data';
import { useFrame, useThree } from '@react-three/fiber';
import Fallback from './Fallback';

type WorldProps = {
  isController: boolean;
  isTarget: boolean;
}
const World = ({ isController, isTarget}: WorldProps) => {
  const regress = useThree((state) => state.performance.regress);
  const contents = useThree((state) => state.scene.getObjectByName('contents'));
  const previousRotation = useRef<string>('');

  useFrame(() => {
    if (!contents) {
      return;
    }
    const currentRotation = contents.parent!.rotation.toArray().join(',');
    if (currentRotation !== previousRotation.current) {
      regress();
      previousRotation.current = currentRotation;
    }
  });

  return (
    <Bvh>
      <AdaptiveEvents />
      <AdaptiveDpr />
      <Preload all />
      <Controls isController={isController} isTarget={isTarget}>
        <Suspense fallback={<Fallback />}>
          <Model />
        </Suspense>
      </Controls>
    </Bvh>
  );
}

export default World;