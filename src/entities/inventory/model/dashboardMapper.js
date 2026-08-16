import { getRegionLabel, getStoreLayout, getWarehouseLayout } from './dashboardLayout.js';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function mapWarehouse(warehouse, index) {
  const layout = getWarehouseLayout(warehouse.warehouseCode, index);

  return {
    id: warehouse.warehouseCode ?? String(warehouse.warehouseId),
    warehouseId: warehouse.warehouseId,
    code: warehouse.warehouseCode,
    name: warehouse.warehouseName,
    shortName: layout.shortName,
    region: layout.region ?? getRegionLabel(warehouse.regionCode),
    description: warehouse.address,
    address: warehouse.address,
    x: layout.x,
    y: layout.y,
    currentStock: toNumber(warehouse.currentStock),
    availableStock: toNumber(warehouse.availableStock),
    nearExpiryStock: toNumber(warehouse.nearExpiryStock),
    outboundStock: toNumber(warehouse.outboundStock),
    riskSkuCount: toNumber(warehouse.riskSkuCount),
  };
}

function mapOfflineStore(store, index) {
  const layout = getStoreLayout(store.salesPointCode, index);

  return {
    id: store.salesPointCode ?? String(store.salesPointId),
    salesPointId: store.salesPointId,
    code: store.salesPointCode,
    name: store.salesPointName,
    shortName: layout.shortName,
    type: '오프라인',
    region: getRegionLabel(store.regionCode),
    address: store.address,
    x: layout.x,
    y: layout.y,
    currentStock: toNumber(store.currentStock),
    availableStock: toNumber(store.availableStock),
    nearExpiryStock: toNumber(store.nearExpiryStock),
    expectedDisposal: toNumber(store.expectedDisposalQty),
    riskSkuCount: toNumber(store.riskSkuCount),
  };
}

function mapRiskSalesPoint(point) {
  return {
    id: String(point.salesPointId),
    rank: toNumber(point.rank),
    code: point.salesPointCode,
    name: point.salesPointName,
    type: point.channelType === 'ONLINE' ? '온라인' : '오프라인',
    region: getRegionLabel(point.regionCode),
    availableStock: toNumber(point.availableStock),
    riskSkuCount: toNumber(point.riskSkuCount),
    expectedDisposal: toNumber(point.expectedDisposalQty),
    nearExpiryStock: toNumber(point.nearExpiryStock),
  };
}

function mapUrgentSku(sku) {
  return {
    id: `${sku.skuId}:${sku.stockLocationType}:${sku.stockLocationId}`,
    skuId: String(sku.skuId),
    rank: toNumber(sku.rank),
    code: sku.skuCode,
    name: sku.skuName,
    stockLocationType: sku.stockLocationType,
    stockLocationCode: sku.stockLocationCode,
    stockLocation: sku.stockLocationName,
    allocatedSalesPointCode: sku.allocatedSalesPointCode,
    allocatedSalesPoint: sku.allocatedSalesPointName,
    expiryDays: sku.expiryDaysLeft,
    saleStopDays: sku.saleStopDaysLeft,
    expectedDisposal: toNumber(sku.expectedDisposalQty),
    issue: sku.reasonMessage,
  };
}

export function mapDashboardResponse(response) {
  const summary = response?.summary ?? {};

  return {
    summary: {
      totalAvailableStock: toNumber(summary.totalAvailableStock),
      criticalSkuCount: toNumber(summary.criticalSkuCount),
      warningSkuCount: toNumber(summary.warningSkuCount),
      riskAndCautionSkuCount: toNumber(summary.riskAndWarningSkuCount),
      shortageSkuCount: toNumber(summary.shortageSkuCount),
      expectedDisposal: toNumber(summary.expectedDisposalQty),
    },
    warehouses: (response?.warehouses ?? []).map(mapWarehouse),
    offlineStores: (response?.offlineStores ?? []).map(mapOfflineStore),
    riskSalesPointsTop10: (response?.riskSalesPointsTop10 ?? []).map(mapRiskSalesPoint),
    urgentSkusTop5: (response?.urgentSkusTop5 ?? []).map(mapUrgentSku),
    calculatedAt: response?.calculatedAt ?? null,
  };
}
