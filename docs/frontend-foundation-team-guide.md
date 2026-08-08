# 프론트엔드 초기 세팅 팀 가이드

> 최종 갱신: 2026-08-08
> 대상: 현대그린푸드 다중 판매채널 재고 운영 플랫폼 프론트엔드 팀
> 범위: 실제 업무 기능 개발 전, 모든 팀원이 공유할 프론트엔드 기반과 사용 규칙

이 문서는 현재 저장소의 실제 구현을 기준으로 작성한 상세 기준입니다. 처음 참여한 팀원은 먼저 `docs/team-onboarding.md`의 필수 설치·실행·PR 절차를 끝내고, 구조나 기술 선택의 이유가 필요할 때 이 문서를 확인합니다. 과거 디자인 탐색과 의사결정 과정은 `docs/plans`에 보관하지만, 기능 개발을 시작할 때에는 이 문서와 실제 코드를 우선합니다.

## 1. 한눈에 보는 현재 상태

상태 표기:

- **완료**: 설치와 공통 설정이 끝나 팀원이 바로 사용할 수 있음
- **부분 완료**: 기반은 있으나 실제 백엔드 계약 또는 팀 공통 예시가 더 필요함
- **설치만 완료**: 패키지는 설치했지만 아직 앱 코드에서 사용하지 않음
- **기능 단계**: 초기 세팅 범위가 아니라 실제 기능 개발과 함께 구현함
- **보류**: 팀 결정에 따라 나중에 진행함

| 영역 | 상태 | 현재 구현 |
| --- | --- | --- |
| React 19 + JavaScript + Vite | 완료 | 앱 진입점, alias, 개발·빌드 스크립트 구성 |
| Node.js + pnpm | 완료 | Node.js 24 LTS, pnpm 11.18.0, `packageManager`와 lockfile 고정 |
| Tailwind CSS v4 | 완료 | Vite 플러그인과 `src/styles.css` 연결 |
| shadcn/ui 방식 | 완료 | `components.json`, 소스 소유 방식, `cn`, `cva` 구성 |
| 디자인 토큰 | 완료 | Dashboard Filter Foundations 색상, Pretendard, 간격, 반경, 그림자, 모션 |
| 공통 UI | 완료 | Button, Card, Input, Select, Badge, Alert, Checkbox, StateView, Table, DataTable, Drawer 등 |
| Storybook | 완료 | 공통 UI와 디자인 토큰 story, 접근성·Docs 애드온 구성 |
| React Router | 완료 | 앱 셸과 5개 기본 메뉴 경로 구성 |
| FSD-lite | 완료 | 레이어 구조, 예시 slice, public entry 구성 |
| 팀 개발 규칙 | 완료 | segment·파일 명명, formatter, 전체 흐름 template, 기능·PR 체크리스트 구성 |
| Axios | 완료 | 중앙 인스턴스, timeout, credentials, CSRF, 오류 정규화 |
| TanStack Query | 부분 완료 | 전역 Provider, inventory query key/options 구성; 실제 API 연결과 hooks 사용은 남음 |
| Spring Security 세션 | 부분 완료 | 프론트 쿠키 전송과 CSRF 헤더 골격만 구성; 실제 서버 계약 검증은 남음 |
| Sentry | 완료 | DSN, Error Boundary, 민감정보 scrubber와 단위 테스트 구성; 배포별 정책은 운영 단계에서 확정 |
| TanStack Table | 완료 | 재사용 `DataTable`, 정렬, 상태, row click, Storybook 예시 구성 |
| Zustand | 설치만 완료 | 전역 UI 상태가 실제로 필요할 때 store를 생성 |
| React Hook Form + Zod | 설치만 완료 | 검색·필터 또는 입력 폼의 요구가 확정될 때 feature에 적용 |
| Recharts | 설치만 완료 | 재고 상세 수요예측·위험분석 화면에서 사용 |
| Loading media | 완료 | reduced-motion 대응 `LoadingMedia`, MP4 레퍼런스, 투명 Lottie 스피너, 비교 route 구성 |
| Vitest | 부분 완료 | 공통 경계·formatter·template 테스트 19개가 있으며 실제 도메인 테스트는 기능 단계에서 추가 |
| Playwright | 부분 완료 | 라우팅 E2E 2개가 있으며 실제 업무 흐름 테스트는 기능 단계에서 추가 |
| 배포 | 보류 | Vercel, S3/CloudFront 등 아키텍처 확정 후 진행 |
| lint·format 자동화 | 완료 | ESLint, Prettier, 공통 `check` 명령 구성 |
| GitHub Actions CI | 완료 | PR과 main push에서 lint, format, test, build, Storybook, E2E 검증 |

현재 화면은 앱 셸과 라우팅을 확인하는 준비 화면입니다. 재고 목록, 상세, AI 전략, 통계의 실제 API와 업무 동작은 아직 연결하지 않았습니다.

