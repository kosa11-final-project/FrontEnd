# 현대그린푸드 재고 운영 플랫폼 프론트엔드

현대그린푸드의 다중 판매채널 재고를 통합 조회하고 위험 재고와 AI 실행 전략을 관리하기 위한 B2B 운영 플랫폼의 프론트엔드 기반입니다.

## 최근 통계 작업

- AI 전략 성과와 위험재고 추이를 실제 통계 API에 연결했습니다.
- 기간·재고 위치 필터와 성과 지표·추이 차트를 제공합니다.

통합 재고 조회의 로컬 feature 범위는 구현되어 있습니다. 앱 셸, 라우터, FSD-lite 폴더 구조, HTTP 통신 경계, 디자인 토큰, 재사용 UI, Storybook, 테스트와 CI 기반이 구성되어 있으며, 실제 source sync·Oracle 반영은 별도 후속 범위입니다.

통합 재고의 물리 스키마는 BackEnd Flyway V1~V16이 우선합니다. 화면에서는 `on_hand_qty` 집계를 가용재고, `reserved_qty` 집계를 예약재고, 두 값의 합인 `total_qty`를 총재고로 표시하며 FrontEnd가 예약수량을 다시 차감하지 않습니다. 세부 정합성 작업은 workspace의 `../docs/integrated-inventory/SCHEMA-FLYWAY-WORKLIST.md`를 기준으로 합니다.

> Spring Security 세션 로그인과 현재 사용자 조회 계약을 연결했으며, 세부 권한 정책, 재고 조회·페이지네이션과 배포 환경은 기능 또는 운영 단계에서 확정합니다. 공통 개발 환경, lint·format, 테스트와 PR 자동 검증은 이 저장소에 포함되어 있습니다.

처음 참여하는 팀원은 먼저 [`docs/team-onboarding.md`](./docs/team-onboarding.md)를 순서대로 진행합니다. 팀원이 이해하기 쉽게 설명할 때는 [`docs/team-frontend-handbook.md`](./docs/team-frontend-handbook.md)를 사용하고, 토큰·컴포넌트·API의 상세 기준은 [`docs/frontend-foundation-team-guide.md`](./docs/frontend-foundation-team-guide.md)에서 확인합니다.

## 빠른 시작

필수 버전은 Node.js 24 LTS와 pnpm 11.18.0입니다. `.nvmrc`, `package.json`, CI가 모두 같은 버전을 기준으로 합니다.

```bash
node --version
corepack enable
pnpm --version
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm exec playwright install chromium
pnpm run check
pnpm run test:e2e
pnpm dev
```

- `node --version`: `v24.x`
- `pnpm --version`: `11.18.0`
- 앱: `http://localhost:5173`
- Storybook: `pnpm storybook` 실행 후 `http://localhost:6006`

Windows PowerShell에서는 환경 파일을 `Copy-Item .env.example .env.local`로 복사합니다. 모든 값에 로컬 기본값이 있으므로 첫 실행에서는 `.env.local`의 값을 그대로 두어도 됩니다.

PR 전 필수 검증:

```bash
pnpm run audit:prod
pnpm run check
pnpm run test:e2e
pnpm run build-storybook
```

`pnpm run audit:prod`는 high 이상 운영 의존성 취약점을 확인합니다. `pnpm run check`는 ESLint, Prettier 검사, Vitest, production build를 순서대로 실행합니다. GitHub에서도 PR마다 같은 검사와 Storybook build, Playwright를 실행합니다.

환경변수는 [`.env.example`](./.env.example)을 기준으로 `.env.local`에 작성합니다. `VITE_`가 붙은 값은 브라우저 번들에 노출되므로 비밀번호, 세션 값, AWS 키와 같은 secret을 넣지 않습니다. 팀원은 `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`를 로컬 프론트엔드에 설정하지 않습니다.

## 기본 화면과 라우터

| 경로 | 화면 | 현재 범위 |
| --- | --- | --- |
| `/login` | 로그인 | CSRF 발급, 세션 로그인, 오류 상태 연결 |
| `/dashboard` | 대시보드 | 기본 페이지와 앱 셸 연결 |
| `/inventory` | 통합 재고 조회 | 목록·필터·상세·LOT·수요예측·위험·가격·미할당 재고 구현, source sync는 준비 중 |
| `/ai-strategy` | AI 전략 및 시뮬레이션 | 기본 페이지 연결 |
| `/execution` | AI 전략 기록 & 성과 | 기본 페이지 연결 |
| `/statistics` | 통계 | 기본 페이지 연결 |
| `/heendi-loader` | 로딩 모션 확인 | MP4 레퍼런스와 Lottie 스피너 비교 |

