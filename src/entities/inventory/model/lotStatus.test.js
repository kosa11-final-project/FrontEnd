import { describe, expect, it } from 'vitest';
import { getLotStatusMeta, LOT_STATUS_META } from './lotStatus.js';

describe('LOT 상태 메타데이터', () => {
  it.each([
    ['AVAILABLE', '정상', '판매 가능한 LOT입니다.'],
    ['SALE_STOPPED', '판매중지', '판매가 중지된 LOT입니다.'],
    ['EXPIRED', '소비기한 경과', '소비기한이 지난 LOT입니다.'],
    ['DEPLETED', '재고 소진', '남은 재고가 없는 LOT입니다.'],
  ])('상태 코드 %s를 한글 라벨과 설명으로 변환합니다', (status, label, description) => {
    expect(getLotStatusMeta(status)).toMatchObject({ label, description });
  });

  it('현재 서비스에서 사용하는 네 가지 상태를 안내할 수 있습니다', () => {
    expect(Object.keys(LOT_STATUS_META)).toEqual(['AVAILABLE', 'SALE_STOPPED', 'EXPIRED', 'DEPLETED']);
  });

  it('알 수 없는 상태는 원본 코드를 설명에 보존하고 한글 상태로 안내합니다', () => {
    expect(getLotStatusMeta('HOLD')).toEqual({
      code: 'HOLD',
      label: '알 수 없는 상태',
      description: '원천 시스템이 전달한 상태를 확인해 주세요. (코드: HOLD)',
    });
  });
});
