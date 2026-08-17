import { describe, expect, it } from 'vitest';
import { getStatisticsInventoryUrl } from './statisticsLinks.js';

const locations = [
  { id: 'WH_1', code: 'WAREHOUSE_1', scopeType: 'WAREHOUSE' },
  { id: 'WH_2', code: 'WAREHOUSE_2', scopeType: 'WAREHOUSE' },
  { id: 'STORE_1', code: 'DEPT_STORE_1', scopeType: 'OFFLINE_STORE' },
];

describe('statistics inventory links', () => {
  it('maps the statistics critical grade to the inventory danger grade', () => {
    expect(getStatisticsInventoryUrl({ riskGrade: 'CRITICAL' })).toBe('/inventory?riskGrade=DANGER');
  });

  it('preserves a selected warehouse and risk grade', () => {
    expect(
      getStatisticsInventoryUrl({
        scopeType: 'WAREHOUSE',
        locationId: 'WH_1',
        locations,
        riskGrade: 'WARNING',
      }),
    ).toBe('/inventory?warehouseCode=WAREHOUSE_1&riskGrade=CAUTION');
  });

  it('includes every location when a location type total is selected', () => {
    expect(
      getStatisticsInventoryUrl({
        scopeType: 'WAREHOUSE',
        locationId: 'ALL',
        locations,
      }),
    ).toBe('/inventory?warehouseCode=WAREHOUSE_1&warehouseCode=WAREHOUSE_2');
  });

  it('links unassessed inventory using the existing assessment status filter', () => {
    expect(getStatisticsInventoryUrl({ assessmentStatus: 'UNASSESSED' })).toBe(
      '/inventory?assessmentStatus=UNASSESSED',
    );
  });

  it('does not create an inaccurate link for unassigned inventory', () => {
    expect(
      getStatisticsInventoryUrl({ scopeType: 'UNASSIGNED', locationId: 'ALL', locations, riskGrade: 'CRITICAL' }),
    ).toBeNull();
  });
});
