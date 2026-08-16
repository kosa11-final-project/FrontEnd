const DAY_IN_MILLISECONDS = 86_400_000;

function buildDistribution(totalSkuCount, totalStockQty, criticalSkuCount, criticalStockQty) {
  const warningSkuCount = Math.min(totalSkuCount - criticalSkuCount, Math.round(criticalSkuCount * 1.65));
  const unassessedSkuCount = Math.max(1, Math.round(totalSkuCount * 0.006));
  const normalSkuCount = Math.max(0, Math.round(totalSkuCount * 0.27));
  const goodSkuCount = Math.max(
    0,
    totalSkuCount - criticalSkuCount - warningSkuCount - normalSkuCount - unassessedSkuCount,
  );
  const warningStockQty = Math.round(Math.min(totalStockQty - criticalStockQty, criticalStockQty * 2.35));
  const unassessedStockQty = Math.round(totalStockQty * 0.015);
  const normalStockQty = Math.round(totalStockQty * 0.32);
  const goodStockQty = Math.max(
    0,
    totalStockQty - criticalStockQty - warningStockQty - normalStockQty - unassessedStockQty,
  );

  return [
    { riskGrade: 'CRITICAL', skuCount: criticalSkuCount, stockQty: criticalStockQty },
    { riskGrade: 'WARNING', skuCount: warningSkuCount, stockQty: warningStockQty },
    { riskGrade: 'NORMAL', skuCount: normalSkuCount, stockQty: normalStockQty },
    { riskGrade: 'GOOD', skuCount: goodSkuCount, stockQty: goodStockQty },
    { riskGrade: 'UNASSESSED', skuCount: unassessedSkuCount, stockQty: unassessedStockQty },
  ];
}

function createSummary({
  totalSkuCount,
  totalStockQty,
  availableStockQty,
  criticalSkuCount,
  criticalStockQty,
  shortageSkuCount,
  expectedDisposalQty30d,
  costMultiplier = 6_250,
  missingCostSkuCount = 0,
  missingCostStockQty = 0,
  missingForecastSkuCount = Math.max(1, Math.round(totalSkuCount * 0.009)),
}) {
  const riskDistribution = buildDistribution(totalSkuCount, totalStockQty, criticalSkuCount, criticalStockQty);
  const unassessed = riskDistribution.find(({ riskGrade }) => riskGrade === 'UNASSESSED');

  return {
    totalSkuCount,
    totalStockQty,
    availableStockQty,
    criticalSkuCount,
    criticalStockQty,
    shortageSkuCount,
    expectedDisposalQty30d,
    riskDistribution,
    dataQuality: {
      unassessedSkuCount: unassessed?.skuCount ?? 0,
      unassessedStockQty: unassessed?.stockQty ?? 0,
      missingForecastSkuCount,
      disposalExcludedSkuCount: missingForecastSkuCount,
    },
    financialSummary: {
      totalInventoryCostAmount: Math.round(totalStockQty * costMultiplier),
      criticalInventoryCostAmount: Math.round(criticalStockQty * costMultiplier * 1.08),
      expectedDisposalLossAmount30d: Math.round(expectedDisposalQty30d * costMultiplier * 1.04),
      missingCostSkuCount,
      missingCostStockQty,
    },
  };
}

function createLocation({
  id,
  name,
  code,
  scopeType,
  region,
  totalStockQty,
  totalSkuCount,
  criticalStockQty,
  criticalSkuCount,
}) {
  const summary = createSummary({
    totalSkuCount,
    totalStockQty,
    availableStockQty: Math.round(totalStockQty * 0.93),
    criticalSkuCount,
    criticalStockQty,
    shortageSkuCount: Math.round(criticalSkuCount * 1.8),
    expectedDisposalQty30d: Math.max(0, Math.round(criticalStockQty * 0.012)),
  });

  return {
    id,
    name,
    code,
    scopeType,
    region,
    ...summary,
    criticalStockRatio: totalStockQty ? (criticalStockQty / totalStockQty) * 100 : 0,
  };
}