제공된 흰디 영상은 약 4.43초 H.264 MP4입니다. 원본 영상은 벡터 레이어 정보가 없으므로 동일한 캐릭터 모션을 Lottie JSON으로 직접 변환할 수 없습니다. 원본은 `LoadingMedia` 레퍼런스로 유지하고, 작은 영역의 공통 로딩에는 `public/projects/hg-inventory-loader/scene-1/lottie.json` 기반 `LottieLoader`를 사용합니다.

## 2. 빠른 시작

처음 설치하는 팀원은 `docs/team-onboarding.md`를 먼저 진행합니다. 필수 버전은 Node.js 24 LTS와 pnpm 11.18.0입니다.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm exec playwright install chromium
pnpm run check
pnpm run test:e2e
pnpm dev
```

- 앱: `http://localhost:5173`
- Storybook: `pnpm storybook` 실행 후 `http://localhost:6006`

환경변수는 `.env.example`을 기준으로 로컬의 `.env.local`에 설정합니다. `VITE_` 환경변수는 브라우저 번들에 노출되므로 secret, 세션 값, AWS 키, DB 비밀번호를 넣지 않습니다.

기본 검증 명령:

```bash
pnpm run audit:prod
pnpm run check
pnpm run test:e2e
pnpm run build-storybook
```


## 3. 확정 기술 스택과 사용 원칙

| 분류 | 기술 | 팀 규칙 |
| --- | --- | --- |
| 언어 | JavaScript, HTML, CSS | TypeScript는 현재 도입하지 않음 |
| UI | React 19 | 함수 컴포넌트와 hooks 사용 |
| 빌드 | Vite | `@`는 `src` alias |
| 패키지 | pnpm | npm·yarn lockfile을 추가하지 않음 |
| 스타일 | Tailwind CSS v4 | 토큰 우선, 임의 색상 하드코딩 금지 |
| UI 소스 | shadcn/ui 방식 | 설치한 코드를 프로젝트가 소유하고 토큰에 맞게 수정 |
| 클래스 조합 | `clsx`, `tailwind-merge`, `cn()` | 조건부 클래스와 충돌 정리에 사용 |
| variant | `class-variance-authority` | 반복되는 의미 기반 variant에만 사용 |
| 라우터 | React Router DOM v7 | URL 화면 상태와 앱 셸 조립 담당 |
| 서버 상태 | TanStack Query v5 | 캐시, 로딩, 오류, 재조회, 무효화 담당 |
| 클라이언트 상태 | Zustand | 여러 화면이 공유하는 UI 상태가 생길 때만 사용 |
| 폼 | React Hook Form + Zod | 실제 폼이 생길 때 feature 내부에서 적용 |
| 테이블 | TanStack Table v8 | 컬럼과 데이터는 도메인에서 주입 |
| 차트 | Recharts | 데이터 시각화 기능에서만 사용 |
| 모션 | 완료 | MP4 레퍼런스와 공통 `LottieLoader`를 분리하고 reduced-motion 정책을 반영 |
| HTTP | Axios | `shared/api` 내부에서만 직접 import |
| 모니터링 | Sentry | 환경변수 DSN이 있을 때만 활성화 |
| 아이콘 | Reicon | `reicon-react` 외의 아이콘 라이브러리를 혼용하지 않음 |
| 컴포넌트 문서 | Storybook | 공통 UI와 디자인 토큰 계약 확인 |
| 정적 검사 | ESLint + Prettier | 코드 오류와 공통 포맷을 PR 전에 검증 |
| 단위 테스트 | Vitest | mapper, formatter, query key, 상태 규칙 테스트 |
| E2E | Playwright | 실제 사용자 흐름과 라우팅 검증 |
| CI | GitHub Actions | 로컬 필수 검증을 PR에서 다시 실행 |

`@tanstack/react-virtual`은 설치하지 않았습니다. 이 서비스는 서버 페이지네이션을 기본으로 하므로 현재 초기 세팅에 필요하지 않습니다. 한 페이지의 행 수가 매우 많아 실제 성능 문제가 확인될 때만 페이지네이션과 별개로 도입합니다.

Ky는 제거했고 HTTP 클라이언트는 Axios 하나로 통일했습니다.

## 4. FSD-lite 폴더 구조

```text
src/
├─ app/                 # 앱 전체 조립: Provider, Router, Layout
├─ pages/               # URL에 대응하는 화면 조합
├─ widgets/             # 여러 feature/entity를 묶은 업무 블록
├─ features/            # 사용자의 한 가지 행동
├─ entities/            # 도메인 데이터, API, 표현 규칙
├─ shared/              # 도메인을 모르는 UI, HTTP, 설정, 유틸리티
└─ _template/           # 팀원용 구조 예시
```

의존성은 아래 방향으로만 흐릅니다.

```text
app -> pages -> widgets -> features -> entities -> shared
```

핵심 규칙:

