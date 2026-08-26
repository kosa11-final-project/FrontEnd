# 프론트엔드 개발 규칙

이 문서는 풀스택 팀원이 프론트엔드 파일을 같은 기준으로 배치하고 이름 짓기 위한 공통 규칙입니다. 구조 판단은 이 문서, 디자인 표현은 Storybook과 `src/styles.css`, 전체 현황은 루트 `README.md`를 기준으로 합니다.

## 1. FSD 용어

```text
layer   app, pages, widgets, features, entities, shared
slice   inventory, inventory-filter, app-shell처럼 하나의 업무 책임
segment api, model, ui처럼 slice 내부의 기술 역할
```

예를 들어 `src/entities/inventory/api/inventoryQueries.js`는 다음처럼 읽습니다.

- layer: `entities`
- slice: `inventory`
- segment: `api`
- file: inventory entity의 Query options와 query key

## 2. 파일 위치 결정 순서

1. 앱 전체 초기화, Provider, Router인가? → `app`
2. URL에 대응하는 최종 화면인가? → `pages`
3. 여러 feature와 entity를 묶은 독립 업무 블록인가? → `widgets`
4. 필터, 동기화, 상세 열기처럼 사용자의 한 가지 행동인가? → `features`
5. 재고, 상품, 판매채널처럼 도메인의 데이터와 표시 규칙인가? → `entities`
6. 어떤 도메인에서도 사용할 수 있는 UI·통신·유틸리티인가? → `shared`

한 화면에서만 사용하는 작은 컴포넌트와 hook은 먼저 해당 page 안에 둡니다. 재사용 가능성이 아니라 실제 재사용과 동일한 의미가 확인됐을 때 상위 계층으로 이동합니다.

## 3. 반복되는 폴더 이름

| 이름 | 역할 | 넣는 것 | 넣지 않는 것 |
| --- | --- | --- | --- |
| `api` | 서버 통신 계약 | API 함수, query key, query options, mutation options | JSX, 화면 layout, Axios instance 재생성 |
| `api/clients` | 외부 통신 도구의 실제 instance | Axios client와 interceptor | entity endpoint, React hook |
| `model` | 상태와 도메인 규칙 | mapper, schema, constants, store, 순수 상태 계산 | 화면 배치, 범용 UI primitive |
| `ui` | 사용자에게 보이는 표현 | React 컴포넌트, compound component | API 요청 생성, 전역 설정 |
| `lib` | 범용 순수 유틸리티 | formatter, class 조합, 파서, 계산 함수 | React state, 특정 도메인 정책 |
| `hooks` | 범용 React hook | 브라우저 API나 여러 화면에서 재사용하는 hook | 서버 데이터 복제, 특정 page 전용 hook |
| `config` | 실행 환경 설정 | 환경변수 정규화, 변경되지 않는 앱 설정 | secret, 사용자 상태, API 호출 |
| `providers` | 앱 전체 Context 연결 | QueryClientProvider, TooltipProvider | 페이지별 상태와 화면 JSX |
| `layouts` | 전역 배치 | AppShell widget, Router Outlet 배치 | Sidebar·Header 세부 구현 |
| `router` | URL 구조 | route, redirect, lazy route boundary | navigation 버튼의 세부 스타일 |
| `stories` | 독립 UI 문서 | 기본·variant·disabled·긴 텍스트·오류 상태 | 실제 서버 호출, 업무 데이터 저장 |
| `assets` | 코드와 함께 배포하는 정적 리소스 | 이미지, 로컬 SVG, 애니메이션 | API 응답이나 사용자가 업로드한 파일 |

### `lib`과 `hooks` 구분

- React 없이 입력을 받아 결과를 반환하면 `lib`입니다.
- `useState`, `useEffect`, Context, 브라우저 lifecycle을 사용하면 `hooks`입니다.
- inventory 전용 계산은 `shared/lib`가 아니라 `entities/inventory/model`에 둡니다.
- 한 page에서만 사용하는 hook은 `shared/hooks`로 올리지 않고 해당 page에 둡니다.

### `api`와 `model` 구분

