import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import Overview from './Overview/Overview';

const SimpleStadium = () => {
  return (
    <Canvas flat frameloop='always' camera={{
      position: [0, 120, -120],
    }}>
      <Preload all />
      <ambientLight intensity={10} />
      <directionalLight position={[0, 10, 0]} intensity={10} />
      <Overview />
    </Canvas>
  );
}

export default SimpleStadium;