1. 한 페이지에서만 쓰는 코드는 먼저 해당 `pages` 폴더에 둡니다.
2. 여러 페이지에서 같은 도메인 의미로 재사용되면 `entities`로 이동합니다.
3. 사용자의 한 가지 행동이면 `features`에 둡니다.
4. 여러 feature와 entity를 묶은 화면 블록이면 `widgets`에 둡니다.
5. 업무 용어를 모르는 범용 UI와 기술 코드는 `shared`에 둡니다.
6. `shared/ui`는 React Router, 재고, 판매채널, 전략 같은 상위 레이어를 import하지 않습니다.
7. 각 slice의 외부 공개 항목은 가능한 한 `index.js`를 통해 가져옵니다.

예시:

```text
pages/inventory/InventoryPage.jsx
  -> widgets/inventory-table/InventoryTable.jsx
  -> features/inventory-filter/InventoryFilterBar.jsx
  -> entities/inventory/ui/InventoryStatusBadge.jsx
  -> shared/ui/Badge.jsx
```

현재 `entities`, `features`, `widgets`의 일부 파일은 구조 설명을 위한 placeholder입니다. 실제 API와 상태를 억지로 채우지 말고 해당 기능을 구현할 때 완성합니다.

## 5. 디자인 시스템

### 5.1 단일 출처

- 전역 토큰과 앱 셸 스타일: `src/styles.css`
- 디자인 토큰 Storybook: `src/shared/ui/stories/DesignTokens.stories.jsx`
- UI8 레퍼런스 규칙: `docs/design-references/ui8-dashboard-style-reference.md`
- 로컬 폰트: `public/fonts/PretendardVariable.woff2`

페이지나 컴포넌트에 색상 HEX, 폰트 패밀리, 반복되는 radius를 직접 추가하지 않습니다. 먼저 semantic token 또는 기존 공통 컴포넌트를 사용합니다.

### 5.2 원시 색상

| 토큰 | 값 | 기본 용도 |
| --- | --- | --- |
| `--color-main` | `#27B06E` | 브랜드, 주요 행동, 양호 |
| `--color-sub-mint` | `#11C6AB` | 보조 강조 |
| `--color-sub-cyan` | `#00B0D7` | 정보, 일반 상태 |
| `--color-sub-orange` | `#FDA643` | 주의, 위험 후보 |
| `--color-sub-mint-soft` | `#DAF7E9` | 초록·민트 soft 배경 |
| `--color-sub-cyan-soft` | `#CFF4FC` | 정보 soft 배경 |
| `--color-sub-orange-soft` | `#FFEC2C` | 주의 soft 배경 |
| `--color-danger` | `#D92D20` | 위험·오류 강조 |
| `--color-danger-soft` | `#FEE4E2` | 위험·오류 soft 배경 |
| `--color-gray-900` | `#282828` | 제목, 흰색 버튼의 글자 |
| `--color-gray-700` | `#747474` | 본문 |
| `--color-gray-500` | `#8E8E8E` | 보조 설명, placeholder |
| `--color-gray-300` | `#C1C1C1` | 강한 border |
| `--color-gray-200` | `#DADADA` | 기본 border |
| `--color-gray-50` | `#F4F4F4` | 앱 배경, subtle surface |
| `--color-white` | `#FFFFFF` | 카드, 패널, 역상 글자 |

### 5.3 semantic 색상

컴포넌트는 가능하면 원시 색상보다 다음 역할 토큰을 사용합니다.

| 역할 | 토큰 | 현재 매핑 |
| --- | --- | --- |
| 주요 행동 | `--primary` | main |
| 주요 행동 글자 | `--primary-foreground` | white |
| 제목 | `--text-heading` | gray-900 |
| 본문 | `--text-body` | gray-700 |
| 보조 설명 | `--text-muted` | gray-500 |
| 표면 | `--surface`, `--card` | white |
| 앱 배경 | `--background` | gray-50 |
| 양호 | `--good`, `--good-soft` | main, mint-soft |
| 보통·정보 | `--info`, `--info-soft` | cyan, cyan-soft |
| 주의 | `--warning`, `--warning-soft` | orange, orange-soft |
| 위험 | `--danger`, `--danger-soft` | semantic danger red, danger-soft |

주의와 위험은 서로 다른 semantic 색상을 사용합니다. 원시 Dashboard Filter Foundations 팔레트에는 별도 red가 없기 때문에 `danger`와 `danger-soft`를 semantic 확장 토큰으로 추가했습니다.

버튼 대비 규칙:

- 흰색 `secondary` 버튼: gray-900 글자
- main·danger 등 색상이 채워진 버튼: 흰색 글자
- ghost 버튼: 투명 배경과 muted 글자, hover 시 primary 강조
- 색상만으로 의미를 전달하지 않고 텍스트와 아이콘을 함께 사용

### 5.4 Pretendard 타이포그래피

