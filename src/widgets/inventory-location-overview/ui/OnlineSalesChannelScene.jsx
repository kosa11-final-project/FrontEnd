import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Html, RoundedBox, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/shared/lib/cn';
import { formatQuantity } from '@/shared/lib/format';
import { getInventoryLocationTone } from '../model/inventoryLocationTone.js';

const ASSET_ROOT = '/assets/3d/dashboard/online';

const palette = Object.freeze({
  background: '#eaf6f3',
  platform: '#cadfd8',
  inset: '#eef6f2',
  white: '#f9faf7',
  deep: '#173f36',
  road: '#314b48',
  green: '#15976b',
  greenLight: '#7bd2b5',
  cyan: '#56aeb6',
  cyanLight: '#b7e5e4',
  beige: '#c8a77b',
  tape: '#f2eee6',
  danger: '#df3528',
  warning: '#f0a034',
  good: '#20ad78',
});

const channelPositions = Object.freeze([
  [-5.6, 0, 0.75],
  [5.6, 0, 0.75],
]);

function getChannelKind(location, index) {
  const identifier = `${location.code ?? ''} ${location.name ?? ''} ${location.shortName ?? ''}`.toLowerCase();
  if (identifier.includes('greeting') || identifier.includes('그리팅')) return 'greeting';
  if (identifier.includes('modu') || identifier.includes('맛집')) return 'modu';
  return index === 0 ? 'greeting' : 'modu';
}

function ResponsiveCamera() {
  const { size } = useThree();
  const previousSizeRef = useRef('');

  useFrame(({ camera }) => {
    const sizeKey = `${size.width}:${size.height}`;
    if (previousSizeRef.current === sizeKey) return;
    previousSizeRef.current = sizeKey;
    camera.position.set(16.2, 13.4, 18.6);
    camera.lookAt(0, 1.15, 0.2);
    camera.zoom = Math.min(size.width / 26, size.height / 12, 48);
    camera.updateProjectionMatrix();
  });

  return null;
}

function usePreparedPackage(url) {
  const { scene } = useGLTF(url);

  return useMemo(() => {
    const clone = scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const dimensions = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const normalizationScale = 1 / Math.max(dimensions.x, dimensions.y, dimensions.z, 1);

    clone.position.set(-center.x, -bounds.min.y, -center.z);
    clone.scale.setScalar(normalizationScale);
    clone.traverse((object) => {
      if (!object.isMesh) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = object.material.clone();
      object.material.color.set(palette.beige);
      object.material.roughness = 0.84;
    });
    return clone;
  }, [scene]);
}

function PackageAsset({ kind = 'small', position, rotation = 0, scale = 1 }) {
  const packageScene = usePreparedPackage(`${ASSET_ROOT}/box-${kind}.glb`);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <primitive object={packageScene} />
    </group>
  );
}

function StorageShelf() {
  const packages = [
    [-1.44, 0.52, -0.2, 0.78, 'large'],
    [-0.45, 0.52, 0.18, 0.65, 'small'],
    [0.5, 0.52, -0.14, 0.72, 'small'],
    [1.42, 0.52, 0.14, 0.62, 'small'],
    [-1.5, 1.55, 0.13, 0.68, 'small'],
    [-0.5, 1.55, -0.2, 0.76, 'large'],
    [0.52, 1.55, 0.16, 0.67, 'small'],
    [1.47, 1.55, -0.1, 0.7, 'small'],
    [-1.42, 2.58, -0.12, 0.7, 'small'],
    [-0.4, 2.58, 0.16, 0.64, 'small'],
    [0.58, 2.58, -0.1, 0.74, 'large'],
    [1.5, 2.58, 0.12, 0.58, 'small'],
  ];

  return (
    <group position={[0, 0.16, -0.75]}>
      <RoundedBox args={[5.85, 0.34, 3.35]} radius={0.2} position={[0, 0.17, 0]} receiveShadow>
        <meshStandardMaterial color={palette.white} roughness={0.88} />
      </RoundedBox>
      <RoundedBox args={[5.25, 0.1, 2.8]} radius={0.12} position={[0, 0.4, 0]} receiveShadow>
        <meshStandardMaterial color={palette.green} roughness={0.62} />
      </RoundedBox>

      {[-2.05, 2.05].flatMap((x) =>
        [-0.67, 0.67].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.98, z]} castShadow>
            <boxGeometry args={[0.14, 3.25, 0.14]} />
            <meshStandardMaterial color={palette.deep} roughness={0.7} metalness={0.06} />
          </mesh>
        )),
      )}
      {[0.5, 1.52, 2.54, 3.48].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.35, 0.11, 1.52]} />
          <meshStandardMaterial color={palette.deep} roughness={0.72} metalness={0.05} />
        </mesh>
      ))}

      {packages.map(([x, y, z, scale, kind], index) => (
        <PackageAsset
          key={`${x}-${y}`}
          kind={kind}
          position={[x, y, z]}
          rotation={index % 2 === 0 ? -0.06 : 0.08}
          scale={scale}
        />
      ))}

      <RoundedBox args={[4.7, 0.2, 1.82]} radius={0.1} position={[0, 3.72, 0]} castShadow>
        <meshStandardMaterial color={palette.white} roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 4.05, 0]} castShadow>
        <sphereGeometry args={[0.14, 18, 12]} />
        <meshStandardMaterial color={palette.green} emissive={palette.green} emissiveIntensity={0.4} roughness={0.42} />
      </mesh>
    </group>
  );
}