function buildDailyTrend() {
  const start = Date.UTC(2026, 0, 19);
  return Array.from({ length: 210 }, (_, index) => {
    const date = new Date(start + index * DAY_IN_MILLISECONDS).toISOString().slice(0, 10);
    const campaignLift = index > 142 && index < 157 ? 145 - Math.abs(149 - index) * 13 : 0;
    const criticalSkuCount = Math.max(
      1_180,
      Math.round(1_655 - index * 1.72 + Math.sin(index / 4.7) * 34 + campaignLift),
    );
    const criticalStockQty = Math.max(
      165_000,
      Math.round(264_000 - index * 392 + Math.sin(index / 8.2) * 8_600 + campaignLift * 315),
    );

    return { date, criticalSkuCount, criticalStockQty };
  });
}

const locations = Object.freeze([
  createLocation({
    id: 'WH_SEONGNAM',
    code: 'SEONGNAM',
    name: '성남 스마트푸드센터',
    scopeType: 'WAREHOUSE',
    region: '경기',
    totalStockQty: 421_600,
    totalSkuCount: 7_842,
    criticalStockQty: 31_820,
    criticalSkuCount: 428,
  }),
  createLocation({
    id: 'WH_GYEONGIN_1',
    code: 'GYEONGIN_1',
    name: '경인센터 1',
    scopeType: 'WAREHOUSE',
    region: '경기',
    totalStockQty: 356_400,
    totalSkuCount: 7_310,
    criticalStockQty: 25_930,
    criticalSkuCount: 386,
  }),
  createLocation({
    id: 'WH_GYEONGIN_2',
    code: 'GYEONGIN_2',
    name: '경인센터 2',
    scopeType: 'WAREHOUSE',
    region: '경기',
    totalStockQty: 301_260,
    totalSkuCount: 6_920,
    criticalStockQty: 28_740,
    criticalSkuCount: 402,
  }),
  createLocation({
    id: 'WH_SUJI',
    code: 'SUJI',
    name: '용인-수지센터',
    scopeType: 'WAREHOUSE',
    region: '경기',
    totalStockQty: 282_900,
    totalSkuCount: 6_770,
    criticalStockQty: 14_320,
    criticalSkuCount: 260,
  }),
  createLocation({
    id: 'WH_DONGTAN',
    code: 'DONGTAN',
    name: '동탄센터',
    scopeType: 'WAREHOUSE',
    region: '경기',
    totalStockQty: 274_850,
    totalSkuCount: 6_540,
    criticalStockQty: 18_610,
    criticalSkuCount: 292,
  }),
  createLocation({
    id: 'WH_ICHEON',
    code: 'ICHEON_DC',
    name: '이천 DC',
    scopeType: 'WAREHOUSE',
    region: '경기',
    totalStockQty: 268_420,
    totalSkuCount: 6_380,
    criticalStockQty: 12_340,
    criticalSkuCount: 224,
  }),
  createLocation({
    id: 'WH_YEONGNAM',
    code: 'YEONGNAM',
    name: '영남센터',
    scopeType: 'WAREHOUSE',
    region: '영남',
    totalStockQty: 244_180,
    totalSkuCount: 5_960,
    criticalStockQty: 27_690,
    criticalSkuCount: 318,
  }),
  createLocation({
    id: 'WH_HONAM',
    code: 'HONAM',
    name: '호남센터',
    scopeType: 'WAREHOUSE',
    region: '호남',
    totalStockQty: 203_740,
    totalSkuCount: 5_420,
    criticalStockQty: 10_180,
    criticalSkuCount: 188,
  }),
  createLocation({
    id: 'SP_THEHYUNDAI_SEOUL',
    code: 'DEPT_THEHYUNDAI_SEOUL',
    name: '더현대 서울',
    scopeType: 'OFFLINE_STORE',
    region: '서울',
    totalStockQty: 220_907,
    totalSkuCount: 3_140,
    criticalStockQty: 18_520,
    criticalSkuCount: 112,
  }),
  createLocation({
    id: 'SP_TRADE_CENTER',
    code: 'DEPT_TRADE_CENTER',
    name: '무역센터점',
    scopeType: 'OFFLINE_STORE',
    region: '서울',
    totalStockQty: 219_748,
    totalSkuCount: 3_082,
    criticalStockQty: 17_420,
    criticalSkuCount: 106,
  }),
  createLocation({
    id: 'SP_CHEONHO',
    code: 'DEPT_CHEONHO',
    name: '천호점',
    scopeType: 'OFFLINE_STORE',
    region: '서울',
    totalStockQty: 217_208,
    totalSkuCount: 3_010,
    criticalStockQty: 21_380,
    criticalSkuCount: 128,
  }),
  createLocation({
    id: 'SP_PANGYO',
    code: 'DEPT_PANGYO',
    name: '판교점',
    scopeType: 'OFFLINE_STORE',
    region: '경기',
    totalStockQty: 216_299,
    totalSkuCount: 2_980,
    criticalStockQty: 13_840,
    criticalSkuCount: 94,
  }),
  createLocation({
    id: 'SP_BUSAN',
    code: 'DEPT_BUSAN',
    name: '커넥트현대 부산',
    scopeType: 'OFFLINE_STORE',
    region: '부산',
    totalStockQty: 221_623,
    totalSkuCount: 3_060,
    criticalStockQty: 16_910,
    criticalSkuCount: 102,
  }),
  createLocation({
    id: 'SP_DAEGU',
    code: 'DEPT_DAEGU',
    name: '더현대 대구',
    scopeType: 'OFFLINE_STORE',
    region: '대구',
    totalStockQty: 217_140,
    totalSkuCount: 2_940,
    criticalStockQty: 14_860,
    criticalSkuCount: 98,
  }),
  createLocation({
    id: 'SP_GREETING',
    code: 'GREETING',
    name: '그리팅몰',
    scopeType: 'ONLINE_STORE',
    region: '온라인',
    totalStockQty: 82_640,
    totalSkuCount: 2_860,
    criticalStockQty: 4_980,
    criticalSkuCount: 74,
  }),
  createLocation({
    id: 'SP_MODU_MATJIP',
    code: 'MODU_MATJIP',
    name: '모두의 맛집',
    scopeType: 'ONLINE_STORE',
    region: '온라인',
    totalStockQty: 41_280,
    totalSkuCount: 1_920,
    criticalStockQty: 3_720,
    criticalSkuCount: 56,
  }),
  createLocation({
    id: 'UNASSIGNED',
    code: 'UNASSIGNED',
    name: '공용 미할당',
    scopeType: 'UNASSIGNED',
    region: '전국 물류센터',
    totalStockQty: 58_895,
    totalSkuCount: 1_440,
    criticalStockQty: 8_940,
    criticalSkuCount: 146,
  }),
]);

