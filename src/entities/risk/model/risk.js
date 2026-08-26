export const RISK_GRADES = {
  SAFE: 'SAFE',
  NORMAL: 'NORMAL',
  CAUTION: 'CAUTION',
  DANGER: 'DANGER',
};

export const RISK_GRADE_META = {
  SAFE: {
    label: '양호',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  NORMAL: {
    label: '보통',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-500',
  },
  CAUTION: {
    label: '주의',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  DANGER: {
    label: '위험',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
  },
  UNASSESSED: {
    label: '미판정',
    badgeClass: 'bg-slate-50 text-slate-500 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const ASSESSMENT_STATUS_LABELS = {
  ASSESSED: '판정 완료',
  UNASSESSED: '미판정',
  STALE: '판정 만료',
  FAILED: '판정 실패',
  REASSESSING: '재판정 중',
  ERROR: '판정 실패',
  LOADING: '판정 중',
};

export const RISK_GRADE_ALIASES = Object.freeze({
  GOOD: 'SAFE',
  WARNING: 'CAUTION',
  CRITICAL: 'DANGER',
});

export const RISK_REASON_SEVERITY_LABELS = Object.freeze({
  CRITICAL: '매우 위험',
  WARNING: '주의',
  NORMAL: '보통',
  GOOD: '양호',
  INFO: '안내',
});

export function normalizeRiskGrade(grade) {
  if (typeof grade !== 'string') return null;
  const normalized = grade.trim().toUpperCase();
  const canonical = RISK_GRADE_ALIASES[normalized] || normalized;
  return Object.hasOwn(RISK_GRADES, canonical) ? canonical : null;
}

export function getRiskGradeLabel(grade) {
  const normalized = normalizeRiskGrade(grade);
  return normalized ? RISK_GRADE_META[normalized]?.label || '위험 등급 확인 필요' : '위험 등급 확인 필요';
}

export function getAssessmentStatusLabel(status) {
  return ASSESSMENT_STATUS_LABELS[status] || '판정 상태 확인 필요';
}

export function getRiskReasonSeverityLabel(severity) {
  return RISK_REASON_SEVERITY_LABELS[severity] || '평가 정보';
}
