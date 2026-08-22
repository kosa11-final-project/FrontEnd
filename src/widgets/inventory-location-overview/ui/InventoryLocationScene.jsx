import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, Line, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { VehicleAsset, WarehouseAsset } from './InventoryLocationAssets.jsx';
import { WarehouseCampusScene } from './WarehouseScenePrototype.jsx';

const scenePalette = Object.freeze({
  primary: '#168963',
  primaryDark: '#0b5f45',
  primaryLight: '#a9ead3',
  mint: '#e4f8f0',
  online: '#3b82a0',
  onlineLight: '#cfeef4',
  store: '#d39a45',
  storeLight: '#f7e8ca',
  surface: '#e7f1ed',
  floor: '#c9dcd4',
  road: '#8fa9a0',
  white: '#ffffff',
  centerBody: '#f1eadf',
  centerBodyActive: '#fff7e8',
  centerRoof: '#4b91df',
  centerRoofActive: '#2f78cb',
  logisticsYellow: '#f5a623',
  logisticsOrange: '#e87531',
  logisticsRed: '#d95d43',
  logisticsGreen: '#84ad62',
  onlineBody: '#93cedb',
  onlineBodyActive: '#3d9db3',
  storeBody: '#e5c17d',
  storeBodyActive: '#c98e32',
  neutral: '#7b8b84',
  danger: '#df3528',
  warning: '#f0a034',
  good: '#20ad78',
});

const sceneConfig = Object.freeze({
  centers: {
    background: '#eef8f5',
    floor: '#deded9',
    platform: '#c9cbc8',
    accent: scenePalette.primary,
  },
  online: {
    background: '#e5f0f3',
    floor: '#bdd7dd',
    platform: '#a9d4dd',
    accent: scenePalette.online,
  },
  stores: {
    background: '#f1ede5',
    floor: '#dfd0b8',
    platform: '#dfc793',
    accent: scenePalette.store,
  },
});

const LOGISTICS_OUTER_PATH = Object.freeze([
  [-6.15, -3.15],
  [6.05, -3.15],
  [6.05, 3.15],
  [-6.15, 3.15],
]);

const LOGISTICS_INNER_PATH = Object.freeze([
  [-5.3, 2.55],
  [5.15, 2.55],
  [5.15, -2.45],
  [-5.3, -2.45],
]);

const CENTER_YARD_POSITIONS = Object.freeze([
  [-3.95, -1.8],
  [-3.85, 1.05],
  [0, -1.3],
  [3.8, -1.7],
  [3.65, 1.05],
]);

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  return reducedMotion;
}

function getScenePosition(location, viewMode, index = 0) {
  if (viewMode === 'centers') {
    const [x, z] = CENTER_YARD_POSITIONS[index % CENTER_YARD_POSITIONS.length];
    return new THREE.Vector3(x, 0, z);
  }
  return new THREE.Vector3((location.x - 50) / 6.4, 0, (location.y - 50) / 7.2);
}

function getLocationTone(location) {
  if (location.riskSkuCount >= 5 || location.nearExpiryStock >= 50 || location.expectedDisposal >= 40) {
    return 'danger';
  }
  if (location.riskSkuCount >= 3 || location.nearExpiryStock >= 30 || location.expectedDisposal >= 25) {
    return 'warning';
  }
  return 'good';
}

function getToneColor(tone) {
  return scenePalette[tone];
}

