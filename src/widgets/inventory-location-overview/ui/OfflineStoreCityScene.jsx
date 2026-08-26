import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { getInventoryLocationTone } from '../model/inventoryLocationTone.js';

const ASSET_ROOT = '/assets/3d/dashboard/downtown';
const buildingUrls = Object.freeze([
  `${ASSET_ROOT}/building-large-2.glb`,
  `${ASSET_ROOT}/building-medium-2.glb`,
  `${ASSET_ROOT}/building-small-1.glb`,
]);

const cityPalette = Object.freeze({
  background: '#e8f5f1',
  sky: '#e8f5f1',
  ground: '#c8dfd8',
  sidewalk: '#e7ece8',
  road: '#31494a',
  roadLine: '#edf3ee',
  building: '#f7f7f2',
  buildingAlt: '#d4e1dc',
  buildingWarm: '#eee9df',
  contextBuilding: '#dce7e2',
  contextWindow: '#9fc8c0',
  window: '#54b9b1',
  trim: '#0d6549',
  roof: '#187a55',
  roofActive: '#0d6549',
  tree: '#6cab59',
  treeDark: '#4f914a',
  trunk: '#856a4c',
  good: '#27b06e',
  warning: '#fda643',
  danger: '#d92d20',
});

const storeLayouts = Object.freeze({
  DEPT_THEHYUNDAI_SEOUL: { shortName: '더현대서울', model: 0, position: [-5.9, 0, -2.45], height: 2.28 },
  DEPT_APGUJEONG: { shortName: '압구정점', model: 1, position: [-3.55, 0, -2.45], height: 2.02 },
  DEPT_TRADE_CENTER: { shortName: '무역점', model: 0, position: [-1.18, 0, -2.45], height: 2.34 },
  DEPT_CHEONHO: { shortName: '천호점', model: 2, position: [1.18, 0, -2.45], height: 1.88 },
  DEPT_SINCHON: { shortName: '신촌점', model: 2, position: [3.5, 0, -2.45], height: 1.84 },
  DEPT_MIA: { shortName: '미아점', model: 1, position: [5.75, 0, -2.45], height: 1.96 },
  DEPT_MOKDONG: { shortName: '목동점', model: 1, position: [-4.75, 0, 0], height: 2 },
  DEPT_JUNGDONG: { shortName: '중동점', model: 2, position: [-2.35, 0, 0], height: 1.82 },
  DEPT_KINTEX: { shortName: '킨텍스점', model: 2, position: [0, 0, 0], height: 1.9 },
  DEPT_PANGYO: { shortName: '판교점', model: 0, position: [2.65, 0, 0], height: 2.38 },
  HMART_ASAN_HOSPITAL: { shortName: 'Hmart 아산병원점', model: 2, position: [5.05, 0, 0], height: 1.78 },
  DEPT_CHUNGCHEONG: { shortName: '충청점', model: 1, position: [-4.05, 0, 2.55], height: 1.94 },
  DEPT_DAEGU: { shortName: '대구점', model: 0, position: [-1.35, 0, 2.55], height: 2.26 },
  DEPT_ULSAN: { shortName: '울산점', model: 2, position: [1.85, 0, 2.55], height: 1.86 },
  DEPT_BUSAN: { shortName: '부산점', model: 1, position: [4.65, 0, 2.55], height: 2 },
});

const fallbackLayouts = Object.values(storeLayouts);
const roofRatios = Object.freeze([
  [0.55, 0.54],
  [0.58, 0.56],
  [0.57, 0.46],
]);

function FixedCityCamera() {
  const { size } = useThree();
  const previousSizeRef = useRef('');

  useFrame(({ camera }) => {
    const sizeKey = `${size.width}:${size.height}`;
    if (previousSizeRef.current === sizeKey) return;
    previousSizeRef.current = sizeKey;
    camera.position.set(11.8, 10.6, 14.6);
    camera.zoom = Math.min(size.width / 16.4, size.height / 8.25, 58);
    camera.lookAt(0, 1.45, 0);
    camera.updateProjectionMatrix();
  });

  return null;
}