로그인하지 않은 사용자가 루트(`/`) 또는 업무 경로에 접근하면 `/login`으로 이동합니다. 로그인 후 루트는 `/dashboard`로 이동하며, 사용자가 먼저 접근한 업무 경로가 있으면 해당 경로로 돌아갑니다. 라우트 정의는 [`src/app/router/router.jsx`](./src/app/router/router.jsx), 메뉴의 단일 출처는 [`src/widgets/app-shell/model/navigation.js`](./src/widgets/app-shell/model/navigation.js)입니다.

## 기술 스택과 역할

| 영역 | 라이브러리 | 역할과 사용 기준 | 현재 상태 |
| --- | --- | --- | --- |
| UI | React 19, JavaScript | 함수 컴포넌트와 hooks 기반 UI | 기반 연결 완료 |
| 빌드 | Vite | 개발 서버, 번들, `@` → `src` alias, 선택적 `/api` proxy | 완료 |
| 패키지 | pnpm | 의존성과 lockfile 관리 | 완료 |
| 라우터 | React Router DOM v7 | URL, 중첩 layout, 페이지 이동 | 완료 |
| 서버 상태 | TanStack Query v5 | 서버 데이터 캐시, 로딩·오류, 재조회, 무효화 | Provider와 query options 예시 완료 |
| HTTP | Axios | base URL, timeout, 쿠키 전송, CSRF header, 오류 정규화 | 공통 client 완료 |
| 클라이언트 상태 | Zustand | 여러 화면이 공유하는 UI 상태만 관리 | 설치 완료, 필요할 때 store 생성 |
| 폼 | React Hook Form, Zod | 입력 상태, 검증, 제출 처리 | 로그인 폼 적용 완료 |
| 테이블 | TanStack Table v8 | 컬럼·행 모델과 정렬, 재사용 테이블 껍데기 | `DataTable` 완료 |
| 차트 | Recharts | 수요예측 및 전략 성과 시각화 | 수요예측 탭 적용 완료 |
| 스타일 | Tailwind CSS v4 | layout과 token 기반 스타일링 | 완료 |
| UI 소스 | shadcn/ui 방식 | 코드를 프로젝트가 소유하고 디자인 토큰에 맞춰 수정 | 완료 |
| 클래스 조합 | `cn`, `clsx`, `tailwind-merge` | 조건부 class와 Tailwind 충돌 정리 | 완료 |
| variant | Class Variance Authority | Button, Badge처럼 의미 있는 variant 관리 | 완료 |
| 접근성 primitive | Radix Slot, Tooltip | `asChild`, tooltip, 키보드·포커스 기반 | 완료 |
| 아이콘 | `reicon-react` | 앱에서 사용하는 유일한 아이콘 라이브러리 | 완료 |
| 모션 | `lottie-web` | 공통 Lottie 로딩 스피너를 동적 import로 재생 | 완료 |
| 모니터링 | Sentry | Error Boundary, 환경별 DSN, 민감정보 제거 | 기반 완료, 운영 정책은 추후 확정 |
| UI 문서 | Storybook | 디자인 토큰과 공통 컴포넌트 상태 확인 | 완료 |
| 단위 테스트 | Vitest | formatter, mapper, query key, 상태 규칙 검증 | 기반 완료 |
| E2E | Playwright | 라우팅과 실제 사용자 흐름 검증 | 기반 완료 |
| 코드 품질 | ESLint, Prettier | 오류 탐지와 공통 포맷 검증 | 완료 |
| CI | GitHub Actions | PR마다 lint, format, test, build, Storybook, E2E 검증 | 완료 |

`@tanstack/react-virtual`은 설치하지 않았습니다. 이 서비스는 서버 페이지네이션을 기본으로 하며, 한 페이지의 행 수 때문에 실제 성능 문제가 확인될 때만 별도로 도입합니다. HTTP 클라이언트는 Axios로 통일했고 Ky 관련 코드는 사용하지 않습니다.