function CameraRig({ activeLocation, activeLocationIndex, reducedMotion, viewMode }) {
  const { size } = useThree();
  const activePosition = useMemo(
    () => (activeLocation ? getScenePosition(activeLocation, viewMode, activeLocationIndex) : new THREE.Vector3()),
    [activeLocation, activeLocationIndex, viewMode],
  );
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, pointer }, delta) => {
    const focusX = activePosition.x * 0.08;
    const focusZ = activePosition.z * 0.07;
    const pointerX = reducedMotion ? 0 : pointer.x * 0.24;
    const pointerY = reducedMotion ? 0 : pointer.y * 0.14;
    const targetZoom =
      viewMode === 'centers'
        ? Math.min(size.width / 20, size.height / 10.2, 50)
        : viewMode === 'stores'
          ? Math.min(size.width / 23, size.height / 11.8, 44)
          : Math.min(size.width / 22, size.height / 11, 48);

    desiredPosition.set(10.2 + focusX + pointerX, 8.8 + pointerY, 13.4 + focusZ);
    lookTarget.set(activePosition.x * 0.12, 0.55, activePosition.z * 0.1);

    if (reducedMotion) {
      camera.position.copy(desiredPosition);
      camera.zoom = targetZoom;
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredPosition.x, 3.8, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredPosition.y, 3.8, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredPosition.z, 3.8, delta);
      camera.zoom = THREE.MathUtils.damp(camera.zoom, targetZoom, 4.2, delta);
    }
    camera.lookAt(lookTarget);
    camera.updateProjectionMatrix();
  });

  return null;
}

function SceneFloor({ locations, reducedMotion, viewMode }) {
  const config = sceneConfig[viewMode];
  const locationPositions = locations.map((location, index) => getScenePosition(location, viewMode, index));
  const centerPosition = new THREE.Vector3(0, 0.04, 0);
  const connectionLines = locationPositions.map((position) => [centerPosition, position.clone().setY(0.08)]);

  return (
    <group>
      <RoundedBox args={[15.2, 0.3, 9.4]} radius={0.42} smoothness={4} position={[0, -0.2, 0]} receiveShadow>
        <meshStandardMaterial color={config.floor} roughness={0.9} />
      </RoundedBox>

      {viewMode === 'centers' ? <LogisticsYard positions={locationPositions} reducedMotion={reducedMotion} /> : null}
      {viewMode === 'online' ? (
        <>
          <OnlineNetwork positions={locationPositions} />
          {connectionLines.map((points, index) => (
            <Line
              key={`online-connection-${index}`}
              points={points}
              color={config.accent}
              lineWidth={1.8}
              transparent
              opacity={0.5}
            />
          ))}
          <OnlineDispatchHub />
        </>
      ) : null}
      {viewMode === 'stores' ? <RetailDistrict /> : null}
    </group>
  );
}

function ParcelBox({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <RoundedBox args={[0.34, 0.3, 0.34]} radius={0.025} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color="#c98845" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.305, 0]}>
        <boxGeometry args={[0.055, 0.012, 0.35]} />
        <meshStandardMaterial color="#e8bd7b" roughness={0.76} />
      </mesh>
    </group>
  );
}

function BoxStack({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <ParcelBox position={[-0.18, 0, 0]} />
      <ParcelBox position={[0.18, 0, 0]} />
      <ParcelBox position={[0, 0.3, 0]} />
    </group>
  );
}

function ShippingContainer({ color, position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.45, 0.72, 0.65]} radius={0.06} position={[0, 0.36, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.67} metalness={0.08} />
      </RoundedBox>
      {[-0.52, -0.26, 0, 0.26, 0.52].map((x) => (
        <mesh key={x} position={[x, 0.36, 0.33]}>
          <boxGeometry args={[0.035, 0.58, 0.025]} />
          <meshStandardMaterial color="#9a4d3c" transparent opacity={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function YardTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.56, 10]} />
        <meshStandardMaterial color="#806348" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.72, 0]} castShadow>
        <dodecahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={scenePalette.logisticsGreen} roughness={0.88} />
      </mesh>
    </group>
  );
}

