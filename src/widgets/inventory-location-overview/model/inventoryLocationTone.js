export function getInventoryLocationTone(location, viewMode) {
  const riskSkuCount = Number(location.riskSkuCount) || 0;
  const nearExpiryStock = Number(location.nearExpiryStock) || 0;
  const expectedDisposal = Number(location.expectedDisposal) || 0;

  if (viewMode === 'centers') {
    if (riskSkuCount >= 5 || nearExpiryStock >= 1200) return 'danger';
    if (riskSkuCount >= 2 || nearExpiryStock >= 500) return 'warning';
    return 'good';
  }

  if (riskSkuCount >= 210 || nearExpiryStock >= 2000 || expectedDisposal >= 40) return 'danger';
  if (riskSkuCount >= 150 || nearExpiryStock >= 800 || expectedDisposal >= 25) return 'warning';
  return 'good';
}