## FSD-lite 적용 범위

이 프로젝트는 Feature-Sliced Design을 전부 엄격하게 적용하지 않고, 4명의 풀스택 팀원이 빠르게 이해할 수 있는 **FSD-lite**로 사용합니다.

적용하는 이유:

- 페이지가 늘어도 UI, 도메인 규칙, 사용자 행동, 서버 통신의 책임이 섞이지 않게 합니다.
- 재고 상태, 필터, 상세 Drawer처럼 여러 화면에서 재사용되는 기능의 위치를 예측할 수 있게 합니다.
- 한 파일에 페이지 전체 로직이 쌓이는 것을 막고 팀원이 동시에 작업할 때 충돌 범위를 줄입니다.
- `shared`가 재고나 전략 같은 도메인을 알지 못하게 해 공통 컴포넌트의 재사용성을 유지합니다.

의존성은 위에서 아래 방향으로만 흐릅니다.

```text
app → pages → widgets → features → entities → shared
```

| 계층 | 역할 | 이 프로젝트의 예시 |
| --- | --- | --- |
| `app` | 앱 전체 생명주기와 조립 | Provider, Router, Error Boundary, AppLayout |
| `pages` | URL에 대응하는 최종 화면 조합 | InventoryPage, DashboardPage |
| `widgets` | 여러 feature·entity를 묶은 독립 업무 블록 | AppShell, InventoryTable, InventorySummary |
| `features` | 사용자의 한 가지 행동과 그 상태 | inventory-filter, inventory-sync, inventory-detail |
| `entities` | 도메인 데이터, API, 표시 규칙 | inventory, product, sales-channel, strategy |
| `shared` | 도메인을 모르는 공통 기반 | UI primitive, Axios client, env, 유틸리티 |
| `_template` | 팀원용 구조 예시 | 새 slice를 만들 때 참고하며 앱에서 import하지 않음 |

FSD를 억지로 적용하지 않는 기준:

- 한 페이지에서만 쓰는 코드는 먼저 해당 `pages/<page>` 안에 둡니다.
- 두 곳 이상에서 같은 의미와 상태 규칙으로 사용될 때 `widgets`, `features`, `entities`로 올립니다.
- 단순 배치만 하는 컴포넌트를 무조건 widget으로 만들지 않습니다.
- 단순 클릭 handler를 무조건 feature로 만들지 않습니다.
- `shared/ui`에는 현대그린푸드, 재고, LOT, 전략 같은 도메인 용어를 넣지 않습니다.
- 각 slice 외부에서는 가능한 한 `index.js` 공개 진입점으로 import합니다.

## 폴더 구조

```text
src/
├─ app/
│  ├─ providers/                 # TanStack Query, Tooltip, Sentry 경계
│  ├─ router/                    # 전체 route 정의
│  └─ layouts/                   # 전역 widget과 Outlet 배치
├─ pages/
│  ├─ dashboard/                 # /dashboard
│  ├─ inventory/                 # /inventory
│  ├─ ai-strategy/               # /ai-strategy
│  ├─ execution/                 # /execution
│  └─ statistics/                # /statistics
├─ widgets/
│  ├─ app-shell/                 # 실제 Header, Sidebar, navigation 조합
│  ├─ inventory-summary/         # 재고 요약 업무 블록
│  ├─ inventory-table/           # 필터와 재고 테이블 조합
│  ├─ inventory-detail-drawer/   # 빠른 상세 확인 블록
│  └─ strategy-performance/      # 전략 성과 블록
├─ features/
│  ├─ inventory-filter/          # 재고 필터 행동
│  ├─ inventory-sync/            # 재고 동기화 행동
│  └─ inventory-detail/          # 상세 열기 행동
├─ entities/
│  ├─ inventory/
│  │  ├─ api/                    # API 함수, query key와 options
│  │  ├─ model/                  # 재고 타입·상태·도메인 규칙
│  │  └─ ui/                     # 위험 badge, 범위 카드, LOT 행
│  ├─ product/
│  ├─ sales-channel/
│  └─ strategy/
├─ shared/
│  ├─ api/                       # Axios, CSRF, ApiError, requestJson
│  ├─ config/                    # 환경변수 정규화
│  ├─ hooks/                     # useMediaQuery 등 범용 React hook
│  ├─ lib/                       # cn과 숫자·날짜 formatter
│  ├─ monitoring/                # Sentry 초기화와 scrubber
│  └─ ui/                        # shadcn 기반 공통 UI와 Storybook
├─ _template/                    # FSD 사용 예시 문서
├─ styles.css                    # 전역 디자인 토큰과 소유권별 CSS
└─ main.jsx                      # 앱 진입점
```