function usePreparedBuilding(modelIndex, targetHeight, tone) {
  const { scene } = useGLTF(buildingUrls[modelIndex]);

  return useMemo(() => {
    const clonedScene = scene.clone(true);
    const toneColor = cityPalette[tone];

    clonedScene.traverse((object) => {
      if (!object.isMesh) return;

      const materialName = (object.material?.name || '').toLowerCase();
      let nextMaterial;
      if (materialName.includes('glass')) {
        nextMaterial = new THREE.MeshPhysicalMaterial({
          color: cityPalette.window,
          emissive: toneColor,
          emissiveIntensity: tone === 'good' ? 0.02 : 0.05,
          roughness: 0.23,
          metalness: 0.06,
          transparent: true,
          opacity: 0.88,
        });
      } else if (materialName.includes('interior')) {
        nextMaterial = new THREE.MeshStandardMaterial({
          color: cityPalette.building,
          roughness: 0.76,
          metalness: 0.02,
        });
      } else if (materialName.includes('trim') || materialName.includes('dark')) {
        nextMaterial = new THREE.MeshStandardMaterial({ color: cityPalette.trim, roughness: 0.58, metalness: 0.1 });
      } else if (materialName.includes('metal')) {
        nextMaterial = new THREE.MeshStandardMaterial({
          color: cityPalette.buildingAlt,
          roughness: 0.58,
          metalness: 0.1,
        });
      } else if (materialName.includes('brick')) {
        nextMaterial = new THREE.MeshStandardMaterial({ color: cityPalette.buildingWarm, roughness: 0.86 });
      } else if (materialName.includes('asphalt')) {
        nextMaterial = new THREE.MeshStandardMaterial({ color: cityPalette.road, roughness: 0.96 });
      } else {
        nextMaterial = new THREE.MeshStandardMaterial({ color: cityPalette.building, roughness: 0.8 });
      }

      object.material = nextMaterial;
      object.castShadow = true;
      object.receiveShadow = true;
    });

    const initialBox = new THREE.Box3().setFromObject(clonedScene);
    const initialSize = initialBox.getSize(new THREE.Vector3());
    clonedScene.scale.setScalar(targetHeight / Math.max(initialSize.y, 0.01));
    const scaledBox = new THREE.Box3().setFromObject(clonedScene);
    const center = scaledBox.getCenter(new THREE.Vector3());
    const scaledSize = scaledBox.getSize(new THREE.Vector3());
    clonedScene.position.set(-center.x, -scaledBox.min.y, -center.z);
    return { depth: scaledSize.z, scene: clonedScene, width: scaledSize.x };
  }, [scene, targetHeight, tone]);
}

function SelectionPulse({ active, color, reducedMotion }) {
  const ringRef = useRef(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const scale = reducedMotion ? 1 : 1 + Math.sin(clock.elapsedTime * 2.2) * 0.08;
    ringRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={ringRef} position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.56, 0.73, 42]} />
      <meshBasicMaterial color={color} transparent opacity={active ? 0.64 : 0.22} depthWrite={false} />
    </mesh>
  );
}

