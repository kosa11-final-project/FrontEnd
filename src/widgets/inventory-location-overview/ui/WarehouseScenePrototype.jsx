import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const palette = Object.freeze({
  sky: '#dff5f4',
  grass: '#b9dda9',
  grassDark: '#73ad63',
  concrete: '#d9dfdd',
  road: '#343735',
  roadLine: '#ead39a',
  wall: '#fff3df',
  blue: '#176f0f',
  blueDark: '#0f500a',
  orange: '#ca7700',
  coral: '#e85d45',
  mint: '#48b438',
  dark: '#1e1e1e',
});

const vehicleAssets = Object.freeze({
  delivery: '/assets/3d/dashboard/vehicles/delivery.glb',
  truck: '/assets/3d/dashboard/vehicles/truck.glb',
});

const prototypeCenters = Object.freeze([
  {
    id: 'gyeonggi-1',
    name: '경기1센터',
    region: '수도권',
    currentQty: 14267,
    availableQty: 11938,
    expiringQty: 515,
    outboundQty: 1008,
    riskSkuCount: 0,
    riskLevel: 'warning',
    position: [-4.15, 0.1, -1.72],
    labelOffset: [-0.25, 0, -0.18],
    scale: 0.28,
  },
  {
    id: 'suji',
    name: '수지센터',
    region: '수도권',
    currentQty: 44164,
    availableQty: 37214,
    expiringQty: 1290,
    outboundQty: 3574,
    riskSkuCount: 0,
    riskLevel: 'danger',
    position: [-0.28, 0.1, -1.72],
    labelOffset: [0.05, 0.12, -0.12],
    scale: 0.38,
  },
  {
    id: 'yeongnam',
    name: '영남센터',
    region: '영남권',
    currentQty: 33782,
    availableQty: 28279,
    expiringQty: 1236,
    outboundQty: 2801,
    riskSkuCount: 2,
    riskLevel: 'warning',
    position: [3.92, 0.1, -1.42],
    labelOffset: [0.2, 0.04, -0.15],
    scale: 0.34,
  },
  {
    id: 'gyeonggi-2',
    name: '경기2센터',
    region: '수도권',
    currentQty: 18420,
    availableQty: 15300,
    expiringQty: 740,
    outboundQty: 1675,
    riskSkuCount: 1,
    riskLevel: 'stable',
    position: [-2.55, 0.1, 0.74],
    labelOffset: [-0.45, 0.04, 0.1],
    scale: 0.3,
  },
  {
    id: 'honam',
    name: '호남센터',
    region: '호남권',
    currentQty: 78491,
    availableQty: 66314,
    expiringQty: 2374,
    outboundQty: 6154,
    riskSkuCount: 3,
    riskLevel: 'danger',
    position: [1.75, 0.1, 0.82],
    labelOffset: [0.28, 0.12, 0.12],
    scale: 0.43,
  },
]);

const riskColors = Object.freeze({
  stable: '#1e9d0d',
  warning: '#ca7700',
  danger: '#e85d45',
});

const centerSceneLayout = Object.freeze([
  { position: [-4.15, 0.1, -1.72], labelOffset: [-0.25, 0, -0.18], scale: 0.28 },
  { position: [-0.28, 0.1, -1.72], labelOffset: [0.05, 0.12, -0.12], scale: 0.38 },
  { position: [3.92, 0.1, -1.42], labelOffset: [0.2, 0.04, -0.15], scale: 0.34 },
  { position: [-2.55, 0.1, 0.74], labelOffset: [-0.45, 0.04, 0.1], scale: 0.3 },
  { position: [1.75, 0.1, 0.82], labelOffset: [0.28, 0.12, 0.12], scale: 0.43 },
]);

function getCenterRiskLevel(location) {
  if (location.riskSkuCount >= 5 || location.nearExpiryStock >= 1200) return 'danger';
  if (location.riskSkuCount >= 2 || location.nearExpiryStock >= 500) return 'warning';
  return 'stable';
}

