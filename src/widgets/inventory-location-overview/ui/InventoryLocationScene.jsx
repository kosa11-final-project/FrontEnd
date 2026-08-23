import { lazy, useEffect, useState } from 'react';

const WarehouseCampusScene = lazy(() =>
  import('./WarehouseScenePrototype.jsx').then((module) => ({ default: module.WarehouseCampusScene })),
);
const OfflineStoreCityScene = lazy(() =>
  import('./OfflineStoreCityScene.jsx').then((module) => ({ default: module.OfflineStoreCityScene })),
);
const OnlineSalesChannelScene = lazy(() =>
  import('./OnlineSalesChannelScene.jsx').then((module) => ({ default: module.OnlineSalesChannelScene })),
);

const sceneComponents = Object.freeze({
  centers: WarehouseCampusScene,
  stores: OfflineStoreCityScene,
  online: OnlineSalesChannelScene,
});

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

function useDocumentVisibility() {
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const updateVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  return visible;
}

export function InventoryLocationScene({ activeLocationId, locations, onActivate, onHoverChange, viewMode }) {
  const reducedMotion = useReducedMotion();
  const renderActive = useDocumentVisibility();
  const SceneComponent = sceneComponents[viewMode];

  if (!SceneComponent) return null;

  return (
    <SceneComponent
      activeLocationId={activeLocationId}
      locations={locations}
      onActivate={onActivate}
      onHoverChange={onHoverChange}
      reducedMotion={reducedMotion}
      renderActive={renderActive}
    />
  );
}