function GreetingScreenIcon() {
  return (
    <group position={[0, 2.38, 0.37]}>
      <RoundedBox args={[0.7, 0.62, 0.08]} radius={0.06} position={[-0.42, -0.1, 0]}>
        <meshStandardMaterial color={palette.white} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.82, 0.08]} radius={0.06} position={[0.38, 0, 0]}>
        <meshStandardMaterial color={palette.white} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0.38, 0.07, 0.06]}>
        <boxGeometry args={[0.1, 0.03, 0.04]} />
        <meshStandardMaterial color={palette.green} />
      </mesh>
    </group>
  );
}

function ModuScreenIcon() {
  return (
    <group position={[0, 2.36, 0.38]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.63, 0.63, 0.08, 36]} />
        <meshStandardMaterial color={palette.white} roughness={0.68} />
      </mesh>
      <mesh position={[-0.16, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.035, 10, 24, Math.PI * 1.45]} />
        <meshStandardMaterial color={palette.cyan} roughness={0.6} />
      </mesh>
      <mesh position={[0.71, 0, 0]}>
        <boxGeometry args={[0.07, 0.84, 0.07]} />
        <meshStandardMaterial color={palette.white} roughness={0.65} />
      </mesh>
      {[-0.11, 0, 0.11].map((x) => (
        <mesh key={x} position={[0.71 + x, 0.5, 0]}>
          <boxGeometry args={[0.035, 0.22, 0.06]} />
          <meshStandardMaterial color={palette.white} roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
}

function ChannelTerminal({ index, location, onActivate, onHoverChange, selected }) {
  const kind = getChannelKind(location, index);
  const accent = kind === 'greeting' ? palette.green : palette.cyan;
  const tone = getInventoryLocationTone(location, 'online');
  const toneColor = palette[tone];
  const position = channelPositions[index] ?? [index % 2 === 0 ? -5.6 : 5.6, 0, 0.75];

  const handlePointerEnter = (event) => {
    event.stopPropagation();
    onHoverChange(location.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerLeave = (event) => {
    event.stopPropagation();
    onHoverChange(null);
    document.body.style.cursor = 'default';
  };

  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation();
        onActivate(location.id);
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <RoundedBox args={[3.65, 0.26, 2.92]} radius={0.18} position={[0, 0.13, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={selected ? '#ffffff' : palette.white} roughness={0.86} />
      </RoundedBox>
      <RoundedBox args={[2.92, 3.86, 0.56]} radius={0.26} position={[0, 2.14, -0.13]} castShadow>
        <meshStandardMaterial color={palette.white} roughness={0.82} />
      </RoundedBox>
      <RoundedBox args={[2.52, 2.92, 0.09]} radius={0.14} position={[0, 2.25, 0.2]}>
        <meshStandardMaterial color={palette.deep} roughness={0.62} />
      </RoundedBox>
      <RoundedBox args={[2.22, 2.18, 0.07]} radius={0.11} position={[0, 2.44, 0.27]}>
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={selected ? 0.18 : 0.04}
          roughness={0.52}
        />
      </RoundedBox>

      {kind === 'greeting' ? <GreetingScreenIcon /> : <ModuScreenIcon />}

      <RoundedBox args={[1.15, 0.12, 0.06]} radius={0.04} position={[0, 1.5, 0.33]}>
        <meshStandardMaterial color={palette.white} roughness={0.72} />
      </RoundedBox>
      <RoundedBox args={[0.78, 0.11, 0.06]} radius={0.04} position={[0, 1.24, 0.33]}>
        <meshStandardMaterial color={palette.white} roughness={0.72} />
      </RoundedBox>
      <RoundedBox args={[0.78, 0.1, 0.05]} radius={0.04} position={[0, 0.52, 0.18]}>
        <meshStandardMaterial color={palette.deep} roughness={0.68} />
      </RoundedBox>

      <mesh position={[0, 4.42, -0.13]} castShadow>
        <sphereGeometry args={[selected ? 0.19 : 0.15, 18, 12]} />
        <meshStandardMaterial color={toneColor} emissive={toneColor} emissiveIntensity={0.48} roughness={0.4} />
      </mesh>

      <Html position={[0, 5.05, 0]} center style={{ pointerEvents: 'auto' }}>
        <button
          type="button"
          aria-label={`${location.name}, 판매 가능 재고 ${formatQuantity(location.availableStock)}`}
          aria-pressed={selected}
          onClick={(event) => {
            event.stopPropagation();
            onActivate(location.id);
          }}
          onFocus={() => onHoverChange(location.id)}
          onMouseEnter={() => onHoverChange(location.id)}
          onMouseLeave={() => onHoverChange(null)}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border bg-white/95 px-2.5 py-1.5 shadow-[0_8px_20px_rgba(18,66,53,0.14)] backdrop-blur-sm transition-colors',
            selected
              ? 'border-[color:var(--primary)] bg-[var(--primary-strong)] text-white'
              : 'border-white/85 text-[color:var(--text-heading)] hover:border-[color:var(--primary)]',
          )}
        >
          <i className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: toneColor }} aria-hidden="true" />
          <strong className="text-[12px]">{location.shortName || location.name}</strong>
          <span className="tabular-nums text-[13px] font-[var(--font-weight-bold)]">
            {formatQuantity(location.availableStock)}
          </span>
        </button>
      </Html>
    </group>
  );
}

function FlowRail({ accent, endX, index, reducedMotion }) {
  const parcelRef = useRef(null);
  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(Math.sign(endX) * 2.72, 0.22, 0.45),
        new THREE.Vector3(Math.sign(endX) * 4.05, 0.22, 1.95),
        new THREE.Vector3(endX, 0.22, 1.08),
      ),
    [endX],
  );
  const geometry = useMemo(() => new THREE.TubeGeometry(curve, 36, 0.065, 8, false), [curve]);

  useFrame(({ clock }) => {
    if (!parcelRef.current) return;
    const progress = reducedMotion ? 0.56 : (clock.elapsedTime * 0.065 + index * 0.24) % 1;
    const point = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress);
    parcelRef.current.position.copy(point);
    parcelRef.current.position.y = 0.36;
    parcelRef.current.rotation.y = Math.atan2(tangent.x, tangent.z) + Math.PI / 2;
  });

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.12} roughness={0.55} />
      </mesh>
      <group ref={parcelRef} scale={0.52}>
        <PackageAsset kind={index === 0 ? 'small' : 'large'} position={[0, 0, 0]} scale={1} />
      </group>
    </group>
  );
}