function MovingVehicle({ kind, path, phase = 0, reducedMotion, reverse = false, speed = 0.026 }) {
  const vehicleRef = useRef(null);

  useFrame(({ clock }) => {
    if (!vehicleRef.current) return;
    if (reducedMotion) {
      const [x, z] = path[0];
      vehicleRef.current.position.set(x, 0.26, z);
      vehicleRef.current.rotation.y = 0;
      return;
    }

    const rawProgress = (clock.elapsedTime * speed + phase) % 1;
    const perimeterProgress = reverse ? 1 - rawProgress : rawProgress;
    const segmentProgress = (perimeterProgress * 4) % 1;
    const segment = Math.floor(perimeterProgress * 4);
    const start = path[segment];
    const end = path[(segment + 1) % path.length];
    const x = THREE.MathUtils.lerp(start[0], end[0], segmentProgress);
    const z = THREE.MathUtils.lerp(start[1], end[1], segmentProgress);
    const dx = end[0] - start[0];
    const dz = end[1] - start[1];

    vehicleRef.current.position.set(x, 0.26, z);
    vehicleRef.current.rotation.y = Math.atan2(dx, dz);
  });

  return (
    <group ref={vehicleRef}>
      <VehicleAsset kind={kind} scale={kind === 'truck' ? 0.86 : 0.72} />
    </group>
  );
}

function RoadDashes({ axis = 'x', count, fixed, from, to }) {
  return Array.from({ length: count }, (_, index) => {
    const progress = count === 1 ? 0.5 : index / (count - 1);
    const variable = THREE.MathUtils.lerp(from, to, progress);
    const position = axis === 'x' ? [variable, 0.31, fixed] : [fixed, 0.31, variable];
    const args = axis === 'x' ? [0.58, 0.025, 0.055] : [0.055, 0.025, 0.58];
    return (
      <mesh key={`${axis}-${fixed}-${index}`} position={position} receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color="#f8e6a9" roughness={0.74} />
      </mesh>
    );
  });
}

function YardLamp({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 1, 10]} />
        <meshStandardMaterial color="#52666d" roughness={0.6} />
      </mesh>
      <mesh position={[0.13, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.28, 0.04, 0.04]} />
        <meshStandardMaterial color="#52666d" roughness={0.6} />
      </mesh>
      <mesh position={[0.27, 0.94, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.12]} />
        <meshStandardMaterial color="#fff0ad" emissive="#ffd95b" emissiveIntensity={0.45} roughness={0.4} />
      </mesh>
    </group>
  );
}