사이드바와 헤더의 공통 primitive는 `shared/ui`, 실제 메뉴·사용자·현재 경로를 묶는 조합은 `widgets/app-shell`, 최종 배치는 `app/layouts/AppLayout.jsx`가 담당합니다. 따라서 Layout 한 파일에 전체 navigation JSX를 넣지 않습니다.

구체적인 새 기능 배치 예시는 [`src/_template/README.md`](./src/_template/README.md)를 확인합니다.

### 반복되는 하위 폴더와 파일 이름

FSD 계층 안에서는 다음 segment 이름을 같은 의미로 사용합니다.

| 이름 | 역할 | 예시 |
| --- | --- | --- |
| `api` | endpoint 함수, query key, Query·Mutation options | `inventoryApi.js`, `inventoryQueries.js` |
| `api/clients` | Axios처럼 실제 HTTP 도구의 공통 instance | `axiosClient.js` |
| `model` | mapper, schema, constants, store와 도메인 상태 규칙 | `inventoryMapper.js` |
| `ui` | 사용자에게 보이는 React 컴포넌트 | `InventoryScopeCard.jsx` |
| `lib` | React와 도메인에 의존하지 않는 순수 유틸리티 | formatter, `cn.js` |
| `hooks` | 여러 곳에서 재사용하는 React hook | `useMediaQuery.js` |
| `config` | 환경변수와 변경되지 않는 앱 설정 | `env.js` |
| `providers` | 앱 전체 Context와 외부 Provider 연결 | `AppProviders.jsx` |
| `layouts` | 전역 widget과 Router Outlet 배치 | `AppLayout.jsx` |
| `router` | route, redirect, lazy route 경계 | `router.jsx` |
| `monitoring` | Sentry 초기화와 민감정보 제거 | `sentry.js` |
| `stories` | 공통 UI의 독립 상태 문서 | `Button.stories.jsx` |

`lib`은 React 없이 입력을 결과로 바꾸는 순수 코드, `hooks`는 React lifecycle과 state를 사용하는 코드입니다. `api`는 통신, `model`은 통신 결과를 프론트 도메인으로 해석하는 역할입니다.

파일 이름도 역할을 드러내도록 통일합니다.

| 패턴 | 의미 |
| --- | --- |
| `*Api.js` | endpoint별 HTTP 함수 |
| `*Queries.js` | query key와 Query options factory |
| `*Mutations.js` | mutation options와 무효화 규칙 |
| `*Mapper.js` | API DTO를 프론트 모델로 변환 |
| `*Schema.js` | Zod 검증 schema |
| `*Store.js` | Zustand 전역 UI store |
| `use*.js` | React hook |
| `*.test.js` | Vitest 테스트 |
| `*.stories.jsx` | Storybook 문서 |
| `index.js` | slice 외부에 노출할 공개 API |

더 자세한 위치 결정, 명명, 상태 소유권 기준은 [`docs/development-conventions.md`](./docs/development-conventions.md)를 확인합니다.

## API 통신 규칙

Axios와 TanStack Query는 대체 관계가 아니라 서로 다른 책임을 가집니다.

```text
Page / Widget
  → TanStack Query options
    → Entity API function
      → requestJson
        → axiosClient
          → Spring Boot API
```

- Axios는 실제 HTTP 요청, timeout, `withCredentials`, CSRF header, 공통 오류 변환을 담당합니다.
- TanStack Query는 서버 상태 캐시, 로딩·오류 상태, 재조회와 무효화를 담당합니다.
- 페이지와 UI 컴포넌트에서 Axios를 직접 import하지 않습니다.
- API 응답을 Zustand에 복사하지 않습니다.
- Query의 `signal`을 API 함수까지 전달해 취소 가능한 요청을 유지합니다.
- query key는 entity별 key factory에서 관리합니다.
- `shared/api`는 `getJson`, `postJson`, `putJson`, `patchJson`, `deleteJson`, `headJson` named helper를 제공합니다.

