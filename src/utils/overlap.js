const EPSILON = 1e-9;

function getAxisSize(block, axis) {
  return axis === 'x' ? block.width : block.depth;
}

/**
 * Calculate one-axis overlap, retained section and cut fragment.
 * Blocks are axis-aligned and represented by center coordinates and dimensions.
 */
export function calculatePlacement(lower, moving, axis, perfectTolerance = 0) {
  if (axis !== 'x' && axis !== 'z') throw new Error('axis must be x or z');

  const lowerSize = getAxisSize(lower, axis);
  const movingSize = getAxisSize(moving, axis);
  const lowerCenter = lower[axis];
  const movingCenter = moving[axis];
  const delta = movingCenter - lowerCenter;

  const lowerMin = lowerCenter - lowerSize / 2;
  const lowerMax = lowerCenter + lowerSize / 2;
  const movingMin = movingCenter - movingSize / 2;
  const movingMax = movingCenter + movingSize / 2;

  if (Math.abs(delta) <= perfectTolerance) {
    return {
      hit: true,
      perfect: true,
      delta,
      overlap: Math.min(lowerSize, movingSize),
      retained: {
        center: lowerCenter,
        size: Math.min(lowerSize, movingSize),
      },
      fragment: null,
    };
  }

  const intersectionStart = Math.max(lowerMin, movingMin);
  const intersectionEnd = Math.min(lowerMax, movingMax);
  const overlap = intersectionEnd - intersectionStart;

  if (overlap <= EPSILON) {
    return {
      hit: false,
      perfect: false,
      delta,
      overlap: 0,
      retained: null,
      fragment: {
        center: movingCenter,
        size: movingSize,
      },
    };
  }

  const retainedCenter = (intersectionStart + intersectionEnd) / 2;
  let fragment = null;

  if (movingCenter >= lowerCenter) {
    const size = movingMax - intersectionEnd;
    if (size > EPSILON) {
      fragment = {
        center: intersectionEnd + size / 2,
        size,
        side: 1,
      };
    }
  } else {
    const size = intersectionStart - movingMin;
    if (size > EPSILON) {
      fragment = {
        center: movingMin + size / 2,
        size,
        side: -1,
      };
    }
  }

  return {
    hit: true,
    perfect: false,
    delta,
    overlap,
    retained: {
      center: retainedCenter,
      size: overlap,
    },
    fragment,
  };
}
