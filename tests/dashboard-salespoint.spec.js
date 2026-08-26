import { expect, test } from '@playwright/test';
import { mockAuthenticatedSession } from './auth-mocks.js';

const dashboardBody = JSON.stringify({
  data: {
    summary: {},
    warehouses: [],
    onlineSalesPoints: [],
    offlineStores: [
      {
        salesPointId: 13,
        salesPointCode: 'DEPT_PANGYO',
        salesPointName: '판교점',
        regionCode: 'GYEONGGI',
        address: '경기도 성남시',
        currentStock: 100,
        availableStock: 80,
        nearExpiryStock: 10,
        expectedDisposalQty: 5,
        riskSkuCount: 1,
      },
      {
        salesPointId: 14,
        salesPointCode: 'DEPT_SUJI',
        salesPointName: '수지점',
        regionCode: 'GYEONGGI',
        address: '경기도 용인시',
        currentStock: 90,
        availableStock: 70,
        nearExpiryStock: 8,
        expectedDisposalQty: 4,
        riskSkuCount: 1,
      },
    ],
    riskSalesPointsTop10: [
      {
        rank: 1,
        salesPointId: 13,
        salesPointCode: 'DEPT_PANGYO',
        salesPointName: '판교점',
        channelType: 'OFFLINE',
        regionCode: 'GYEONGGI',
        availableStock: 80,
        riskSkuCount: 1,
        expectedDisposalQty: 5,
        nearExpiryStock: 10,
      },
    ],
    urgentSkusTop5: [],
    urgentSkusBySalesPoint: {
      13: [
        {
          rank: 1,
          skuId: 1,
          skuCode: 'SKU-PANGYO',
          skuName: '판교 긴급 SKU',
          stockLocationType: 'WAREHOUSE',
          stockLocationId: 1,
          stockLocationCode: 'SEONGNAM',
          stockLocationName: '성남센터',
          allocatedSalesPointId: 13,
          allocatedSalesPointCode: 'DEPT_PANGYO',
          allocatedSalesPointName: '판교점',
          expiryDaysLeft: 12,
          saleStopDaysLeft: 5,
          expectedDisposalQty: 10,
          reasonMessage: '판교점 긴급 처리 대상입니다.',
        },
      ],
      14: [
        {
          rank: 1,
          skuId: 2,
          skuCode: 'SKU-SUJI',
          skuName: '수지 긴급 SKU',
          stockLocationType: 'WAREHOUSE',
          stockLocationId: 1,
          stockLocationCode: 'SEONGNAM',
          stockLocationName: '성남센터',
          allocatedSalesPointId: 14,
          allocatedSalesPointCode: 'DEPT_SUJI',
          allocatedSalesPointName: '수지점',
          expiryDaysLeft: 11,
          saleStopDaysLeft: 4,
          expectedDisposalQty: 8,
          reasonMessage: '수지점 긴급 처리 대상입니다.',
        },
      ],
    },
    calculatedAt: '2026-08-25T05:00:00Z',
  },
  timestamp: '2026-08-25T05:00:00Z',
});

test('판매처를 선택하면 통합 운영 카드의 긴급 SKU만 해당 판매처 기준으로 바뀐다', async ({ page }) => {
  await mockAuthenticatedSession(page);
  await page.unroute('**/api/v1/dashboard');
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: dashboardBody }),
  );

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: '판매처 운영 현황' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /긴급 처리 SKU TOP 5/ })).toBeVisible();
  await expect(page.getByText('전체 재고 구역 개요')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '전체 보기' })).toHaveCount(0);
  await expect(page.getByText('판교 긴급 SKU')).toBeVisible();
  await page.getByRole('button', { name: /위험재고 보유 판매처 TOP 10/ }).click();
  await expect(page.getByRole('link', { name: '판교점 재고 보기' })).toBeVisible();

  await page.getByRole('button', { name: /수지점/ }).click();

  await expect(page.getByText('수지 긴급 SKU')).toBeVisible();
  await expect(page.getByText('판교 긴급 SKU')).not.toBeVisible();
  await expect(page.getByRole('link', { name: '판교점 재고 보기' })).toBeVisible();
});
