import { AdaptiveDpr, AdaptiveEvents, Bvh, Preload, useTrail } from '@react-three/drei'
import Model from '../Model/Model'
import Controls from '../Controls/Controls'
import { useEffect, useRef, useState } from 'react';
import { $entries } from '../../../store/data';
import { useFrame, useThree } from '@react-three/fiber';

type WorldProps = {
  isController: boolean;
  isTarget: boolean;
}
const World = ({ isController, isTarget}: WorldProps) => {
  const [entries, setEntries] = useState($entries.get());

  useEffect(() => {
    const unsubscribe = $entries.subscribe((newEntries) => {
      setEntries(newEntries as Entry[]);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
        <Model entries={entries} />
      </Controls>
    </Bvh>
  );
}

export default World;