const nationalSummary = createSummary({
  totalSkuCount: 9_277,
  totalStockQty: 3_208_895,
  availableStockQty: 3_070_127,
  criticalSkuCount: 1_297,
  criticalStockQty: 182_430,
  shortageSkuCount: 6_821,
  expectedDisposalQty30d: 519,
  missingCostSkuCount: 12,
  missingCostStockQty: 4_280,
  missingForecastSkuCount: 83,
});

export const inventoryStatisticsFixture = Object.freeze({
  asOfDate: '2026-08-16',
  calculatedAt: '2026-08-16T03:07:00+09:00',
  canViewFinancials: true,
  scopeSummaries: Object.freeze({
    NATIONAL: nationalSummary,
    WAREHOUSE: createSummary({
      totalSkuCount: 9_104,
      totalStockQty: 2_357_750,
      availableStockQty: 2_241_420,
      criticalSkuCount: 1_082,
      criticalStockQty: 169_630,
      shortageSkuCount: 5_104,
      expectedDisposalQty30d: 342,
    }),
    OFFLINE_STORE: createSummary({
      totalSkuCount: 5_720,
      totalStockQty: 3_070_127,
      availableStockQty: 2_914_240,
      criticalSkuCount: 884,
      criticalStockQty: 143_520,
      shortageSkuCount: 2_410,
      expectedDisposalQty30d: 421,
    }),
    ONLINE_STORE: createSummary({
      totalSkuCount: 3_240,
      totalStockQty: 123_920,
      availableStockQty: 116_640,
      criticalSkuCount: 130,
      criticalStockQty: 8_700,
      shortageSkuCount: 214,
      expectedDisposalQty30d: 46,
    }),
    UNASSIGNED: locations.find(({ id }) => id === 'UNASSIGNED'),
  }),
  locations,
  dailyTrend: Object.freeze(buildDailyTrend()),
});
