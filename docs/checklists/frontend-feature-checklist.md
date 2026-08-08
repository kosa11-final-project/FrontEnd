# 프론트엔드 기능 개발 체크리스트

모든 항목을 기계적으로 체크하는 문서가 아니라, 현재 작업에 적용되는 항목을 빠뜨리지 않기 위한 기준입니다. 적용되지 않는 항목은 PR에 이유를 짧게 적습니다.

## 작업 시작 전

- [ ] 요구사항과 화면의 성공 조건을 확인했습니다.
- [ ] ZONE과 KAN이 요구사항, UI 모델, URL에 포함되지 않았는지 확인했습니다.
- [ ] 기존 `shared/ui`, entity UI, Storybook에서 재사용할 컴포넌트를 확인했습니다.
- [ ] 비슷한 page, widget, feature, entity 패턴을 확인했습니다.
- [ ] 변경할 FSD 계층과 slice를 정했습니다.
- [ ] 실제 백엔드 계약이 없는 부분을 임의로 확정하지 않았습니다.

## 구조와 이름

- [ ] `app → pages → widgets → features → entities → shared` 의존성 방향을 지켰습니다.
- [ ] 한 page 전용 코드를 너무 일찍 공통 계층으로 올리지 않았습니다.
- [ ] `shared`가 특정 도메인, route, Spring DTO를 import하지 않습니다.
- [ ] API 함수는 `*Api.js`, Query options는 `*Queries.js`, mapper는 `*Mapper.js` 규칙을 따릅니다.
- [ ] 컴포넌트는 PascalCase, 폴더와 route는 kebab-case를 사용합니다.
- [ ] boolean 이름이 `is`, `has`, `can`, `should`로 의미를 드러냅니다.
- [ ] slice 외부 import는 가능한 한 `index.js` 공개 API를 사용합니다.

## UI와 디자인

- [ ] 새 HTML·CSS를 만들기 전에 shadcn 기반 `shared/ui` 조합을 먼저 시도했습니다.
- [ ] 색상, 폰트, radius, 간격에 `src/styles.css` token을 사용했습니다.
- [ ] 색이 있는 버튼은 흰색 글자, 흰색 버튼은 Gray 900 글자를 사용합니다.
- [ ] 위험·주의·양호 상태를 색상만으로 구분하지 않고 텍스트와 Reicon을 함께 사용합니다.
- [ ] Reicon 외의 아이콘 라이브러리나 직접 작성한 SVG 아이콘을 추가하지 않았습니다.
- [ ] 카드 중첩과 장식 목적의 카드 사용을 피했습니다.
- [ ] 테이블과 필터가 불투명한 업무 표면을 유지합니다.
- [ ] 긴 한글, 큰 수치, 빈 값에서 텍스트가 잘리거나 겹치지 않습니다.
- [ ] 적용 가능한 데스크톱·좁은 화면에서 layout을 확인했습니다.

## 접근성과 상태

- [ ] 버튼, input, select, icon button에 명확한 accessible name이 있습니다.
- [ ] 키보드만으로 주요 행동을 실행할 수 있습니다.
- [ ] focus-visible 상태가 보입니다.
- [ ] 최초 loading 상태를 처리했습니다.
- [ ] empty 상태를 처리했습니다.
- [ ] error와 다시 시도 상태를 처리했습니다.
- [ ] 적용되는 경우 forbidden 상태를 처리했습니다.
- [ ] background refetch에서 기존 데이터를 불필요하게 지우지 않습니다.
- [ ] animation은 `prefers-reduced-motion`을 존중합니다.

## API와 상태 관리

- [ ] 페이지와 UI에서 Axios를 직접 import하지 않습니다.
- [ ] API 함수가 `requestJson` 경계를 사용합니다.
- [ ] Query가 제공한 `signal`을 API 요청까지 전달합니다.
- [ ] query key를 entity key factory에서 생성합니다.
- [ ] 목록 필터, 정렬, 페이지 정보가 query key에 포함됩니다.
- [ ] API response를 entity mapper에서 프론트 모델로 변환합니다.
- [ ] API response를 Zustand에 복사하지 않습니다.
- [ ] URL로 복원해야 하는 필터와 페이지 정보를 search params에 둡니다.
- [ ] React Hook Form, Zustand, local state의 책임이 겹치지 않습니다.
- [ ] 세션 ID나 token을 localStorage 또는 Zustand에 저장하지 않습니다.
- [ ] 오류 메시지에 cookie, token, SKU, LOT 등 민감정보가 노출되지 않습니다.

## 테스트와 문서

- [ ] mapper, formatter, 상태 계산처럼 순수한 규칙에 Vitest를 추가했습니다.
- [ ] 실패와 경계값을 포함한 테스트를 작성했습니다.
- [ ] 주요 사용자 흐름을 Playwright로 검증하거나 수동 검증 방법을 PR에 적었습니다.
- [ ] 공통 UI나 variant 변경을 Storybook에 반영했습니다.
- [ ] 기본, disabled, loading, error, 긴 텍스트 상태를 필요한 범위에서 확인했습니다.
- [ ] 환경변수를 추가했다면 `.env.example`과 문서를 갱신했습니다.
- [ ] 구조나 팀 규칙을 바꿨다면 README 또는 개발 규칙 문서를 갱신했습니다.

## 완료 전 명령

PR 전에는 아래 명령을 모두 실행합니다.

```bash
pnpm run audit:prod
pnpm run check
pnpm run test:e2e
pnpm run build-storybook
```

- [ ] 실행한 검증과 결과를 PR에 기록했습니다.
- [ ] `git diff --check`가 통과합니다.
- [ ] unrelated 변경을 포함하거나 되돌리지 않았습니다.
