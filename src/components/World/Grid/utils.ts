const GRID_DEPTH = 100;

function calculateZ(index: number, columnIndex: number) {
 const columnModifier = columnIndex % 2 === 0 ? 1 : -1;
 
 let rowModifier = 1; // default for even
 if (index % 2 === 1) rowModifier = 2; // odd
 if ((index + 1) % 5 === 0) rowModifier = 3; // 5n
 if ((index + 1) % 3 === 0) rowModifier = -1; // 3n
 
 return columnModifier * rowModifier;
}

export const getMasonryLayout = (items: readonly Entry[]) => {
  const gap = 100; // Now in same units as thumbnail dimensions
  const columnWidth = Math.max(...items.map(item => item.thumbnail.width)); // Use actual thumbnail width
  
  const totalItemHeight = items.reduce((sum, item) => sum + item.thumbnail.height, 0);
  const estimatedHeight = Math.sqrt(totalItemHeight * columnWidth);
  const optimalColumns = Math.max(1, Math.round(estimatedHeight / (columnWidth + gap)));
  
  const containerWidth = optimalColumns * columnWidth + (optimalColumns - 1) * gap;
  const columnHeights = Array(optimalColumns).fill(0);
  
  const positions = items.map(item => {
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    
    const localX = shortestColumnIndex * (columnWidth + gap) + columnWidth / 2;
    const localY = columnHeights[shortestColumnIndex] + item.thumbnail.height / 2;
    
    columnHeights[shortestColumnIndex] += item.thumbnail.height + gap;
    
    return { x: localX, y: localY };
  });
  
  const containerHeight = Math.max(...columnHeights) - gap;
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  const centeredPositions = positions.map((pos, index) => ({
    x: pos.x - centerX,
    y: pos.y - centerY,
    z: calculateZ(index, Math.floor(index / optimalColumns)) * GRID_DEPTH,
  }));
  
  return {
    positions: centeredPositions,
    containerWidth,
    containerHeight
  };
};