| 이름 | 토큰 | rem | px | 기본 굵기 |
| --- | --- | --- | --- | --- |
| Headline1 | `--font-size-headline1` | `1.375rem` | 22px | Bold |
| Headline2 | `--font-size-headline2` | `1.25rem` | 20px | Bold |
| Subtitle1 | `--font-size-subtitle1` | `1rem` | 16px | Semibold/Bold |
| Subtitle2 | `--font-size-subtitle2` | `0.875rem` | 14px | Semibold |
| Body1 | `--font-size-body1` | `0.875rem` | 14px | Regular |
| Body2 | `--font-size-body2` | `0.75rem` | 12px | Regular/Medium |
| Description | `--font-size-description` | `0.75rem` | 12px | Regular |

사용 예시:

```jsx
<h1 className="text-[length:var(--font-size-headline1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
  통합 재고 조회
</h1>
```

Tailwind v4와 `tailwind-merge`가 폰트 크기와 색상을 같은 `text-[...]` 그룹으로 오인하지 않도록 타입을 명시합니다.

```jsx
// 올바른 사용
className="text-[length:var(--font-size-body1)] text-[color:var(--text-body)]"

// 사용하지 않음
className="text-[var(--font-size-body1)] text-[var(--text-body)]"
```

### 5.5 간격, 모서리, 표면

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `--spacing-field-gap` | `0.5rem` | 필터·입력 필드 간격 |
| `--spacing-bar-gap` | `0.75rem` | 툴바·필터 바 간격 |
| `--radius-control` | `0.375rem` | 버튼, 입력, 작은 제어 요소 |
| `--radius-panel` | `0.5rem` | 카드, 패널, 테이블 표면 |
| `--shadow-soft` | 공통 soft shadow | hover 또는 작은 부유 표면 |
| `--shadow-panel` | 공통 panel shadow | Drawer와 주요 패널 |
| `--motion-fast` | `160ms` | 버튼과 작은 상태 변경 |
| `--motion-standard` | `220ms` | 표면과 레이아웃 전환 |

Mesh Forecast 스타일은 앱 배경과 요약 표면에 제한적으로 사용합니다. 필터, 테이블, 상세 데이터는 흰색 불투명 표면과 얇은 border를 유지합니다.

### 5.6 아이콘

```jsx
import { Refresh } from 'reicon-react';
import { Icon } from '@/shared/ui';

<Icon icon={Refresh} size={16} aria-hidden="true" />
```

- 아이콘은 `reicon-react`만 사용합니다.
- 아이콘 버튼은 반드시 `label`을 제공해 accessible name과 tooltip을 만듭니다.
- 상태 아이콘은 상태 텍스트와 함께 사용합니다.

## 6. 재사용 컴포넌트

모든 범용 UI는 `@/shared/ui`에서 가져옵니다.

| 컴포넌트 | 주요 API | 용도 |
| --- | --- | --- |
| `Button` | `variant`, `size`, `asChild` | primary, secondary, ghost, danger 행동 |
| `Alert` | `variant`, `title` | 인라인 good, info, warning, danger 안내 |
| `Checkbox` | `size`, native input props | 표 행 선택과 필터 선택 |
| `IconButton` | `variant`, `size`, `label` | 아이콘 전용 행동 |
| `Card` | `variant`, `padding`, `asChild` | default, subtle, selected, flat 표면 |
| `CardHeader` 등 | compound parts | 카드 내부 구조 |
| `MetricCard` | `tone`, `selected`, `onClick` | 요약 지표 |
| `Input` | `size`, `tone` | 기본, 오류, 성공 입력 |
| `Select` | `size`, `tone` | 네이티브 select 기반 필터 |
| `Badge` | `variant` | neutral, good, info, warning, danger |
| `StatusDot` | `tone` | 보조 상태 점; 텍스트와 함께 사용 |
| `StateView` | `state`, `actionLabel`, `onAction` | loading, empty, error, forbidden |
| `Skeleton` | `shape` | 데이터 로딩 자리 표시 |
| `LoadingMedia` | `src`, `poster`, `controls` | MP4 등 로딩 모션 레퍼런스 |
| `LottieLoader` | `path`, `label`, `size`, `speed` | 투명 배경 공통 로딩 스피너; 기본 경로는 `hg-inventory-loader/scene-1` |
| `Avatar` | `size` | 사용자 표시 |
| `Tabs` | controlled/uncontrolled value | 상세 화면 탭 |
| `Tooltip` | `tone`, Radix parts | 판단 기준과 보조 설명 |
| `Drawer` | `open`, `onClose`, `size` | 빠른 상세 확인 |
| `Table` | `density`, `surface` | 기본 table 표면 |
| `DataTable` | `columns`, `data`, sorting, states | TanStack Table 재사용 껍데기 |
| `DetailLayout` | `aside`, `asideContent` | 좌측 정보와 우측 본문 |
| `Sidebar` primitives | shadcn-style compound parts | 앱 셸 사이드바 기반 |

재고 도메인 컴포넌트는 `@/entities/inventory`에 둡니다.