function StoreBuilding({ active, layout, location, onActivate, onHoverChange, reducedMotion }) {
  const tone = getInventoryLocationTone(location, 'stores');
  const toneColor = cityPalette[tone];
  const building = usePreparedBuilding(layout.model, layout.height, tone);
  const [roofWidthRatio, roofDepthRatio] = roofRatios[layout.model];

  const handlePointerEnter = (event) => {
    event.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    document.body.style.cursor = 'default';
  };

  return (
    <group
      position={layout.position}
      onClick={(event) => {
        event.stopPropagation();
        onActivate(location.id);
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.08, 10]} />
        <meshStandardMaterial color="#f5f7f4" roughness={0.9} />
      </mesh>
      <group position={[0, 0.08, 0]}>
        <primitive object={building.scene} />
      </group>
      <RoundedBox
        args={[Math.max(0.5, building.width * roofWidthRatio), 0.06, Math.max(0.46, building.depth * roofDepthRatio)]}
        radius={0.025}
        smoothness={2}
        position={[0, layout.height + 0.11, 0]}
        castShadow
      >
        <meshStandardMaterial color={active ? cityPalette.roofActive : cityPalette.roof} roughness={0.66} />
      </RoundedBox>
      <SelectionPulse active={active} color={toneColor} reducedMotion={reducedMotion} />
      <mesh position={[0, layout.height + 0.32, 0]}>
        <sphereGeometry args={[active ? 0.095 : 0.075, 14, 10]} />
        <meshStandardMaterial color={toneColor} emissive={toneColor} emissiveIntensity={1.25} />
      </mesh>

      <Html position={[0, layout.height + 0.55, 0]} center style={{ pointerEvents: 'auto' }} zIndexRange={[1600, 20]}>
        <button
          type="button"
          aria-label={`${location.name}, 판매 가능 ${formatQuantity(location.availableStock)}, ${tone === 'danger' ? '위험' : tone === 'warning' ? '주의' : '정상'}`}
          aria-pressed={active}
          className={cn(
            'inline-flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[12px] font-[var(--font-weight-semibold)] shadow-[0_6px_16px_rgba(24,58,47,0.13)] backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
            active
              ? 'border-[#176d54] bg-[#176d54] text-white'
              : 'border-white/85 bg-white/95 text-[color:var(--text-heading)]',
            'hover:border-[color:var(--primary)] hover:bg-[var(--primary-soft)] hover:text-[color:var(--primary-strong)]',
          )}
          onClick={(event) => {
            event.stopPropagation();
            onActivate(location.id);
          }}
          onPointerEnter={(event) => {
            event.stopPropagation();
            onHoverChange(location.id);
          }}
          onPointerLeave={(event) => {
            event.stopPropagation();
            onHoverChange(null);
          }}
          onFocus={() => onHoverChange(location.id)}
          onBlur={() => onHoverChange(null)}
        >
          <span>{layout.shortName || location.shortName}</span>
          <strong
            className={cn(
              'tabular-nums text-[13px] font-[var(--font-weight-bold)]',
              active ? 'text-white hover:text-[color:var(--primary-strong)]' : 'text-[color:var(--text-heading)]',
            )}
          >
            {formatQuantity(location.availableStock)}
          </strong>
        </button>
      </Html>
    </group>
  );
}

function RoadLine({ count, from, to, z }) {
  return Array.from({ length: count }, (_, index) => {
    const x = THREE.MathUtils.lerp(from, to, index / Math.max(count - 1, 1));
    return (
      <mesh key={`${z}-${index}`} position={[x, 0.055, z]} receiveShadow>
        <boxGeometry args={[0.52, 0.018, 0.045]} />
        <meshBasicMaterial color={cityPalette.roadLine} />
      </mesh>
    );
  });
}

function CityTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.065, 0.5, 8]} />
        <meshStandardMaterial color={cityPalette.trunk} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.68, 0]} castShadow>
        <dodecahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial color={cityPalette.tree} roughness={0.9} />
      </mesh>
      <mesh position={[0.12, 0.78, 0]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color={cityPalette.treeDark} roughness={0.9} />
      </mesh>
    </group>
  );
}

function ContextBuilding({ height, position, width }) {
  return (
    <group position={position}>
      <RoundedBox args={[width, height, 0.92]} radius={0.08} position={[0, height / 2, 0]} castShadow>
        <meshStandardMaterial color={cityPalette.contextBuilding} roughness={0.92} />
      </RoundedBox>
      {Array.from({ length: Math.max(2, Math.floor(height / 0.38)) }, (_, index) => (
        <mesh key={index} position={[0, 0.28 + index * 0.38, 0.47]}>
          <boxGeometry args={[width * 0.68, 0.09, 0.025]} />
          <meshStandardMaterial color={cityPalette.contextWindow} roughness={0.68} />
        </mesh>
      ))}
    </group>
  );
}

function MovingCityCar({ color, phase, reducedMotion, z }) {
  const carRef = useRef(null);

  useFrame(({ clock }) => {
    if (!carRef.current) return;
    const x = reducedMotion ? -4 + phase * 8 : ((clock.elapsedTime * 0.48 + phase * 13) % 14) - 7;
    carRef.current.position.x = x;
  });

  return (
    <group ref={carRef} position={[0, 0.12, z]}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.48, 0.2, 0.27]} />
        <meshStandardMaterial color={color} roughness={0.52} metalness={0.06} />
      </mesh>
      <mesh position={[-0.02, 0.29, 0]} castShadow>
        <boxGeometry args={[0.25, 0.14, 0.23]} />
        <meshStandardMaterial color="#b9e3e5" roughness={0.35} />
      </mesh>
    </group>
  );
}

