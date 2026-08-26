const warehouseLayoutByCode = Object.freeze({
  GYEONGIN_1: { shortName: '경인1', region: '수도권', x: 24, y: 24 },
  GYEONGIN_2: { shortName: '경인2', region: '수도권', x: 18, y: 43 },
  SUJI: { shortName: '수지', region: '수도권', x: 38, y: 37 },
  SMART_FOOD: { shortName: '성남', region: '수도권', x: 49, y: 20 },
  SEONGNAM: { shortName: '성남', region: '수도권', x: 49, y: 20 },
  DONGTAN: { shortName: '동탄', region: '수도권', x: 52, y: 50 },
  ICHEON_DC: { shortName: '이천', region: '수도권', x: 70, y: 37 },
  YEONGNAM: { shortName: '영남', region: '영남권', x: 76, y: 72 },
  HONAM: { shortName: '호남', region: '호남권', x: 39, y: 78 },
});

const onlineSalesPointLayoutByCode = Object.freeze({
  GREETING: { shortName: '그리팅몰', region: '온라인', x: 34, y: 44 },
  MODU_MATJIP: { shortName: '모두의맛집', region: '온라인', x: 66, y: 56 },
});

const storeLayoutByCode = Object.freeze({
  DEPT_THEHYUNDAI_SEOUL: { shortName: '더현대서울', x: 27, y: 14 },
  DEPT_APGUJEONG: { shortName: '압구정점', x: 46, y: 36 },
  DEPT_TRADE_CENTER: { shortName: '무역점', x: 62, y: 31 },
  DEPT_CHEONHO: { shortName: '천호점', x: 79, y: 40 },
  DEPT_SINCHON: { shortName: '신촌점', x: 29, y: 36 },
  DEPT_MIA: { shortName: '미아점', x: 44, y: 16 },
  DEPT_MOKDONG: { shortName: '목동점', x: 14, y: 42 },
  DEPT_JUNGDONG: { shortName: '중동점', x: 22, y: 62 },
  DEPT_KINTEX: { shortName: '킨텍스점', x: 11, y: 22 },
  DEPT_PANGYO: { shortName: '판교점', x: 43, y: 56 },
  DEPT_BUSAN: { shortName: '부산점', x: 80, y: 80 },
  DEPT_DAEGU: { shortName: '대구점', x: 70, y: 63 },
  DEPT_ULSAN: { shortName: '울산점', x: 86, y: 59 },
  DEPT_CHUNGCHEONG: { shortName: '충청점', x: 53, y: 75 },
  HMART_ASAN_HOSPITAL: { shortName: 'Hmart 아산병원점', x: 67, y: 14 },
});

const regionLabels = Object.freeze({
  SEOUL: '서울',
  GYEONGGI: '경기',
  INCHEON: '인천',
  BUSAN: '부산',
  DAEGU: '대구',
  ULSAN: '울산',
  CHUNGCHEONG: '충청',
  JEOLLA: '호남',
  GYEONGSANG: '영남',
  ONLINE: '온라인',
});

function fallbackPosition(index, columns, rowGap) {
  return {
    x: 12 + (index % columns) * (76 / Math.max(columns - 1, 1)),
    y: 18 + Math.floor(index / columns) * rowGap,
  };
}

export function getWarehouseLayout(code, index) {
  return warehouseLayoutByCode[code] ?? { shortName: code, ...fallbackPosition(index, 4, 48) };
}

export function getStoreLayout(code, index) {
  return storeLayoutByCode[code] ?? { shortName: code, ...fallbackPosition(index, 5, 24) };
}

export function getOnlineSalesPointLayout(code, index) {
  return onlineSalesPointLayoutByCode[code] ?? { shortName: code, ...fallbackPosition(index, 3, 38) };
}

export function getRegionLabel(code) {
  return regionLabels[code] ?? code ?? '-';
}

export function getHeatmapMarkerSize(availableStock, minimumStock, maximumStock, viewMode) {
  const sizeRange = {
    centers: [58, 94],
    online: [50, 76],
    stores: [48, 64],
  }[viewMode] ?? [48, 64];
  const [minimumSize, maximumSize] = sizeRange;
  const value = Number(availableStock);
  const minimum = Number(minimumStock);
  const maximum = Number(maximumStock);

  if (![value, minimum, maximum].every(Number.isFinite)) return minimumSize;
  if (maximum <= minimum) return Math.round((minimumSize + maximumSize) / 2);

  const normalized = Math.min(Math.max((value - minimum) / (maximum - minimum), 0), 1);
  return Math.round(minimumSize + Math.sqrt(normalized) * (maximumSize - minimumSize));
}
