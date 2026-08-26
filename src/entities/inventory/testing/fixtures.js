/**
 * 통합 재고 계약 기반의 결정적 DTO Fixtures
 * 백엔드 API와 100% 동일한 shape로 UI와 테스트를 지원합니다.
 */

// 현대백화점 15개 전 지점 공통 템플릿
const HYUNDAI_DEPT_15_STORES = [
  { id: 101, code: 'STORE_THE_HYUNDAI_SEOUL', name: '더현대 서울점' },
  { id: 102, code: 'STORE_APGUJEONG', name: '압구정본점' },
  { id: 103, code: 'STORE_TRADE_CENTER', name: '무역센터점' },
  { id: 104, code: 'STORE_CHEONHO', name: '천호점' },
  { id: 105, code: 'STORE_SINCHON', name: '신촌점' },
  { id: 106, code: 'STORE_MIA', name: '미아점' },
  { id: 107, code: 'STORE_MOKDONG', name: '목동점' },
  { id: 108, code: 'STORE_JUNG_DONG', name: '중동점' },
  { id: 109, code: 'STORE_KINTEX', name: '킨텍스점' },
  { id: 110, code: 'STORE_DCUBE', name: '디큐브시티' },
  { id: 111, code: 'STORE_PANGYO', name: '판교점' },
  { id: 112, code: 'STORE_ULSAN', name: '울산점' },
  { id: 113, code: 'STORE_ULSAN_DONGGU', name: '울산동구점' },
  { id: 114, code: 'STORE_CHUNGCHEONG', name: '충청점' },
  { id: 115, code: 'STORE_DAEGU', name: '대구점' },
];

