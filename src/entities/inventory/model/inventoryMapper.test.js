import { describe, expect, it } from 'vitest';
import {
  mapInventoryFilterOptionsResponse,
  mapInventoryItem,
  mapInventoryListResponse,
  mapInventoryLotsResponse,
  mapInventorySummaryResponse,
} from './inventoryMapper.js';
import { INVENTORY_FACT_STATE, RESULT_STATE } from './inventory.js';

describe('Inventory Mapper', () => {
  it('correctly maps raw backend DTO to standardized view model', () => {
    const rawDto = {
      sku_id: 1001,
      product_code: 'PROD_MANDU_01',
      product_name: '비비고 왕교자 1.05kg',
      supplier_name: 'CJ제일제당',
      sku_code: 'SKU_MANDU_01_105',
      sku_name: '1.05kg 단품',
      sales_point_code: 'STORE_THE_HYUNDAI_SEOUL',
      sales_point_name: '더현대 서울',
      channel_type: 'HYUNDAI_DEPT',
      storage_type: 'FROZEN',
      current_qty: 450,
      available_qty: 420,
      reserved_qty: 30,
      safety_qty: 100,
      inventory_fact_state: 'AVAILABLE',
      risk: {
        grade: 'SAFE',
        assessmentStatus: 'ASSESSED',
        reason: '충분한 안전재고 유지 중',
      },
      category: {
        leaf: { id: 301, name: '베이커리', level: 3 },
        path: [
          { id: 1, name: '식품', level: 1 },
          { id: 20, name: '베이커리/간식', level: 2 },
          { id: 301, name: '베이커리', level: 3 },
        ],
      },
      locations: [{ warehouseCode: 'GYEONGIN_1', warehouseName: '경인 1센터', quantity: 450 }],
    };

    const mapped = mapInventoryItem(rawDto);

    expect(mapped.rowId).toBe('SKU_MANDU_01_105:STORE_THE_HYUNDAI_SEOUL');
    expect(mapped.skuId).toBe(1001);
    expect(mapped.productName).toBe('비비고 왕교자 1.05kg');
    expect(mapped.supplierName).toBe('CJ제일제당');
    expect(mapped.currentQuantity).toBe(450);
    expect(mapped.availableQuantity).toBe(420);
    expect(mapped.reservedQuantity).toBe(30);
    expect(mapped.channelName).toBe('현대백화점');
    expect(mapped.storageName).toBe('냉동');
    expect(mapped.riskGrade).toBe('SAFE');
    expect(mapped.riskMeta.tone).toBe('success');
    expect(mapped.inventoryFactState).toBe(INVENTORY_FACT_STATE.AVAILABLE);
    expect(mapped.primaryWarehouseName).toBe('경인 1센터');
    expect(mapped.category.leaf).toEqual({ id: 301, name: '베이커리', level: 3 });
    expect(mapped.categoryPathLabel).toBe('식품 > 베이커리/간식 > 베이커리');
  });

  it('preserves unavailable quantities as null while keeping explicit zero values', () => {
    const emptyDto = {};
    const mapped = mapInventoryItem(emptyDto);

    expect(mapped.productName).toBe('상품명 미지정');
    expect(mapped.currentQuantity).toBeNull();
    expect(mapped.availableQuantity).toBeNull();
    expect(mapped.reservedQuantity).toBeNull();
    expect(mapped.safetyQuantity).toBeNull();
    expect(mapped.sellingPrice).toBeNull();
    expect(mapped.inventoryFactState).toBeNull();
    expect(mapped.riskGrade).toBeNull();
    expect(mapped.assessmentStatus).toBe('UNASSESSED');
    expect(mapped.riskMeta).toBeNull();
    expect(mapped.salesPoints).toEqual([]);
    expect(mapped.aiRecommendation).toBeNull();

    const zeroMapped = mapInventoryItem({
      currentQuantity: 0,
      availableQuantity: 0,
      reservedQuantity: 0,
      safetyQuantity: 0,
    });
    expect(zeroMapped.currentQuantity).toBe(0);
    expect(zeroMapped.availableQuantity).toBe(0);
    expect(zeroMapped.reservedQuantity).toBe(0);
    expect(zeroMapped.safetyQuantity).toBe(0);
  });

  it('does not invent SKU, storage, LOT, or assessment facts that are absent from the API', () => {
    const mapped = mapInventoryItem({ skuCode: 'SKU_EMPTY', salesPoints: [] });

    expect(mapped.rowId).toBe('SKU_EMPTY');
    expect(mapped.storageType).toBeNull();
    expect(mapped.storageName).toBe('보관유형 미제공');
    expect(mapped.salesPoints).toEqual([]);

    const lot = mapInventoryLotsResponse({ items: [{}] }).items[0];
    expect(lot.lotNumber).toBeNull();
    expect(lot.fefoPriority).toBeNull();
  });

  it('preserves unknown explicit assessment status and normalizes numeric strings', () => {
    const mapped = mapInventoryItem({
      skuCode: 'SKU-1',
      riskGrade: 'SAFE',
      assessmentStatus: 'UNKNOWN',
      ownerSalesPointCount: '5',
    });

    expect(mapped.assessmentStatus).toBeNull();
    expect(mapped.ownerSalesPointCount).toBe(5);
  });

  it('maps inventory list response and computes pagination correctly', () => {
    const rawListResponse = {
      items: [
        { skuCode: 'SKU_01', salesPointCode: 'P_01', currentQuantity: 100 },
        { skuCode: 'SKU_02', salesPointCode: 'P_02', currentQuantity: 50 },
      ],
      totalCount: 42,
      page: 1,
      size: 20,
    };

    const mapped = mapInventoryListResponse(rawListResponse);

    expect(mapped.items.length).toBe(2);
    expect(mapped.totalCount).toBe(42);
    expect(mapped.totalPages).toBe(3);
    expect(mapped.resultState).toBe(RESULT_STATE.HAS_DATA);
  });

  it('keeps a SKU-level row and preserves every owning sales point from the aggregate response', () => {
    const mapped = mapInventoryItem({
      rowId: 'SKU-AGGREGATE',
      skuCode: 'SKU-AGGREGATE',
      productName: '같은 SKU 상품',
      currentQuantity: 30,
      availableQuantity: 24,
      ownerSalesPointCount: 5,
      salesPoints: [
        { salesPointCode: 'STORE-A', salesPointName: 'A점', channelType: 'HYUNDAI_DEPT', currentQuantity: 10 },
        { salesPointCode: 'STORE-B', salesPointName: 'B점', channelType: 'HYUNDAI_DEPT', currentQuantity: 20 },
      ],
    });

    expect(mapped.rowId).toBe('SKU-AGGREGATE');
    expect(mapped.salesPointCount).toBe(2);
    expect(mapped.ownerSalesPointCount).toBe(5);
    expect(mapped.salesPoints.map((point) => point.salesPointCode)).toEqual(['STORE-A', 'STORE-B']);
    expect(mapped.currentQuantity).toBe(30);
  });

  it('separates center-only stock from sales points and does not expose a seller warehouse', () => {
    const mapped = mapInventoryItem({
      skuCode: 'SKU-OWNERSHIP-1',
      currentQuantity: 100,
      availableQuantity: 90,
      reservedQuantity: 10,
      locations: [{ warehouseCode: 'DC-A', warehouseName: '센터 A', quantity: 40 }],
      salesPoints: [
        {
          salesPointCode: 'STORE-A',
          salesPointName: 'A점',
          channelType: 'HYUNDAI_DEPT',
          currentQuantity: 60,
          availableQuantity: 55,
          reservedQuantity: 5,
          warehouseName: '센터 A',
          salesPointState: 'OWNED',
        },
        {
          salesPointCode: 'UNASSIGNED',
          salesPointName: '판매처 미할당',
          channelType: 'CENTER',
          currentQuantity: 40,
          availableQuantity: 35,
          reservedQuantity: 5,
          salesPointState: 'CENTER_ONLY',
        },
      ],
      unassignedRiskGrade: 'CAUTION',
      unassignedAssessmentStatus: 'ASSESSED',
      unassignedRiskReason: '미할당 공용재고의 예측 데이터 없음',
    });

    expect(mapped.salesPoints.map((point) => point.salesPointCode)).toEqual(['STORE-A']);
    expect(mapped.salesPoints[0].warehouseName).toBe('');
    expect(mapped.unassignedInventory).toMatchObject({
      currentQuantity: 40,
      availableQuantity: 35,
      reservedQuantity: 5,
      locationCount: 1,
      riskGrade: 'CAUTION',
      assessmentStatus: 'ASSESSED',
      riskReason: '미할당 공용재고의 예측 데이터 없음',
    });
    expect(mapped.unassignedInventory.locations).toEqual([
      { warehouseCode: 'DC-A', warehouseName: '센터 A', quantity: 40 },
    ]);
  });

  it('maps empty inventory list response with NO_DATA state', () => {
    const mapped = mapInventoryListResponse({ items: [], totalCount: 0 });
    expect(mapped.items).toEqual([]);
    expect(mapped.resultState).toBe(RESULT_STATE.NO_DATA);
  });

  it('maps summary response correctly', () => {
    const rawSummary = {
      total_current_qty: 125000,
      total_available_qty: 118000,
      under_safety_count: 14,
      danger_risk_count: 5,
    };

    const mapped = mapInventorySummaryResponse(rawSummary);

    expect(mapped.totalCurrentQuantity).toBe(125000);
    expect(mapped.totalAvailableQuantity).toBe(118000);
    expect(mapped.underSafetyCount).toBe(14);
    expect(mapped.dangerRiskCount).toBe(5);
  });

  it('maps backend detail, LOT and filter option response shapes without creating server values', () => {
    const detail = mapInventoryItem({
      rowId: 'SKU-1:STORE-1',
      skuCode: 'SKU-1',
      salesPointCode: 'STORE-1',
      currentQuantity: 10,
      risk: { assessmentStatus: 'ASSESSED', grade: 'SAFE', reason: '정상' },
      lots: [
        {
          id: 17,
          lotNumber: 'LOT-17',
          lotStatus: 'AVAILABLE',
          quantity: 10,
          availableQuantity: 8,
          reservedQuantity: 2,
          expiryDate: '2026-12-31',
          expiryDays: 100,
          fefoPriority: 1,
          warehouseCode: 'WH-1',
          warehouseName: '경인 1센터',
        },
      ],
    });

    expect(detail.lots).toEqual([
      expect.objectContaining({
        id: 17,
        lotNumber: 'LOT-17',
        expiryDate: '2026-12-31',
        warehouseCode: 'WH-1',
        rackLocation: null,
      }),
    ]);
    expect(detail.sellingPrice).toBeNull();
    expect(detail.updatedAt).toBeNull();

    expect(
      mapInventoryLotsResponse({ data: { items: [{ id: 17, lotNumber: 'LOT-17', quantity: 10 }], totalCount: 1 } }),
    ).toMatchObject({ totalCount: 1, items: [expect.objectContaining({ id: 17 })] });

    expect(
      mapInventoryFilterOptionsResponse({
        data: {
          warehouses: [{ code: 'WH-1', name: '경인 1센터', availability: 'ACTIVE' }],
          categories: [{ code: 'CAT-3', name: '베이커리', parentCode: 'CAT-2', level: 3 }],
          riskGrades: [{ code: 'SAFE', name: '양호' }],
        },
      }),
    ).toMatchObject({
      warehouses: [{ code: 'WH-1', name: '경인 1센터', availability: 'ACTIVE' }],
      categories: [{ code: 'CAT-3', name: '베이커리', parentCode: 'CAT-2', level: 3, categoryLevel: 3 }],
      riskGrades: [{ code: 'SAFE', name: '양호' }],
    });
  });

  it('marks a channel price without a selling value as NOT_LOADED', () => {
    const mapped = mapInventoryItem({
      skuCode: 'SKU-PRICE-1',
      channelPrices: [
        { salesPointCode: 'STORE-1', salesPointName: '테스트점', sellingPrice: null },
        { salesPointCode: 'STORE-2', salesPointName: '정상점', sellingPrice: 12500 },
      ],
    });

    expect(mapped.channelPrices).toEqual([
      expect.objectContaining({ salesPointCode: 'STORE-1', sellingPrice: null, priceStatus: 'NOT_LOADED' }),
      expect.objectContaining({ salesPointCode: 'STORE-2', sellingPrice: 12500, priceStatus: 'AVAILABLE' }),
    ]);
  });
});
