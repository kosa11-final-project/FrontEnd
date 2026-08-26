import { getJson } from '@/shared/api';
import { SUPPORTED_ACTION_TYPES } from '../model/strategy.js';

const strategyExecutionPath = 'v1/strategy-executions';
const supportedActionTypes = new Set(SUPPORTED_ACTION_TYPES);

const normalizeLocation = (location) =>
  location
    ? {
        id: location.id ?? null,
        code: location.code ?? null,
        name: location.name ?? null,
        type: location.type ?? null,
      }
    : null;

const normalizeAction = (action = {}) => ({
  id: action.id ?? null,
  type: action.type ?? null,
  title: action.title ?? '',
  target: action.target ?? '',
  relationship: action.relationship ?? null,
  dependsOn: Array.isArray(action.dependsOn) ? action.dependsOn : [],
  status: action.status ?? null,
  progress: action.progress ?? null,
  note: action.note ?? null,
  actionQuantity: action.actionQuantity ?? null,
  startDate: action.startDate ?? null,
  endDate: action.endDate ?? null,
  sourceSalesPoint: normalizeLocation(action.sourceSalesPoint),
  targetSalesPoint: normalizeLocation(action.targetSalesPoint),
  sourceWarehouse: normalizeLocation(action.sourceWarehouse),
  destinationWarehouse: normalizeLocation(action.destinationWarehouse),
  kpis: Array.isArray(action.kpis) ? action.kpis : [],
});

const normalizeInventoryTransfer = (transfer = {}) => ({
  fromLocationId: transfer.fromLocationId ?? null,
  fromLocationName: transfer.fromLocationName ?? '',
  toLocationId: transfer.toLocationId ?? null,
  toLocationName: transfer.toLocationName ?? '',
  destinationWarehouseId: transfer.destinationWarehouseId ?? null,
  destinationWarehouseName: transfer.destinationWarehouseName ?? null,
  targetSalesPointId: transfer.targetSalesPointId ?? null,
  targetSalesPointName: transfer.targetSalesPointName ?? null,
  quantity: transfer.quantity ?? null,
});

export function mapStrategyExecutionResponse(value = {}) {
  const product = value.product ?? {};
  return {
    id: value.id ?? null,
    number: value.number ?? '',
    status: value.status ?? null,
    product: {
      skuId: product.skuId ?? null,
      name: product.name ?? '',
      sku: product.sku ?? '',
      imageUrl: product.imageUrl ?? null,
    },
    establishedAt: value.establishedAt ?? null,
    progress: value.progress ?? null,
    goal: value.goal ?? null,
    resultSummary: value.resultSummary ?? null,
    actions: (Array.isArray(value.actions) ? value.actions : [])
      .filter((action) => supportedActionTypes.has(action.type))
      .map(normalizeAction),
    inventoryResults: Array.isArray(value.inventoryResults) ? value.inventoryResults : [],
    inventoryTransfers: (Array.isArray(value.inventoryTransfers) ? value.inventoryTransfers : []).map(
      normalizeInventoryTransfer,
    ),
    channelResults: Array.isArray(value.channelResults) ? value.channelResults : [],
    salesDaily: Array.isArray(value.salesDaily) ? value.salesDaily : [],
    salesPointComparison: Array.isArray(value.salesPointComparison) ? value.salesPointComparison : [],
    performance: value.performance ?? null,
    lastSyncedAt: value.lastSyncedAt ?? null,
  };
}

export function mapStrategyExecutionPageResponse(response = {}) {
  const data = response?.data ?? {};
  const content = Array.isArray(data) ? data : Array.isArray(data.content) ? data.content : [];
  const backendPage = Number.isInteger(data.page) ? data.page : Number.isInteger(data.number) ? data.number : 0;
  const size = Number.isInteger(data.size) && data.size > 0 ? data.size : Math.max(content.length, 10);
  const totalElements = Number.isInteger(data.totalElements) ? data.totalElements : content.length;
  const totalPages = Number.isInteger(data.totalPages) ? Math.max(data.totalPages, 1) : 1;

  return {
    items: content.map(mapStrategyExecutionResponse),
    page: backendPage + 1,
    size,
    totalElements,
    totalPages,
    first: typeof data.first === 'boolean' ? data.first : backendPage <= 0,
    last: typeof data.last === 'boolean' ? data.last : backendPage >= totalPages - 1,
  };
}

export async function getStrategyExecutions(params = {}, signal) {
  const response = await getJson({ path: strategyExecutionPath, params, signal });
  return mapStrategyExecutionPageResponse(response);
}

export async function getStrategyExecution(strategyCaseId, signal) {
  const response = await getJson({ path: `${strategyExecutionPath}/${strategyCaseId}`, signal });
  if (!response?.data) throw new Error('전략 실행 정보를 찾을 수 없습니다.');
  return mapStrategyExecutionResponse(response.data);
}