function CityGround({ reducedMotion }) {
  return (
    <group>
      <mesh position={[0, -0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15.3, 9.25]} />
        <meshStandardMaterial color={cityPalette.ground} roughness={0.98} />
      </mesh>

      {[-2.45, 0, 2.55].map((z, index) => (
        <RoundedBox
          key={z}
          args={[13.2 - index * 0.25, 0.07, 1.55]}
          radius={0.18}
          position={[0, 0.02, z]}
          receiveShadow
        >
          <meshStandardMaterial color={cityPalette.sidewalk} roughness={0.96} />
        </RoundedBox>
      ))}

      {[-1.25, 1.28].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.015, z]} receiveShadow>
            <boxGeometry args={[15.1, 0.06, 0.82]} />
            <meshStandardMaterial color={cityPalette.road} roughness={0.96} />
          </mesh>
          <RoadLine count={14} from={-6.7} to={6.7} z={z} />
        </group>
      ))}

      {[-6.92, 6.92].map((x) => (
        <mesh key={x} position={[x, 0.016, 0]} receiveShadow>
          <boxGeometry args={[0.72, 0.06, 9.15]} />
          <meshStandardMaterial color={cityPalette.road} roughness={0.96} />
        </mesh>
      ))}

      {[-6.25, -4.7, -3.1, -1.5, 0.1, 1.7, 3.3, 4.9, 6.25].map((x, index) => (
        <CityTree key={x} position={[x, 0.06, index % 2 === 0 ? 3.72 : -3.72]} scale={0.72 + (index % 3) * 0.08} />
      ))}
      <CityTree position={[-7.35, 0.04, -2.15]} scale={0.72} />
      <CityTree position={[7.35, 0.04, 2.1]} scale={0.78} />
      <MovingCityCar color="#00b0d7" phase={0.08} reducedMotion={reducedMotion} z={-1.25} />
      <MovingCityCar color="#fda643" phase={0.55} reducedMotion={reducedMotion} z={1.28} />

      {[
        [-5.7, -4.2, 1.2, 1.8],
        [-3.9, -4.2, 1.45, 2.25],
        [-1.85, -4.2, 1.55, 1.95],
        [0.35, -4.2, 1.5, 2.55],
        [2.45, -4.2, 1.45, 2.05],
        [4.45, -4.2, 1.5, 2.4],
        [6.25, -4.2, 1.2, 1.75],
      ].map(([x, z, width, height]) => (
        <ContextBuilding key={x} height={height} position={[x, -0.02, z]} width={width} />
      ))}
    </group>
  );
}

function OfflineStoreCityWorld({ activeLocationId, locations, onActivate, onHoverChange, reducedMotion }) {
  const locationsWithLayout = useMemo(
    () =>
      locations.map((location, index) => ({
        location,
        layout: storeLayouts[location.id] ?? fallbackLayouts[index % fallbackLayouts.length],
      })),
    [locations],
  );

  useEffect(
    () => () => {
      document.body.style.cursor = 'default';
    },
    [],
  );

  return (
    <>
      <color attach="background" args={[cityPalette.background]} />
      <hemisphereLight args={[cityPalette.sky, cityPalette.road, 1.65]} />
      <directionalLight
        castShadow
        color="#fff5dc"
        intensity={3.65}
        position={[-12, 28, 16]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={48}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <FixedCityCamera />
      <CityGround reducedMotion={reducedMotion} />
      <ContactShadows
        frames={1}
        position={[0, 0.045, 0]}
        opacity={0.25}
        scale={17}
        blur={2.4}
        far={5}
        resolution={256}
        color="#456057"
      />

      {locationsWithLayout.map(({ layout, location }) => (
        <StoreBuilding
          key={location.id}
          active={location.id === activeLocationId}
          layout={layout}
          location={location}
          onActivate={onActivate}
          onHoverChange={onHoverChange}
          reducedMotion={reducedMotion}
        />
      ))}
    </>
  );
}

export function OfflineStoreCityScene({
  activeLocationId,
  locations,
  onActivate,
  onHoverChange,
  reducedMotion,
  renderActive = true,
}) {
  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.25]}
      frameloop={renderActive ? 'always' : 'never'}
      camera={{ position: [11.8, 10.6, 14.6], zoom: 44, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
      onPointerMissed={() => onHoverChange(null)}
    >
      <OfflineStoreCityWorld
        activeLocationId={activeLocationId}
        locations={locations}
        onActivate={onActivate}
        onHoverChange={onHoverChange}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

buildingUrls.forEach((url) => useGLTF.preload(url));