function mapDashboardCenter(location, index) {
  const layout = centerSceneLayout[index % centerSceneLayout.length];
  return {
    id: location.id,
    name: location.shortName || location.name,
    fullName: location.name,
    region: location.region,
    currentQty: location.currentStock,
    availableQty: location.availableStock,
    expiringQty: location.nearExpiryStock,
    outboundQty: location.outboundStock,
    riskSkuCount: location.riskSkuCount,
    riskLevel: getCenterRiskLevel(location),
    ...layout,
  };
}

const formatQuantity = (value) => new Intl.NumberFormat('ko-KR').format(value);

function CameraRig() {
  const previousSizeRef = useRef('');

  useFrame(({ camera, size }) => {
    const sizeKey = `${size.width}:${size.height}`;
    if (previousSizeRef.current === sizeKey) return;
    previousSizeRef.current = sizeKey;
    const tallSceneRatio = THREE.MathUtils.clamp((size.height - 420) / 260, 0, 1);
    const lookTarget = new THREE.Vector3(
      0,
      THREE.MathUtils.lerp(0.55, 0.3, tallSceneRatio),
      THREE.MathUtils.lerp(-0.05, 0.22, tallSceneRatio),
    );
    camera.position.set(9.4, 9.3, 11.2);
    camera.zoom = Math.min(size.width / 14.5, size.height / 6.8, 66);
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();
  });

  return null;
}

function Parcel({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.38, 0.34, 0.38]} radius={0.03} position={[0, 0.17, 0]} castShadow>
        <meshStandardMaterial color="#c98742" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.345, 0]}>
        <boxGeometry args={[0.065, 0.012, 0.39]} />
        <meshStandardMaterial color="#f0c47b" roughness={0.72} />
      </mesh>
    </group>
  );
}

function ParcelStack({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <Parcel position={[-0.21, 0, 0]} />
      <Parcel position={[0.21, 0, 0]} />
      <Parcel position={[0, 0.34, 0]} />
    </group>
  );
}

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 0.68, 10]} />
        <meshStandardMaterial color="#7c5c42" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.88, 0]} castShadow>
        <dodecahedronGeometry args={[0.48, 0]} />
        <meshStandardMaterial color={palette.grassDark} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Worker({ position, rotation = [0, 0, 0], vestColor = '#48a86d' }) {
  return (
    <group position={position} rotation={rotation} scale={0.92}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.13, 14, 10]} />
        <meshStandardMaterial color="#e5aa75" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.36, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.3, 4, 8]} />
        <meshStandardMaterial color={vestColor} roughness={0.66} />
      </mesh>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]}>
          <boxGeometry args={[0.06, 0.28, 0.08]} />
          <meshStandardMaterial color="#344f5b" roughness={0.76} />
        </mesh>
      ))}
    </group>
  );
}

function VehicleModel({ kind = 'truck', targetLength = 2.2, accentColor = palette.orange }) {
  const { scene } = useGLTF(vehicleAssets[kind]);
  const preparedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = object.material.clone();
      object.material.roughness = Math.min(object.material.roughness ?? 0.7, 0.78);

      const hsl = {};
      object.material.color?.getHSL(hsl);
      const isBodyColor = (hsl.s ?? 0) > 0.22 && (hsl.l ?? 0) > 0.18 && !((hsl.h ?? 0) > 0.47 && (hsl.h ?? 0) < 0.66);
      if (isBodyColor) object.material.color.set(accentColor);
    });

    clone.rotation.y = -Math.PI / 2;
    clone.updateMatrixWorld(true);
    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const horizontalLength = Math.max(initialSize.x, initialSize.z);
    const normalizationScale = horizontalLength > 0 ? targetLength / horizontalLength : 1;
    clone.scale.setScalar(normalizationScale);
    clone.updateMatrixWorld(true);

    const normalizedBounds = new THREE.Box3().setFromObject(clone);
    const normalizedCenter = normalizedBounds.getCenter(new THREE.Vector3());
    clone.position.set(-normalizedCenter.x, -normalizedBounds.min.y, -normalizedCenter.z);
    return clone;
  }, [accentColor, scene, targetLength]);

  return <primitive object={preparedScene} />;
}