export const mockRawInventoryItems = [
  {
    sku_id: 1001,
    product_code: 'PROD_MANDU_001',
    product_name: '비비고 왕교자 1.05kg (옴니채널 통합기획)',
    sku_code: 'SKU_MANDU_001_105',
    sku_name: '1.05kg 단품팩',
    sales_point_code: 'OMNI_ALL_CHANNELS',
    sales_point_name: '온·오프라인 4대 전 채널',
    channel_type: 'GREETING',
    storage_type: 'FROZEN',
    selling_price: 11900,
    image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=100&auto=format&fit=crop&q=60',
    current_qty: 2450,
    available_qty: 2180,
    reserved_qty: 270,
    safety_qty: 500,
    inventory_fact_state: 'AVAILABLE',
    risk: {
      grade: 'CAUTION',
      assessmentStatus: 'ASSESSED',
      reason: '이커머스(모두의맛집) 및 백화점 무역센터점 재고 품절 임박',
    },
    location_count: 5,
    locations: [
      { warehouseCode: 'GYEONGIN_1', warehouseName: '경인 1물류센터', quantity: 1100 },
      { warehouseCode: 'GYEONGIN_2', warehouseName: '경인 2물류센터', quantity: 450 },
      { warehouseCode: 'SMART_FOOD', warehouseName: '스마트푸드센터', quantity: 400 },
      { warehouseCode: 'DONGTAN', warehouseName: '동탄 물류센터', quantity: 420 },
      { warehouseCode: 'ICHEON_DC', warehouseName: '이천 통합물류센터', quantity: 80 },
    ],
    sales_points: [
      // 1. 그리팅 공식몰 (자사 온라인몰)
      {
        sales_point_id: 201,
        sales_point_code: 'GREETING_ONLINE',
        sales_point_name: '그리팅 공식몰',
        channel_type: 'GREETING',
        current_qty: 1000,
        available_qty: 900,
        reserved_qty: 100,
        risk_grade: 'SAFE',
        warehouse_name: '경인 1센터',
      },
      // 2. 모두의맛집 (이커머스/외부몰)
      {
        sales_point_id: 202,
        sales_point_code: 'ECOMMERCE_MODOO',
        sales_point_name: '모두의맛집 온라인스토어',
        channel_type: 'ECOMMERCE',
        current_qty: 80,
        available_qty: 10,
        reserved_qty: 70,
        risk_grade: 'DANGER',
        warehouse_name: '이천 통합센터',
      },
      // 3. H마트 역삼점 (오프라인 점포)
      {
        sales_point_id: 203,
        sales_point_code: 'HMART_STORE_01',
        sales_point_name: 'H마트 역삼점',
        channel_type: 'HMART',
        current_qty: 220,
        available_qty: 200,
        reserved_qty: 20,
        risk_grade: 'SAFE',
        warehouse_name: '동탄 센터',
      },
      // 4. 현대백화점 15개 전 지점
      ...HYUNDAI_DEPT_15_STORES.map((st, i) => {
        let qty = 60;
        let avail = 55;
        let grade = 'SAFE';
        let wh = i % 2 === 0 ? '경인 1센터' : '경인 2센터';

        if (st.code === 'STORE_THE_HYUNDAI_SEOUL') {
          qty = 120;
          avail = 90;
          grade = 'SAFE';
          wh = '경인 1센터';
        } else if (st.code === 'STORE_TRADE_CENTER') {
          qty = 35;
          avail = 5;
          grade = 'DANGER';
          wh = '경인 1센터';
        } else if (st.code === 'STORE_PANGYO') {
          qty = 150;
          avail = 140;
          grade = 'SAFE';
          wh = '경인 2센터';
        } else if (st.code === 'STORE_ULSAN') {
          qty = 30;
          avail = 15;
          grade = 'CAUTION';
          wh = '스마트푸드센터';
        } else if (st.code === 'STORE_ULSAN_DONGGU') {
          qty = 25;
          avail = 10;
          grade = 'CAUTION';
          wh = '스마트푸드센터';
        } else if (st.code === 'STORE_CHEONHO') {
          qty = 70;
          avail = 65;
          grade = 'SAFE';
          wh = '동탄 센터';
        }

        return {
          sales_point_id: st.id,
          sales_point_code: st.code,
          sales_point_name: st.name,
          channel_type: 'HYUNDAI_DEPT',
          current_qty: qty,
          available_qty: avail,
          reserved_qty: qty - avail,
          risk_grade: grade,
          warehouse_name: wh,
        };
      }),
    ],
    lots: [
      {
        id: 'LOT-MANDU-01',
        lot_number: 'LOT-GF-20260729-01',
        quantity: 1200,
        available_qty: 1050,
        reserved_qty: 150,
        expiry_date: '2026-11-15',
        expiry_days: 90,
        received_date: '2026-07-29',
        rack_location: '경인 1센터 A-04-12',
        fefo_priority: 1,
      },
      {
        id: 'LOT-MANDU-02',
        lot_number: 'LOT-GF-20260805-02',
        quantity: 850,
        available_qty: 780,
        reserved_qty: 70,
        expiry_date: '2026-11-28',
        expiry_days: 103,
        received_date: '2026-08-05',
        rack_location: '경인 2센터 B-02-08',
        fefo_priority: 2,
      },
      {
        id: 'LOT-MANDU-03',
        lot_number: 'LOT-GF-20260812-03',
        quantity: 400,
        available_qty: 350,
        reserved_qty: 50,
        expiry_date: '2026-12-10',
        expiry_days: 115,
        received_date: '2026-08-12',
        rack_location: '동탄 센터 C-01-05',
        fefo_priority: 3,
      },
    ],
    ai_recommendation: {
      type: 'RT',
      title: '판교점 ➔ 무역센터점 재고 30개 점간 이동(RT) 권고',
      description: '무역센터점 가용재고 5개(당일 소진 예상) 대비 판교점 가용 140개(보유율 93%)로 불균형 심화',
      source_point: '판교점 (가용 140개)',
      target_point: '무역센터점 (가용 5개, 품절 임박)',
      recommended_qty: 30,
      expected_profit_gain: 185000,
    },
    nearest_expiry_days: 90,
    nearest_expiry_date: '2026-11-15',
    updated_at: '2026-08-14T09:30:00Z',
  },
  {
    sku_id: 1002,
    product_code: 'PROD_HANWOO_002',
    product_name: '현대명품 한우 1++ 등심 구이용 500g',
    sku_code: 'SKU_HANWOO_002_500',
    sku_name: '500g 냉장팩',
    sales_point_code: 'STORE_THE_HYUNDAI_SEOUL',
    sales_point_name: '더현대 서울점 외 14개 지점',
    channel_type: 'HYUNDAI_DEPT',
    storage_type: 'COLD',
    selling_price: 78000,
    image_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=100&auto=format&fit=crop&q=60',
    current_qty: 85,
    available_qty: 40,
    reserved_qty: 45,
    safety_qty: 60,
    inventory_fact_state: 'AVAILABLE',
    risk: {
      grade: 'CAUTION',
      assessmentStatus: 'ASSESSED',
      reason: '가용재고가 안전재고 기준에 미달하여 추가 공급 권고',
    },
    location_count: 1,
    locations: [{ warehouseCode: 'GYEONGIN_1', warehouseName: '경인 1물류센터', quantity: 85 }],
    sales_points: HYUNDAI_DEPT_15_STORES.map((st, i) => {
      let qty = 45;
      let avail = 40;
      let grade = 'SAFE';
      if (st.code === 'STORE_THE_HYUNDAI_SEOUL') {
        qty = 85;
        avail = 40;
        grade = 'CAUTION';
      } else if (st.code === 'STORE_TRADE_CENTER') {
        qty = 15;
        avail = 0;
        grade = 'DANGER';
      } else if (st.code === 'STORE_PANGYO') {
        qty = 120;
        avail = 110;
        grade = 'SAFE';
      } else if (st.code === 'STORE_ULSAN') {
        qty = 10;
        avail = 5;
        grade = 'CAUTION';
      }
      return {
        sales_point_id: st.id,
        sales_point_code: st.code,
        sales_point_name: st.name,
        channel_type: 'HYUNDAI_DEPT',
        current_qty: qty,
        available_qty: avail,
        reserved_qty: qty - avail,
        risk_grade: grade,
        warehouse_name: i % 2 === 0 ? '경인 1센터' : '경인 2센터',
      };
    }),
    lots: [
      {
        id: 'LOT-HANWOO-01',
        lot_number: 'LOT-HW-20260810-01',
        quantity: 50,
        available_qty: 25,
        reserved_qty: 25,
        expiry_date: '2026-08-22',
        expiry_days: 8,
        received_date: '2026-08-10',
        rack_location: '경인 1센터 냉장 1존-R03',
        fefo_priority: 1,
      },
      {
        id: 'LOT-HANWOO-02',
        lot_number: 'LOT-HW-20260813-02',
        quantity: 35,
        available_qty: 15,
        reserved_qty: 20,
        expiry_date: '2026-08-28',
        expiry_days: 14,
        received_date: '2026-08-13',
        rack_location: '경인 1센터 냉장 1존-R05',
        fefo_priority: 2,
      },
    ],
    ai_recommendation: {
      type: 'REFILL',
      title: '경인 1물류센터 ➔ 더현대 서울점 30개 긴급 보충 발주',
      description: '주말 프로모션 수요 대비 더현대 서울점 안전재고 부족 예상',
      source_point: '경인 1물류센터 공용재고',
      target_point: '더현대 서울점',
      recommended_qty: 30,
      expected_profit_gain: 420000,
    },
    nearest_expiry_days: 8,
    nearest_expiry_date: '2026-08-22',
    updated_at: '2026-08-14T11:00:00Z',
  },
  {
    sku_id: 1003,
    product_code: 'PROD_SALAD_003',
    product_name: '프레시 바질 리코타 샐러드 220g',
    sku_code: 'SKU_SALAD_003_220',
    sku_name: '220g 용기형',
    sales_point_code: 'ECOMMERCE_MODOO',
    sales_point_name: '모두의맛집 온라인스토어',
    channel_type: 'ECOMMERCE',
    storage_type: 'COLD',
    selling_price: 6900,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&auto=format&fit=crop&q=60',
    current_qty: 15,
    available_qty: 0,
    reserved_qty: 15,
    safety_qty: 50,
    inventory_fact_state: 'OUT_OF_STOCK',
    risk: {
      grade: 'DANGER',
      assessmentStatus: 'ASSESSED',
      reason: '가용수량 0 및 당일 출고 예약으로 완전 품절',
    },
    location_count: 1,
    locations: [{ warehouseCode: 'ICHEON_DC', warehouseName: '이천 통합물류센터', quantity: 15 }],
    sales_points: [
      {
        sales_point_code: 'ECOMMERCE_MODOO',
        sales_point_name: '모두의맛집 온라인스토어',
        channel_type: 'ECOMMERCE',
        current_qty: 15,
        available_qty: 0,
        reserved_qty: 15,
        risk_grade: 'DANGER',
        warehouse_name: '이천 통합센터',
      },
    ],
    lots: [
      {
        id: 'LOT-SALAD-01',
        lot_number: 'LOT-SL-20260814-01',
        quantity: 15,
        available_qty: 0,
        reserved_qty: 15,
        expiry_date: '2026-08-16',
        expiry_days: 2,
        received_date: '2026-08-14',
        rack_location: '이천 센터 냉장 존-S01',
        fefo_priority: 1,
      },
    ],
    ai_recommendation: {
      type: 'REFILL',
      title: '스마트푸드센터 ➔ 모두의맛집 50개 긴급 제조 출고',
      description: '온라인 주문 폭주로 인한 완전 품절 상태, 당일 긴급 배송 조치 필요',
      source_point: '스마트푸드센터',
      target_point: '모두의맛집 온라인스토어',
      recommended_qty: 50,
      expected_profit_gain: 95000,
    },
    nearest_expiry_days: 2,
    nearest_expiry_date: '2026-08-16',
    updated_at: '2026-08-14T12:00:00Z',
  },
  {
    sku_id: 1004,
    product_code: 'PROD_KIMCHI_004',
    product_name: '종가집 전라도 포기김치 3.2kg',
    sku_code: 'SKU_KIMCHI_004_320',
    sku_name: '3.2kg 단일 규격',
    sales_point_code: 'HMART_STORE_01',
    sales_point_name: 'H마트 역삼점',
    channel_type: 'HMART',
    storage_type: 'COLD',
    selling_price: 28900,
    image_url: 'https://images.unsplash.com/photo-1583032015879-a68132e4d0d0?w=100&auto=format&fit=crop&q=60',
    current_qty: 320,
    available_qty: 300,
    reserved_qty: 20,
    safety_qty: 150,
    inventory_fact_state: 'AVAILABLE',
    risk: {
      grade: 'SAFE',
      assessmentStatus: 'ASSESSED',
      reason: '정상 재고 운영 중',
    },
    location_count: 1,
    locations: [{ warehouseCode: 'DONGTAN', warehouseName: '동탄 물류센터', quantity: 320 }],
    sales_points: [
      {
        sales_point_code: 'HMART_STORE_01',
        sales_point_name: 'H마트 역삼점',
        channel_type: 'HMART',
        current_qty: 320,
        available_qty: 300,
        reserved_qty: 20,
        risk_grade: 'SAFE',
        warehouse_name: '동탄 센터',
      },
    ],
    lots: [
      {
        id: 'LOT-KIMCHI-01',
        lot_number: 'LOT-KC-20260801-01',
        quantity: 320,
        available_qty: 300,
        reserved_qty: 20,
        expiry_date: '2026-10-14',
        expiry_days: 60,
        received_date: '2026-08-01',
        rack_location: '동탄 센터 K-02',
        fefo_priority: 1,
      },
    ],
    nearest_expiry_days: 60,
    nearest_expiry_date: '2026-10-14',
    updated_at: '2026-08-14T08:15:00Z',
  },
  {
    sku_id: 1005,
    product_code: 'PROD_SOUP_005',
    product_name: '갈비탕 밀키트 800g (2인분)',
    sku_code: 'SKU_SOUP_005_800',
    sku_name: '800g 팩',
    sales_point_code: 'STORE_HYUNDAI_PANGYO',
    sales_point_name: '현대백화점 판교점 외 2곳',
    channel_type: 'HYUNDAI_DEPT',
    storage_type: 'FROZEN',
    selling_price: 15900,
    image_url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&auto=format&fit=crop&q=60',
    current_qty: 520,
    available_qty: 480,
    reserved_qty: 40,
    safety_qty: 200,
    inventory_fact_state: 'AVAILABLE',
    risk: {
      grade: 'NORMAL',
      assessmentStatus: 'ASSESSED',
      reason: '수요예측 대비 적정 재고 수준 유지',
    },
    location_count: 2,
    locations: [
      { warehouseCode: 'GYEONGIN_2', warehouseName: '경인 2물류센터', quantity: 300 },
      { warehouseCode: 'ICHEON_DC', warehouseName: '이천 통합물류센터', quantity: 220 },
    ],
    sales_points: [
      {
        sales_point_code: 'STORE_PANGYO',
        sales_point_name: '현대백화점 판교점',
        channel_type: 'HYUNDAI_DEPT',
        current_qty: 300,
        available_qty: 280,
        reserved_qty: 20,
        risk_grade: 'SAFE',
        warehouse_name: '경인 2센터',
      },
      {
        sales_point_code: 'STORE_THE_HYUNDAI_SEOUL',
        sales_point_name: '더현대 서울점',
        channel_type: 'HYUNDAI_DEPT',
        current_qty: 120,
        available_qty: 110,
        reserved_qty: 10,
        risk_grade: 'NORMAL',
        warehouse_name: '경인 2센터',
      },
      {
        sales_point_code: 'STORE_TRADE_CENTER',
        sales_point_name: '무역센터점',
        channel_type: 'HYUNDAI_DEPT',
        current_qty: 100,
        available_qty: 90,
        reserved_qty: 10,
        risk_grade: 'NORMAL',
        warehouse_name: '이천 통합센터',
      },
    ],
    lots: [
      {
        id: 'LOT-SOUP-01',
        lot_number: 'LOT-SP-20260715-01',
        quantity: 520,
        available_qty: 480,
        reserved_qty: 40,
        expiry_date: '2026-11-12',
        expiry_days: 90,
        received_date: '2026-07-15',
        rack_location: '경인 2센터 F-01',
        fefo_priority: 1,
      },
    ],
    nearest_expiry_days: 90,
    nearest_expiry_date: '2026-11-12',
    updated_at: '2026-08-14T07:40:00Z',
  },
];

export const mockInventoryListResponse = {
  success: true,
  data: {
    items: mockRawInventoryItems,
    totalCount: 5,
    page: 1,
    size: 20,
    isFilterEmpty: false,
  },
};

export const mockEmptyInventoryListResponse = {
  success: true,
  data: {
    items: [],
    totalCount: 0,
    page: 1,
    size: 20,
    isFilterEmpty: false,
  },
};

export const mockFilterEmptyInventoryListResponse = {
  success: true,
  data: {
    items: [],
    totalCount: 0,
    page: 1,
    size: 20,
    isFilterEmpty: true,
  },
};

export const mockInventorySummaryResponse = {
  success: true,
  data: {
    totalCurrentQuantity: 2190,
    totalAvailableQuantity: 2000,
    totalReservedQuantity: 190,
    underSafetyCount: 2,
    dangerRiskCount: 1,
    cautionRiskCount: 1,
    safeRiskCount: 3,
    lastSyncTime: '2026-08-14T15:00:00Z',
  },
};
