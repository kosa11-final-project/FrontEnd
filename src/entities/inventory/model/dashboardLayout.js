const warehouseLayoutByCode = Object.freeze({
  GYEONGIN_1: { shortName: '경인1', region: '수도권', x: 24, y: 24 },
  GYEONGIN_2: { shortName: '경인2', region: '수도권', x: 18, y: 43 },
  SUJI: { shortName: '수지', region: '수도권', x: 38, y: 37 },
  SEONGNAM: { shortName: '성남', region: '수도권', x: 49, y: 20 },
  DONGTAN: { shortName: '동탄', region: '수도권', x: 52, y: 50 },
  ICHEON_DC: { shortName: '이천', region: '수도권', x: 70, y: 37 },
  YEONGNAM: { shortName: '영남', region: '영남권', x: 76, y: 72 },
  HONAM: { shortName: '호남', region: '호남권', x: 39, y: 78 },
});

const storeLayoutByCode = Object.freeze({
  DEPT_THEHYUNDAI_SEOUL: { shortName: '더현대서울', x: 25, y: 17 },
  DEPT_APGUJEONG: { shortName: '압구정', x: 39, y: 24 },
  DEPT_TRADE_CENTER: { shortName: '무역', x: 53, y: 19 },
  DEPT_CHEONHO: { shortName: '천호', x: 66, y: 28 },
  DEPT_SINCHON: { shortName: '신촌', x: 25, y: 34 },
  DEPT_MIA: { shortName: '미아', x: 56, y: 8 },
  DEPT_MOKDONG: { shortName: '목동', x: 16, y: 46 },
  DEPT_JUNGDONG: { shortName: '중동', x: 24, y: 55 },
  DEPT_KINTEX: { shortName: '킨텍스', x: 11, y: 27 },
  DEPT_PANGYO: { shortName: '판교', x: 48, y: 41 },
  DEPT_BUSAN: { shortName: '부산', x: 82, y: 78 },
  DEPT_DAEGU: { shortName: '대구', x: 71, y: 63 },
  DEPT_ULSAN: { shortName: '울산', x: 88, y: 61 },
  DEPT_CHUNGCHEONG: { shortName: '충청', x: 51, y: 58 },
  HMART_ASAN_HOSPITAL: { shortName: 'Hmart', x: 70, y: 12 },
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

export function getRegionLabel(code) {
  return regionLabels[code] ?? code ?? '-';
}

export function getHeatmapMarkerSize(availableStock, minimumStock, maximumStock, viewMode) {
  const minimumSize = viewMode === 'centers' ? 58 : 44;
  const maximumSize = viewMode === 'centers' ? 94 : 66;
  const value = Number(availableStock);
  const minimum = Number(minimumStock);
  const maximum = Number(maximumStock);

  if (![value, minimum, maximum].every(Number.isFinite)) return minimumSize;
  if (maximum <= minimum) return Math.round((minimumSize + maximumSize) / 2);

  const normalized = Math.min(Math.max((value - minimum) / (maximum - minimum), 0), 1);
  return Math.round(minimumSize + Math.sqrt(normalized) * (maximumSize - minimumSize));
}
