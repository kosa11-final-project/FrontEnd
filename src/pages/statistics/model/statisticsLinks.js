const inventoryRiskGradeMap = Object.freeze({
  CRITICAL: 'DANGER',
  WARNING: 'CAUTION',
  NORMAL: 'NORMAL',
  GOOD: 'SAFE',
});

function appendScopeParams(searchParams, { scopeType, locationId, locations }) {
  if (scopeType === 'NATIONAL') return true;
  if (scopeType === 'UNASSIGNED') return false;

  const scopeLocations = locations.filter((location) => location.scopeType === scopeType);
  const selectedLocations =
    locationId && locationId !== 'ALL'
      ? scopeLocations.filter((location) => location.id === locationId)
      : scopeLocations;

  if (selectedLocations.length === 0) return false;

  const parameterName = scopeType === 'WAREHOUSE' ? 'warehouseCode' : 'salesPointCode';
  selectedLocations.forEach((location) => searchParams.append(parameterName, location.code));
  return true;
}

export function getStatisticsInventoryUrl({
  scopeType = 'NATIONAL',
  locationId = 'ALL',
  locations = [],
  riskGrade,
  assessmentStatus,
} = {}) {
  const searchParams = new URLSearchParams();
  const canRepresentScope = appendScopeParams(searchParams, { scopeType, locationId, locations });

  if (!canRepresentScope) return null;

  if (riskGrade) {
    const inventoryRiskGrade = inventoryRiskGradeMap[riskGrade];
    if (!inventoryRiskGrade) return null;
    searchParams.append('riskGrade', inventoryRiskGrade);
  }

  if (assessmentStatus) searchParams.append('assessmentStatus', assessmentStatus);

  const query = searchParams.toString();
  return query ? `/inventory?${query}` : '/inventory';
}
