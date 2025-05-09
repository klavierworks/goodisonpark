import { Group, Mesh, Raycaster, Vector2, Vector3 } from "three";
import Point from "./Point/Point";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

const Model = () => {

  return (
    <group>
      <Point position={[-2, 0, 2]} />
      <Point position={[3, 0, 2]} />
      <Point position={[1, 0, 3]} />
    </group>
  )
}

export default Model;