- 네트워크 요청과 Query 설정은 `api`입니다.
- 서버 응답을 프론트 도메인 모델로 바꾸는 mapper와 상태 규칙은 `model`입니다.
- Axios response 전체를 UI로 전달하지 않습니다.
- API 함수에서 mapper를 호출해 정규화된 데이터만 반환합니다.

## 4. 반복되는 파일 이름

| 패턴 | 역할 | 예시 |
| --- | --- | --- |
| `*Api.js` | endpoint별 HTTP 함수 | `inventoryApi.js` |
| `*Queries.js` | query key와 Query options factory | `inventoryQueries.js` |
| `*Mutations.js` | mutation options와 무효화 규칙 | `inventoryMutations.js` |
| `*Mapper.js` | API DTO → 프론트 모델 변환 | `inventoryMapper.js` |
| `*Schema.js` | Zod 입력·응답 검증 schema | `inventoryFilterSchema.js` |
| `*Store.js` | Zustand 전역 UI store | `useTableSettingsStore.js` |
| `use*.js` | React hook | `useMediaQuery.js` |
| `*.test.js` | Vitest 단위·통합 테스트 | `inventoryMapper.test.js` |
| `*.stories.jsx` | Storybook UI 상태 문서 | `Button.stories.jsx` |
| `index.js` | slice의 공개 API | 외부에서 사용할 export만 노출 |

`utils.js`, `helpers.js`, `common.js`, `data.js`처럼 책임을 알기 어려운 이름은 피합니다. 파일 이름만 보고 역할이 드러나게 작성합니다.

## 5. 명명 규칙

| 대상 | 규칙 | 예시 |
| --- | --- | --- |
| React 컴포넌트 | PascalCase | `InventoryFilterBar.jsx` |
| 일반 함수·변수 | camelCase | `formatQuantity` |
| hook | `use` + Pascal 의미 | `useInventoryFilters` |
| API 조회 함수 | `get` + 대상 | `getInventories` |
| API 변경 함수 | `create`, `update`, `delete`, 실행 동사 | `syncInventory` |
| Query options | 대상 + 목적 + `QueryOptions` | `inventoryListQueryOptions` |
| query key factory | 복수형 entity + `Keys` | `inventoryKeys` |
| mapper | `map` + 대상 + 방향 | `mapInventoryListResponse` |
| schema | 대상 + `Schema` | `inventoryFilterSchema` |
| Zustand store | `use` + 대상 + `Store` | `useDrawerStore` |
| boolean | `is`, `has`, `can`, `should` | `isLoading`, `hasPermission` |
| 폴더·route | kebab-case | `inventory-detail`, `/ai-strategy` |

백엔드 DTO의 `itemCd`, `available_qty`, `riskYn` 같은 이름을 UI까지 전파하지 않습니다. entity mapper에서 `itemCode`, `availableQuantity`, `riskLevel`처럼 프론트 도메인 이름으로 변환합니다.

## 6. 상태의 위치

| 상태 | 소유 도구·위치 | 예시 |
| --- | --- | --- |
| 서버에서 받은 데이터 | TanStack Query | 재고 목록, 상세, 통계 |
| URL로 공유·복원할 상태 | React Router search params | 검색어, 필터, 정렬, 페이지 |
| 입력 중인 폼 상태 | React Hook Form | 전략 입력, 검색 조건 폼 |
| 한 컴포넌트의 짧은 UI 상태 | `useState` | Dropdown 열림, 선택된 tab |
| 여러 화면이 공유하는 UI 상태 | Zustand | 사용자별 표 표시 설정 |
| 앱 전체 Context | `app/providers` | QueryClient, Tooltip |

API 응답을 Zustand로 복사하지 않습니다. 서버 상태는 TanStack Query가 소유하고, Zustand에는 서버 캐시와 무관한 전역 UI 상태만 둡니다.

## 7. API와 Query 규칙

```text
Page / Widget
  → Query options
    → Entity API
      → requestJson
        → axiosClient
```

- 페이지, widget, feature에서 Axios를 직접 import하지 않습니다.
- Axios는 HTTP 전송, timeout, cookie, CSRF header, 오류 정규화를 담당합니다.
- TanStack Query는 캐시, 로딩·오류, 재조회와 무효화를 담당합니다.
- API 함수에는 Query가 제공한 `signal`을 전달합니다.
- 목록 필터와 페이지 정보는 query key에 포함합니다.
- query key 배열을 page에서 직접 만들지 않고 entity key factory를 사용합니다.
- 같은 GET 요청을 `useEffect`로 다시 구현하지 않습니다.
- API response는 mapper를 통과한 뒤 UI에 전달합니다.

