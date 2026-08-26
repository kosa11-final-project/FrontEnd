import { getAssessmentStatusLabel, normalizeRiskGrade, RISK_GRADES, RISK_GRADE_META } from '../model/risk.js';

/**
 * 위험 등급 배지 컴포넌트
 * @param {object} props
 * @param {string | null} [props.grade=null] - 위험 등급 (CRITICAL, WARNING, SAFE 등)
 * @param {string} [props.status='ASSESSED'] - 판정 상태 (ASSESSED, UNASSESSED 등)
 * @param {boolean} [props.showStatus=false] - 판정 상태 텍스트 표시 여부
 * @param {boolean} [props.showDot=true] - 위험도 라벨 앞의 점 표시 여부
 * @param {string} [props.className='']
 */
export function RiskGradeBadge({
  grade = null,
  status = 'ASSESSED',
  showStatus = false,
  showDot = true,
  className = '',
}) {
  const normalizedGrade = normalizeRiskGrade(grade);
  const isUnassessed =
    status === 'UNASSESSED' ||
    status === 'FAILED' ||
    status === 'STALE' ||
    status === 'REASSESSING' ||
    !Object.values(RISK_GRADES).includes(normalizedGrade);
  const targetGrade = isUnassessed ? 'UNASSESSED' : normalizedGrade;
  const meta = RISK_GRADE_META[targetGrade];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
      >
        {showDot && <span className={`size-1.5 rounded-full ${meta.dotClass}`} />}
        <span>{meta.label}</span>
      </span>

      {showStatus && status && status !== 'ASSESSED' && (
        <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {getAssessmentStatusLabel(status)}
        </span>
      )}
    </div>
  );
}