| 컴포넌트 | 의미 |
| --- | --- |
| `InventoryStatusBadge` | 양호, 보통, 주의, 위험 매핑 |
| `InventoryScopeCard` | 계열사, 채널, 센터 등 재고 범위 요약 |
| `LotInventoryRow` | LOT별 소비기한과 수량 요약 |

기본 사용 예시:

```jsx
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui';

export function InventorySummaryCard() {
  return (
    <Card variant="default" padding="md">
      <CardHeader>
        <CardTitle>위험 재고</CardTitle>
      </CardHeader>
      <CardContent className="mt-4 flex items-center justify-between">
        <Badge variant="danger">위험 8건</Badge>
        <Button variant="secondary" size="sm">상세 보기</Button>
      </CardContent>
    </Card>
  );
}
```

컴포넌트 추가 순서:

1. Storybook과 `src/shared/ui/index.js`에서 이미 있는 컴포넌트를 확인합니다.
2. 기존 컴포넌트의 `variant`, `size`, `tone`, `className`으로 표현합니다.
3. 반복되는 의미가 있을 때만 `cva()` variant를 추가합니다.
4. 특정 업무 의미가 들어가면 `shared/ui`가 아니라 entity 또는 feature에 둡니다.
5. 공통 컴포넌트를 추가하면 Storybook에 기본, variant, disabled, 오류, 긴 텍스트 상태를 추가합니다.
6. `src/shared/ui/index.js`에 공개 export를 추가합니다.

shadcn/ui 컴포넌트를 추가할 때에는 `components.json`의 경로를 사용합니다.

```bash
pnpm dlx shadcn@latest add dialog
```

생성된 코드를 그대로 확정하지 않고 다음을 검토합니다.

- 프로젝트 semantic token 사용 여부
- Reicon 외 아이콘 의존성 제거 여부
- `@/shared/ui` 공개 export 여부
- 키보드 조작과 focus-visible 상태
- Storybook 상태 문서

## 7. 라우터와 앱 셸

현재 경로:

| 경로 | 화면 |
| --- | --- |
| `/` | `/inventory`로 이동 |
| `/dashboard` | 대시보드 |
| `/inventory` | 통합 재고 조회 |
| `/ai-strategy` | AI 전략 및 시뮬레이션 |
| `/execution` | AI 전략 기록 & 성과 |
| `/statistics` | 통계 |

메뉴 이름, 경로, 아이콘은 `src/widgets/app-shell/model/navigation.js`가 단일 출처입니다. 라우트 element는 `src/app/router/router.jsx`, 전역 배치는 `src/app/layouts/AppLayout.jsx`가 담당합니다.

페이지에서 사이드바나 헤더를 다시 만들지 않습니다. `AppLayout` 아래의 `Outlet`에 페이지 내용만 렌더링합니다.

## 8. Axios와 TanStack Query 분리 규칙

### 8.1 책임 경계

```text
Page / Widget
  -> query hook 또는 query options
  -> entity API 함수
  -> requestJson
  -> Axios instance
  -> Spring Boot API
```

| 계층 | 책임 | 하지 않는 일 |
| --- | --- | --- |
| Axios | base URL, timeout, credentials, CSRF, HTTP 오류 정규화, 취소 신호 | 캐시, 재조회, UI 상태, Query 무효화 |
| entity API | endpoint, params, body, 응답 adapter | React hook, 화면 이동, toast |
| TanStack Query | query key, 캐시, loading/error, retry, invalidation | Axios interceptor 구성, 쿠키 직접 처리 |
| component | query 상태를 화면으로 표현 | Axios 직접 import, 서버 데이터를 Zustand에 복사 |

중요 규칙:

- Axios는 `src/shared/api` 밖에서 직접 import하지 않습니다.
- Axios interceptor에서 Router 이동, toast, Query invalidation을 실행하지 않습니다.
- Axios와 TanStack Query에서 동시에 재시도하지 않습니다. 현재 Axios retry는 없고 Query가 retry를 담당합니다.
- Query 데이터는 Zustand에 다시 저장하지 않습니다.
- API 함수가 Axios response 전체를 노출하지 않고 `requestJson`이 `response.data`만 반환합니다.
- Query의 `AbortSignal`을 API 함수와 Axios까지 전달합니다.

### 8.2 현재 Axios 사용 예시

```js
// entities/inventory/api/inventoryApi.js
import { requestJson } from '@/shared/api';

export function getInventories(params, signal) {
  return requestJson({
    method: 'get',
    path: 'v1/inventories',
    params,
    signal,
  });
}
```

금지:

```js
// page 또는 component에서 사용하지 않음
import axios from 'axios';
```

### 8.3 현재 Query 표준

재고 목록과 상세의 query key·options는 `entities/inventory/api/inventoryQueries.js`에 구성되어 있습니다. 실제 Spring API 응답 계약이 확정되면 query 결과 mapper와 도메인별 hook을 이 기준 위에 추가합니다.

