import { RISK_ASSESSMENT_STATUS } from '@/entities/inventory/model/inventory.js';

// 채널별 시그니처 뱃지 스타일 (WCAG AA 4.5:1 이상 고대비 보장)
export const CHANNEL_BADGE_STYLES = {
  GREETING: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
  ECOMMERCE: 'bg-[#CFFAFE] text-[#155E75] border-[#A5F3FC]',
  HYUNDAI_DEPT: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
  HMART: 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
};

// 보관유형 뱃지 스타일
export const STORAGE_BADGE_STYLES = {
  FROZEN: 'bg-[#E0F2FE] text-[#075985]',
  COLD: 'bg-[#EEF2FF] text-[#3730A3]',
  ROOM_TEMP: 'bg-[#F3F4F6] text-[#1F2937]',
};

export const ASSESSMENT_STATUS_LABELS = {
  [RISK_ASSESSMENT_STATUS.ASSESSED]: '판정 완료',
  [RISK_ASSESSMENT_STATUS.UNASSESSED]: '미판정',
  [RISK_ASSESSMENT_STATUS.REASSESSING]: '재판정 중',
  [RISK_ASSESSMENT_STATUS.STALE]: '판정 만료',
  [RISK_ASSESSMENT_STATUS.FAILED]: '판정 실패',
};