function MovingTruck({ reducedMotion }) {
  const groupRef = useRef(null);
  const route = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(-4.75, 0.14, 2.65),
          new THREE.Vector3(4.75, 0.14, 2.65),
          new THREE.Vector3(5.7, 0.14, 1.85),
          new THREE.Vector3(5.7, 0.14, -2.35),
          new THREE.Vector3(4.75, 0.14, -3.05),
          new THREE.Vector3(-4.75, 0.14, -3.05),
          new THREE.Vector3(-5.7, 0.14, -2.35),
          new THREE.Vector3(-5.7, 0.14, 1.85),
        ],
        true,
        'centripetal',
        0.45,
      ),
    [],
  );
  const routePoint = useMemo(() => new THREE.Vector3(), []);
  const routeTangent = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const progress = reducedMotion ? 0.08 : (clock.elapsedTime * 0.018) % 1;
    route.getPointAt(progress, routePoint);
    route.getTangentAt(progress, routeTangent);
    groupRef.current.position.copy(routePoint);
    groupRef.current.rotation.y = Math.atan2(routeTangent.z, -routeTangent.x);
  });

  return (
    <group ref={groupRef}>
      <VehicleModel kind="truck" targetLength={1.42} accentColor={palette.orange} />
    </group>
  );
}

function ParkedTruck() {
  return (
    <group position={[-4.45, 0.13, 1.42]} rotation={[0, Math.PI / 2, 0]}>
      <VehicleModel kind="delivery" targetLength={1.28} accentColor={palette.coral} />
    </group>
  );
}

function Forklift({ reducedMotion }) {
  const groupRef = useRef(null);
  const parcelRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || !parcelRef.current) return;
    if (reducedMotion) {
      groupRef.current.position.x = -3.72;
      parcelRef.current.visible = true;
      return;
    }

    const phase = (clock.elapsedTime * 0.105) % 1;
    let progress;
    let carriesParcel = true;

    if (phase < 0.16) {
      progress = 0;
    } else if (phase < 0.4) {
      progress = THREE.MathUtils.smoothstep((phase - 0.16) / 0.24, 0, 1);
    } else if (phase < 0.56) {
      progress = 1;
    } else if (phase < 0.8) {
      progress = 1 - THREE.MathUtils.smoothstep((phase - 0.56) / 0.24, 0, 1);
      carriesParcel = false;
    } else {
      progress = 0;
      carriesParcel = false;
    }

    groupRef.current.position.x = THREE.MathUtils.lerp(-3.92, -3.18, progress);
    parcelRef.current.visible = carriesParcel;
  });

  return (
    <group ref={groupRef} position={[-3.92, 0.14, 1.42]} rotation={[0, Math.PI, 0]} scale={0.5}>
      <RoundedBox args={[0.72, 0.42, 0.56]} radius={0.07} position={[0, 0.31, 0]} castShadow>
        <meshStandardMaterial color={palette.orange} roughness={0.58} />
      </RoundedBox>
      <mesh position={[-0.27, 0.73, 0]}>
        <boxGeometry args={[0.09, 0.82, 0.58]} />
        <meshStandardMaterial color={palette.dark} roughness={0.64} />
      </mesh>
      {[-0.18, 0.18].map((z) => (
        <mesh key={z} position={[-0.62, 0.14, z]}>
          <boxGeometry args={[0.7, 0.06, 0.06]} />
          <meshStandardMaterial color={palette.dark} />
        </mesh>
      ))}
      <group ref={parcelRef}>
        <Parcel position={[-0.78, 0.18, 0]} scale={0.8} />
      </group>
    </group>
  );
}

function createGableRoofGeometry() {
  const geometry = new THREE.BufferGeometry();
  const width = 6.1;
  const depth = 3.8;
  const baseY = 2.08;
  const ridgeY = 2.9;
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const vertices = new Float32Array([
    -halfWidth,
    baseY,
    halfDepth,
    halfWidth,
    baseY,
    halfDepth,
    0,
    ridgeY,
    halfDepth,
    -halfWidth,
    baseY,
    -halfDepth,
    halfWidth,
    baseY,
    -halfDepth,
    0,
    ridgeY,
    -halfDepth,
  ]);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 2, 5, 4, 3, 0, 2, 5, 0, 5, 3, 2, 1, 4, 2, 4, 5]);
  geometry.computeVertexNormals();
  return geometry;
}

