# Taste Skill Dashboard Prompt

이 문서는 Codex의 `redesign-skill`과 `minimalist-skill`을 현대그린푸드 재고 운영 플랫폼에 적용할 때 사용하는 팀 공용 프롬프트입니다. 두 스킬의 일반적인 미학보다 이 프로젝트의 도메인 규칙과 디자인 토큰을 우선합니다.

## Installed Skills

- `redesign-skill`: 기존 화면을 다시 작성하지 않고 타이포그래피, 계층, 상태, 상호작용, 접근성을 진단하고 개선합니다.
- `minimalist-skill`: 업무 화면에 필요한 절제된 표면, 명확한 여백, 얇은 경계선, 정보 밀도를 점검합니다.

스킬은 Codex 사용자 환경에 설치되어 있습니다.

- `/Users/junha/.codex/skills/redesign-skill/SKILL.md`
- `/Users/junha/.codex/skills/minimalist-skill/SKILL.md`

## Team Prompt

```text
현재 React 19 + Vite + JavaScript 기반의 현대그린푸드 다중 판매채널 재고 운영 플랫폼을 개선한다.
이 작업은 마케팅 랜딩이 아니라 재고 담당자가 매일 사용하는 B2B 업무 화면이다.

먼저 현재 코드와 기존 shared/ui, widgets, pages 구조를 읽고 다음 순서로 작업한다.
1. 기존 기능·라우팅·FSD 경계를 유지한 채 시각적 문제를 진단한다.
2. 정보 우선순위, 타이포그래피, 여백, 상태 표현, 포커스와 hover/active 상태를 개선한다.
3. 같은 기능을 다시 구현하지 말고 이미 있는 shadcn/ui source-owned 컴포넌트와 src/shared/ui를 우선 재사용한다.
4. 도메인 조합은 pages/widgets/features/entities에 두고 shared/ui에는 도메인·라우터 의존성을 넣지 않는다.
5. 새 CSS는 기존 토큰으로 표현할 수 없는 경우에만 해당 FSD slice에 최소 범위로 추가한다.

시각 방향:
- 흰색 고정 사이드바와 밝은 gray-50 작업 캔버스, 현재 메뉴는 main 초록으로 활성화
- Dashboard Filter Foundations 색상만 사용
- main #27B06E, sub-mint #11C6AB, sub-cyan #00B0D7, sub-orange #FDA643
- semantic danger #D92D20, danger-soft #FEE4E2
- soft mint #DAF7E9, soft cyan #CFF4FC, soft orange #FFEC2C
- gray-900 #282828, gray-700 #747474, gray-500 #8E8E8E
- gray-300 #C1C1C1, gray-200 #DADADA, gray-50 #F4F4F4
- 원시 hex를 페이지 CSS에 직접 쓰지 말고 src/styles.css의 semantic token을 사용한다.
- 폰트는 프로젝트에 포함된 Pretendard 하나만 사용한다.
- 아이콘은 프로젝트의 Reicon만 사용하고 새 아이콘 라이브러리를 추가하지 않는다.
- panel radius는 0.5rem, control radius는 0.375rem을 기본으로 하며 과도한 pill과 둥근 카드 남용을 피한다.
- 그림자는 약하게, 1px 경계선과 여백을 우선해 계층을 만든다.
- 표·필터·요약 수치가 주 콘텐츠이며 장식용 이미지, 히어로 마케팅 문구, 보라색 AI 그라디언트는 사용하지 않는다.
- 숫자 데이터에는 tabular figures를 사용하고, 긴 제목은 text-wrap: balance 또는 pretty로 처리한다.
- 버튼, 링크, 입력, 선택, 탭에는 hover, active, focus-visible, disabled 상태를 제공한다.
- prefers-reduced-motion 사용자가 애니메이션을 끌 수 있게 한다.

도메인 규칙:
- ZONE과 KAN은 표시하지 않는다.
- 핵심 식별자는 단품코드, SKU, LOT, 센터, 점포, 판매채널이다.
- 현재고와 가용수량을 구분한다.
- 소비기한 잔여일과 재고일수를 구분한다.
- 위험등급은 색상만으로 표시하지 말고 텍스트와 아이콘을 함께 사용한다.

결과를 제출하기 전 다음을 확인한다.
- 기본 경로와 사이드바 라우팅이 유지된다.
- 로딩, 빈 데이터, 오류, 권한 없음 상태가 깨지지 않는다.
- 1440px 데스크톱과 좁은 화면에서 텍스트가 잘리거나 겹치지 않는다.
- pnpm run build, pnpm test, pnpm run test:e2e를 실행하고 결과를 보고한다.
- 사용한 변경은 파일별로 짧게 요약하고, 새 추상화가 필요했던 이유를 설명한다.
```

## Usage Notes

- 화면을 새로 만들 때는 `redesign-skill`의 **Scan → Diagnose → Fix** 순서를 먼저 적용합니다.
- 기존 운영 화면을 개선할 때는 `minimalist-skill`의 절제된 표면 원칙만 가져오고, 따뜻한 단색 팔레트·세리프 폰트·Phosphor 아이콘 지침은 프로젝트 규칙으로 대체합니다.
- AI가 새 컴포넌트를 만들기 전에 `src/shared/ui/index.js`와 해당 FSD slice를 먼저 검색하도록 합니다.
- 완성 판단은 시각적 캡처만으로 하지 않고 빌드·단위 테스트·E2E 결과와 함께 기록합니다.
