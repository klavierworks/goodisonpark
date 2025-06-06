import { SPHERE_SCALE, TILE_DEPTH, TILE_HEIGHT } from "../constants";

const SIDE_ANGLES = {
  right: 0,
  left: Math.PI,
  front: Math.PI / -2,
  back: Math.PI / 2,
};

export const getEntriesPlacements = (entries: Entry[], side: keyof typeof SIDE_ANGLES) => {
  const ITEM_COUNT = entries.length;
   
  const startAngle = SIDE_ANGLES[side];
  const quarterCircle = Math.PI / 2; // 90 degrees
  
  return entries.map((data, index) => {
    // Calculate angle within the quarter circle
    const angle = startAngle + (index / ITEM_COUNT) * quarterCircle;
    
    // Calculate x and z coordinates for a circle around the origin
    const x = Math.cos(angle) * (SPHERE_SCALE / 2);
    let z = Math.sin(angle) * (SPHERE_SCALE / 2);
    let y = 0;
    
    const Z_DIRECTION = z < 0 ? -1 : 1;
    const tileDepth = TILE_DEPTH * Z_DIRECTION;
    
    if (index % 2 === 0) {
      y = -TILE_HEIGHT;
      z += tileDepth;
    }
    if (index % 3 === 0) {
      y = TILE_HEIGHT;
      z += 0;
    }
    if (index % 4 === 0) {
      y = -TILE_HEIGHT / 2;
      z += tileDepth / 2;
    }
    if (index % 5 === 0) {
      y = TILE_HEIGHT / 2;
      z += -tileDepth / 2;
    }
    
    const rotation = Math.PI / 2 - angle;
    
    let scale = 1;

    if (ITEM_COUNT < 10) {
      scale = 3;
    }
    return {
      id: data.id,
      data,
      x,
      y,
      z,
      rotation,
      scale,
    };
  });
}