function Warehouse({ onHoverChange, onSelect, riskColor, selected }) {
  const roofGeometry = useMemo(() => createGableRoofGeometry(), []);
  const [hovered, setHovered] = useState(false);

  return (
    <group
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
        onHoverChange(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        setHovered(false);
        onHoverChange(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      {selected && (
        <mesh position={[0, 0.09, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.25, 3.55, 48]} />
          <meshBasicMaterial color="#1e9d0d" transparent opacity={0.68} />
        </mesh>
      )}
      <RoundedBox args={[5.7, 2.05, 3.4]} radius={0.16} position={[0, 1.05, -0.55]} castShadow receiveShadow>
        <meshStandardMaterial color={palette.wall} roughness={0.76} />
      </RoundedBox>
      <mesh geometry={roofGeometry} position={[0, 0, -0.55]} castShadow>
        <meshStandardMaterial color={palette.blue} roughness={0.58} flatShading />
      </mesh>

      {[-1.65, 0, 1.65].map((x, index) => (
        <group key={x} position={[x, 0.1, 1.19]}>
          <RoundedBox args={[1.15, 0.12, 0.72]} radius={0.04} position={[0, 0.03, 0.18]} receiveShadow>
            <meshStandardMaterial color="#b9c5c2" roughness={0.84} />
          </RoundedBox>
          <mesh position={[0, 0.76, 0]}>
            <boxGeometry args={[0.9, 1.25, 0.07]} />
            <meshStandardMaterial color={index === 1 ? palette.blueDark : '#52646c'} roughness={0.67} />
          </mesh>
          <mesh position={[0, 1.48, 0.1]}>
            <boxGeometry args={[1.18, 0.14, 0.36]} />
            <meshStandardMaterial color={palette.blueDark} roughness={0.56} />
          </mesh>
        </group>
      ))}

      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <mesh key={x} position={[x, 1.45, -2.28]}>
          <boxGeometry args={[0.62, 0.42, 0.06]} />
          <meshStandardMaterial color="#bfe4ea" roughness={0.38} />
        </mesh>
      ))}

      <RoundedBox args={[1.3, 0.52, 0.08]} radius={0.05} position={[0, 1.73, 1.19]}>
        <meshStandardMaterial color="#fffaf0" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 1.74, 1.25]}>
        <boxGeometry args={[0.34, 0.34, 0.04]} />
        <meshStandardMaterial color={palette.mint} emissive={palette.mint} emissiveIntensity={0.12} />
      </mesh>

      <mesh position={[0, 0.08, 1.62]} receiveShadow>
        <boxGeometry args={[5.65, 0.12, 0.9]} />
        <meshStandardMaterial color="#b9c5c2" roughness={0.86} />
      </mesh>

      {[-2.53, 2.53].map((x) => (
        <group key={x} position={[x, 0.48, 1.45]}>
          <mesh castShadow>
            <boxGeometry args={[0.16, 0.95, 0.16]} />
            <meshStandardMaterial color={palette.orange} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.1, 14, 10]} />
            <meshStandardMaterial color="#ffe595" emissive="#ffc23b" emissiveIntensity={0.42} />
          </mesh>
        </group>
      ))}

      <group position={[-2.35, 2.3, 1]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.32, 32]} />
          <meshBasicMaterial color={riskColor} transparent opacity={0.62} />
        </mesh>
        <pointLight color={riskColor} intensity={hovered || selected ? 3.4 : 1.3} distance={3} />
      </group>
    </group>
  );
}

