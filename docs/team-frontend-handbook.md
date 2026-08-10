
# 프론트엔드 팀 설명용 핸드북

이 문서는 초기 세팅을 처음 보는 팀원이 **왜 이렇게 구성했는지**, **새 코드를 어디에 넣는지**, **공통 라이브러리와 컴포넌트를 어떻게 사용하는지**를 순서대로 이해하도록 돕는 설명용 문서입니다.

실제 API 계약이나 업무 정책이 확정되면 이 문서의 예시를 실제 기능 코드와 함께 갱신합니다. 현재 예시는 팀 공통 패턴을 보여주기 위한 기준이며, 화면 전체를 한 번에 완성한 업무 기능 예시는 아닙니다.

관련 문서:

- 설치와 최초 실행: docs/team-onboarding.md
- 토큰·컴포넌트·API의 상세 기준: docs/frontend-foundation-team-guide.md
- 코드 배치와 명명 규칙: docs/development-conventions.md
- 기능 작업 완료 조건: docs/checklists/frontend-feature-checklist.md

---

## 1. 팀원에게 설명할 순서

처음 설명할 때는 라이브러리 목록부터 읽지 않고 다음 순서로 진행합니다.

1. 서비스가 해결하는 업무 문제와 현재 개발 범위를 설명합니다.
2. React 앱이 어떤 흐름으로 실행되는지 보여줍니다.
3. FSD 계층을 “누가 무엇을 소유하는가”로 설명합니다.
4. 새 기능 하나를 예로 들어 파일 위치를 결정합니다.
5. 디자인 토큰과 공통 컴포넌트를 Storybook에서 확인합니다.
6. Axios와 TanStack Query의 책임을 분리해서 설명합니다.
7. URL 상태·서버 상태·로컬 상태·폼 상태를 구분합니다.
8. 테스트와 PR 체크리스트로 마무리합니다.

### 1.1 15분 설명용 요약

팀원이 시간이 없을 때는 아래 내용만 먼저 전달합니다.

> 이 저장소는 React 화면을 빠르게 만드는 것보다, 네 명이 같은 방식으로 기능을 추가할 수 있는 공통 기반을 먼저 만든 저장소입니다. 페이지는 URL 화면을 조합하고, 업무 행동은 feature, 재고·상품 같은 업무 데이터는 entity, 여러 조각을 묶은 화면 블록은 widget, 도메인을 모르는 공통 코드는 shared에 둡니다. 서버 데이터는 TanStack Query, 실제 HTTP 요청은 shared/api의 Axios, 전역 UI 상태만 Zustand가 맡습니다. 화면을 만들기 전 Storybook과 공통 컴포넌트를 확인하고, 변경 후 loading·empty·error 상태와 테스트를 함께 추가합니다.

### 1.2 설명 후 팀원이 할 수 있어야 하는 것

- /inventory가 어떤 route와 page 파일로 연결되는지 설명할 수 있어야 합니다.
- 새 필터를 shared가 아니라 features/inventory-filter에 둘 수 있어야 합니다.
- 재고 API를 page에서 Axios로 직접 호출하지 않고 entity API와 Query options로 연결할 수 있어야 합니다.
- 버튼·카드·배지·표를 새 HTML로 만들기 전에 Storybook의 공통 컴포넌트를 찾을 수 있어야 합니다.
- 색상과 폰트를 임의의 HEX·px로 작성하지 않고 토큰으로 사용할 수 있어야 합니다.
- PR 전에 pnpm run check, pnpm run test:e2e, pnpm run build-storybook을 실행할 수 있어야 합니다.

---

## 2. 프로젝트를 한 문장으로 이해하기

현대그린푸드의 여러 판매채널과 재고 위치를 통합 조회하고, 위험 재고를 찾아 AI 전략과 성과를 관리하는 B2B 운영 화면입니다.

초기 세팅에서 확정한 범위는 다음과 같습니다.

- React 19 + JavaScript + Vite
- FSD-lite 폴더 구조
- Dashboard Filter Foundations 컬러 토큰
- Pretendard 타이포그래피
- Mesh Forecast 스타일의 제한적인 표면 효과
- shadcn/ui 방식의 소스 소유 공통 컴포넌트
- React Router, Axios, TanStack Query, Zustand, TanStack Table, Storybook, Vitest, Playwright, Sentry 기반
- 실제 Spring Boot API와 업무 동작은 계약이 확정된 뒤 수직 slice로 구현

현재 초기 화면은 앱 셸과 라우팅을 확인하기 위한 준비 화면입니다. 기능이 비어 있다는 것은 구조가 누락됐다는 뜻이 아니라, 백엔드 계약 전에는 임의의 데이터를 확정하지 않기 위한 의도적인 상태입니다.

### 2.1 핵심 업무 용어

| 용어 | 의미 | 화면에서의 기준 |
| --- | --- | --- |
| 단품코드 | 판매·재고를 식별하는 개별 상품 코드 | 상품 식별과 API 조회 기준 |
| SKU | 상품 운영 단위 | 위험 SKU, 상품/SKU 수 비교 |
| LOT | 같은 생산·입고 묶음 | 소비기한, FEFO, LOT 재고 비교 |
| 현재고 | 물리적으로 보유한 재고 | 판매 가능 수량과 분리 |
| 가용수량 | 출고 예정 등을 제외하고 판매 가능한 수량 | 판매 가능 지표 |
| 판매채널 | 그리팅몰, 점포 등 판매 경로 | 온라인·오프라인 범위 필터 |
| 재고 위치 | 센터·점포 등 실제 보관 위치 | 재고 위치 필터 |
| 위험등급 | 재고 부족·과잉·소비기한 등을 종합한 상태 | 양호·보통·주의·위험 |

ZONE과 KAN은 현재 제품 기준에서 제거된 용어입니다. 모델, URL 검색 파라미터, API adapter, 테이블 컬럼, Storybook 예시에 새로 추가하지 않습니다.

---

## 3. React 앱 실행 흐름

브라우저가 앱을 열면 다음 순서로 코드가 연결됩니다.

~~~text
index.html
  -> src/main.jsx
    -> src/App.jsx
      -> src/app/providers/AppProviders.jsx
        -> src/app/router/router.jsx
          -> src/app/layouts/AppLayout.jsx
            -> AppSidebar + AppHeader + Outlet
              -> src/pages/<route>
~~~

### 3.1 각 파일의 역할