function OnlineScene({ activeLocationId, locations, onActivate, onHoverChange, reducedMotion }) {
  const visibleLocations = locations.slice(0, 2);
  const totalAvailableStock = locations.reduce((sum, location) => sum + location.availableStock, 0);

  return (
    <>
      <color attach="background" args={[palette.background]} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#ffffff', palette.road, 1.15]} />
      <directionalLight
        castShadow
        color="#fff4dc"
        intensity={2.65}
        position={[-9, 18, 12]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <ResponsiveCamera />

      <group position={[0, 0, 0.25]}>
        <RoundedBox args={[19.4, 0.54, 8.8]} radius={0.42} position={[0, -0.27, 0]} receiveShadow>
          <meshStandardMaterial color={palette.platform} roughness={0.94} />
        </RoundedBox>
        <RoundedBox args={[17.9, 0.08, 7.35]} radius={0.3} position={[0, 0.03, 0]} receiveShadow>
          <meshStandardMaterial color={palette.inset} roughness={0.92} />
        </RoundedBox>

        <StorageShelf />
        <FlowRail accent={palette.greenLight} endX={-4.5} index={0} reducedMotion={reducedMotion} />
        <FlowRail accent={palette.cyanLight} endX={4.5} index={1} reducedMotion={reducedMotion} />

        {visibleLocations.map((location, index) => (
          <ChannelTerminal
            key={location.id}
            index={index}
            location={location}
            onActivate={onActivate}
            onHoverChange={onHoverChange}
            selected={location.id === activeLocationId}
          />
        ))}

        <Html position={[0, 5.05, -0.75]} center>
          <div className="pointer-events-none inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/85 bg-white/95 px-2.5 py-1.5 text-[color:var(--text-heading)] shadow-[0_8px_20px_rgba(18,66,53,0.14)] backdrop-blur-sm">
            <i className="size-1.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
            <strong className="text-[12px]">온라인 연동 재고</strong>
            <span className="tabular-nums text-[13px] font-[var(--font-weight-bold)]">
              {formatQuantity(totalAvailableStock)}
            </span>
          </div>
        </Html>
      </group>

      <ContactShadows
        frames={1}
        position={[0, 0.03, 0.25]}
        opacity={0.24}
        scale={21}
        blur={2.8}
        far={6}
        resolution={256}
        color="#31534a"
      />
    </>
  );
}

export function OnlineSalesChannelScene({
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
      camera={{ position: [16.2, 13.4, 18.6], zoom: 36, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      onPointerMissed={() => onHoverChange(null)}
    >
      <OnlineScene
        activeLocationId={activeLocationId}
        locations={locations}
        onActivate={onActivate}
        onHoverChange={onHoverChange}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}

useGLTF.preload(`${ASSET_ROOT}/box-small.glb`);
useGLTF.preload(`${ASSET_ROOT}/box-large.glb`);
