/**
 * LOT 상태 코드는 서버와 원천 데이터에서 사용하고,
 * 화면에는 사용자가 이해할 수 있는 한글 라벨과 설명을 표시합니다.
 */
export const LOT_STATUS_META = {
  AVAILABLE: {
    code: 'AVAILABLE',
    label: '정상',
    description: '판매 가능한 LOT입니다.',
  },
  SALE_STOPPED: {
    code: 'SALE_STOPPED',
    label: '판매중지',
    description: '판매가 중지된 LOT입니다.',
  },
  EXPIRED: {
    code: 'EXPIRED',
    label: '소비기한 경과',
    description: '소비기한이 지난 LOT입니다.',
  },
  DEPLETED: {
    code: 'DEPLETED',
    label: '재고 소진',
    description: '남은 재고가 없는 LOT입니다.',
  },
};

const UNKNOWN_STATUS_DESCRIPTION = '원천 시스템이 전달한 상태를 확인해 주세요.';

export function getLotStatusMeta(status) {
  const rawStatus = typeof status === 'string' ? status.trim() : '';
  const normalizedStatus = rawStatus.toUpperCase();

  return (
    LOT_STATUS_META[normalizedStatus] || {
      code: rawStatus || null,
      label: rawStatus ? '알 수 없는 상태' : '상태 미제공',
      description: rawStatus ? `${UNKNOWN_STATUS_DESCRIPTION} (코드: ${rawStatus})` : UNKNOWN_STATUS_DESCRIPTION,
    }
  );
}
