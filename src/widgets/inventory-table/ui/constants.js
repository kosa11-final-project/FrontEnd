import { RISK_ASSESSMENT_STATUS } from '@/entities/inventory';

// 채널별 시그니처 뱃지 스타일
export const CHANNEL_BADGE_STYLES = {
  GREETING: 'bg-[#DAF7E9] text-[#1E8251] border-[#B7ECCF]',
  ECOMMERCE: 'bg-[#CFF4FC] text-[#007B9E] border-[#A6E8F6]',
  HYUNDAI_DEPT: 'bg-[#F3E8FF] text-[#6B21A8] border-[#E9D5FF]',
  HMART: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]',
};

// 보관유형 뱃지 스타일
export const STORAGE_BADGE_STYLES = {
  FROZEN: 'bg-[#E0F2FE] text-[#0369A1]',
  COLD: 'bg-[#E0E7FF] text-[#4338CA]',
  ROOM_TEMP: 'bg-[#F3F4F6] text-[#4B5563]',
};

export const ASSESSMENT_STATUS_LABELS = {
  [RISK_ASSESSMENT_STATUS.ASSESSED]: '판정 완료',
  [RISK_ASSESSMENT_STATUS.UNASSESSED]: '미판정',
  [RISK_ASSESSMENT_STATUS.REASSESSING]: '재판정 중',
  [RISK_ASSESSMENT_STATUS.STALE]: '판정 만료',
  [RISK_ASSESSMENT_STATUS.FAILED]: '판정 실패',
};
