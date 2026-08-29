import { describe, expect, it, vi } from 'vitest';

vi.mock('./WarehouseScenePrototype.jsx', () => ({
  WarehouseScenePrototype: () => null,
}));

import meta from './WarehouseScenePrototype.stories.jsx';

describe('WarehouseScenePrototype story', () => {
  it('keeps the heavy animated WebGL prototype out of Chromatic snapshots', () => {
    expect(meta.parameters.chromatic.disableSnapshot).toBe(true);
  });
});
