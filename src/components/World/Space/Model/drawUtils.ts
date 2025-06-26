import { Curve, CurvePath, Euler, Matrix4, Object3D, PerspectiveCamera, Quaternion, Vector2, Vector3, type BufferGeometry, type Line } from "three"
import { ELLIPSIS_X_RADIUS, ELLIPSIS_Y_RADIUS, TILE_DEPTH, TILE_Y_DEPTH } from "../constants"
import type { MutableRefObject, RefObject } from "react";
import type { Group } from "three";

export const drawStadiumShape = (scale: number = 1): Curve<Vector3> => {
  class XZEllipseCurve extends Curve<Vector3> {
    private xRadius: number;
    private zRadius: number;
    rotation: number = Math.PI / 2;

    constructor(xRadius: number, zRadius: number) {
      super();
      this.xRadius = xRadius;
      this.zRadius = zRadius;
    }
    
    getPoint(t: number): Vector3 {
      const angle = t * Math.PI * 2;
      const x = Math.cos(angle) * this.xRadius;
      const z = Math.sin(angle) * this.zRadius;
      
      // Apply rotation around Y-axis
      const rotatedX = x * Math.cos(this.rotation) - z * Math.sin(this.rotation);
      const rotatedZ = x * Math.sin(this.rotation) + z * Math.cos(this.rotation);
      
      return new Vector3(rotatedX, 0, rotatedZ);
    }
  }
  
  return new XZEllipseCurve(
    ELLIPSIS_X_RADIUS * scale,
    ELLIPSIS_Y_RADIUS * scale
  );
}

const sections: Record<Section, {start: number, end: number}> = {
  leftStraight: {
    start: 0.12,
    end: 0.35
  },
  topSemicircle: {
    start: 0.35,
    end: 0.62
  },
  rightStraight: {
    start: 0.62,
    end: 0.87
  },
  bottomSemicircle: {
    start: 0.87,
    end: 1.12
  },
}

const layout: Record<Tier, Record<Section, string[]>> = {
  lower: {
    topSemicircle: [
      'PE7', 'PE6', 'PE5', 'PE4', 'PE3', 'PE2', 'PE1',
    ],
    leftStraight: [
      'PK5', 'PK4', 'PK3', 'PK2', 'LV4', 'LV3',
    ],
    bottomSemicircle: [
      'GT1', 'GT2', 'GT3', 'GT4', 'GT5', 'GT6', 'GT7', 'GT8'
    ],
    rightStraight: [
      'FE9', 'FE8', 'FE7', 'FE6', 'FE5', 'FE4', 'FE3', 'FE2', 'FE1'
    ]
  },
  middle: {
    topSemicircle: [],
    leftStraight: [
      'LB6', 'LB5', 'LB4', 'LB3', 'LB2', 'LV2', 'LV1'
    ],
    bottomSemicircle: [
      'GS1', 'GS2', 'GS3', 'GS4', 'GS5',
    ],
    rightStraight: [
      'MS5', 'MS4', 'MS3', 'MS2', 'MS1'
    ]
  },
  upper: {
    topSemicircle: [],
    leftStraight: [
      'UB6', 'UB5', 'UB4', 'UB3', 'UV2', 'UV1',
    ],
    bottomSemicircle: [],
    rightStraight: [
      'TB5', 'TB4', 'TB3', 'TB2', 'TB1'
    ],
  }
}


const distributeInSubsection = (items: Entry[], line: Curve<Vector3>, subsectionStart: number, subsectionEnd: number) => {
  if (items.length === 0) return []
  
  return items.map((item, index) => {
    let ratio: number
    
    if (items.length === 1) {
      ratio = 0.5 // Center single item
    } else {
      // Distribute evenly with small padding at edges
      const padding = 0.1 // 10% padding on each side
      const usableSpace = 1 - (2 * padding)
      ratio = padding + (index / (items.length - 1)) * usableSpace
    }
    
    const t = subsectionStart + ratio * (subsectionEnd - subsectionStart)
    const point = line.getPoint(t)
    const tangent = line.getTangent(t)

    let inwardOffset = index % 2 * TILE_DEPTH
    if (index % 3 === 0) {
      inwardOffset = -TILE_DEPTH
    }
    if (index % 4 === 0) {
      inwardOffset = -TILE_DEPTH * 5
    }
    if (index % 5 === 0) {
      inwardOffset = TILE_DEPTH * 2
    }
    if (index % 7 === 0) {
      inwardOffset = TILE_DEPTH * 3
    }


    let verticalOffset = index % 3 * TILE_Y_DEPTH / 2
    const normalAngle = Math.atan2(tangent.z, tangent.x)
    const normal = new Vector3(-Math.sin(normalAngle), 0, Math.cos(normalAngle)) // 3D normal
    const offsetPoint = point.clone().add(normal.multiplyScalar(inwardOffset))    
    return {
      ...item,
      point: t,
      position: [offsetPoint.x, verticalOffset, offsetPoint.z],
      rotation: [Math.PI / 2, normalAngle, Math.PI]
    }
  })
}