function LogisticsYard({ positions, reducedMotion }) {
  return (
    <group>
      <RoundedBox args={[14.25, 0.08, 8.4]} radius={0.62} position={[0, -0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#d9edc5" roughness={0.98} />
      </RoundedBox>

      <mesh position={[-6.35, 0.04, -2.95]} rotation={[-Math.PI / 2, 0, -0.08]} receiveShadow>
        <planeGeometry args={[1.25, 4.25]} />
        <meshStandardMaterial color="#8fd7e8" roughness={0.82} />
      </mesh>
      <mesh position={[-5.75, 0.055, -2.05]} rotation={[-Math.PI / 2, 0, -0.08]}>
        <planeGeometry args={[0.08, 4.1]} />
        <meshBasicMaterial color="#d8f6fb" transparent opacity={0.8} />
      </mesh>

      {positions.map((position, index) => (
        <RoundedBox
          key={`center-yard-${index}`}
          args={[2.48, 0.11, 1.92]}
          radius={0.18}
          position={[position.x, 0.07, position.z]}
          receiveShadow
        >
          <meshStandardMaterial color={index % 2 === 0 ? '#d9dcd8' : '#d1d6d2'} roughness={0.94} />
        </RoundedBox>
      ))}

      {positions.map((position, index) => {
        const roadZ = 0;
        const length = Math.abs(position.z - roadZ);
        if (length < 0.35) return null;
        return (
          <Line
            key={`center-driveway-${index}`}
            points={[
              [position.x, 0.24, position.z],
              [position.x, 0.24, roadZ],
            ]}
            color="#829099"
            lineWidth={17}
          />
        );
      })}

      <Line
        points={[
          [-6.3, 0.26, 0],
          [6.3, 0.26, 0],
        ]}
        color="#53646d"
        lineWidth={42}
      />
      <Line
        points={[
          [1.75, 0.27, -3.35],
          [1.75, 0.27, 3.35],
        ]}
        color="#53646d"
        lineWidth={38}
      />
      <Line
        points={[
          [-6.15, 0.22, 3.45],
          [6.15, 0.22, 3.45],
        ]}
        color="#65747c"
        lineWidth={34}
      />

      <RoundedBox args={[2.4, 0.08, 0.9]} radius={0.28} position={[-4.15, 0.1, -0.12]} receiveShadow>
        <meshStandardMaterial color="#b9d889" roughness={0.94} />
      </RoundedBox>
      <RoundedBox args={[2.15, 0.08, 0.9]} radius={0.28} position={[4.55, 0.1, -0.12]} receiveShadow>
        <meshStandardMaterial color="#c7e19b" roughness={0.94} />
      </RoundedBox>

      <RoadDashes axis="x" count={11} fixed={0} from={-5.65} to={5.65} />
      <RoadDashes axis="z" count={6} fixed={1.75} from={-2.7} to={2.7} />
      <RoadDashes axis="x" count={10} fixed={3.45} from={-5.55} to={5.55} />

      <ShippingContainer color={scenePalette.logisticsRed} position={[5.2, 0.1, -2.45]} />
      <ShippingContainer
        color={scenePalette.logisticsOrange}
        position={[5.45, 0.1, -1.65]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <BoxStack position={[4.45, 0.12, -2.58]} scale={0.74} />
      <BoxStack position={[-5.35, 0.12, 2.5]} scale={0.68} />
      <BoxStack position={[-4.75, 0.12, 2.62]} scale={0.54} />
      <YardTree position={[-6.85, 0.08, -2.3]} scale={0.9} />
      <YardTree position={[-6.85, 0.08, 2.25]} scale={0.78} />
      <YardTree position={[6.85, 0.08, 2.35]} scale={0.82} />
      <YardTree position={[6.7, 0.08, -2.55]} scale={0.72} />
      <YardTree position={[-3.55, 0.08, -3.55]} scale={0.68} />
      <YardTree position={[-1.8, 0.08, 3.55]} scale={0.76} />
      <YardTree position={[3.55, 0.08, 3.55]} scale={0.7} />
      <YardLamp position={[-5.65, 0.13, -0.78]} />
      <YardLamp position={[-1.25, 0.13, 0.78]} />
      <YardLamp position={[4.75, 0.13, -0.78]} />
      <MovingVehicle kind="truck" path={LOGISTICS_OUTER_PATH} reducedMotion={reducedMotion} speed={0.024} />
      <MovingVehicle
        kind="delivery"
        path={LOGISTICS_INNER_PATH}
        phase={0.42}
        reducedMotion={reducedMotion}
        reverse
        speed={0.031}
      />
    </group>
  );
}

function OnlineNetwork({ positions }) {
  return (
    <group>
      <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.05, 2.13, 64]} />
        <meshBasicMaterial color={scenePalette.online} transparent opacity={0.56} />
      </mesh>
      {positions.map((position, index) => (
        <group key={`online-node-${index}`} position={[position.x, 0.14, position.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.35, 48]} />
            <meshStandardMaterial color="#84beca" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.12, 1.25, 48]} />
            <meshBasicMaterial color={scenePalette.online} transparent opacity={0.68} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function RetailDistrict() {
  return (
    <group>
      <RoundedBox args={[6.6, 0.12, 5.15]} radius={0.7} position={[-3.65, 0.1, -1.15]} receiveShadow>
        <meshStandardMaterial color="#d8b875" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[5.15, 0.12, 4.15]} radius={0.7} position={[3.85, 0.1, 0.65]} receiveShadow>
        <meshStandardMaterial color="#e6c991" roughness={0.92} />
      </RoundedBox>
      <RoundedBox args={[5.2, 0.12, 2.55]} radius={0.7} position={[-0.1, 0.1, 3.2]} receiveShadow>
        <meshStandardMaterial color="#cdaa62" roughness={0.92} />
      </RoundedBox>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.58, 8.7]} />
        <meshBasicMaterial color="#f6f2e9" />
      </mesh>
      <mesh position={[0, 0.11, 0.2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.52, 14.1]} />
        <meshBasicMaterial color="#f6f2e9" />
      </mesh>
    </group>
  );
}

function OnlineDispatchHub() {
  return (
    <group position={[0, 0.08, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.12, 48]} />
        <meshStandardMaterial color={scenePalette.onlineLight} roughness={0.7} />
      </mesh>
      <RoundedBox args={[1.35, 0.7, 1.05]} radius={0.14} position={[0, 0.44, 0]} castShadow>
        <meshStandardMaterial color={scenePalette.white} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.52, 0.54]}>
        <boxGeometry args={[0.82, 0.28, 0.04]} />
        <meshStandardMaterial color={scenePalette.online} emissive={scenePalette.online} emissiveIntensity={0.16} />
      </mesh>
    </group>
  );
}

