import {
  CHANNEL_NAMES,
  getInventoryFactStateLabel,
  INVENTORY_FACT_STATE,
  RESULT_STATE,
  RISK_ASSESSMENT_STATUS,
  RISK_GRADE_META,
  STORAGE_NAMES,
} from './inventory.js';
import { normalizeRiskGrade } from '@/entities/risk/model/risk.js';

function unwrapApiResponse(response = {}) {
  return response && typeof response === 'object' && response.data !== undefined ? response.data : response;
}

function valueOf(source, camelKey, snakeKey, fallback = undefined) {
  return source?.[camelKey] ?? source?.[snakeKey] ?? fallback;
}

function nullableNumber(...values) {
  const value = values.find((candidate) => candidate !== undefined && candidate !== null);
  if (value === undefined || value === null || value === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeShortageYn(value) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  return normalized === 'Y' || normalized === 'N' ? normalized : null;
}

/**
 * 동기화된 RISK_ASSESSMENT.shortage_yn을 우선 사용하고,
 * 구형 응답에서 해당 값이 빠진 경우에만 현재 가용수량과 안전재고 기준으로 보완합니다.
 */
function resolveShortageYn(rawValue, availableQuantity, safetyQuantity) {
  const persistedValue = normalizeShortageYn(rawValue);
  if (persistedValue) return persistedValue;
  if (availableQuantity == null || safetyQuantity == null) return null;
  return availableQuantity < safetyQuantity ? 'Y' : 'N';
}

function normalizeAssessmentStatus(value, riskGrade = null) {
  if (value === RISK_ASSESSMENT_STATUS.ASSESSED || value === RISK_ASSESSMENT_STATUS.UNASSESSED) {
    return value;
  }
  return (value == null || value === '') && normalizeRiskGrade(riskGrade) ? RISK_ASSESSMENT_STATUS.ASSESSED : null;
}

function mapCategoryPathItem(dto = {}) {
  return {
    id: valueOf(dto, 'id', 'categoryId', null),
    name: valueOf(dto, 'name', 'categoryName', ''),
    level: valueOf(dto, 'level', 'categoryLevel', null),
  };
}

function mapInventoryCategory(dto, fallback = {}) {
  const categoryDto = dto?.category ?? dto?.category_info;
  const rawLeaf = categoryDto?.leaf ?? categoryDto?.selected ?? null;
  const rawPath = categoryDto?.path ?? categoryDto?.categoryPath ?? categoryDto?.category_path ?? [];
  const fallbackLeaf = {
    id: fallback.categoryId,
    name: fallback.categoryName,
    level: fallback.categoryLevel,
  };
  const leaf = mapCategoryPathItem(rawLeaf || fallbackLeaf);
  const path = Array.isArray(rawPath) ? rawPath.map(mapCategoryPathItem).filter((item) => item.name) : [];

  if (!leaf.name && path.length === 0) {
    return null;
  }

  const normalizedPath = path.length > 0 ? path : [leaf];
  const normalizedLeaf = leaf.name ? leaf : normalizedPath[normalizedPath.length - 1];

  return {
    leaf: normalizedLeaf,
    path: normalizedPath,
  };
}

/**
 * 백엔드 LOT DTO를 화면에서 사용하는 LOT 모델로 정규화합니다.
 * 백엔드가 제공하지 않는 랙 위치는 물류센터명으로 추정하지 않고 null로 유지합니다.
 */
export function mapInventoryLot(dto = {}, index = 0) {
  const warehouseName = valueOf(dto, 'warehouseName', 'warehouse_name', '');

  return {
    id: valueOf(dto, 'id', 'lotId', `lot-${index + 1}`),
    // LOT 번호와 FEFO 순위는 서버가 계산한 값만 표시합니다. id만 UI key 용도로 합성합니다.
    lotNumber: valueOf(dto, 'lotNumber', 'lot_number', null),
    lotStatus: valueOf(dto, 'lotStatus', 'lot_status', null),
    quantity: nullableNumber(valueOf(dto, 'quantity', 'current_qty')),
    availableQuantity: nullableNumber(valueOf(dto, 'availableQuantity', 'available_qty')),
    reservedQuantity: nullableNumber(valueOf(dto, 'reservedQuantity', 'reserved_qty')),
    manufacturedDate: valueOf(dto, 'manufacturedDate', 'manufactured_date', null),
    receivedDate: valueOf(dto, 'receivedDate', 'received_date', null),
    expiryDate: valueOf(dto, 'expiryDate', 'expiry_date', null),
    saleStopDate: valueOf(dto, 'saleStopDate', 'sale_stop_date', null),
    expiryDays: nullableNumber(valueOf(dto, 'expiryDays', 'expiry_days', null)),
    fefoPriority: nullableNumber(valueOf(dto, 'fefoPriority', 'fefo_priority', null)),
    warehouseCode: valueOf(dto, 'warehouseCode', 'warehouse_code', null),
    warehouseName,
    rackLocation: valueOf(dto, 'rackLocation', 'rack_location', null),
  };
}

function mapLocation(dto = {}) {
  return {
    warehouseCode: valueOf(dto, 'warehouseCode', 'warehouse_code', ''),
    warehouseName: valueOf(dto, 'warehouseName', 'warehouse_name', ''),
    quantity: nullableNumber(valueOf(dto, 'quantity', 'current_qty')),
  };
}

function mapSalesPoint(dto = {}, fallback = {}) {
  const sellingPrice = nullableNumber(valueOf(dto, 'sellingPrice', 'selling_price', fallback.sellingPrice));
  const rawPriceStatus = valueOf(dto, 'priceStatus', 'price_status', null);
  const currentQuantity = nullableNumber(valueOf(dto, 'currentQuantity', 'current_qty'));
  const availableQuantity = nullableNumber(valueOf(dto, 'availableQuantity', 'available_qty'));
  const reservedQuantity = nullableNumber(valueOf(dto, 'reservedQuantity', 'reserved_qty'));
  const safetyQuantity = nullableNumber(valueOf(dto, 'safetyQuantity', 'safety_qty', fallback.safetyQuantity));
  const rawRiskGrade = valueOf(dto, 'riskGrade', 'risk_grade', fallback.riskGrade || null);
  const rawAssessmentStatus = valueOf(dto, 'assessmentStatus', 'assessment_status', fallback.assessmentStatus);
  const assessmentStatus = normalizeAssessmentStatus(rawAssessmentStatus, rawRiskGrade);
  const isLegacyStatusOmitted = rawAssessmentStatus == null || rawAssessmentStatus === '';
  const rawShortageYn = valueOf(dto, 'shortageYn', 'shortage_yn', fallback.shortageYn || null);
  const shortageYn =
    assessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED
      ? normalizeShortageYn(rawShortageYn)
      : isLegacyStatusOmitted
        ? resolveShortageYn(rawShortageYn, availableQuantity, safetyQuantity)
        : null;
  return {
    salesPointId: nullableNumber(valueOf(dto, 'salesPointId', 'sales_point_id', fallback.salesPointId)),
    salesPointCode: valueOf(dto, 'salesPointCode', 'sales_point_code', fallback.salesPointCode || ''),
    salesPointName: valueOf(
      dto,
      'salesPointName',
      'sales_point_name',
      fallback.salesPointName || valueOf(dto, 'salesPointCode', 'sales_point_code', ''),
    ),
    channelType: valueOf(dto, 'channelType', 'channel_type', fallback.channelType || ''),
    currentQuantity,
    availableQuantity,
    reservedQuantity,
    safetyQuantity,
    riskGrade: assessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED ? normalizeRiskGrade(rawRiskGrade) : null,
    assessmentStatus,
    shortageYn,
    salesPointState: valueOf(dto, 'salesPointState', 'sales_point_state', fallback.salesPointState || 'OWNED'),
    priceStatus: rawPriceStatus || (sellingPrice == null ? 'NOT_LOADED' : 'AVAILABLE'),
    warehouseName: valueOf(dto, 'warehouseName', 'warehouse_name', fallback.warehouseName || ''),
    sellingPrice,
  };
}

function isUnassignedSalesPoint(salesPoint = {}) {
  const salesPointCode = String(salesPoint.salesPointCode || '').toUpperCase();
  const channelType = String(salesPoint.channelType || '').toUpperCase();
  const salesPointState = String(salesPoint.salesPointState || '').toUpperCase();

  return salesPointCode === 'UNASSIGNED' || channelType === 'CENTER' || salesPointState === 'CENTER_ONLY';
}

/**
 * 백엔드 단일 재고 DTO를 프론트엔드 전용 View Model로 정규화합니다.
 * 목록 grain: SKU (rowId = skuCode), salesPoints에 소유 판매처를 중첩합니다.
 * 상세 응답은 하위 호환을 위해 서버가 제공한 rowId(skuCode:salesPointCode)를 그대로 유지합니다.
 * @param {Record<string, any>} dto
 * @returns {Record<string, any>}
 */
export function mapInventoryItem(response = {}) {
  const dto = unwrapApiResponse(response) || {};
  const skuId = nullableNumber(dto.skuId, dto.sku_id);
  const salesPointId = nullableNumber(dto.salesPointId, dto.sales_point_id);
  const productCode = dto.productCode || dto.product_code || '';
  const productName = dto.productName || dto.product_name || '상품명 미지정';
  const supplierName = dto.supplierName || dto.supplier_name || '';
  const skuCode = dto.skuCode || dto.sku_code || '';
  const skuName = dto.skuName || dto.sku_name || '';
  const salesPointCode = dto.salesPointCode || dto.sales_point_code || '';
  const salesPointName = dto.salesPointName || dto.sales_point_name || salesPointCode || '판매처 미지정';
  const channelType = dto.channelType || dto.channel_type || '';
  const storageType = dto.storageType || dto.storage_type || null;
  const categoryId = dto.categoryId ?? dto.category_id ?? null;
  const categoryName = dto.categoryName || dto.category_name || '';
  const categoryLevel = dto.categoryLevel ?? dto.category_level ?? null;
  const category = mapInventoryCategory(dto, { categoryId, categoryName, categoryLevel });

  const rawSalesPointsValue = dto.salesPoints ?? dto.sales_points;
  const hasAggregateSalesPoints = Array.isArray(rawSalesPointsValue);
  const rowId = dto.rowId || dto.row_id || (hasAggregateSalesPoints ? skuCode : `${skuCode}:${salesPointCode}`);

  // 수량 필드는 서버가 명시한 0과 미제공(null)을 구분해 보존합니다.
  const currentQuantity = nullableNumber(dto.currentQuantity, dto.current_qty, dto.on_hand_qty);
  const availableQuantity = nullableNumber(dto.availableQuantity, dto.available_qty);
  const reservedQuantity = nullableNumber(dto.reservedQuantity, dto.reserved_qty);
  const expectedDisposalQuantity = nullableNumber(
    dto.expectedDisposalQuantity,
    dto.expected_disposal_quantity,
    dto.expectedDisposalQty,
    dto.expected_disposal_qty,
  );
  const safetyQuantity = nullableNumber(dto.safetyQuantity, dto.safety_qty);

  // 판매처별 현재 가격 정보만 상세에서 사용합니다. 판매량은 ML 파이프라인의 입력이며
  // 통합재고 조회 응답에 포함하지 않습니다.
  const sellingPrice = nullableNumber(dto.sellingPrice, dto.selling_price);

  // 재고 사실 상태
  const rawFactState = dto.inventoryFactState ?? dto.inventory_fact_state ?? null;
  const inventoryFactState =
    rawFactState && Object.values(INVENTORY_FACT_STATE).includes(rawFactState) ? rawFactState : null;

  // 위험 판정 정보
  const riskObj = dto.risk || {};
  const rawShortageYn = dto.shortageYn ?? dto.shortage_yn ?? riskObj.shortageYn ?? riskObj.shortage_yn;
  const rawRiskGrade = dto.riskGrade ?? dto.risk_grade ?? riskObj.grade ?? null;
  const rawAssessmentStatus =
    dto.assessmentStatus ?? dto.assessment_status ?? riskObj.assessmentStatus ?? riskObj.assessment_status ?? null;
  const assessmentStatus = normalizeAssessmentStatus(rawAssessmentStatus, rawRiskGrade);
  const isLegacyStatusOmitted = rawAssessmentStatus == null || rawAssessmentStatus === '';
  const riskGrade = assessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED ? normalizeRiskGrade(rawRiskGrade) : null;
  const shortageYn =
    assessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED
      ? normalizeShortageYn(rawShortageYn)
      : isLegacyStatusOmitted
        ? resolveShortageYn(rawShortageYn, availableQuantity, safetyQuantity)
        : null;
  const riskReason =
    assessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED
      ? dto.riskReason || dto.risk_reason || riskObj.reason || ''
      : '';

  // 보관 물류센터 목록은 판매처에 귀속되지 않은 미할당 재고만 담습니다.
  // 새 API는 unassignedInventory.locations를 함께 제공하지만, 목록/상세 하위 호환을 위해
  // 기존 locations도 동일한 미할당 위치 목록으로 정규화합니다.
  const locations = Array.isArray(dto.locations) ? dto.locations.map(mapLocation) : [];
  const rawUnassignedInventory = dto.unassignedInventory ?? dto.unassigned_inventory ?? null;
  const nestedUnassignedLocations = Array.isArray(rawUnassignedInventory?.locations)
    ? rawUnassignedInventory.locations.map(mapLocation)
    : [];
  const unassignedLocations = nestedUnassignedLocations.length > 0 ? nestedUnassignedLocations : locations;
  const locationCount = nullableNumber(dto.locationCount, dto.location_count) ?? locations.length;
  const unassignedLocationCount =
    nullableNumber(
      rawUnassignedInventory?.locationCount,
      rawUnassignedInventory?.location_count,
      dto.unassignedLocationCount,
      dto.unassigned_location_count,
    ) ?? unassignedLocations.length;
  const primaryWarehouseName = unassignedLocations[0]?.warehouseName || dto.warehouseName || dto.warehouse_name || '-';

  // 소비기한 정보 (null 보존)
  const nearestExpiryDays = nullableNumber(dto.nearestExpiryDays, dto.nearest_expiry_days);
  const nearestExpiryDate = dto.nearestExpiryDate || dto.nearest_expiry_date || null;

  // 판매처별(지점별) 상세 분산 목록
  const rawSalesPoints = hasAggregateSalesPoints
    ? rawSalesPointsValue
    : salesPointCode || dto.salesPointName || dto.sales_point_name
      ? [
          {
            salesPointId,
            salesPointCode,
            salesPointName,
            channelType,
            currentQuantity,
            availableQuantity,
            reservedQuantity,
            riskGrade,
            warehouseName: primaryWarehouseName,
          },
        ]
      : [];

  const mappedSalesPoints = rawSalesPoints.map((sp) =>
    mapSalesPoint(sp, {
      salesPointCode,
      salesPointName,
      channelType,
      currentQuantity,
      availableQuantity,
      reservedQuantity,
      riskGrade,
      safetyQuantity: hasAggregateSalesPoints ? null : safetyQuantity,
      shortageYn: hasAggregateSalesPoints ? null : shortageYn,
      warehouseName: primaryWarehouseName,
    }),
  );
  const centerSalesPoint = mappedSalesPoints.find(isUnassignedSalesPoint) || null;
  const salesPoints = mappedSalesPoints
    .filter((sp) => !isUnassignedSalesPoint(sp))
    .map((sp) => ({ ...sp, warehouseName: '' }));

  const unassignedCurrentQuantity = nullableNumber(
    rawUnassignedInventory?.currentQuantity,
    rawUnassignedInventory?.current_quantity,
    dto.unassignedCurrentQty,
    dto.unassigned_current_qty,
    centerSalesPoint?.currentQuantity,
  );
  const unassignedAvailableQuantity = nullableNumber(
    rawUnassignedInventory?.availableQuantity,
    rawUnassignedInventory?.available_quantity,
    dto.unassignedAvailableQty,
    dto.unassigned_available_qty,
    centerSalesPoint?.availableQuantity,
  );
  const unassignedReservedQuantity = nullableNumber(
    rawUnassignedInventory?.reservedQuantity,
    rawUnassignedInventory?.reserved_quantity,
    dto.unassignedReservedQty,
    dto.unassigned_reserved_qty,
    centerSalesPoint?.reservedQuantity,
  );
  const unassignedSafetyQuantity = nullableNumber(
    rawUnassignedInventory?.safetyQuantity,
    rawUnassignedInventory?.safety_quantity,
    dto.unassignedSafetyQty,
    dto.unassigned_safety_qty,
  );
  const rawUnassignedShortageYn =
    rawUnassignedInventory?.shortageYn ??
    rawUnassignedInventory?.shortage_yn ??
    dto.unassignedShortageYn ??
    dto.unassigned_shortage_yn ??
    centerSalesPoint?.shortageYn ??
    null;
  const rawUnassignedAssessmentStatus =
    rawUnassignedInventory?.assessmentStatus ??
    rawUnassignedInventory?.assessment_status ??
    dto.unassignedAssessmentStatus ??
    dto.unassigned_assessment_status ??
    centerSalesPoint?.assessmentStatus ??
    null;
  const rawUnassignedRiskGrade =
    rawUnassignedInventory?.riskGrade ??
    rawUnassignedInventory?.risk_grade ??
    dto.unassignedRiskGrade ??
    dto.unassigned_risk_grade ??
    centerSalesPoint?.riskGrade ??
    null;
  const unassignedAssessmentStatus = normalizeAssessmentStatus(rawUnassignedAssessmentStatus, rawUnassignedRiskGrade);
  const unassignedShortageYn =
    unassignedAssessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED
      ? normalizeShortageYn(rawUnassignedShortageYn)
      : rawUnassignedAssessmentStatus == null || rawUnassignedAssessmentStatus === ''
        ? resolveShortageYn(rawUnassignedShortageYn, unassignedAvailableQuantity, unassignedSafetyQuantity)
        : null;
  const rawUnassignedFactState =
    rawUnassignedInventory?.inventoryFactState ??
    rawUnassignedInventory?.inventory_fact_state ??
    dto.unassignedInventoryFactState ??
    dto.unassigned_inventory_fact_state ??
    null;
  const unassignedFactState = Object.values(INVENTORY_FACT_STATE).includes(rawUnassignedFactState)
    ? rawUnassignedFactState
    : null;
  const unassignedRiskGrade =
    unassignedAssessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED ? normalizeRiskGrade(rawUnassignedRiskGrade) : null;
  const unassignedRiskReason =
    unassignedAssessmentStatus === RISK_ASSESSMENT_STATUS.ASSESSED
      ? (rawUnassignedInventory?.riskReason ??
        rawUnassignedInventory?.risk_reason ??
        dto.unassignedRiskReason ??
        dto.unassigned_risk_reason ??
        '')
      : '';
  const unassignedInventory = {
    currentQuantity: unassignedCurrentQuantity,
    availableQuantity: unassignedAvailableQuantity,
    reservedQuantity: unassignedReservedQuantity,
    inventoryFactState: unassignedFactState,
    shortageYn: unassignedShortageYn,
    riskGrade: unassignedRiskGrade,
    assessmentStatus: unassignedAssessmentStatus,
    riskReason: unassignedRiskReason,
    locations: unassignedLocations,
    locationCount: unassignedLocationCount,
    hasStock: Boolean(
      centerSalesPoint ||
      unassignedCurrentQuantity != null ||
      unassignedAvailableQuantity != null ||
      unassignedReservedQuantity != null ||
      nestedUnassignedLocations.length > 0,
    ),
  };
  const hasShortage =
    shortageYn === 'Y' || unassignedShortageYn === 'Y' || mappedSalesPoints.some((point) => point.shortageYn === 'Y');
  const hasKnownShortageStatus =
    shortageYn === 'N' || unassignedShortageYn === 'N' || mappedSalesPoints.some((point) => point.shortageYn === 'N');
  const resolvedShortageYn = hasShortage ? 'Y' : hasKnownShortageStatus ? 'N' : null;

  // 채널별 지점 수 요약
  const channelCountMap = {};
  salesPoints.forEach((sp) => {
    channelCountMap[sp.channelType] = (channelCountMap[sp.channelType] || 0) + 1;
  });

  // LOT 목록 정규화
  const rawLots = Array.isArray(dto.lots) ? dto.lots : [];
  const lots = rawLots.map(mapInventoryLot);

  // 판매처별 판매가 목록 정규화
  const rawPrices = Array.isArray(dto.channelPrices)
    ? dto.channelPrices
    : Array.isArray(dto.channel_prices)
      ? dto.channel_prices
      : [];
  const channelPrices = rawPrices.map((p) => {
    const channelSellingPrice = nullableNumber(p.sellingPrice, p.selling_price);
    return {
      salesPointCode: p.salesPointCode || p.sales_point_code || '',
      salesPointName: p.salesPointName || p.sales_point_name || '',
      sellingPrice: channelSellingPrice,
      actualPrice: nullableNumber(p.actualPrice, p.actual_price),
      minimumSellingPrice: nullableNumber(p.minimumSellingPrice, p.minimum_selling_price),
      effectiveFrom: p.effectiveFrom || p.effective_from || null,
      effectiveTo: p.effectiveTo || p.effective_to || null,
      priceStatus: p.priceStatus || p.price_status || (channelSellingPrice == null ? 'NOT_LOADED' : 'AVAILABLE'),
    };
  });

  return {
    rowId,
    skuId,
    productCode,
    productName,
    supplierName,
    skuCode,
    skuName,
    categoryId,
    categoryName,
    categoryLevel,
    category,
    categoryPath: category?.path || [],
    categoryPathLabel: category?.path?.map((entry) => entry.name).join(' > ') || categoryName,
    imageUrl: dto.imageUrl || dto.image_url || null,
    channelType,
    channelName: CHANNEL_NAMES[channelType] || channelType || '기타',
    salesPointCode,
    salesPointName,
    storageType,
    channelPrices,
    storageName: storageType ? STORAGE_NAMES[storageType] || storageType : '보관유형 미제공',
    sellingPrice,
    currentQuantity,
    availableQuantity,
    reservedQuantity,
    expectedDisposalQuantity,
    safetyQuantity,
    shortageYn: resolvedShortageYn,
    inventoryFactState,
    inventoryFactLabel: inventoryFactState ? getInventoryFactStateLabel(inventoryFactState) : null,
    riskGrade,
    riskMeta: riskGrade ? RISK_GRADE_META[riskGrade] || null : null,
    assessmentStatus,
    riskReason,
    locations,
    locationCount,
    unassignedInventory,
    primaryWarehouseName,
    salesPoints,
    salesPointCount: salesPoints.length,
    ownerSalesPointCount: nullableNumber(dto.ownerSalesPointCount, dto.owner_sales_point_count) ?? salesPoints.length,
    channelCountMap,
    lots,
    aiRecommendation: null,
    nearestExpiryDays,
    nearestExpiryDate,
    updatedAt: dto.updatedAt || dto.updated_at || null,
  };
}

/**
 * 백엔드 재고 목록 API 응답을 정규화합니다.
 * @param {Record<string, any>} response
 * @returns {{
 *   items: Array<any>,
 *   totalCount: number,
 *   page: number,
 *   size: number,
 *   totalPages: number,
 *   resultState: string
 * }}
 */
export function mapInventoryListResponse(response = {}) {
  const rawData = unwrapApiResponse(response) || {};
  const rawItems = Array.isArray(rawData.items)
    ? rawData.items
    : Array.isArray(rawData.content)
      ? rawData.content
      : Array.isArray(rawData)
        ? rawData
        : [];

  const items = rawItems.map(mapInventoryItem);
  const totalCount = Math.max(0, nullableNumber(rawData.totalCount, rawData.totalElements) ?? items.length);
  const page = Math.max(1, nullableNumber(rawData.page, rawData.number) ?? 1);
  const size = Math.max(1, nullableNumber(rawData.size) ?? 20);
  const totalPages = Math.max(
    1,
    nullableNumber(rawData.totalPages, rawData.total_pages) ?? Math.ceil(totalCount / size),
  );

  let resultState = RESULT_STATE.HAS_DATA;
  if (items.length === 0) {
    resultState = rawData.isFilterEmpty || rawData.filterEmpty ? RESULT_STATE.FILTER_EMPTY : RESULT_STATE.NO_DATA;
  }

  return {
    items,
    totalCount,
    page,
    size,
    totalPages,
    resultState,
  };
}

/**
 * 상단 KPI 요약 통계 응답을 정규화합니다.
 * @param {Record<string, any>} response
 */
export function mapInventorySummaryResponse(response = {}) {
  const data = unwrapApiResponse(response) || {};

  return {
    totalCurrentQuantity: nullableNumber(data.totalCurrentQuantity, data.total_current_qty, data.totalCurrentQty),
    totalAvailableQuantity: nullableNumber(
      data.totalAvailableQuantity,
      data.total_available_qty,
      data.totalAvailableQty,
    ),
    totalReservedQuantity: nullableNumber(data.totalReservedQuantity, data.total_reserved_qty, data.totalReservedQty),
    underSafetyCount: nullableNumber(data.underSafetyCount, data.under_safety_count) ?? 0,
    dangerRiskCount: nullableNumber(data.dangerRiskCount, data.danger_risk_count) ?? 0,
    cautionRiskCount: nullableNumber(data.cautionRiskCount, data.caution_risk_count) ?? 0,
    safeRiskCount: nullableNumber(data.safeRiskCount, data.safe_risk_count) ?? 0,
    lastSyncTime: data.lastSyncTime || data.last_sync_time || null,
  };
}

/** 선택 SKU × 판매처의 LOT 응답을 정규화합니다. */
export function mapInventoryLotsResponse(response = {}) {
  const data = unwrapApiResponse(response) || {};
  const rawItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return {
    items: rawItems.map(mapInventoryLot),
    totalCount: nullableNumber(data?.totalCount, data?.total_count) ?? rawItems.length,
  };
}

/** 재고 필터 기준정보 응답을 정규화합니다. */
export function mapInventoryFilterOptionsResponse(response = {}) {
  const data = unwrapApiResponse(response) || {};
  const optionKeys = [
    'channels',
    'salesPoints',
    'warehouses',
    'regions',
    'categories',
    'storageTypes',
    'riskGrades',
    'assessmentStatuses',
  ];

  return Object.fromEntries(
    optionKeys.map((key) => {
      const snakeKey = key.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
      const options = data?.[key] ?? data?.[snakeKey] ?? [];
      return [
        key,
        Array.isArray(options)
          ? options.map((option) => {
              const code = valueOf(option, 'code', 'code', '');
              const rawName = valueOf(option, 'name', 'name', code);
              const name = key === 'riskGrades' && (code === 'NORMAL' || rawName === '관찰') ? '보통' : rawName;
              return {
                code,
                name,
                parentCode: valueOf(option, 'parentCode', 'parent_code', null),
                regionCode: valueOf(option, 'regionCode', 'region_code', null),
                channelType: valueOf(option, 'channelType', 'channel_type', null),
                availability: valueOf(option, 'availability', 'availability', null),
                currentSkuCount: valueOf(option, 'currentSkuCount', 'current_sku_count', null),
                currentBalanceRowCount: valueOf(option, 'currentBalanceRowCount', 'current_balance_row_count', null),
                currentOnHandQty: valueOf(option, 'currentOnHandQty', 'current_on_hand_qty', null),
                level: valueOf(option, 'level', 'categoryLevel', null),
                // 필터 모달은 categoryLevel을 사용하고 백엔드 계약은 level을 사용하므로 양쪽 이름을 보존합니다.
                categoryLevel: valueOf(option, 'categoryLevel', 'level', null),
              };
            })
          : [],
      ];
    }),
  );
}