function WarehouseNode({ center, onHoverChange, selected, onSelect }) {
  const riskColor = riskColors[center.riskLevel];
  const labelHeight = center.scale * 3.8 + 0.24;

  return (
    <group position={center.position}>
      <group scale={center.scale}>
        <Warehouse onHoverChange={onHoverChange} onSelect={onSelect} riskColor={riskColor} selected={selected} />
      </group>

      <Html
        center
        position={[center.labelOffset[0], labelHeight + center.labelOffset[1], center.labelOffset[2]]}
        style={{ pointerEvents: 'auto', width: '138px' }}
        zIndexRange={[500, 100]}
      >
        <button
          type="button"
          onClick={onSelect}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          className="flex w-[138px] items-center justify-between gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-bold shadow-[0_8px_18px_rgba(42,76,66,0.16)] backdrop-blur-md transition-transform hover:-translate-y-0.5"
          style={{
            backgroundColor: selected ? 'rgba(30, 125, 13, 0.95)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: selected ? '#1e9d0d' : 'rgba(255, 255, 255, 0.92)',
            color: selected ? '#ffffff' : '#263b3d',
          }}
          aria-label={`${center.name} 선택`}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: riskColor }} />
          <span>{center.name}</span>
          <strong>{formatQuantity(center.availableQty)}개</strong>
        </button>
      </Html>
    </group>
  );
}

function RoadDashes() {
  return (
    <>
      {[2.65, -3.05].flatMap((z) =>
        Array.from({ length: 10 }, (_, index) => (
          <mesh key={`${z}-${index}`} position={[-4.5 + index, 0.155, z]} receiveShadow>
            <boxGeometry args={[0.52, 0.025, 0.07]} />
            <meshStandardMaterial color={palette.roadLine} roughness={0.78} />
          </mesh>
        )),
      )}
      {[-5.7, 5.7].flatMap((x) =>
        Array.from({ length: 5 }, (_, index) => (
          <mesh key={`${x}-${index}`} position={[x, 0.155, -2 + index * 0.95]} receiveShadow>
            <boxGeometry args={[0.07, 0.025, 0.5]} />
            <meshStandardMaterial color={palette.roadLine} roughness={0.78} />
          </mesh>
        )),
      )}
    </>
  );
}

function ShippingContainer({ color, position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.75, 0.82, 0.88]} radius={0.05} position={[0, 0.43, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.73} />
      </RoundedBox>
      {[-0.68, -0.34, 0, 0.34, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.43, 0.451]}>
          <boxGeometry args={[0.035, 0.68, 0.02]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.34} />
        </mesh>
      ))}
    </group>
  );
}

function ContainerYard() {
  return (
    <group>
      <RoundedBox args={[2.35, 0.055, 1.92]} radius={0.05} position={[4.18, 0.12, 1.05]} receiveShadow>
        <meshStandardMaterial color="#c5ccc7" roughness={0.94} />
      </RoundedBox>
      {[3.28, 3.68, 4.08, 4.48, 4.88].map((x) => (
        <mesh key={x} position={[x, 0.16, 1.98]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.24, 0.055]} />
          <meshStandardMaterial color="#e6bd44" roughness={0.8} />
        </mesh>
      ))}
      <ShippingContainer color="#ca7700" position={[4.18, 0.15, 1.5]} />
      <ShippingContainer color="#3e473f" position={[4.18, 0.15, 0.56]} />
    </group>
  );
}

function LoadingBay() {
  return (
    <group>
      <RoundedBox args={[2.55, 0.045, 0.98]} radius={0.04} position={[-3.65, 0.11, 1.45]} receiveShadow>
        <meshStandardMaterial color="#cbd2ce" roughness={0.95} />
      </RoundedBox>
      {[-4.7, -4.25, -3.8, -3.35, -2.9].map((x) => (
        <mesh key={x} position={[x, 0.145, 1.84]} rotation={[-Math.PI / 2, 0, -0.38]}>
          <planeGeometry args={[0.28, 0.055]} />
          <meshStandardMaterial color="#e7bf43" roughness={0.82} />
        </mesh>
      ))}
    </group>
  );
}

function LampPost({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.05, 1.5, 10]} />
        <meshStandardMaterial color={palette.dark} roughness={0.65} />
      </mesh>
      <mesh position={[0.17, 1.48, 0]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.38, 0.06, 0.06]} />
        <meshStandardMaterial color={palette.dark} />
      </mesh>
      <mesh position={[0.34, 1.4, 0]}>
        <boxGeometry args={[0.23, 0.08, 0.18]} />
        <meshStandardMaterial color="#fff0a8" emissive="#ffdc72" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function RegionZone({ color, position, size }) {
  return (
    <RoundedBox args={[size[0], 0.045, size[1]]} radius={0.18} position={position} receiveShadow>
      <meshStandardMaterial color={color} roughness={0.96} />
    </RoundedBox>
  );
}