사용 예시:

```jsx
import { useQuery } from '@tanstack/react-query';
import { inventoryListQueryOptions } from '@/entities/inventory';

const query = useQuery(inventoryListQueryOptions(filters));
```

공통 통신 코드는 [`src/shared/api`](./src/shared/api), 재고 API 예시는 [`src/entities/inventory/api`](./src/entities/inventory/api)에 있습니다.

변경 요청이 생기면 실제 도메인 API에서 같은 options 구조를 사용합니다. 아직 백엔드 계약이 없는 재고 수정·삭제 endpoint를 미리 만들지는 않습니다.

```js
import { postJson } from '@/shared/api';

export function syncInventory(body, signal) {
  return postJson({
    path: 'v1/inventory-sync',
    body,
    signal,
  });
}
```

세션 로그인은 다음 Spring Security 계약을 사용합니다.

```text
GET  /api/v1/auth/csrf   -> CSRF cookie와 header 정보 발급
POST /api/v1/auth/login  -> loginId, password로 세션 로그인
GET  /api/v1/auth/me     -> 현재 세션 사용자 조회
POST /api/v1/auth/logout -> 서버 세션과 인증 cookie 제거
```

앱은 `/me`의 `401 AUTH-001`을 비로그인 상태로 해석하고 보호된 업무 경로를 `/login`으로 전환합니다. 네트워크 오류나 서버 오류는 로그인 화면으로 숨기지 않고 다시 시도할 수 있는 오류 상태로 표시합니다. 세션 ID는 localStorage, sessionStorage 또는 Zustand에 저장하지 않으며 브라우저의 HttpOnly cookie가 관리합니다. 로그아웃 성공 시 사용자별 서버 캐시를 제거하고 `/login`으로 이동합니다. 업무 API의 `401 AUTH-001`은 전역 세션 만료로 처리하여 전체 서버 캐시를 제거하고 현재 URL을 보존한 뒤 로그인 화면으로 이동합니다. 세부 `403` 권한 정책은 후속 기능에서 연결합니다.

## 재사용 UI 규칙

공통 컴포넌트는 [`src/shared/ui/index.js`](./src/shared/ui/index.js)를 통해 가져옵니다.

```jsx
import { Badge, Button, Card, DataTable, LottieLoader } from '@/shared/ui';
```

현재 준비된 주요 컴포넌트:

- 행동: `Button`, `IconButton`
- 입력: `Input`, `Select`, `Checkbox`
- 표면: `Card`, `MetricCard`, `DetailLayout`, `Drawer`
- 상태: `Badge`, `StatusDot`, `Alert`, `StateView`, `Skeleton`
- 데이터: `Table`, `DataTable`, `Tabs`
- 보조 UI: `Avatar`, `Tooltip`, `Icon`, `Sidebar`
- 모션: `LoadingMedia`, `LottieLoader`

사용 순서:

1. 먼저 `shared/ui`와 Storybook에서 기존 컴포넌트를 확인합니다.
2. 기존 컴포넌트의 `variant`, `size`, `tone`, `className`으로 해결합니다.
3. 범용 표현만 `shared/ui`에 추가합니다.
4. 위험등급, LOT, 재고 범위처럼 도메인 의미가 있으면 `entities/inventory/ui`에 둡니다.
5. 공통 컴포넌트를 추가하거나 variant를 변경하면 Storybook도 함께 갱신합니다.

`cn()`은 조건부 class 조합과 Tailwind 충돌 정리에 사용합니다. `cva()`는 Button, Badge, Input처럼 의미 있는 variant가 반복될 때 사용합니다. 페이지 전용 layout에 cva를 만들거나 화면마다 동일한 HTML·CSS를 다시 작성하지 않습니다.

숫자, 금액, 퍼센트, 수량, 날짜와 소비기한 표기는 공통 formatter를 사용합니다.

```jsx
import {
  formatCurrency,
  formatDateTime,
  formatDaysRemaining,
  formatNumber,
  formatPercent,
  formatQuantity,
} from '@/shared/lib/format';
```

기본 표기는 `2,058`, `₩8,900`, `14.3%`, `205개`, `2026.08.08 09:05`, `D-43`이며 표시할 수 없는 값은 `-`로 통일합니다. 화면마다 `toLocaleString()`이나 날짜 문자열 조합을 다시 작성하지 않습니다.