```js
// entities/inventory/api/inventoryQueries.js
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getInventories, getInventoryDetail } from './inventoryApi.js';

export const inventoryKeys = Object.freeze({
  all: ['inventory'],
  lists: () => [...inventoryKeys.all, 'list'],
  list: (params) => [...inventoryKeys.lists(), params],
  details: () => [...inventoryKeys.all, 'detail'],
  detail: (inventoryId) => [...inventoryKeys.details(), inventoryId],
});

export function inventoryListQueryOptions(params) {
  return queryOptions({
    queryKey: inventoryKeys.list(params),
    queryFn: ({ signal }) => getInventories(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function inventoryDetailQueryOptions(inventoryId) {
  return queryOptions({
    queryKey: inventoryKeys.detail(inventoryId),
    queryFn: ({ signal }) => getInventoryDetail(inventoryId, signal),
    enabled: Boolean(inventoryId),
  });
}
```

컴포넌트에서는 options를 소비합니다.

```jsx
import { useQuery } from '@tanstack/react-query';
import { inventoryListQueryOptions } from '@/entities/inventory';

export function InventoryTableContainer({ filters }) {
  const inventoryQuery = useQuery(inventoryListQueryOptions(filters));

  return (
    <DataTable
      columns={columns}
      data={inventoryQuery.data?.content ?? []}
      loading={inventoryQuery.isPending}
      error={inventoryQuery.isError ? inventoryQuery.error : null}
    />
  );
}
```

mutation은 실제 행동을 소유하는 feature에 둡니다.

```js
// features/inventory-sync/api/useInventorySyncMutation.js (API 계약 후 구현)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryKeys } from '@/entities/inventory';
import { syncInventory } from './inventorySyncApi.js';

export function useInventorySyncMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncInventory,
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: inventoryKeys.lists(),
    }),
  });
}
```

Query key에 들어가는 필터는 문자열, 숫자, boolean, plain object처럼 직렬화 가능한 값만 사용합니다. 서버 페이지가 0부터 시작하는지 1부터 시작하는지 확정한 뒤 URL과 Query key에서 같은 기준을 사용합니다.

### 8.4 현재 QueryClient 기본값

```js
queries: {
  staleTime: 30_000,
  retry: 1,
  refetchOnWindowFocus: false,
},
mutations: {
  retry: 0,
}
```

도메인별로 다른 정책이 필요하면 query options에서 덮어씁니다. 전역 기본값을 기능 하나 때문에 자주 변경하지 않습니다.

## 9. 세션 인증, CSRF, CORS

현재 Axios 인스턴스에는 `withCredentials: true`가 적용되어 있습니다. 세션 ID는 localStorage, sessionStorage, Zustand에 저장하지 않고 브라우저 쿠키로만 관리합니다.

변경 요청 흐름:

```text
Spring Security가 CSRF cookie 발급
  -> 프론트가 cookie에서 token 읽음
  -> POST/PUT/PATCH/DELETE 요청 header에 추가
  -> 서버가 session과 CSRF token 검증
```

현재 지원 환경변수:

| 환경변수 | 기본값 | 용도 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api/` | Spring Boot API base URL |
| `VITE_API_TIMEOUT_MS` | `10000` | Axios timeout |
| `VITE_CSRF_COOKIE_NAME` | `XSRF-TOKEN` | CSRF cookie 이름 |
| `VITE_CSRF_HEADER_NAME` | `X-XSRF-TOKEN` | 변경 요청 header 이름 |
| `VITE_SENTRY_DSN` | 빈 값 | Sentry 활성화 |
| `VITE_APP_ENVIRONMENT` | Vite mode | Sentry environment |
| `VITE_APP_VERSION` | `local` | release 식별자 |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0` | 성능 추적 비율 |

백엔드와 확정해야 할 계약:

- 프론트 개발·운영 origin
- CORS `allowCredentials=true`와 명시적 허용 origin
- 세션 cookie의 이름, Domain, Path, Secure, SameSite
- CSRF cookie와 header 이름
- CSRF cookie가 프론트에서 읽을 수 있도록 HttpOnly가 아닌지 여부
- 로그인, 로그아웃, 현재 사용자 API 경로
- 401과 403의 의미 및 표준 JSON 응답
- Spring Boot 표준 오류 응답 필드와 trace ID
- 프론트와 API가 다른 site일 때 `SameSite=None; Secure` 필요 여부
- 로컬 개발에서 Vite proxy를 사용할지 직접 CORS를 사용할지

이 계약을 확정하기 전에는 401 interceptor에서 임의로 로그인 페이지로 이동시키지 않습니다. 오류 정규화까지만 공통으로 처리하고 실제 인증 상태 전환은 향후 auth provider가 담당합니다.

## 10. 상태 관리 기준