function CampusRoadNetwork() {
  return (
    <>
      <RoundedBox args={[12.1, 0.065, 1.02]} radius={0.08} position={[0, 0.12, 2.65]} receiveShadow>
        <meshStandardMaterial color={palette.road} roughness={0.9} />
      </RoundedBox>
      <RoundedBox args={[12.1, 0.065, 1.02]} radius={0.08} position={[0, 0.12, -3.05]} receiveShadow>
        <meshStandardMaterial color={palette.road} roughness={0.9} />
      </RoundedBox>
      {[-5.7, 5.7].map((x) => (
        <RoundedBox key={x} args={[1.02, 0.065, 5.75]} radius={0.08} position={[x, 0.12, -0.2]} receiveShadow>
          <meshStandardMaterial color={palette.road} roughness={0.9} />
        </RoundedBox>
      ))}
      {[-3.15, 0.55, 3.65].map((x) => (
        <RoundedBox key={x} args={[0.26, 0.04, 3.65]} radius={0.025} position={[x, 0.12, -0.48]} receiveShadow>
          <meshStandardMaterial color="#8d978e" roughness={0.94} />
        </RoundedBox>
      ))}
    </>
  );
}

function BackdropScenery() {
  const hills = [
    [-5.2, 0.74, -3.42, 1.18, '#9bc27d'],
    [-3.9, 0.58, -3.5, 0.92, '#add08d'],
    [-2.75, 0.48, -3.52, 0.78, '#92bd78'],
    [2.65, 0.46, -3.53, 0.72, '#a9cb87'],
    [3.75, 0.66, -3.48, 1, '#91bb75'],
    [5.05, 0.52, -3.42, 0.82, '#a6ca83'],
  ];

  return (
    <>
      {hills.map(([x, y, z, radius, color]) => (
        <mesh key={`${x}-${z}`} position={[x, y * 0.62, z]} scale={[radius, y * 0.72, radius * 0.62]} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} roughness={0.96} flatShading />
        </mesh>
      ))}

      {[-4.8, -2.4, 0, 2.4, 4.8].map((x) => (
        <group key={x} position={[x, 0.12, -2.83]}>
          <mesh position={[0, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.84, 8]} />
            <meshStandardMaterial color="#6d7f79" roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.76, 0]}>
            <boxGeometry args={[0.55, 0.055, 0.055]} />
            <meshStandardMaterial color="#7f918b" roughness={0.86} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function SkyBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(circle at 72% 16%, rgba(255,255,255,0.92) 0, rgba(255,255,255,0) 27%), linear-gradient(145deg, #edf8f4 0%, #e4f2ec 48%, #f6f3e9 100%)',
      }}
    />
  );
}

function DistantFactory({ position, scale = 1, accent = '#789688' }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[1.8, 0.65, 1.05]} radius={0.06} position={[0, 0.33, 0]}>
        <meshStandardMaterial color="#c7d3cd" roughness={0.96} />
      </RoundedBox>
      <mesh position={[0, 0.74, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.95, 0.16, 1.18]} />
        <meshStandardMaterial color={accent} roughness={0.92} />
      </mesh>
      {[-0.52, 0, 0.52].map((x) => (
        <mesh key={x} position={[x, 0.35, 0.53]}>
          <boxGeometry args={[0.28, 0.3, 0.035]} />
          <meshStandardMaterial color="#8ba9a5" roughness={0.76} />
        </mesh>
      ))}
      <mesh position={[0.57, 1.05, -0.2]}>
        <cylinderGeometry args={[0.08, 0.1, 0.7, 8]} />
        <meshStandardMaterial color="#718078" roughness={0.94} />
      </mesh>
    </group>
  );
}

