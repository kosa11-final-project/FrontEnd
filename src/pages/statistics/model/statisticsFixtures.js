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
  const pointCount = 800;
  const legacyPointCount = 210;
  const end = Date.UTC(2026, 7, 16);
  const start = end - (pointCount - 1) * DAY_IN_MILLISECONDS;

  return Array.from({ length: pointCount }, (_, index) => {
    const seriesIndex = index - (pointCount - legacyPointCount);
    const date = new Date(start + index * DAY_IN_MILLISECONDS).toISOString().slice(0, 10);
    const campaignLift = seriesIndex > 142 && seriesIndex < 157 ? 145 - Math.abs(149 - seriesIndex) * 13 : 0;
    const criticalSkuCount = Math.max(
      1_180,
      Math.round(1_655 - seriesIndex * 1.72 + Math.sin(seriesIndex / 4.7) * 34 + campaignLift),
    );
    const criticalStockQty = Math.max(
      260_000,
      Math.round(355_000 - seriesIndex * 350 + Math.sin(seriesIndex / 8.2) * 8_600 + campaignLift * 315),
    );

    const warningSkuCount = Math.max(
      2_040,
      Math.round(2_510 - seriesIndex * 1.75 + Math.sin(seriesIndex / 6.4) * 48 + campaignLift * 0.8),
    );
    const warningStockQty = Math.max(
      620_000,
      Math.round(830_000 - seriesIndex * 900 + Math.sin(seriesIndex / 10.5) * 16_500 + campaignLift * 510),
    );
    const expectedDisposalQty30d = Math.max(
      420,
      Math.round(920 - seriesIndex * 1.9 + Math.sin(seriesIndex / 11) * 42 + campaignLift * 0.55),
    );
    const shortageSkuCount = Math.max(
      6_450,
      Math.round(7_240 - seriesIndex * 2 + Math.sin(seriesIndex / 7.8) * 95 - campaignLift * 0.35),
    );
    const totalStockQty = 3_790_195;

    return {
      date,
      totalStockQty,
      criticalSkuCount,
      warningSkuCount,
      riskSkuCount: criticalSkuCount + warningSkuCount,
      riskStockQty: criticalStockQty + warningStockQty,
      riskStockRatio: ((criticalStockQty + warningStockQty) / totalStockQty) * 100,
      warningStockQty,
      expectedDisposalQty30d,
      expectedDisposalLossAmount30d: expectedDisposalQty30d * 6_500,
      shortageSkuCount,
      criticalStockQty,
    };
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
]);

const previousLocations = Object.freeze(
  locations.map((location) => ({
    id: location.id,
    ...createSummary({
      totalSkuCount: Math.round(location.totalSkuCount * 1.01),
      totalStockQty: Math.round(location.totalStockQty * 1.03),
      availableStockQty: Math.round(location.availableStockQty * 1.025),
      criticalSkuCount: Math.round(location.criticalSkuCount * 1.08),
      criticalStockQty: Math.round(location.criticalStockQty * 1.1),
      shortageSkuCount: Math.round(location.shortageSkuCount * 1.05),
      expectedDisposalQty30d: Math.round(location.expectedDisposalQty30d * 1.2),
    }),
  })),
);

const nationalSummary = createSummary({
  totalSkuCount: 9_277,
  totalStockQty: 3_790_195,
  availableStockQty: 3_524_881,
  criticalSkuCount: 1_297,
  criticalStockQty: 281_260,
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
      totalStockQty: 2_353_350,
      availableStockQty: 2_188_616,
      criticalSkuCount: 1_082,
      criticalStockQty: 169_630,
      shortageSkuCount: 5_104,
      expectedDisposalQty30d: 342,
    }),
    OFFLINE_STORE: createSummary({
      totalSkuCount: 5_720,
      totalStockQty: 1_312_925,
      availableStockQty: 1_221_020,
      criticalSkuCount: 884,
      criticalStockQty: 102_930,
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
  }),
  previousScopeSummaries: Object.freeze({
    NATIONAL: createSummary({
      totalSkuCount: 9_340,
      totalStockQty: 3_842_600,
      availableStockQty: 3_562_000,
      criticalSkuCount: 1_364,
      criticalStockQty: 306_400,
      shortageSkuCount: 7_010,
      expectedDisposalQty30d: 648,
    }),
    WAREHOUSE: createSummary({
      totalSkuCount: 9_160,
      totalStockQty: 2_381_900,
      availableStockQty: 2_204_600,
      criticalSkuCount: 1_144,
      criticalStockQty: 188_500,
      shortageSkuCount: 5_400,
      expectedDisposalQty30d: 410,
    }),
    OFFLINE_STORE: createSummary({
      totalSkuCount: 5_780,
      totalStockQty: 1_333_100,
      availableStockQty: 1_236_700,
      criticalSkuCount: 906,
      criticalStockQty: 109_400,
      shortageSkuCount: 2_530,
      expectedDisposalQty30d: 493,
    }),
    ONLINE_STORE: createSummary({
      totalSkuCount: 3_290,
      totalStockQty: 127_600,
      availableStockQty: 120_700,
      criticalSkuCount: 136,
      criticalStockQty: 8_500,
      shortageSkuCount: 229,
      expectedDisposalQty30d: 51,
    }),
  }),
  locations,
  previousLocations,
  dailyTrend: Object.freeze(buildDailyTrend()),
});