Spring Security 세션 계약에 따라 `/me` bootstrap과 보호 route를 사용합니다. `/me`의 `401 AUTH-001`만 비로그인 상태로 해석하며, 네트워크 오류나 5xx를 로그인 redirect로 숨기지 않습니다. 업무 API의 `401 AUTH-001`은 공통 Axios 응답 경계에서 감지하고, 진행 중인 Query와 전체 서버 캐시를 정리한 뒤 현재 URL을 보존해 `/login`으로 이동합니다. 로그인과 `/me`의 `401`은 각 인증 화면이 직접 처리하며, `403`은 세션을 제거하지 않고 적용되는 page의 forbidden 상태로 표시합니다.

## 8. 페이지 상태 규칙

| 상황 | 기본 표현 |
| --- | --- |
| 최초 페이지 로딩 | `Skeleton` 또는 작은 `LottieLoader` |
| 목록 재조회 | 기존 데이터 유지, 필요한 영역만 진행 상태 표시 |
| 데이터 없음 | `StateView state="empty"` |
| 요청 실패 | `StateView state="error"`와 다시 시도 행동 |
| 권한 없음 | `StateView state="forbidden"` |
| mutation 결과 | `Alert` 또는 추후 공통 Toast |

로딩 상태 때문에 전체 layout이 크게 이동하지 않도록 실제 콘텐츠와 비슷한 크기의 Skeleton을 사용합니다. 배경 재조회에서는 기존 데이터를 지우지 않습니다.

## 9. URL 상태 규칙

다음 값은 사용자가 새로고침하거나 URL을 공유해도 유지돼야 하므로 search params로 관리합니다.

- 검색어
- 판매채널, 센터·점포, 카테고리, 위험등급
- 정렬 컬럼과 방향
- 페이지 번호와 페이지 크기

Dropdown 열림, tooltip, 임시 hover, 입력 중인 draft처럼 공유할 필요 없는 값은 URL에 넣지 않습니다. ZONE과 KAN은 UI 모델과 URL에 추가하지 않습니다.

## 10. UI와 디자인 규칙

- `shared/ui`와 Storybook을 먼저 확인한 뒤 새 컴포넌트를 만듭니다.
- Tailwind 임의 색상보다 `src/styles.css` semantic token을 우선합니다.
- `cn()`은 class 조합, `cva()`는 반복되는 의미 기반 variant에 사용합니다.
- 색이 있는 버튼은 흰색 글자, 흰색 버튼은 Gray 900 글자를 사용합니다.
- 위험 상태는 색상과 함께 텍스트와 Reicon 아이콘을 제공합니다.
- 아이콘 버튼에는 accessible label과 tooltip을 제공합니다.
- 테이블과 필터는 불투명 표면으로 유지하고 Mesh 효과를 남용하지 않습니다.
- 카드 안에 카드를 중첩하지 않습니다.
- 공통 UI를 추가하거나 variant를 바꾸면 Storybook을 함께 갱신합니다.

## 11. 완료 기준

기능은 화면이 한 번 표시되는 것만으로 완료되지 않습니다. 다음을 확인해야 합니다.

- 책임에 맞는 FSD 계층과 segment에 배치했습니다.
- loading, empty, error, forbidden 중 적용 가능한 상태를 처리했습니다.
- API를 연결했다면 Query/API/mapper 경계를 지켰습니다.
- 키보드 포커스, label, 색상 대비를 확인했습니다.
- 공통 컴포넌트 변경은 Storybook에 반영했습니다.
- 순수 도메인 규칙과 mapper에는 Vitest를 추가했습니다.
- 주요 사용자 흐름에는 Playwright를 추가하거나 검증 방법을 기록했습니다.
- 관련 문서와 환경변수 예시를 갱신했습니다.

실제 작업용 체크리스트는 [`docs/checklists/frontend-feature-checklist.md`](./checklists/frontend-feature-checklist.md)를 사용합니다.