export const distributeElementsOnStadium = (line: Curve<Vector3>, elements: Entry[], tier: Tier) => {
  const groups = layout[tier]
  
  return Object.entries(groups).flatMap(([sectionName, blockNames]) => {
    const section = sections[sectionName as unknown as Section]
    
    // Skip empty sections
    if (blockNames.length === 0) return []
    
    const sectionLength = section.end - section.start
    const subsectionLength = sectionLength / blockNames.length
    
    return blockNames.flatMap((blockName, blockIndex) => {
      const items = elements.filter(item => item.block === blockName)
      
      // Skip if no items for this block
      if (items.length === 0) return []
      
      const subsectionStart = section.start + (blockIndex * subsectionLength)
      const subsectionEnd = subsectionStart + subsectionLength
      
      return distributeInSubsection(items, line, subsectionStart, subsectionEnd)
    })
  })
}

export const getBlockAtPosition = (x: number, y: number): string | null => {

  // Clamp inputs to valid range
  x = Math.max(0, Math.min(1, x));
  y = Math.max(0, Math.min(1, y));
  
  // Determine tier based on y value
  let tier: Tier;
  if (y <  0.33) {
    tier = 'lower';
  } else if (y < 0.67) {
    tier = 'middle';
  } else {
    tier = 'upper';
  }

  // Normalize x to the curve parameter range (0.12 to 1.12)
  let curveParam = x + 0;
  
  // Find which section contains this curve parameter
  let currentSection: Section | null = null;
  for (const [sectionName, sectionData] of Object.entries(sections)) {
    if (curveParam >= sectionData.start && curveParam <= sectionData.end) {
      currentSection = sectionName as Section;
      break;
    }
  }
  
  if (!currentSection) {
    curveParam += 1;
    for (const [sectionName, sectionData] of Object.entries(sections)) {
      if (curveParam >= sectionData.start && curveParam <= sectionData.end) {
        currentSection = sectionName as Section;
        break;
      }
    }
  }

  if (!currentSection) return null; // No valid section found
  
  // Get the blocks for this tier and section
  let blocks = layout[tier][currentSection];
  if (blocks.length === 0 && tier === 'upper') {
    tier = 'middle';
    blocks = layout['middle'][currentSection];
  }

  if (blocks.length === 0 && tier === 'middle') {
    tier = 'lower';
    blocks = layout['lower'][currentSection];
  }


  if (blocks.length === 0) return null;
  
  // Calculate which block within the section
  const section = sections[currentSection];
  const relativePosition = (curveParam - section.start) / (section.end - section.start);
  const blockIndex = Math.floor(relativePosition * blocks.length);
  
  // Ensure we don't go out of bounds
  const safeBlockIndex = Math.max(0, Math.min(blockIndex, blocks.length - 1));
  
  return blocks[safeBlockIndex];
}

export const getRotationAngleAroundAxis = (centerPoint: Vector3, pointA: Vector3, pointB: Vector3, axis: Vector3) => {
  // Get vectors from center to each point
  const vectorA = new Vector3().subVectors(pointA, centerPoint);
  const vectorB = new Vector3().subVectors(pointB, centerPoint);
  
  // Project both vectors onto the plane perpendicular to the axis
  const projectedA = vectorA.clone().projectOnPlane(axis).normalize();
  const projectedB = vectorB.clone().projectOnPlane(axis).normalize();
  
  // Get the unsigned angle between them
  const angle = projectedA.angleTo(projectedB);
  
  // Get the sign using cross product
  const cross = new Vector3().crossVectors(projectedA, projectedB);
  const sign = Math.sign(cross.dot(axis));
  
  const signedAngle = sign * angle;

  if (axis.equals(new Vector3(1, 0, 0))) {
    // X-axis rotation
    return new Euler(signedAngle, 0, 0);
  } else if (axis.equals(new Vector3(0, 1, 0))) {
    // Y-axis rotation (your case - vertical axis)
    return new Euler(0, signedAngle, 0);
  } else if (axis.equals(new Vector3(0, 0, 1))) {
    // Z-axis rotation
    return new Euler(0, 0, signedAngle);
  } else {
    // For arbitrary axis, use quaternion then convert
    const quaternion = new Quaternion().setFromAxisAngle(axis, signedAngle);
    return new Euler().setFromQuaternion(quaternion);
  }
}