function DistantIndustrialBackdrop() {
  return (
    <group position={[0, -0.32, -4.35]}>
      <RoundedBox args={[15.8, 0.18, 2.5]} radius={0.08} position={[0, 0, 0]}>
        <meshStandardMaterial color="#d7e2d8" roughness={1} />
      </RoundedBox>

      <RoundedBox args={[15.4, 0.04, 0.48]} radius={0.02} position={[0, 0.13, 0.68]}>
        <meshStandardMaterial color="#77847e" roughness={0.98} />
      </RoundedBox>
      {Array.from({ length: 22 }, (_, index) => (
        <mesh key={index} position={[-7.35 + index * 0.7, 0.16, 0.68]}>
          <boxGeometry args={[0.06, 0.035, 0.72]} />
          <meshStandardMaterial color="#a7b2ac" roughness={0.96} />
        </mesh>
      ))}

      <DistantFactory position={[-5.2, 0.14, -0.25]} scale={0.86} accent="#84998c" />
      <DistantFactory position={[-2.85, 0.14, -0.34]} scale={0.72} accent="#9baa9f" />
      <DistantFactory position={[2.75, 0.14, -0.3]} scale={0.8} accent="#7e9688" />
      <DistantFactory position={[5.15, 0.14, -0.2]} scale={0.68} accent="#a1aea5" />

      {[-6.8, -4.05, -1.25, 1.05, 4.05, 6.65].map((x, index) => (
        <Tree key={x} position={[x, 0.12, index % 2 === 0 ? -0.72 : -0.88]} scale={0.48} />
      ))}
    </group>
  );
}

function PrototypeScene({ centers, onHoverCenter, onSelectCenter, reducedMotion, selectedCenterId }) {
  return (
    <>
      <fog attach="fog" args={['#e7f1eb', 16, 27]} />
      <ambientLight intensity={0.92} />
      <hemisphereLight args={['#ffffff', '#87ae6c', 1.15]} />
      <directionalLight
        castShadow
        color="#fff9e8"
        intensity={2.4}
        position={[7, 11, 9]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />

      <CameraRig />
      <DistantIndustrialBackdrop />
      <RoundedBox args={[13.6, 0.34, 7.4]} radius={0.12} position={[0, -0.17, 0]} receiveShadow>
        <meshStandardMaterial color={palette.grass} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[12.1, 0.1, 5.5]} radius={0.04} position={[0, 0.02, -0.35]} receiveShadow>
        <meshStandardMaterial color={palette.concrete} roughness={0.92} />
      </RoundedBox>
      <RegionZone color="#e4f0dd" position={[-2.65, 0.085, -0.72]} size={[6.35, 4.55]} />
      <RegionZone color="#edf3e7" position={[1.38, 0.086, 0.92]} size={[4.3, 1.75]} />
      <RegionZone color="#f2e9da" position={[3.62, 0.087, -1.52]} size={[3.65, 2.45]} />
      <CampusRoadNetwork />
      <RoadDashes />
      <LoadingBay />
      <ContainerYard />

      {[-2.65, -1.65, -0.65, 0.35, 1.35, 2.35].map((x) => (
        <mesh key={x} position={[x, 0.135, 1.7]} rotation={[-Math.PI / 2, 0, -0.42]} receiveShadow>
          <planeGeometry args={[0.72, 0.055]} />
          <meshStandardMaterial color="#f4cc45" roughness={0.74} />
        </mesh>
      ))}

      {centers.map((center) => (
        <WarehouseNode
          key={center.id}
          center={center}
          onHoverChange={(hovered) => onHoverCenter?.(hovered ? center.id : null)}
          selected={selectedCenterId === center.id}
          onSelect={() => onSelectCenter(center.id)}
        />
      ))}
      <MovingTruck reducedMotion={reducedMotion} />
      <ParkedTruck />
      <Forklift reducedMotion={reducedMotion} />
      <Worker position={[-3.05, 0.16, 1.38]} rotation={[0, -0.6, 0]} vestColor="#1e9d0d" />
      <Worker position={[-4.68, 0.16, 1.02]} rotation={[0, 0.55, 0]} vestColor="#ca7700" />
      <Worker position={[3.2, 0.16, 1.28]} rotation={[0, 0.7, 0]} vestColor="#1e9d0d" />
      <ParcelStack position={[-4.08, 0.13, 1.08]} scale={0.58} />
      <ParcelStack position={[-2.95, 0.13, 1.08]} scale={0.48} />
      <LampPost position={[-4.85, 0.08, 1.55]} />
      <LampPost position={[3.08, 0.08, 1.88]} />
      <BackdropScenery />
    </>
  );
}