function WorkerFigure({ position }) {
  return (
    <group position={position} scale={0.56}>
      <mesh position={[0, 0.52, 0]} castShadow>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshStandardMaterial color="#e5b07b" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.26, 4, 8]} />
        <meshStandardMaterial color="#4fa86f" roughness={0.64} />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.07, 0]}>
          <boxGeometry args={[0.055, 0.25, 0.07]} />
          <meshStandardMaterial color="#3d5563" roughness={0.74} />
        </mesh>
      ))}
    </group>
  );
}

function AnimatedForklift({ baseX, reducedMotion }) {
  const forkliftRef = useRef(null);

  useFrame(({ clock }) => {
    if (!forkliftRef.current) return;
    forkliftRef.current.position.x = baseX;
    forkliftRef.current.position.z = reducedMotion ? 0.78 : 0.78 + Math.sin(clock.elapsedTime * 0.9) * 0.18;
  });

  return (
    <group ref={forkliftRef} position={[baseX, 0.12, 0.78]} scale={0.52}>
      <RoundedBox args={[0.62, 0.34, 0.48]} radius={0.06} position={[0, 0.28, 0]} castShadow>
        <meshStandardMaterial color={scenePalette.logisticsYellow} roughness={0.56} />
      </RoundedBox>
      <mesh position={[-0.22, 0.6, 0]}>
        <boxGeometry args={[0.08, 0.72, 0.5]} />
        <meshStandardMaterial color="#4d555b" roughness={0.62} />
      </mesh>
      {[-0.15, 0.15].map((z) => (
        <mesh key={z} position={[-0.52, 0.13, z]}>
          <boxGeometry args={[0.56, 0.055, 0.055]} />
          <meshStandardMaterial color="#4d555b" roughness={0.62} />
        </mesh>
      ))}
      {[-0.23, 0.23].map((z) => (
        <mesh key={z} position={[0.16, 0.12, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.09, 16]} />
          <meshStandardMaterial color="#343b40" roughness={0.72} />
        </mesh>
      ))}
      <ParcelBox position={[-0.64, 0.17, 0]} scale={0.72} />
    </group>
  );
}

function FacilityBeacon({ active, color, reducedMotion }) {
  const beaconRef = useRef(null);

  useFrame(({ clock }) => {
    if (!beaconRef.current) return;
    const pulse = reducedMotion ? 1 : 0.82 + Math.sin(clock.elapsedTime * 2.2) * 0.18;
    beaconRef.current.scale.setScalar(active ? pulse * 1.15 : pulse);
    beaconRef.current.rotation.y = reducedMotion ? 0 : clock.elapsedTime * 0.8;
  });

  return (
    <group ref={beaconRef} position={[0, 1.55, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.33, 30]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.58 : 0.34} />
      </mesh>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} roughness={0.38} />
      </mesh>
    </group>
  );
}

