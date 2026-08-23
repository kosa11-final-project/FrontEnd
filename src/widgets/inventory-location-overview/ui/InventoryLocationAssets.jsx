import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const ASSET_ROOT = '/assets/3d/dashboard';

const warehouseUrls = Object.freeze([
  `${ASSET_ROOT}/industrial/building-h.glb`,
  `${ASSET_ROOT}/industrial/building-i.glb`,
  `${ASSET_ROOT}/industrial/building-j.glb`,
  `${ASSET_ROOT}/industrial/building-p.glb`,
  `${ASSET_ROOT}/industrial/building-s.glb`,
]);

const vehicleUrls = Object.freeze({
  delivery: `${ASSET_ROOT}/vehicles/delivery.glb`,
  truck: `${ASSET_ROOT}/vehicles/truck.glb`,
});

function usePreparedAsset(url, { emissive = '#000000', tint = '#ffffff' } = {}) {
  const { scene } = useGLTF(url);

  return useMemo(() => {
    const clonedScene = scene.clone(true);
    clonedScene.traverse((object) => {
      if (!object.isMesh) return;

      object.castShadow = true;
      object.receiveShadow = true;
      object.material = object.material.clone();
      object.material.color.multiply(new THREE.Color(tint));
      object.material.emissive = new THREE.Color(emissive);
      object.material.emissiveIntensity = emissive === '#000000' ? 0 : 0.07;
      object.material.roughness = Math.min(object.material.roughness ?? 0.72, 0.78);
      object.material.needsUpdate = true;
    });
    return clonedScene;
  }, [emissive, scene, tint]);
}

export function WarehouseAsset({ active = false, index, scale = 1 }) {
  const url = warehouseUrls[index % warehouseUrls.length];
  const scene = usePreparedAsset(url, {
    emissive: active ? '#4ab88d' : '#000000',
    tint: active ? '#f4fffb' : '#f4faff',
  });

  return <primitive object={scene} position={[0, 0.13, 0]} rotation={[0, -Math.PI / 2, 0]} scale={1.72 * scale} />;
}

export function VehicleAsset({ kind, scale = 1 }) {
  const scene = usePreparedAsset(vehicleUrls[kind], {
    tint: kind === 'truck' ? '#fff5e8' : '#eefcff',
  });

  return <primitive object={scene} rotation={[0, Math.PI / 2, 0]} scale={0.92 * scale} />;
}

warehouseUrls.forEach((url) => useGLTF.preload(url));
Object.values(vehicleUrls).forEach((url) => useGLTF.preload(url));