export function WarehouseScenePrototype() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState('suji');
  const selectedCenter = prototypeCenters.find((center) => center.id === selectedCenterId) ?? prototypeCenters[0];

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return (
    <section className="relative aspect-[16/9] w-[min(960px,calc(100vw-48px))] overflow-hidden rounded-[28px] border border-white/80 bg-[#dff5f4] shadow-[0_30px_80px_rgba(39,94,76,0.2)]">
      <SkyBackdrop />
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [9.4, 9.3, 11.2], zoom: 62, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ position: 'relative', zIndex: 1 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.16;
          gl.setClearColor(0x000000, 0);
        }}
      >
        <PrototypeScene
          centers={prototypeCenters}
          onSelectCenter={setSelectedCenterId}
          reducedMotion={reducedMotion}
          selectedCenterId={selectedCenterId}
        />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 z-[2000] rounded-full border border-white bg-white px-4 py-2 shadow-[0_10px_28px_rgba(31,76,62,0.14)]">
        <strong className="text-sm text-[#263b3d]">판매처 미할당 재고 · 5개 센터</strong>
      </div>

      <div
        className="items-stretch gap-2 rounded-2xl border border-white/90 p-2.5 shadow-[0_16px_36px_rgba(35,76,63,0.18)] backdrop-blur-xl"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          left: 16,
          zIndex: 1000,
          display: 'grid',
          gridTemplateColumns: '1.4fr repeat(5, minmax(0, 0.72fr))',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
        }}
      >
        <div className="flex min-w-0 items-center gap-3 rounded-xl bg-[#edf6e9] px-3 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#dcedd6] text-lg text-[#1e9d0d]">
            ▣
          </span>
          <span className="min-w-0">
            <small className="block text-[10px] font-bold text-[#1e9d0d]">
              선택 물류센터 · {selectedCenter.region}
            </small>
            <strong className="block truncate text-sm text-[#203739]">{selectedCenter.name}</strong>
          </span>
        </div>
        {[
          ['현재고', selectedCenter.currentQty, '#25373a'],
          ['판매 가능', selectedCenter.availableQty, '#1e9d0d'],
          ['소비기한 임박', selectedCenter.expiringQty, '#f08b24'],
          ['출고 예정', selectedCenter.outboundQty, '#4a554b'],
          ['위험 SKU', selectedCenter.riskSkuCount, '#e33b2f'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl bg-[#f6f8f7] px-3 py-2 text-center">
            <small className="block truncate text-[10px] font-medium text-[#73807f]">{label}</small>
            <strong className="mt-0.5 block text-sm" style={{ color }}>
              {formatQuantity(value)}개
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function WarehouseCampusScene({
  activeLocationId,
  locations,
  onActivate,
  onHoverChange,
  reducedMotion,
  renderActive = true,
}) {
  const sceneCenters = useMemo(() => locations.map(mapDashboardCenter), [locations]);
  const selectedCenterId = sceneCenters.some((center) => center.id === activeLocationId)
    ? activeLocationId
    : sceneCenters[0]?.id;

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#edf8f4]">
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.25]}
        frameloop={renderActive ? 'always' : 'never'}
        camera={{ position: [9.4, 9.3, 11.2], zoom: 62, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ position: 'relative', zIndex: 1 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.16;
          gl.setClearColor(0xedf8f4, 1);
        }}
        onPointerMissed={() => onHoverChange(null)}
      >
        <PrototypeScene
          centers={sceneCenters}
          onHoverCenter={onHoverChange}
          onSelectCenter={onActivate}
          reducedMotion={reducedMotion}
          selectedCenterId={selectedCenterId}
        />
      </Canvas>
    </div>
  );
}

Object.values(vehicleAssets).forEach((url) => useGLTF.preload(url));