| 파일 | 역할 |
| --- | --- |
| src/main.jsx | React root에 앱을 마운트하고 전역 CSS를 불러옵니다. |
| src/App.jsx | RouterProvider 같은 앱 최상위 렌더링 경계를 둡니다. |
| src/app/providers/AppProviders.jsx | QueryClient와 Tooltip 같은 전역 Provider를 연결합니다. |
| src/app/router/router.jsx | URL, redirect, lazy route, 404 경계를 정의합니다. |
| src/app/layouts/AppLayout.jsx | 앱 셸과 Outlet을 배치합니다. |
| src/pages/* | route 하나에 대응하는 화면 조합입니다. |
| src/styles.css | Pretendard, 색상, typography, spacing, 앱 셸의 전역 토큰입니다. |

페이지 컴포넌트는 AppLayout을 다시 만들지 않습니다. 사이드바·헤더는 layout에서 한 번만 렌더링하고, page는 Outlet 안에 들어갈 업무 화면만 작성합니다.

---

## 4. FSD란 무엇인가

FSD(Feature-Sliced Design)는 코드를 파일 종류가 아니라 **제품의 책임과 의미**에 따라 나누는 프론트엔드 구조입니다.

예를 들어 전통적인 구조는 모든 버튼을 components, 모든 API를 api 한 곳에 모을 수 있습니다. 프로젝트가 커지면 어떤 화면에서 쓰이는 코드인지, 도메인 규칙이 어디에 있는지 찾기 어려워집니다. FSD는 재고 필터, 재고 상태, 전략 성과처럼 업무 의미를 기준으로 가까운 코드를 묶고, 공통 기반만 아래 계층으로 공유합니다.

이 프로젝트는 엄격한 FSD 전체 규칙이 아니라 **FSD-lite**를 사용합니다. 네 명의 풀스택 팀원이 처음에도 이해할 수 있도록 계층은 유지하되, 실제 기능이 생기기 전에는 entities, features, widgets를 억지로 채우지 않습니다.

### 4.1 FSD-lite 의존성 방향

~~~text
app
  ↓
pages
  ↓
widgets
  ↓
features
  ↓
entities
  ↓
shared
~~~

위 계층은 아래 계층을 사용할 수 있지만, 아래 계층은 위 계층을 알면 안 됩니다.

예:

- pages는 widgets, features, entities, shared를 조합할 수 있습니다.
- entities/inventory는 shared/api, shared/ui를 사용할 수 있습니다.
- shared/ui는 entities/inventory나 pages/inventory를 import하면 안 됩니다.
- shared/api는 React Router나 특정 재고 화면을 알아서는 안 됩니다.

### 4.2 레이어·슬라이스·세그먼트 이해하기

FSD 폴더를 읽을 때는 다음 세 단계를 구분합니다.

~~~text
레이어(layer)
  큰 책임 영역: app, pages, widgets, features, entities, shared
    ↓
슬라이스(slice)
  한 업무 개념이나 사용자 행동의 소유 단위: inventory, inventory-filter
    ↓
세그먼트(segment)
  슬라이스 안에서 목적별로 나눈 역할 단위: ui, model, api, lib
~~~

#### 레이어: 책임의 높이

레이어는 “이 코드는 앱 전체인가, URL 화면인가, 업무 행동인가, 공통 기반인가?”를 구분하는 가장 큰 단위입니다. 현재 프로젝트의 레이어는 `app → pages → widgets → features → entities → shared` 순서로 의존합니다.

- `app`: Provider, Router, Layout처럼 앱 전체를 조립합니다.
- `pages`: `/inventory`, `/dashboard`처럼 URL에 대응하는 화면을 조합합니다.
- `widgets`: 재고 표, 앱 셸, 상세 Drawer처럼 여러 조각을 묶습니다.
- `features`: 필터, 동기화, 상세 열기처럼 사용자의 한 가지 행동을 소유합니다.
- `entities`: 재고, 상품, 판매채널, 전략 같은 업무 데이터와 표시 규칙을 소유합니다.
- `shared`: 도메인을 모르는 Button, Axios, formatter 같은 공통 기반을 제공합니다.

#### 슬라이스: 업무 단위

슬라이스는 레이어 안에서 하나의 업무 개념이나 기능을 소유하는 폴더입니다. 슬라이스는 Redux의 state slice와 같은 뜻이 아니며, 상태가 없어도 만들 수 있습니다.

~~~text
entities/inventory
  entities 레이어의 inventory 슬라이스: 재고 데이터와 표시 규칙

features/inventory-filter
  features 레이어의 inventory-filter 슬라이스: 재고 필터 행동

widgets/inventory-table
  widgets 레이어의 inventory-table 슬라이스: 필터와 표를 묶은 업무 블록
~~~

슬라이스 이름에는 가능한 한 업무 의미를 넣습니다. `components`, `common`, `misc`처럼 의미가 없는 이름으로 여러 도메인을 섞지 않습니다. 한 페이지에서만 쓰이는 작은 코드는 먼저 page 안에 두고, 실제로 독립적인 업무 책임과 재사용이 생긴 뒤 슬라이스로 올립니다.

#### 세그먼트: 역할별 서랍

세그먼트는 슬라이스 안에서 코드를 목적별로 나눈 하위 폴더입니다. 세그먼트는 URL의 route segment가 아니며, Redux slice도 아닙니다.

~~~text
entities/inventory/
├─ api/       # inventoryApi.js, inventoryQueries.js
├─ model/     # 상태·상수·mapper·도메인 규칙
├─ ui/        # InventoryStatusBadge, InventoryScopeCard
└─ index.js   # 외부에 공개할 진입점
~~~

현재 프로젝트에서 자주 사용하는 세그먼트는 다음과 같습니다.

| 세그먼트 | 소유하는 코드 | 프로젝트 예시 |
| --- | --- | --- |
| `ui` | 화면에 표시되는 React 컴포넌트 | `entities/inventory/ui/InventoryStatusBadge.jsx` |
| `model` | 상태, 상수, mapper, schema, 도메인 규칙 | `features/inventory-filter/model/filterState.js` |
| `api` | endpoint 함수, query key, Query options | `entities/inventory/api/inventoryQueries.js` |
| `lib` | 해당 슬라이스에만 필요한 순수 함수 | 재고 전용 계산 함수 |
| `hooks` | 해당 슬라이스에만 필요한 React Hook | 필터 전용 Hook |
| `config` | 해당 슬라이스의 설정값 | 재고 상태 설정 |

`shared`와 `app`은 업무 슬라이스보다 세그먼트 중심으로 구성하는 경우가 많습니다. 예를 들어 `shared/ui`, `shared/api`, `shared/hooks`, `app/providers`, `app/router`, `app/layouts`가 이에 해당합니다. `shared`의 세그먼트에는 업무 용어를 넣지 않습니다.

#### 현재 프로젝트 경로를 세 단계로 읽는 법

~~~text
src/entities/inventory/ui/InventoryStatusBadge.jsx
    ↑              ↑  ↑
  레이어          슬라이스 세그먼트

src/features/inventory-filter/model/filterState.js
      ↑                    ↑      ↑
    레이어                슬라이스  세그먼트
~~~

새 파일을 만들 때는 “어떤 레이어인가?”를 먼저 정하고, 그다음 “어떤 업무 슬라이스가 소유하는가?”, 마지막으로 “ui·model·api 중 어떤 세그먼트인가?”를 판단합니다. 세 파일도 없는 상태에서 모든 세그먼트를 미리 만들 필요는 없습니다.

### 4.3 계층별 역할

| 계층 | 질문 | 넣는 것 | 넣지 않는 것 |
| --- | --- | --- | --- |
| app | 앱 전체를 어떻게 조립하는가? | Provider, Router, Layout, Error Boundary | 특정 재고 카드의 업무 규칙 |
| pages | URL에서 어떤 화면을 보여주는가? | page 조합, route-level layout | 범용 Button 구현 및 API 세부 구현 |
| widgets | 여러 조각을 묶은 업무 블록은 무엇인가? | 앱 셸, 재고 표 영역, 상세 Drawer 영역 | 단순 범용 Input |
| features | 사용자가 수행하는 한 가지 행동은 무엇인가? | 필터, 동기화, 상세 열기, 전략 실행 | 단순 상품 데이터 모델 |
| entities | 업무 데이터와 표시 규칙은 무엇인가? | inventory API, 상태 배지, LOT 행, mapper | 페이지 이동 전체 |
| shared | 도메인 없이도 재사용 가능한가? | Axios, Button, formatter, media hook | 위험 SKU 같은 업무 의미 |
| _template | 새 팀원이 어떻게 시작하는가? | 예시 slice와 주석 | 실제 화면에서의 import |

### 4.4 어디에 만들까? 결정 트리

새 파일을 만들기 전에 다음 질문을 순서대로 답합니다.

1. URL 하나에 대응하는 최종 화면인가?
   - 예: src/pages/inventory/InventoryPage.jsx
2. 여러 조각을 묶은 큰 화면 블록인가?
   - 예: src/widgets/inventory-table/ui/InventoryTable.jsx
3. 사용자가 수행하는 하나의 행동인가?
   - 예: src/features/inventory-filter, src/features/inventory-sync
4. 재고·상품·전략 데이터와 그 표시 규칙인가?
   - 예: src/entities/inventory
5. 업무 용어 없이 여러 도메인에서 쓸 수 있는가?
   - 예: src/shared/ui/Select.jsx, src/shared/lib/format
6. 아직 한 페이지에서만 쓰이는가?
   - 먼저 해당 page 내부에 두고, 실제 반복이 생긴 뒤 올립니다.

### 4.5 억지로 계층을 만들지 않는 기준

다음은 하지 않습니다.

- Button 하나를 감싸는 feature를 만들지 않습니다.
- API도 없는 상태에서 entity model을 과도하게 추상화하지 않습니다.
- 한 페이지의 작은 JSX를 widget으로 쪼개 이름만 늘리지 않습니다.
- props 전달이 한 단계라는 이유만으로 Zustand store를 만들지 않습니다.
- 두 곳에서 같은 색을 쓴다는 이유만으로 업무 컴포넌트를 shared로 올리지 않습니다.

반대로 아래 상황에서는 계층을 분리합니다.

- 같은 재고 상태 매핑을 두 화면에서 사용합니다.
- 필터 값이 URL과 API query에 함께 사용됩니다.
- 여러 화면에서 같은 동기화 행동과 성공·실패 처리가 필요합니다.
- 표·검색·상세 Drawer가 하나의 업무 블록으로 함께 움직입니다.

---

## 5. 폴더와 파일 이름을 읽는 법

~~~text
src/
├─ app/
│  ├─ providers/              # 전역 Provider
│  ├─ router/                 # route와 redirect
│  └─ layouts/               # 앱 셸과 Outlet
├─ pages/                     # URL 화면
├─ widgets/                   # 여러 조각을 묶은 화면 블록
├─ features/                  # 사용자 행동
├─ entities/                  # 도메인 데이터와 규칙
├─ shared/
│  ├─ api/                    # HTTP 경계와 오류
│  ├─ config/                 # 환경변수 정규화
│  ├─ hooks/                  # 범용 React hook
│  ├─ lib/                    # 순수 함수와 formatter
│  ├─ monitoring/             # Sentry
│  └─ ui/                     # 공통 UI와 Storybook
├─ _template/                 # 새 slice 예시
├─ styles.css                 # 전역 디자인 토큰
└─ main.jsx                   # 앱 진입점
~~~

### 5.1 반복되는 하위 폴더

| 폴더 | 역할 | 예시 |
| --- | --- | --- |
| ui | 사용자에게 보이는 React 컴포넌트 | InventoryScopeCard.jsx |
| model | 상태·상수·mapper·schema·store | filterState.js |
| api | endpoint 함수, query key, Query options | inventoryApi.js |
| lib | React 없는 순수 유틸리티 | formatter, cn.js |
| hooks | React lifecycle을 사용하는 공통 hook | useMediaQuery.js |
| config | 환경변수와 앱 설정 | env.js |
| providers | 앱 전체 Context와 외부 Provider | AppProviders.jsx |
| layouts | 전역 widget과 Router Outlet 배치 | AppLayout.jsx |
| router | route, redirect, lazy route | router.jsx |
| monitoring | Sentry 초기화와 scrubber | sentry.js |
| stories | Storybook 독립 상태 문서 | Button.stories.jsx |

lib은 React lifecycle이 없는 순수 코드, hooks는 React state와 effect를 사용하는 코드입니다. api는 통신, model은 통신 결과를 프론트 도메인으로 해석하는 역할입니다.

### 5.2 파일 이름 규칙

| 패턴 | 의미 |
| --- | --- |
| *Api.js | endpoint별 HTTP 함수 |
| *Queries.js | query key와 Query options factory |
| *Mutations.js | mutation options와 무효화 규칙 |
| *Mapper.js | API DTO를 프론트 모델로 변환 |
| *Schema.js | Zod 검증 schema |
| *Store.js | Zustand 전역 UI store |
| use*.js | React hook |
| *.test.js | Vitest 테스트 |
| *.stories.jsx | Storybook 문서 |
| index.js | slice 외부에 공개할 API |

### 5.3 공개 진입점

다른 slice가 내부 경로를 깊게 파고들지 않도록 index.js에 공개할 것만 export합니다.

~~~js
// entities/inventory/index.js
export { getInventories, getInventoryDetail } from './api/inventoryApi.js';
export {
  inventoryKeys,
  inventoryListQueryOptions,
  inventoryDetailQueryOptions,
} from './api/inventoryQueries.js';
export { InventoryStatusBadge } from './ui/InventoryStatusBadge.jsx';
~~~

---

## 6. 디자인 시스템을 사용하는 법

### 6.1 디자인 시스템의 단일 출처

| 영역 | 위치 |
| --- | --- |
| 전역 색상·폰트·간격·반경·그림자 | src/styles.css |
| Pretendard 파일 | public/fonts/PretendardVariable.woff2 |
| 디자인 토큰 시각 확인 | src/shared/ui/stories/DesignTokens.stories.jsx |
| 공통 컴포넌트 상태 확인 | src/shared/ui/stories |
| 재고 도메인 컴포넌트 확인 | src/entities/inventory/ui/InventoryCards.stories.jsx |

새 화면을 만들 때 색상 HEX와 폰트 크기를 직접 결정하지 않습니다. 먼저 semantic token이나 기존 컴포넌트를 찾습니다.

### 6.2 색상 토큰

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| --color-main | #27B06E | 브랜드, 주요 행동, 양호 |
| --color-sub-mint | #11C6AB | 보조 강조 |
| --color-sub-cyan | #00B0D7 | 정보, 보통 |
| --color-sub-orange | #FDA643 | 주의 |
| --color-sub-mint-soft | #DAF7E9 | 양호·선택 보조 배경 |
| --color-sub-cyan-soft | #CFF4FC | 정보 보조 배경 |
| --color-sub-orange-soft | #FFEC2C | 주의 보조 강조 |
| --color-danger | #D92D20 | 위험·오류 |
| --color-danger-soft | #FEE4E2 | 위험 보조 배경 |
| --color-gray-900 | #282828 | 제목, 흰 버튼의 글자 |
| --color-gray-700 | #747474 | 본문 |
| --color-gray-500 | #8E8E8E | 설명, placeholder |
| --color-gray-300 | #C1C1C1 | 강한 구분선 |
| --color-gray-200 | #DADADA | 기본 구분선 |
| --color-gray-50 | #F4F4F4 | 앱 배경 |
| --color-white | #FFFFFF | 작업 표면, 역상 글자 |

컴포넌트는 원시 토큰보다 semantic token을 우선 사용합니다.

| semantic token | 매핑 | 사용 예 |
| --- | --- | --- |
| --primary | main | 주요 버튼, 선택된 메뉴 |
| --primary-foreground | white | 채워진 primary 버튼 글자 |
| --text-heading | gray-900 | 제목·핵심 수치 |
| --text-body | gray-700 | 본문·셀 |
| --text-muted | gray-500 | 설명·metadata |
| --background | gray-50 | 앱 전체 배경 |
| --card, --surface | white | 카드·작업 표면 |
| --good | main | 양호 |
| --info | sub-cyan | 정보·보통 |
| --warning | sub-orange | 주의 |
| --danger | danger red | 위험·오류 |

~~~jsx
<p className="text-[color:var(--text-muted)]">최근 동기화 시각</p>
<strong className="text-[color:var(--text-heading)]">284개</strong>
~~~

### 6.3 버튼 대비 규칙

- 흰색 secondary 버튼은 gray-900 글자를 사용합니다.
- primary, danger처럼 채워진 색상 버튼은 흰색 글자를 사용합니다.
- ghost 버튼은 투명 배경과 muted 글자를 사용하고 hover에서 primary를 강조합니다.
- 색상만으로 상태를 전달하지 않습니다. 위험등급은 텍스트와 Reicon을 함께 표시합니다.
- 아이콘만 있는 버튼은 IconButton을 사용하고 label 또는 aria-label을 제공합니다.

### 6.4 Pretendard typography

폰트는 Pretendard 하나만 사용합니다. 크기는 rem 토큰으로 관리합니다.

| 토큰 | rem | px 기준·기본 굵기 | 용도 |
| --- | --- | --- | --- |
| --font-size-headline1 | 1.375rem | 22px · 700 | 페이지 대표 제목 |
| --font-size-headline2 | 1.25rem | 20px · 700 | 큰 섹션 제목 |
| --font-size-subtitle1 | 1rem | 16px · 600 | 카드·패널 제목 |
| --font-size-subtitle2 | 0.875rem | 14px · 600 | 보조 제목 |
| --font-size-body1 | 0.875rem | 14px · 400 | 기본 본문 |
| --font-size-body2 | 0.75rem | 12px · 500 | 조밀한 운영 UI |
| --font-size-description | 0.75rem | 12px · 400 | 설명·metadata |

기본 굵기는 `--font-weight-regular`(400), `--font-weight-medium`(500), `--font-weight-semibold`(600), `--font-weight-bold`(700), `--font-weight-extrabold`(800)으로 관리합니다. 제목·버튼·핵심 수치에는 `--font-weight-headline1`, `--font-weight-button`, `--font-weight-metric` 같은 역할별 semantic token을 사용합니다.

~~~jsx
<h1 className="text-[length:var(--font-size-headline1)] font-[var(--font-weight-bold)] text-[color:var(--text-heading)]">
  통합 재고 조회
</h1>
~~~

Tailwind와 tailwind-merge가 크기와 색상을 같은 그룹으로 합치지 않도록 text-[length:...]와 text-[color:...] 표기를 사용합니다.

### 6.5 간격·반경·표면

- 간격은 4px 기반의 `--space-1`부터 `--space-16`까지 primitive scale을 사용합니다.
- 페이지·섹션·카드·표에는 `--spacing-page-x`, `--spacing-section-gap`, `--spacing-card-padding`, `--spacing-table-cell-x/y` semantic token을 사용합니다.
- 컨트롤 높이는 `--control-height-sm`(32px), `--control-height-default`(40px), `--control-height-lg`(48px)로 통일합니다.
- control radius: 0.375rem · 6px
- bar/card radius: 0.5rem · 8px
- panel radius: 0.5rem · 8px
- field gap: 0.5rem · 8px
- bar gap: 0.75rem · 12px
- 빠른 motion: 160ms
- 기본 motion: 220ms
- 앱은 Gray 50 배경과 흰색 작업 표면을 기본으로 합니다.
- Mesh 효과는 페이지 배경이나 요약 surface에 제한적으로 사용합니다.
- 카드 안에 카드를 계속 중첩하지 않고, 표·필터를 주요 콘텐츠로 유지합니다.

### 6.6 디자인 변경 절차

1. Storybook에서 현재 토큰과 컴포넌트 상태를 확인합니다.
2. 기존 semantic token과 variant로 표현 가능한지 확인합니다.
3. 정말 필요한 경우에만 src/styles.css에 토큰을 추가합니다.
4. 공통 컴포넌트를 변경하면 기본·hover·active·focus·disabled 상태를 확인합니다.
5. Storybook에 변경 전후 상태를 추가합니다.
6. 데스크톱과 좁은 화면에서 텍스트 잘림·겹침·focus 상태를 확인합니다.

---

## 7. 공통 컴포넌트 사용법

공통 컴포넌트는 다음 공개 진입점으로 가져옵니다.

~~~jsx
import { Badge, Button, Card, DataTable, LottieLoader } from '@/shared/ui';
~~~

### 7.1 컴포넌트 선택표

| 상황 | 먼저 확인할 컴포넌트 | 비고 |
| --- | --- | --- |
| 주요 행동 | Button | variant, size, asChild |
| 아이콘 전용 행동 | IconButton | label과 tooltip 필수 |
| 상태 라벨 | Badge | neutral, good, info, warning, danger |
| 일반 표면 | Card | default, subtle, selected, flat |
| 숫자 요약 | MetricCard | tone과 selected 지원 |
| 텍스트 검색 | Input | size와 tone 지원 |
| 단일 선택 | Select | 네이티브 select 기반 |
| 체크 | Checkbox | 행 선택·필터 |
| 표 | Table, DataTable | DataTable은 TanStack Table 기반 |
| 탭 | Tabs | controlled/uncontrolled 지원 |
| 상세 패널 | Drawer, DetailLayout | 빠른 상세 확인과 본문 레이아웃 |
| 로딩·빈 상태·오류 | StateView, Skeleton | 화면마다 문구를 재작성하지 않음 |
| 보조 설명 | Tooltip | 판단 기준, 아이콘 설명 |
| 모션 | LottieLoader, LoadingMedia | 공통 스피너와 MP4 레퍼런스 |

### 7.2 Button, Badge, Card 예시

~~~jsx
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
~~~

### 7.3 cn과 cva

cn은 조건부 class를 합치고 Tailwind 충돌을 정리하는 함수입니다.

~~~jsx
import { cn } from '@/shared/lib/cn';

<div className={cn('p-4', selected && 'border-[var(--primary)]', className)} />
~~~

cva는 반복되는 의미 기반 variant를 한 곳에 선언할 때 사용합니다.

~~~js
const badgeVariants = cva('inline-flex items-center rounded-full', {
  variants: {
    variant: {
      neutral: 'bg-[var(--surface-subtle)] text-[color:var(--text-muted)]',
      danger: 'bg-[var(--danger-soft)] text-[color:var(--danger)]',
    },
  },
  defaultVariants: { variant: 'neutral' },
});
~~~

다음 상황에서는 cva를 만들지 않습니다.

- 페이지 한 곳에서만 쓰는 단일 layout
- class 두세 개를 조건부로 붙이는 작은 표현
- 업무 데이터 판단 로직을 variant 이름으로 숨기는 경우

### 7.4 도메인 컴포넌트와 공통 컴포넌트의 경계

~~~text
shared/ui/Badge.jsx
  -> 색상·크기·일반적인 상태 표현만 제공

entities/inventory/ui/InventoryStatusBadge.jsx
  -> 양호·보통·주의·위험의 업무 의미를 Badge variant로 매핑
~~~

shared/ui/Badge에 위험 SKU 같은 단어를 추가하지 않고, inventory entity가 해당 의미를 소유합니다.

### 7.5 DataTable 사용 기준

DataTable은 컬럼과 데이터를 호출부에서 받는 표현 전용 테이블입니다.

~~~jsx
const columns = [
  { accessorKey: 'channel', header: '판매처' },
  { accessorKey: 'product', header: '상품명' },
  {
    accessorKey: 'available',
    header: '가용수량',
    meta: { align: 'right' },
    cell: ({ getValue }) => String(getValue()) + '개',
  },
];

<DataTable
  caption="통합 재고 조회"
  columns={columns}
  data={rows}
  loading={query.isPending}
  error={query.isError ? query.error : null}
  onRowClick={(row) => openDetail(row.id)}
/>
~~~

표의 컬럼 정의는 재고 entity나 widget이 소유하고, DataTable은 정렬·상태·접근성·행 표현만 담당합니다. 서버 페이지네이션은 API 계약이 확정된 뒤 page 상태와 함께 연결합니다.

---

## 8. 라이브러리별 역할과 사용 시점

### 8.1 React 19

- 함수 컴포넌트와 hooks를 사용합니다.
- 컴포넌트는 하나의 책임을 갖게 합니다.
- 계산 가능한 값을 불필요하게 state로 저장하지 않습니다.
- 반복되는 목록에는 안정적인 key를 사용합니다.
- 렌더링 중 API 요청이나 전역 부작용을 실행하지 않습니다.

### 8.2 Vite

- pnpm dev: 개발 서버와 HMR
- pnpm run build: production bundle
- @ alias는 src를 가리킵니다.
- 환경변수 변경 후에는 Vite 서버를 다시 시작합니다.

### 8.3 React Router DOM

- route 정의는 src/app/router/router.jsx에 둡니다.
- 메뉴의 label·icon·path는 src/widgets/app-shell/model/navigation.js가 단일 출처입니다.
- 페이지 이동은 Link, NavLink, useNavigate를 사용합니다.
- 필터·검색·페이지 번호처럼 공유 URL이 필요한 상태는 search params에 둡니다.
- page 안에서 사이드바 JSX를 복제하지 않습니다.

### 8.4 TanStack Query

서버에서 가져온 데이터의 생명주기를 관리합니다.

- cache
- stale time
- loading·error·empty 경계
- refetch
- query invalidation
- request cancellation

Query는 Axios의 대체재가 아닙니다. Query가 실제 요청을 수행할 때 내부 queryFn이 entity API를 호출하고, entity API가 shared Axios 경계를 사용합니다.

### 8.5 Axios

Axios는 src/shared/api 안에서만 직접 사용합니다.

현재 공통 설정:

- baseURL: env.apiBaseUrl
- timeout: env.requestTimeoutMs
- withCredentials: true: Spring Security session cookie 전송
- request interceptor: 변경 요청에 CSRF header 추가
- response interceptor: ApiError로 정규화
- signal: TanStack Query의 취소 신호 전달

페이지나 UI에서 다음과 같이 직접 사용하지 않습니다.

~~~js
// 금지
import axios from 'axios';
await axios.get('/v1/inventories');
~~~

대신 entity API를 만듭니다.

~~~js
// entities/inventory/api/inventoryApi.js
import { requestJson } from '@/shared/api';

export function getInventories(params, signal) {
  return requestJson({ path: 'v1/inventories', method: 'get', params, signal });
}
~~~

`shared/api`에는 method 문자열을 반복하지 않도록 named helper도 공개되어 있습니다.

~~~js
import { postJson } from '@/shared/api';

export function syncInventory(body, signal) {
  return postJson({
    path: 'v1/inventory-sync',
    body,
    signal,
  });
}
~~~

지원 helper:

| helper | 용도 |
| --- | --- |
| `getJson` | 목록·상세 조회 |
| `postJson` | 생성·동기화·실행 요청 |
| `putJson` | 전체 리소스 수정 |
| `patchJson` | 일부 필드 수정 |
| `deleteJson` | 삭제·해제 요청 |
| `headJson` | 본문 없는 상태 확인 |

모든 helper는 `{ path, params, body, headers, signal }` options를 사용합니다. 실제 재고 수정·삭제 endpoint가 확정되기 전에는 domain API 함수를 미리 만들지 않고, 공통 HTTP helper만 사용 가능한 상태로 둡니다.

### 8.6 Zustand

서버 응답 저장소가 아니라 여러 화면에서 공유하는 클라이언트 UI 상태에만 사용합니다.

사용할 수 있는 예:

- 사용자가 선택한 전역 작업 범위
- 여러 route에서 유지되어야 하는 UI density
- 전역 drawer·command palette 열림 상태

사용하지 않는 예:

- 재고 목록 API 응답
- URL로 복원할 수 있는 검색어와 page
- props 전달이 조금 길다는 이유

실제 공유 상태가 생길 때만 features/<feature>/model/<feature>Store.js 또는 적절한 shared store를 추가합니다.

### 8.7 React Hook Form + Zod

현재 초기 세팅에 설치만 되어 있으며, 실제 입력이 생길 때 feature 안에 적용합니다.

적합한 예:

- AI 전략 조건 입력
- 기간·채널·점포·할인율 조합
- 필터 제출과 검증
- 사용자 설정

단순히 검색 input 하나를 상태로 관리하는 데에는 useState나 URL search params가 더 단순할 수 있습니다.

~~~jsx
const schema = z.object({
  keyword: z.string().trim().max(100),
  risk: z.enum(['all', 'good', 'normal', 'caution', 'risk']),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { keyword: '', risk: 'all' },
});
~~~

### 8.8 TanStack Table

표의 row model, sorting, column definition을 관리합니다. 서버 페이지네이션과 서버 정렬은 manualSorting, page query, API 계약을 확정한 뒤 연결합니다. @tanstack/react-virtual은 페이지네이션만으로 부족한 성능 문제가 실제로 확인될 때 도입합니다.

### 8.9 Recharts

수요예측, 위험분석, 전략 성과 그래프에 사용합니다.

- API 원본 데이터를 chart 전용 배열로 변환합니다.
- 차트 색상은 var(--good), var(--warning), var(--danger) 같은 semantic token을 사용합니다.
- 표와 그래프가 같은 정보를 표현하면 숫자와 단위를 함께 제공합니다.
- 데이터가 없을 때 빈 SVG를 보여주지 않고 StateView나 안내 문구를 사용합니다.

### 8.10 Tailwind CSS + shadcn/ui

shadcn/ui는 외부 실행 서비스가 아니라 컴포넌트 소스를 프로젝트가 소유하는 방식입니다.

- 기존 shared/ui를 먼저 찾습니다.
- 필요한 primitive가 없을 때만 shadcn CLI로 추가합니다.
- 생성 후 디자인 토큰·Reicon·접근성 기준에 맞게 수정합니다.
- 공개 export와 Storybook story를 함께 추가합니다.

### 8.11 Reicon

아이콘은 reicon-react만 사용합니다.

~~~jsx
import { Database } from 'reicon-react';
import { Icon } from '@/shared/ui';

<Icon icon={Database} size={18} aria-hidden="true" />
~~~

아이콘만 있는 버튼은 IconButton으로 감싸고, 의미가 불분명하면 Tooltip을 제공합니다.

### 8.12 Storybook

공통 컴포넌트의 계약을 코드로 확인하는 문서입니다.

새 컴포넌트 story에는 최소한 다음 상태를 포함합니다.

- 기본 상태
- 주요 variant
- hover·focus·disabled
- 긴 텍스트와 큰 수치
- loading·empty·error가 해당되는 경우
- 좁은 화면에서의 상태

### 8.13 Vitest와 Playwright

- Vitest: pure function, mapper, query key, 상태 매핑, formatter
- Playwright: 실제 route 이동, 클릭, query state, 업무 흐름
- Storybook: 컴포넌트 조합과 시각 계약

하나의 테스트로 모든 것을 검증하려 하지 않습니다. 순수 규칙은 Vitest, 사용자 흐름은 Playwright, 시각 상태는 Storybook에 둡니다.

### 8.14 Sentry

Sentry는 화면을 만드는 라이브러리가 아니라 운영 중 오류를 관찰하는 경계입니다.

- DSN이 없으면 로컬에서 비활성화됩니다.
- Error Boundary를 통해 렌더 오류를 수집합니다.
- session, token, cookie, authorization, SKU, LOT 등 민감정보 scrubber를 통과합니다.
- 401·403을 무조건 예외로 보내지 않도록 운영 정책을 백엔드 계약과 정합니다.

---

## 9. Axios와 TanStack Query를 함께 쓰는 표준 흐름

### 9.1 전체 데이터 흐름

~~~text
Page / Widget
  -> useQuery(options)
    -> queryFn({ signal })
      -> entity API function
        -> requestJson
          -> axiosClient
            -> Spring Boot API
~~~

각 단계의 책임:

1. Page·widget은 로딩·오류·데이터를 화면으로 표현합니다.
2. Query options는 query key와 캐시 정책을 정의합니다.
3. Entity API는 endpoint·params·body를 정의합니다.
4. requestJson은 HTTP 메서드와 응답 data 형식을 통일합니다.
5. axiosClient는 base URL, timeout, credentials, CSRF, 오류 변환을 담당합니다.

### 9.2 재고 목록 예시

~~~js
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
~~~

~~~js
// entities/inventory/api/inventoryQueries.js
import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getInventories } from './inventoryApi.js';

export const inventoryKeys = Object.freeze({
  all: ['inventory'],
  lists: () => [...inventoryKeys.all, 'list'],
  list: (params = {}) => [...inventoryKeys.lists(), params],
});

export function inventoryListQueryOptions(params = {}) {
  return queryOptions({
    queryKey: inventoryKeys.list(params),
    queryFn: ({ signal }) => getInventories(params, signal),
    placeholderData: keepPreviousData,
  });
}
~~~

~~~jsx
// widgets/inventory-table/ui/InventoryTable.jsx
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/shared/ui';
import { inventoryListQueryOptions } from '@/entities/inventory';

export function InventoryTable({ filters }) {
  const query = useQuery(inventoryListQueryOptions(filters));

  return (
    <DataTable
      columns={columns}
      data={query.data?.content ?? []}
      loading={query.isPending}
      error={query.isError ? query.error : null}
      emptyMessage="조건에 맞는 재고가 없습니다."
    />
  );
}
~~~

### 9.3 필터와 query key

필터는 다음 순서로 흐릅니다.

~~~text
사용자 입력
  -> URL search params
    -> 파싱·기본값·검증
      -> query key
        -> API params
~~~

URL에 넣을 값:

- keyword
- channel
- location
- risk
- page
- size
- sort

URL에 넣지 않는 값:

- 임시 hover 상태
- 단순 Drawer 열림 여부
- 서버 응답 전체

query key에는 plain object만 넣고, 함수·DOM node·React element를 넣지 않습니다.

### 9.4 mutation과 무효화

동기화, 전략 실행 등 서버를 변경하는 행동은 feature가 소유하고, 성공하면 관련 query를 invalidate합니다.

~~~js
const mutation = useMutation({
  mutationFn: syncInventory,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() }),
});
~~~

Axios interceptor에 mutation이나 화면 이동을 넣지 않습니다. interceptor는 통신 공통 관심사만 처리합니다.

---

## 10. 세션 인증·CSRF·/me를 설명할 때

현재 백엔드 계약이 완성되지 않았으므로 프론트에는 안전한 통신 골격만 있습니다.

### 10.1 세션 방식의 기본 원칙

- 세션 ID는 JavaScript 변수나 localStorage에 저장하지 않습니다.
- 브라우저 cookie가 session을 유지합니다.
- Axios는 withCredentials: true로 cookie를 전송합니다.
- CORS를 사용할 때 서버는 정확한 origin과 credentials 허용을 설정해야 합니다.

### 10.2 CSRF 흐름

~~~text
서버가 CSRF cookie 발급
  -> 프론트가 cookie에서 token 읽기
  -> GET 같은 safe method에는 header를 붙이지 않음
  -> POST/PUT/PATCH/DELETE에 CSRF header 추가
  -> Spring Security가 검증
~~~

현재 기본값:

- cookie: XSRF-TOKEN
- header: X-XSRF-TOKEN

실제 Spring Security 설정이 다르면 .env.local의 이름과 백엔드 계약을 함께 바꿉니다. HttpOnly CSRF cookie를 사용할 경우 브라우저 JavaScript가 읽을 수 없으므로 별도 token endpoint나 meta 전달 방식이 필요합니다.

### 10.3 /me bootstrap은 UI 디자인이 아니다

/me bootstrap은 앱이 시작될 때 현재 로그인 사용자와 권한을 확인하는 **인증 상태 초기화 과정**입니다. UI 부트스트랩이나 CSS 초기화와 다른 개념입니다.

향후 흐름 예시:

~~~text
앱 시작
  -> /me 요청
    -> loading: 인증 경계 표시
    -> 200: 사용자·권한 저장 후 앱 렌더링
    -> 401: 로그인 화면 또는 로그인 안내
    -> 403: 권한 없음 화면
    -> network error: 재시도 가능한 오류 화면
~~~

백엔드 계약이 정해지기 전에는 임의로 401 interceptor에서 /login으로 이동시키지 않습니다. 사용자 객체의 필드, 권한 이름, 세션 만료 정책, 401·403 JSON 형식을 먼저 합의해야 합니다.

---

## 11. 상태 관리 선택표

| 질문 | 선택 |
| --- | --- |
| 서버에 있는 데이터를 가져오는가? | TanStack Query |
| 새로고침해도 URL로 복원되어야 하는가? | React Router search params |
| 한 컴포넌트 안에서만 잠깐 필요한가? | useState |
| 여러 화면에서 공유하지만 서버 데이터는 아닌가? | Zustand 검토 |
| 입력값과 검증·제출이 필요한가? | React Hook Form + Zod |

예를 들어 재고 검색어는 URL에 두고, 재고 목록 결과는 Query cache에 두며, 상세 Drawer의 열림 여부는 page 또는 widget local state에 둡니다. 사용자 전역 작업 범위처럼 여러 route에서 공유되어야 할 때만 Zustand를 검토합니다.

---

## 12. 실제 기능을 시작하는 예시

### 12.1 재고 목록 수직 slice

첫 기능은 /inventory 목록을 다음 작은 흐름으로 완성하는 것이 좋습니다.

~~~text
/inventory
  -> URL filter
  -> filter parser + validation
  -> inventory list query
  -> API response mapper
  -> DataTable
  -> loading / empty / error / forbidden
  -> server pagination
  -> row click -> detail route or Drawer
~~~

추천 파일 배치:

~~~text
src/
├─ pages/inventory/InventoryPage.jsx
├─ widgets/inventory-table/ui/InventoryTable.jsx
├─ widgets/inventory-summary/ui/InventorySummary.jsx
├─ widgets/inventory-detail-drawer/ui/InventoryDetailDrawer.jsx
├─ features/inventory-filter/model/filterState.js
├─ features/inventory-filter/ui/InventoryFilterBar.jsx
├─ features/inventory-detail/ui/InventoryDetailTrigger.jsx
├─ entities/inventory/api/inventoryApi.js
├─ entities/inventory/api/inventoryQueries.js
├─ entities/inventory/model/inventoryMapper.js
├─ entities/inventory/ui/InventoryStatusBadge.jsx
└─ shared/ui/DataTable.jsx
~~~

### 12.2 구현 순서

1. 백엔드와 response, pagination, error contract를 먼저 합의합니다.
2. entities/inventory/api에 endpoint 함수를 추가합니다.
3. Query key와 options factory를 추가합니다.
4. API DTO를 화면 모델로 변환하는 mapper를 추가합니다.
5. URL filter parser를 추가합니다.
6. InventoryFilterBar가 shared Input·Select를 조합하도록 만듭니다.
7. InventoryTable이 Query 상태를 DataTable props로 전달하게 합니다.
8. loading·empty·error·forbidden 상태를 확인합니다.
9. row click을 detail route 또는 Drawer로 연결합니다.
10. Storybook과 Vitest·Playwright를 추가합니다.

### 12.3 기능을 마친 뒤 공통화하는 것

처음부터 재사용할 것을 모두 추측하지 않습니다. 실제 구현 후 아래 조건을 만족하면 공통화합니다.

- 같은 UI 구조가 두 곳 이상에서 반복됩니다.
- props 이름과 상태 의미가 실제로 동일합니다.
- 공통화해도 도메인 규칙이 섞이지 않습니다.
- Storybook에서 독립적인 상태를 문서화할 수 있습니다.

---

## 13. Storybook을 팀 개발 도구로 쓰는 법

Storybook은 디자인을 저장하는 곳이 아니라 컴포넌트 계약을 빠르게 확인하는 곳입니다.

### 13.1 story를 만드는 위치

- 공통 primitive: src/shared/ui/stories
- 재고 도메인 컴포넌트: src/entities/inventory/ui/*.stories.jsx
- 앱 셸: src/widgets/app-shell/ui/AppShell.stories.jsx

### 13.2 story에 넣을 상태

~~~text
기본
variant별
hover / focus / disabled
긴 텍스트
큰 수치
loading
empty
error
좁은 화면
~~~

### 13.3 Show code 규칙

- parameters.docs.source.code를 사용하면 팀이 읽기 좋은 수동 예시를 제공합니다.
- 예시의 import 경로와 props는 실제 코드와 일치해야 합니다.
- story에서만 동작하는 가짜 prop을 문서에 넣지 않습니다.
- 공통 컴포넌트의 token·variant가 실제 코드와 다르면 story가 아니라 컴포넌트를 고칩니다.

### 13.4 Storybook 검토 질문

- 이 컴포넌트가 어떤 props를 공개하는가?
- 기본 상태와 오류·비활성 상태가 보이는가?
- 긴 한국어 제목과 큰 숫자가 잘리지 않는가?
- 키보드 포커스가 보이는가?
- 색상만으로 상태를 구분하고 있지 않은가?
- 실제 앱의 src/styles.css와 Pretendard를 사용하는가?

---

## 14. 테스트와 품질 기준

### 14.1 Vitest를 쓰는 곳

- 숫자·금액·날짜 formatter
- API DTO mapper
- query key와 URL parser
- 위험등급 매핑
- Zustand store action
- CSRF token helper와 Sentry scrubber

### 14.2 Playwright를 쓰는 곳

- / redirect
- 사이드바 메뉴 이동
- 필터 입력 후 URL 변경
- API loading·error 상태의 사용자 표시
- row click 후 상세 이동
- 권한 없음 화면

### 14.3 검증 명령

~~~bash
pnpm run audit:prod
pnpm run check
pnpm run test:e2e
pnpm run build-storybook
git diff --check
~~~

pnpm run check는 ESLint, Prettier, Vitest, production build를 포함합니다. 결과를 숨기지 말고 실패 원인을 확인한 뒤 수정합니다.

### 14.4 접근성 기본선

- 의미 있는 HTML 요소를 사용합니다.
- input에는 label 또는 accessible name이 있어야 합니다.
- 버튼과 링크는 키보드로 접근할 수 있어야 합니다.
- focus-visible 상태를 제거하지 않습니다.
- 상태를 색상만으로 표현하지 않습니다.
- 아이콘 전용 버튼에는 label과 tooltip을 제공합니다.
- 테이블 헤더에는 scope="col"을 유지합니다.
- loading은 role="status", 오류는 role="alert" 같은 상태 의미를 유지합니다.

---

## 15. 네 명이 함께 작업할 때의 규칙

모두 풀스택으로 참여하더라도 프론트 공통 기반은 한 사람이 임의로 바꾸지 않습니다.

### 15.1 공통 파일 변경 전 공유할 것

- src/styles.css
- src/shared/ui/*
- src/shared/api/*
- src/app/providers/AppProviders.jsx
- src/app/router/router.jsx
- package.json, pnpm-lock.yaml

이 파일들은 여러 사람이 동시에 사용하므로 작은 변경도 PR 설명에 영향 범위를 적습니다.

### 15.2 기능 작업 branch 예시

~~~bash
git switch main
git pull --ff-only
git switch -c feat/inventory-list
~~~

PR에는 다음 내용을 적습니다.

1. 무엇을 왜 바꿨는가
2. 어떤 계층과 파일을 변경했는가
3. API 계약 또는 임시 mock 범위는 무엇인가
4. loading·empty·error·forbidden을 어떻게 처리했는가
5. Storybook·Vitest·Playwright를 어떻게 확인했는가
6. 데스크톱과 좁은 화면에서 확인했는가

### 15.3 풀스택 협업 시 먼저 합의할 API 항목

- URL과 HTTP method
- query parameter 이름과 page 기준
- 요청·응답 JSON shape
- 단위와 날짜 형식
- 성공 status와 204 여부
- 표준 오류 shape와 code
- 401·403 구분
- session cookie와 CSRF 정책
- trace ID 또는 correlation ID
- timeout과 재시도 책임

프론트가 임의의 응답 shape을 가정해 진행하지 말고, 계약이 미정이면 mapper와 mock 경계를 명시합니다.

---

## 16. 금지 목록

- 페이지나 컴포넌트에서 axios를 직접 import하지 않습니다.
- 서버 응답을 Zustand에 복사하지 않습니다.
- VITE_*에 secret을 넣지 않습니다.
- 세션 ID를 localStorage에 저장하지 않습니다.
- shared/ui에 재고·LOT·전략 용어를 넣지 않습니다.
- ZONE과 KAN을 새 필터·컬럼·URL에 추가하지 않습니다.
- 색상 HEX와 폰트 px를 컴포넌트마다 하드코딩하지 않습니다.
- Reicon 외 아이콘 라이브러리를 혼용하지 않습니다.
- 위험등급을 색상만으로 표현하지 않습니다.
- 페이지마다 같은 table·filter·button HTML을 복사하지 않습니다.
- 실제 API 계약 전 페이지네이션·인증·에러 정책을 추측해 확정하지 않습니다.
- loading·empty·error 상태를 정상 데이터가 들어온 뒤에 나중 작업으로 미루지 않습니다.
- Storybook에서 보이지 않는 컴포넌트를 공통으로 확정하지 않습니다.

---

## 17. 팀원 개인 완료 체크리스트

### 환경과 실행

- [ ] Node.js 24 LTS를 확인했습니다.
- [ ] pnpm 11.18.0을 확인했습니다.
- [ ] pnpm install --frozen-lockfile이 성공했습니다.
- [ ] .env.local을 만들었고 Git에 추가되지 않았습니다.
- [ ] pnpm dev에서 /inventory를 열었습니다.
- [ ] pnpm storybook에서 공통 UI를 열었습니다.

### 구조 이해

- [ ] app, pages, widgets, features, entities, shared의 역할을 설명할 수 있습니다.
- [ ] 새 필터를 features에 둘 이유를 설명할 수 있습니다.
- [ ] 재고 상태 배지를 entities/inventory/ui에 둘 이유를 설명할 수 있습니다.
- [ ] 범용 Badge를 shared/ui에서 가져올 수 있습니다.
- [ ] index.js 공개 진입점의 목적을 이해했습니다.

### 구현 습관

- [ ] 페이지에서 Axios를 직접 import하지 않았습니다.
- [ ] Query key와 API 함수의 위치를 알고 있습니다.
- [ ] URL 상태와 서버 상태를 구분했습니다.
- [ ] 기존 Button·Card·DataTable을 먼저 확인했습니다.
- [ ] 색상·폰트·간격을 token으로 사용했습니다.
- [ ] loading·empty·error·forbidden을 고려했습니다.
- [ ] Storybook story를 추가하거나 기존 story를 갱신했습니다.

### 제출 전 검증

- [ ] pnpm run audit:prod
- [ ] pnpm run check
- [ ] pnpm run test:e2e
- [ ] pnpm run build-storybook
- [ ] git diff --check
- [ ] 데스크톱과 좁은 화면을 확인했습니다.

---

## 18. 설명자가 사용할 수 있는 마무리 문장

> 이 구조의 목적은 폴더를 복잡하게 만드는 것이 아니라, 코드의 주인을 분명하게 만드는 것입니다. 화면은 page, 큰 조합은 widget, 사용자의 행동은 feature, 업무 데이터는 entity, 어느 도메인에서도 쓸 수 있는 기반은 shared가 소유합니다. 처음에는 가장 가까운 곳에 작게 만들고, 실제 반복과 의미가 확인되면 공통화합니다. API는 Axios와 Query를 분리하고, 디자인은 token과 Storybook을 기준으로 맞추며, 모든 기능은 loading·empty·error·권한 상태까지 포함해야 완료입니다.