## 디자인 가이드

디자인 방향은 **Mesh Forecast** 스타일과 **Dashboard Filter Foundations** 컬러 시스템입니다. 업무용 화면이므로 장식보다 표, 필터, 검색과 상태 비교의 명확성을 우선합니다.

### 컬러

| 역할 | 색상 | 사용 기준 |
| --- | --- | --- |
| Main | `#27B06E` | primary 행동, 활성 navigation, 양호 상태 |
| Sub Mint | `#11C6AB` | 보조 강조 |
| Sub Cyan | `#00B0D7` | 정보, 보통 상태 |
| Sub Orange | `#FDA643` | 주의 상태 |
| Mint Soft | `#DAF7E9` | 양호·primary soft 배경 |
| Cyan Soft | `#CFF4FC` | 정보 soft 배경 |
| Orange Soft | `#FFEC2C` | 주의 soft 강조 |
| Danger | `#D92D20` | 위험과 실패 상태 |
| Danger Soft | `#FEE4E2` | 위험 soft 배경 |
| Gray 900 | `#282828` | 제목과 핵심 텍스트 |
| Gray 700 | `#747474` | 본문 텍스트 |
| Gray 500 | `#8E8E8E` | 설명과 placeholder |
| Gray 300/200/50 | `#C1C1C1` / `#DADADA` / `#F4F4F4` | border와 배경 단계 |

위험등급은 색상만으로 구분하지 않고 텍스트와 Reicon 아이콘을 함께 사용합니다. 색이 있는 버튼은 흰색 글자, 흰색 버튼은 Gray 900 글자를 기본으로 합니다.

### 타이포그래피

Pretendard 가변 폰트 하나만 사용하며 파일은 [`public/fonts/PretendardVariable.woff2`](./public/fonts/PretendardVariable.woff2)에 포함되어 있습니다.

| Token | 크기 | 기본 굵기 | 용도 |
| --- | --- | --- | --- |
| `headline1` | `1.375rem` · 22px | `700` | 페이지 대표 제목 |
| `headline2` | `1.25rem` · 20px | `700` | 큰 섹션 제목 |
| `subtitle1` | `1rem` · 16px | `600` | 카드·패널 제목 |
| `subtitle2` | `0.875rem` · 14px | `600` | 보조 제목 |
| `body1` | `0.875rem` · 14px | `400` | 기본 본문 |
| `body2` | `0.75rem` · 12px | `500` | 조밀한 업무 UI 본문 |
| `description` | `0.75rem` · 12px | `400` | 설명과 metadata |

기본 굵기는 `--font-weight-regular`(400), `--font-weight-medium`(500), `--font-weight-semibold`(600), `--font-weight-bold`(700), `--font-weight-extrabold`(800)으로 관리합니다. 컴포넌트에서는 `--font-weight-headline1`, `--font-weight-button`, `--font-weight-metric`처럼 역할별 semantic token을 우선 사용합니다.

숫자는 비교가 쉽도록 전역 `tabular-nums`를 사용합니다. 컴포넌트에서 임의 px 크기나 색상을 하드코딩하지 않고 [`src/styles.css`](./src/styles.css)의 semantic token을 사용합니다.

### 간격과 표면

- 간격은 4px 기반의 `--space-*` primitive scale을 사용합니다.
- 자주 쓰는 semantic 간격은 `--spacing-page-x`, `--spacing-section-gap`, `--spacing-card-padding`, `--spacing-table-cell-x/y`를 사용합니다.
- control height는 `--control-height-sm`(32px), `--control-height-default`(40px), `--control-height-lg`(48px)로 통일합니다.
- control radius: `0.375rem` · 6px
- bar/card radius: `0.5rem` · 8px
- panel radius: `0.5rem` · 8px
- field gap: `0.5rem` · 8px
- bar gap: `0.75rem` · 12px
- 빠른 motion: `160ms`, 기본 motion: `220ms`
- 밝은 Gray 50 배경과 흰색 작업 표면을 기본으로 사용합니다.
- Mesh 효과는 페이지 배경과 중요한 요약 표면에만 제한적으로 사용합니다.
- 테이블과 필터는 불투명한 작업 표면으로 유지합니다.
- 카드를 페이지 구획처럼 남용하거나 카드 안에 카드를 중첩하지 않습니다.
- 아이콘은 `reicon-react`만 사용하고, 아이콘 버튼에는 accessible label과 tooltip을 제공합니다.
- ZONE과 KAN은 UI 모델, 필터, 표 컬럼, URL 파라미터에 포함하지 않습니다.

