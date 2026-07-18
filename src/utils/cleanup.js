export function disposeObject3D(object) {
  if (!object) return;
  object.traverse?.((child) => {
    child.geometry?.dispose?.();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose?.());
    } else {
      child.material?.dispose?.();
    }
  });
  object.removeFromParent?.();
}

export function clampDelta(delta, maximum = 1 / 30) {
  if (!Number.isFinite(delta) || delta < 0) return 0;
  return Math.min(delta, maximum);
}