function WarehouseModel({ height, index, reducedMotion, selected, toneColor }) {
  const assetScale = 0.92 + Math.min(height, 1.8) * 0.05;

  return (
    <group>
      <WarehouseAsset active={selected} index={index} scale={assetScale} />
      <RoundedBox args={[1.82, 0.045, 0.64]} radius={0.04} position={[0, 0.16, 0.92]} receiveShadow>
        <meshStandardMaterial color={selected ? '#f2ce72' : '#c9d6d1'} roughness={0.78} />
      </RoundedBox>
      {[-0.45, 0, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.19, 0.79]}>
          <boxGeometry args={[0.24, 0.025, 0.52]} />
          <meshStandardMaterial color="#fff3c1" roughness={0.7} />
        </mesh>
      ))}
      <BoxStack position={[-1.12, 0.16, 0.88]} scale={0.48} />
      {selected ? (
        <>
          <AnimatedForklift baseX={1.08} reducedMotion={reducedMotion} />
          <WorkerFigure position={[0.82, 0.13, 0.25]} />
        </>
      ) : null}
      <FacilityBeacon active={selected} color={toneColor} reducedMotion={reducedMotion} />
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <cylinderGeometry args={[1.18, 1.3, 0.16, 36]} />
        <meshStandardMaterial color={toneColor} transparent opacity={selected ? 0.34 : 0.18} roughness={0.75} />
      </mesh>
    </group>
  );
}

function OnlineHubModel({ height, selected, toneColor }) {
  const buildingHeight = 0.74 + height * 0.34;

  return (
    <group>
      <mesh position={[0, 0.11, 0]} receiveShadow>
        <cylinderGeometry args={[1.12, 1.24, 0.18, 40]} />
        <meshStandardMaterial color={toneColor} transparent opacity={selected ? 0.34 : 0.18} roughness={0.7} />
      </mesh>
      <RoundedBox
        args={[1.42, buildingHeight, 1.12]}
        radius={0.18}
        position={[0, buildingHeight / 2 + 0.15, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={selected ? scenePalette.onlineBodyActive : scenePalette.onlineBody}
          roughness={0.52}
        />
      </RoundedBox>
      <RoundedBox args={[0.84, 0.26, 0.08]} radius={0.05} position={[0, buildingHeight * 0.72, 0.59]}>
        <meshStandardMaterial color={scenePalette.online} emissive={scenePalette.online} emissiveIntensity={0.2} />
      </RoundedBox>
      <mesh position={[0, buildingHeight + 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.07, 12, 32]} />
        <meshStandardMaterial color={toneColor} emissive={toneColor} emissiveIntensity={0.16} />
      </mesh>
      {[-0.42, 0, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.35, 0.59]}>
          <boxGeometry args={[0.25, 0.32, 0.05]} />
          <meshStandardMaterial color="#e9f6f8" roughness={0.48} />
        </mesh>
      ))}
      <mesh position={[0.92, 0.25, 0.08]}>
        <boxGeometry args={[0.56, 0.16, 0.42]} />
        <meshStandardMaterial color="#6aaec0" roughness={0.62} />
      </mesh>
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} position={[0.92, 0.12, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.62, 14]} />
          <meshStandardMaterial color="#4f7682" roughness={0.54} />
        </mesh>
      ))}
    </group>
  );
}