| 상태 종류 | 도구 | 예시 |
| --- | --- | --- |
| 서버 데이터 | TanStack Query | 재고 목록, 재고 상세, 전략 이력 |
| URL로 복원해야 하는 상태 | React Router search params | 검색어, 필터, page, size, sort |
| 한 컴포넌트 내부 상태 | `useState` | Drawer 열림, tab 선택 |
| 여러 화면이 공유하는 UI 상태 | Zustand | 사용자가 선택한 전역 작업 범위 등 |
| 입력과 검증 | React Hook Form + Zod | AI 전략 파라미터, 복합 입력 폼 |

Zustand 사용 기준:

- 서버 응답을 복사해서 저장하지 않습니다.
- URL로 표현할 수 있는 필터와 페이지 번호를 저장하지 않습니다.
- 단순히 props 두 단계 전달을 피하려는 이유만으로 store를 만들지 않습니다.
- 실제로 여러 화면이 공유하고 URL에 둘 수 없는 클라이언트 상태가 확인될 때 slice에 생성합니다.

React Hook Form과 Zod는 재고 수정·삭제가 없더라도 다음 입력이 생기면 사용할 수 있습니다.

- 복합 검색 필터의 제출·초기화·검증
- AI 전략 수립 조건 입력
- 할인율, 기간, 채널, 점포 선택
- 사용자 설정 또는 보고서 조건

간단한 feature 예시:

```jsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const schema = z.object({
  keyword: z.string().trim().max(100),
  risk: z.enum(['all', 'good', 'normal', 'caution', 'risk']),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { keyword: '', risk: 'all' },
});
```

## 11. Sentry

현재 구현:

- `VITE_SENTRY_DSN`이 있을 때만 초기화
- environment, release, traces sample rate 설정
- React Error Boundary 적용
- 사용자 email과 IP 제거
- authorization, cookie, CSRF, token, session, SKU, LOT, 재고·판매·원가 관련 key를 recursive scrubber로 제거
- URL query·hash, message·exception 문자열의 token·email과 업무 식별자 제거
- 오류, breadcrumb, transaction, span에 같은 scrubber 적용
- scrubber 단위 테스트 구성

운영 배포 전에 확정할 항목:

- request body, cookie, authorization, 재고·판매·원가 필드 scrubber 정책
- 401·403 같은 예상 오류를 Sentry에 보낼지 필터 기준
- 사용자 식별자를 원문이 아닌 내부 비식별 ID로 보낼지 결정
- 배포 아키텍처 확정 후 source map 업로드
- 개발·스테이징·운영 DSN 또는 environment 분리
- 실제 오류 이벤트에서 민감정보가 제거되는지 테스트

## 12. Storybook과 테스트

Storybook은 앱과 같은 `src/styles.css`와 Pretendard를 사용하므로 색상, 폰트, 컴포넌트 variant가 실제 코드와 연결됩니다.

주요 Storybook 그룹:

- `Foundations/Design tokens`: 색상, 타이포그래피, semantic 역할, 간격, 모션
- `Shared UI`: Button, Card, Input, Select, Table, DataTable, Drawer, Tooltip 등
- `Entities/Inventory cards`: 재고 범위 카드, 상태 배지, LOT 행
- `App Shell/Foundations`: 실제 AppHeader와 AppSidebar 조합

Storybook의 Show code는 실제 React 컴포넌트와 Tailwind class를 기반으로 생성됩니다. 수동으로 지정한 `parameters.docs.source.code`가 있는 story는 팀이 바로 사용할 수 있도록 정리된 예시를 보여줍니다.

현재 테스트 범위:

- Vitest: `cn`, Sentry scrubber, inventory query 규칙, 공통 formatter, template mapper·URL filter 총 19개
- Playwright: 기본 경로 이동과 사이드바 라우팅 2개
- Storybook build: 모든 story가 정적으로 빌드되는지 확인

기능 개발과 함께 추가할 테스트:

- API response mapper와 `ApiError`
- query key와 URL filter 변환
- 재고 위험등급 매핑
- 현재고와 가용수량 표시
- loading, empty, error, 401, 403 상태
- Drawer와 상세 페이지 이동
- 서버 페이지네이션과 정렬

현재 Storybook a11y 설정은 `todo`이므로 접근성 문제가 빌드를 실패시키지 않습니다. 팀이 컴포넌트 기반에 익숙해진 뒤 CI 실패 기준을 단계적으로 강화합니다.

## 13. 초기 세팅 완료와 보류 범위

현재 합의한 프론트엔드 공통 초기 세팅은 완료했습니다.

- FSD-lite 계층, segment, 파일 명명 규칙
- API → Query → mapper → widget → page 전체 흐름 template
- 공통 숫자·금액·수량·퍼센트·날짜·D-day formatter
- 기능 개발 체크리스트와 GitHub PR template
- Query Provider와 전역 TooltipProvider
- Axios, CSRF, ApiError와 선택적 Vite `/api` proxy
- `StateView`, `Skeleton`, `Alert`, `Checkbox`, `LoadingMedia`, `LottieLoader`
- Sentry recursive scrubber와 단위 테스트
- Node.js 24 LTS와 pnpm 11.18.0 고정
- ESLint, Prettier와 공통 `pnpm run check`
- GitHub Actions PR 자동 검증
- `.env*`와 Sentry build plugin 설정의 Git 제외 규칙