디자인 토큰과 실제 컴포넌트 상태는 Storybook의 `Foundations/Design tokens`와 `Shared UI` 그룹에서 확인합니다. 디자인 레퍼런스와 AI 작업용 기준은 [`docs/design-references/ui8-dashboard-style-reference.md`](./docs/design-references/ui8-dashboard-style-reference.md)에 있습니다.

## 로딩 모션

원본 흰디 MP4는 [`public/animations/heendi-loader-reference.mp4`](./public/animations/heendi-loader-reference.mp4)에 레퍼런스로 보관합니다. 작은 공통 로딩 영역에서는 [`public/projects/hg-inventory-loader/scene-1/lottie.json`](./public/projects/hg-inventory-loader/scene-1/lottie.json)과 `LottieLoader`를 사용합니다.

- MP4: 캐릭터가 포함된 큰 로딩 화면 레퍼런스
- Lottie: 투명 배경, 색상 슬롯, 반복 가능한 작은 공통 스피너
- `prefers-reduced-motion`: 자동 재생을 중지해 접근성 설정을 따름

## 초기 세팅 완료 범위

완료:

- React·Vite·pnpm 앱 기반
- FSD-lite 폴더 구조와 예시 slice
- 앱 셸, Header, Sidebar, 기본 라우터
- Dashboard Filter Foundations 디자인 토큰과 Pretendard
- shadcn 기반 재사용 UI와 Storybook
- Axios·CSRF·ApiError 공통 통신 경계
- 세션 로그인, `/me` 인증 복원과 보호 라우터
- 업무 API의 전역 세션 만료 감지, 캐시 정리와 원래 경로 복귀
- React Hook Form·Zod 기반 로그인 화면
- TanStack Query Provider, inventory query key/options 예시
- TanStack Table 기반 재사용 DataTable
- Sentry Error Boundary와 민감정보 scrubber
- MP4 레퍼런스와 Lottie 공통 로더
- Vitest와 Playwright 기본 검증
- 공통 데이터 formatter와 단위 테스트
- API·Query·mapper·URL 상태 전체 흐름 템플릿
- 폴더·파일 명명 규칙과 기능 개발 체크리스트
- GitHub PR 템플릿
- Node.js 24 LTS와 pnpm 버전 고정
- ESLint·Prettier 공통 검사
- GitHub Actions PR 자동 검증
- `.env*` 비밀정보 보호 규칙

기능 또는 운영 단계에서 진행:

- 실제 Spring Boot API와 응답 mapper 연결
- Spring Security 세부 역할·권한 정책
- 실제 재고 조회, 서버 페이지네이션, URL 필터와 정렬
- 재고 상세와 AI 전략 업무 기능
- Zustand, React Hook Form, Zod, Recharts의 실제 도메인 적용
- 운영 Sentry sampling과 개인정보 정책
- 배포 아키텍처와 환경별 설정

## 참고 문서

- [신규 팀원 필수 온보딩](./docs/team-onboarding.md)
- [팀 설명용 프론트엔드 핸드북](./docs/team-frontend-handbook.md)
- [프론트엔드 초기 세팅 팀 가이드](./docs/frontend-foundation-team-guide.md)
- [프론트엔드 개발 규칙](./docs/development-conventions.md)
- [기능 개발 체크리스트](./docs/checklists/frontend-feature-checklist.md)
- [FSD-lite 구조 예시](./src/_template/README.md)
- [API·Query·mapper 전체 흐름 예시](./src/_template/example-flow/README.md)
- [GitHub PR 템플릿](./.github/pull_request_template.md)
- [디자인 레퍼런스와 구현 규칙](./docs/design-references/ui8-dashboard-style-reference.md)
- [HTTP와 FSD 경계 결정](./docs/plans/2026-08-07-003-http-client-and-fsd-boundaries.md)
- [디자인 방향 결정](./docs/plans/2026-08-07-006-design-direction-decision.md)