function StoreModel({ height, selected, toneColor }) {
  const buildingHeight = 0.72 + height * 0.25;
  return (
    <group>
      <RoundedBox
        args={[1.12, buildingHeight, 0.9]}
        radius={0.1}
        position={[0, buildingHeight / 2 + 0.12, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={selected ? scenePalette.storeBodyActive : scenePalette.storeBody}
          roughness={0.58}
        />
      </RoundedBox>
      <mesh position={[0, buildingHeight * 0.68, 0.49]} castShadow>
        <boxGeometry args={[1.28, 0.2, 0.16]} />
        <meshStandardMaterial color={selected ? '#b67c2b' : '#f3d391'} roughness={0.46} />
      </mesh>
      {[-0.44, -0.22, 0, 0.22, 0.44].map((x, index) => (
        <mesh key={x} position={[x, buildingHeight * 0.57, 0.59]}>
          <boxGeometry args={[0.16, 0.25, 0.05]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#f9f2e4' : '#c38b37'} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[-0.24, 0.32, 0.46]}>
        <boxGeometry args={[0.42, 0.42, 0.05]} />
        <meshStandardMaterial color="#508b85" roughness={0.42} metalness={0.05} />
      </mesh>
      <mesh position={[0.28, 0.32, 0.46]}>
        <boxGeometry args={[0.34, 0.5, 0.05]} />
        <meshStandardMaterial color="#735f4a" roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[0.82, 0.91, 0.14, 32]} />
        <meshStandardMaterial color={toneColor} transparent opacity={selected ? 0.34 : 0.18} roughness={0.72} />
      </mesh>
    </group>
  );
}

function LocationLabel({ height, location, onActivate, selected, tone, viewMode }) {
  const accentColor = sceneConfig[viewMode].accent;
  const labelLift = ((Math.round(location.x) + Math.round(location.y)) % 3) * 0.16;

  return (
    <Html position={[0, height + 0.66 + labelLift, 0]} center style={{ pointerEvents: 'auto' }}>
      <button
        type="button"
        aria-label={`${location.name}, 판매 가능 재고 ${formatQuantity(location.availableStock)}, 소비기한 임박 ${formatQuantity(location.nearExpiryStock)}`}
        aria-pressed={selected}
        onClick={(event) => {
          event.stopPropagation();
          onActivate(location.id);
        }}
        className={cn(
          '-translate-y-1 inline-flex min-w-0 items-center gap-1.5 rounded-full border bg-white/94 px-2 py-1 text-center shadow-[0_7px_18px_rgba(24,58,47,0.13)] backdrop-blur-sm transition-[transform,box-shadow] hover:-translate-y-1.5 focus-visible:-translate-y-1.5 motion-reduce:transition-none',
          selected ? 'scale-110 shadow-[0_10px_26px_rgba(15,107,76,0.2)]' : 'border-white/80',
        )}
        style={selected ? { borderColor: accentColor } : undefined}
      >
        <i className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: getToneColor(tone) }} />
        <strong className="inline shrink-0 whitespace-nowrap text-[length:var(--font-size-tiny)] text-[color:var(--text-heading)]">
          {location.shortName}
        </strong>
        <span className="inline shrink-0 tabular-nums text-[length:var(--font-size-meta)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
          {formatQuantity(location.availableStock)}
        </span>
      </button>
    </Html>
  );
}

function LocationObject({
  index,
  location,
  maximumAvailableStock,
  onActivate,
  onHoverChange,
  reducedMotion,
  selected,
  viewMode,
}) {
  const groupRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(() => getScenePosition(location, viewMode, index), [index, location, viewMode]);
  const tone = getLocationTone(location);
  const toneColor = getToneColor(tone);
  const stockRatio = maximumAvailableStock > 0 ? location.availableStock / maximumAvailableStock : 0;
  const height = 0.88 + Math.sqrt(Math.max(stockRatio, 0)) * (viewMode === 'stores' ? 0.72 : 1.15);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetY = hovered || selected ? 0.22 : 0.04;
    const targetScale = hovered ? 1.1 : selected ? 1.06 : 1;
    if (reducedMotion) {
      groupRef.current.position.y = targetY;
      groupRef.current.scale.setScalar(targetScale);
      return;
    }
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 8, delta);
    const nextScale = THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 8, delta);
    groupRef.current.scale.setScalar(nextScale);
  });

  const handlePointerEnter = (event) => {
    event.stopPropagation();
    setHovered(true);
    onHoverChange(location.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    setHovered(false);
    onHoverChange(null);
    document.body.style.cursor = 'default';
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onActivate(location.id);
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <mesh position={[0.12, 0.075, 0.18]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.18, 0.64, 1]}>
        <circleGeometry args={[1, 36]} />
        <meshBasicMaterial
          color={viewMode === 'centers' ? '#62686a' : '#49655b'}
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>

      {viewMode === 'centers' ? (
        <WarehouseModel
          height={height}
          index={index}
          reducedMotion={reducedMotion}
          selected={selected || hovered}
          toneColor={toneColor}
        />
      ) : null}
      {viewMode === 'online' ? <OnlineHubModel height={height} selected={selected} toneColor={toneColor} /> : null}
      {viewMode === 'stores' ? <StoreModel height={height} selected={selected} toneColor={toneColor} /> : null}

      {(hovered || selected) && !reducedMotion ? (
        <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.12, 1.32, 40]} />
          <meshBasicMaterial color={toneColor} transparent opacity={hovered ? 0.38 : 0.24} />
        </mesh>
      ) : null}

      <LocationLabel
        height={height}
        location={location}
        onActivate={onActivate}
        selected={selected || hovered}
        tone={tone}
        viewMode={viewMode}
      />
    </group>
  );
}