Spring Boot 계약이 정해지기 전에는 다음을 임의로 구현하지 않습니다.

- CORS, session cookie, CSRF 재발급 세부 계약
- 로그인·로그아웃·현재 사용자 API
- `/me` bootstrap과 인증 Provider
- 401·403 redirect와 권한별 route guard
- 공통 pagination·error response mapper

### 실제 기능과 함께 진행

- 재고 목록 query와 response mapper
- 서버 페이지네이션, 정렬, URL 필터
- 재고 상세 route와 Drawer
- Recharts 수요예측·위험분석 그래프
- AI 전략 입력 폼과 React Hook Form 적용
- Zustand가 실제로 필요한 전역 UI 상태
- 로그인 화면과 권한별 메뉴
- MSW 기반 API mock
- 업무 흐름 단위 Vitest와 Playwright

### 의도적으로 보류

- Vercel 또는 S3/CloudFront 배포 구조
- Docker·AWS 배포 설정
- pre-commit hook 자동화
- React Virtual
- 실제 데이터 연결 전의 성급한 최적화

## 14. 권장 진행 순서

```text
1. 모든 팀원이 `docs/team-onboarding.md`의 필수 검증 완료
2. 초기 세팅을 기준 버전으로 commit하고 PR CI 통과
3. Spring Boot의 목록·오류·인증 계약을 프론트와 합의
4. 통합 재고 조회를 첫 실제 수직 slice로 개발
5. 실제 구현에서 확인된 공통 규칙만 foundation으로 승격
6. 인증 계약 확정 후 `/me`와 401·403 경계 구성
7. 운영 전 Sentry와 배포 정책 확정
```

첫 실제 slice는 다음 범위가 적합합니다.

```text
/inventory page
  -> URL filter
  -> inventory list query
  -> server pagination
  -> DataTable
  -> loading / empty / error / permission states
  -> row detail navigation 또는 Drawer
```

이 한 흐름을 완성하면 네 명의 팀원이 같은 구조를 복제해 재고 상세, AI 전략, 성과 관제, 통계로 나눠 개발할 수 있습니다.

## 15. 팀 체크리스트

상세 작업 체크리스트는 `docs/checklists/frontend-feature-checklist.md`, 파일과 폴더 규칙은 `docs/development-conventions.md`, PR 작성 시에는 `.github/pull_request_template.md`를 사용합니다.

새 코드 작성 전:

- [ ] 기존 `shared/ui`와 Storybook을 확인했는가?
- [ ] 이 코드는 page, widget, feature, entity, shared 중 어디가 소유하는가?
- [ ] Axios를 직접 import하지 않았는가?
- [ ] 서버 데이터를 Zustand에 복사하지 않았는가?
- [ ] 필터와 페이지 상태를 URL로 복원할 수 있는가?
- [ ] 색상과 폰트를 token으로 사용했는가?
- [ ] 아이콘은 Reicon만 사용했는가?
- [ ] loading, empty, error, disabled, permission 상태를 고려했는가?
- [ ] 위험 상태를 색상만이 아니라 텍스트와 아이콘으로 표현했는가?
- [ ] ZONE과 KAN을 모델, URL, UI에 추가하지 않았는가?
- [ ] 공통 컴포넌트를 추가했다면 Storybook도 추가했는가?

공통 기반 변경 전:

- [ ] `src/styles.css`, `src/shared/ui`, `src/shared/api`, `AppProviders` 변경을 팀에 공유했는가?
- [ ] 기존 variant와 API를 깨지 않고 확장했는가?
- [ ] `pnpm run audit:prod`, `pnpm run check`, `pnpm run test:e2e`, `pnpm run build-storybook`을 확인했는가?

## 16. 관련 문서와 코드

- 시작 안내: `README.md`
- 신규 팀원 필수 온보딩: `docs/team-onboarding.md`
- 개발 규칙: `docs/development-conventions.md`
- 기능 체크리스트: `docs/checklists/frontend-feature-checklist.md`
- FSD 예시: `src/_template/README.md`
- 전체 흐름 예시: `src/_template/example-flow/README.md`
- 디자인 토큰: `src/styles.css`
- 공통 UI 공개 API: `src/shared/ui/index.js`
- Axios 경계: `src/shared/api`
- Query Provider: `src/app/providers/AppProviders.jsx`
- 라우터: `src/app/router/router.jsx`
- 디자인 레퍼런스: `docs/design-references/ui8-dashboard-style-reference.md`
- 초기 계획 기록: `docs/plans/2026-08-07-001-frontend-initial-setup-plan.md`
- Axios·FSD 결정 기록: `docs/plans/2026-08-07-003-http-client-and-fsd-boundaries.md`