export const getRotationAroundPoint = (
  shape: Object3D,
  pointOnEdge: Vector3,
  cameraDirection: Vector3
): Quaternion => {
  // Get shape's world position (center)
  const shapeCenter = new Vector3();
  shape.getWorldPosition(shapeCenter);
  
  // Calculate current direction from center to point
  const currentDirection = new Vector3()
    .copy(pointOnEdge)
    .sub(shapeCenter)
    .normalize();
  
  // Target direction is opposite to camera direction
  // (point should be between camera and center)
  const targetDirection = new Vector3()
    .copy(cameraDirection)
    .negate()
    .normalize();
  
  // Calculate and return rotation needed
  return calculateRotationBetweenVectors(currentDirection, targetDirection);
};

/**
 * Calculate quaternion rotation needed to rotate from one direction to another
 */
const calculateRotationBetweenVectors = (from: Vector3, to: Vector3): Quaternion => {
  const quaternion = new Quaternion();
  
  // Ensure vectors are normalized
  const fromNorm = from.clone().normalize();
  const toNorm = to.clone().normalize();
  
  // Calculate dot product (cosine of angle)
  const dot = fromNorm.dot(toNorm);
  
  // Vectors are already aligned
  if (dot >= 0.999999) {
    return quaternion.identity();
  }
  
  // Vectors are opposite - need 180 degree rotation
  if (dot <= -0.999999) {
    // Find any perpendicular vector for rotation axis
    let axis = new Vector3(1, 0, 0).cross(fromNorm);
    if (axis.lengthSq() < 0.000001) {
      axis = new Vector3(0, 1, 0).cross(fromNorm);
    }
    axis.normalize();
    return quaternion.setFromAxisAngle(axis, Math.PI);
  }
  
  // Calculate rotation axis using cross product
  const axis = new Vector3().crossVectors(fromNorm, toNorm);
  const axisLength = axis.length();
  
  // If axis length is too small, vectors are nearly parallel
  if (axisLength < 0.000001) {
    return quaternion.identity();
  }
  
  // Normalize the axis
  axis.divideScalar(axisLength);
  
  // Calculate angle using atan2 for full 360° range
  // axisLength = sin(angle), dot = cos(angle)
  const angle = Math.atan2(axisLength, dot);
  
  return quaternion.setFromAxisAngle(axis, angle);
};

export const calculateControllerRotationToCenter = (
  entryObject: Object3D,
  stadiumSceneRef: RefObject<Group>,
  TILE_Y_DEPTH: number
): { x: number; y: number } | null => {
  // Get positions in world space
  const targetWorldPosition = entryObject.getWorldPosition(new Vector3());
  
  // Transform target position to stadium's local space
  // This accounts for any existing stadium transformations
  const stadiumWorldToLocal = stadiumSceneRef.current.worldToLocal.bind(stadiumSceneRef.current);
  const targetLocalPosition = stadiumWorldToLocal(targetWorldPosition.clone());
  
  // Calculate angle from stadium center to target in XZ plane
  // Note: atan2(x, z) gives rotation around Y axis
  let targetAngle = Math.atan2(targetLocalPosition.x, targetLocalPosition.z);
  
  // Normalize to 0-2π range
  if (targetAngle < 0) targetAngle += Math.PI * 2;
  
  // Convert to your controller's normalized format
  // Your logic: normalizedYRotation = rotation.y % Math.PI / Math.PI
  // Stadium rotation: Math.PI * 2 * normalizedYRotation
  // So: targetAngle = Math.PI * 2 * (rotation.y % Math.PI / Math.PI)
  // Therefore: rotation.y % Math.PI = (targetAngle / (Math.PI * 2)) * Math.PI
  // Since we want rotation.y in [0, π]: rotation.y = (targetAngle / (Math.PI * 2)) * Math.PI
  const targetControllerYRotation = (targetAngle / (Math.PI * 2)) * Math.PI;
  
  // For X rotation (vertical)
  // Your logic: stadiumPosition.y = -rotation.x * (TILE_Y_DEPTH * 6)
  // We want to position vertically to center the target
  // So: rotation.x = -targetLocalPosition.y / (TILE_Y_DEPTH * 6)
  // But since we want to center it, we might need to invert this
  const targetControllerXRotation = targetLocalPosition.y / (TILE_Y_DEPTH * 6);
  
  return {
    x: targetControllerXRotation,
    y: targetControllerYRotation
  };
};