function InventoryScene({ activeLocationId, locations, onActivate, onHoverChange, reducedMotion, viewMode }) {
  const activeLocation = locations.find((location) => location.id === activeLocationId) ?? locations[0];
  const activeLocationIndex = Math.max(
    locations.findIndex((location) => location.id === activeLocation?.id),
    0,
  );
  const maximumAvailableStock = Math.max(...locations.map((location) => location.availableStock), 0);

  return (
    <>
      <color attach="background" args={[sceneConfig[viewMode].background]} />
      <ambientLight intensity={0.82} />
      <hemisphereLight args={[scenePalette.white, scenePalette.floor, 0.92]} />
      <directionalLight
        castShadow
        color={scenePalette.white}
        intensity={2.15}
        position={[7, 12, 8]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={32}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
      />

      <CameraRig
        activeLocation={activeLocation}
        activeLocationIndex={activeLocationIndex}
        reducedMotion={reducedMotion}
        viewMode={viewMode}
      />
      <SceneFloor locations={locations} reducedMotion={reducedMotion} viewMode={viewMode} />
      <ContactShadows
        position={[0, 0.035, 0]}
        opacity={viewMode === 'centers' ? 0.3 : 0.22}
        scale={18}
        blur={2.6}
        far={5.5}
        resolution={512}
        color="#456057"
      />

      {locations.map((location, index) => (
        <LocationObject
          key={location.id}
          index={index}
          location={location}
          maximumAvailableStock={maximumAvailableStock}
          onActivate={onActivate}
          onHoverChange={onHoverChange}
          reducedMotion={reducedMotion}
          selected={location.id === activeLocationId}
          viewMode={viewMode}
        />
      ))}
    </>
  );
}

export function InventoryLocationScene({ activeLocationId, locations, onActivate, onHoverChange, viewMode }) {
  const reducedMotion = useReducedMotion();

  if (viewMode === 'centers') {
    return (
      <WarehouseCampusScene
        activeLocationId={activeLocationId}
        locations={locations}
        onActivate={onActivate}
        onHoverChange={onHoverChange}
        reducedMotion={reducedMotion}
      />
    );
  }

  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [10.2, 8.8, 13.4], zoom: 36, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
      onPointerMissed={() => onHoverChange(null)}
    >
      <InventoryScene
        activeLocationId={activeLocationId}
        locations={locations}
        onActivate={onActivate}
        onHoverChange={onHoverChange}
        reducedMotion={reducedMotion}
        viewMode={viewMode}
      />
    </Canvas>
  );
}
