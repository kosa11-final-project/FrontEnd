import { getJson, postJson, unwrapApiResponse } from '@/shared/api';

const syncPath = 'v1/inventory-sync-runs';

export async function startInventorySync(clientRequestId, signal) {
  const response = await postJson({ path: syncPath, body: { clientRequestId }, signal });
  return unwrapApiResponse(response);
}

export async function getInventorySyncLatest(signal) {
  const response = await getJson({ path: `${syncPath}/latest`, signal });
  return unwrapApiResponse(response);
}

export async function getInventorySync(syncRunId, signal) {
  const response = await getJson({ path: `${syncPath}/${encodeURIComponent(syncRunId)}`, signal });
  return unwrapApiResponse(response);
}

export function retryAfterSeconds(error) {
  const value =
    error?.response?.headers?.['retry-after'] ??
    error?.cause?.response?.headers?.['retry-after'] ??
    error?.headers?.['retry-after'];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 10;
}
