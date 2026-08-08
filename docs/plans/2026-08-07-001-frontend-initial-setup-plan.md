# 현대그린푸드 재고 운영 플랫폼 프론트엔드 초기세팅 계획

상태: 초안
작성일: 2026-08-07
기준 화면: 통합 재고 관제
대상 폴더: `FrontEnd`

## 1. 목표와 결정 원칙

### 목표

- 현대그린푸드 다중 판매채널 재고 운영 플랫폼의 전체 기능 개발을 위한 프론트엔드 기반을 만든다.
- 첫 기준 화면은 통합 재고 관제로 두고, 이후 재고 상세·AI 전략·실행 전략·통계로 확장한다.
- 최종 기능 구현 전에 디자인 토큰, 재사용 컴포넌트, API 통신 규칙, 폴더 구조, 테스트 규칙을 고정한다.
- 4명의 풀스택 팀원이 도메인 단위로 병렬 개발할 수 있게 한다.

### 기본 원칙

- React와 JavaScript를 고정한다.
- 페이지 단위로 코드를 복사하지 않고, 반복되는 업무 동작과 도메인 책임을 기준으로 재사용한다.
- 화면의 출처는 디자인 초안이 아니라 코드 기반 디자인 토큰과 컴포넌트다.
- 서버 상태와 클라이언트 UI 상태를 분리한다.
- 프론트엔드는 Spring Boot와 별도 폴더에서 관리하고 별도 배포한다.
- ZONE과 KAN은 UI 모델, 필터, 테이블, URL 파라미터에 포함하지 않는다.
- 현재고와 가용수량, 소비기한 잔여일과 재고일수를 서로 다른 지표로 유지한다.

## 2. 현재 상태와 디자인 기준

### 현재 저장소 상태

- Vite + React 기반의 앱 셸과 사이드바 기준 기본 라우트가 있다.
- 확정 디자인은 Mesh Forecast 스타일과 Dashboard Filter Foundations 전역 토큰을 사용한다.
- Reicon 아이콘을 사용한다.
- 실제 서버 API와 React Hook Form은 아직 화면에 연결하지 않았다. TanStack Table은 도메인 API와 분리된 재사용 `DataTable`과 전략·성과·재고 Storybook 예시까지 준비했다. React Router v7과 TanStack Query Provider는 초기 라우트와 앱 셸에 연결했다.
- `/dashboard`, `/inventory`, `/ai-strategy`, `/execution`, `/statistics`는 라우팅과 공통 페이지 셸만 연결한다.
- Playwright에는 루트 리다이렉트와 사이드바 이동을 확인하는 기본 테스트가 있다.
- Storybook은 `src/shared/ui`의 공통 컴포넌트 상태 문서에만 사용한다. 별도 디자인 갤러리나 전체 페이지 story는 만들지 않는다.

### 디자인 방향 운영 규칙

- 운영 코드에는 Mesh Forecast와 Dashboard Filter Foundations 컬러 토큰만 유지한다.
- 메시는 배경과 요약 표면에 제한적으로 적용하고 데이터 표면은 불투명하게 유지한다.
- 위험·주의·양호 색상은 상태 의미를 위해 별도 semantic token으로 유지한다.
- 디자인 초안 비교용 페이지와 과거 테마는 운영 라우트와 CSS에서 제거한다.

## 3. 디자인 시스템 기준

### 3.1 색상

기본 팔레트는 Dashboard Filter Foundations의 main/sub/soft 컬러와 중성 gray scale을 중심으로 한다.

```text
main:             #27B06E
sub-mint:         #11C6AB
sub-cyan:         #00B0D7
sub-orange:       #FDA643
sub-mint-soft:    #DAF7E9
sub-cyan-soft:    #CFF4FC
sub-orange-soft:  #FFEC2C
gray-900:         #282828
gray-700:         #747474
gray-500:         #8E8E8E
gray-300:         #C1C1C1
gray-200:         #DADADA
gray-50:          #F4F4F4
```

- 색상은 장식보다 의미와 상호작용에 사용한다.
- 위험등급은 색상만으로 표현하지 않고 Reicon 아이콘과 텍스트를 함께 제공한다.
- 작은 텍스트는 WCAG AA 4.5:1 이상, UI 경계와 아이콘은 3:1 이상을 목표로 한다.
- 초안별 색상은 `data-theme` 또는 theme class로만 변경하고 컴포넌트 내부에서 임의 색상을 만들지 않는다.
- 다크 초안은 탐색용으로 유지하되, 최종 운영 화면은 밝은 작업 표면을 기본값으로 검토한다.

### 3.2 폰트

- 한국어 우선 폰트는 프로젝트에 포함한 로컬 `Pretendard`를 사용하고, 로드 실패 시에만 `sans-serif`로 대체한다.
- 외부 폰트 CDN은 초기세팅에서 사용하지 않는다.
- 일반 본문과 표는 한 가지 산세리프 계열을 사용한다.
- 폰트 굵기는 일반과 강조를 우선 사용하고, 100·200·300 같은 얇은 굵기는 사용하지 않는다.
- 순수 검정 대신 짙은 중성 텍스트를 사용한다.
- 영문 메타데이터와 단품코드·LOT은 가독성을 위해 모노스페이스 보조 폰트를 사용할 수 있다.

### 3.3 간격과 레이아웃

기본 간격 단위는 4px 기반으로 한다.

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

- 페이지 기본 여백: 24~40px
- 사이드바 폭: 224~248px
- 상단 헤더 높이: 64~72px
- 버튼 높이: 32px 또는 40px
- 입력 높이: 36~40px
- 기본 테이블 행 높이: 56~68px
- 관련 요소는 가까이, 다른 그룹은 16px 이상으로 분리한다.
- 테이블과 필터가 주 콘텐츠이므로 카드 수를 최소화한다.
- 1440px 데스크톱을 우선하고, 작은 화면에서는 테이블 내부 가로 스크롤을 허용한다.

### 3.4 모서리·테두리·그림자

- 기본 모서리는 4px, 6px, 8px 범위에서 일관되게 사용한다.
- 초안에서 12~16px 모서리를 사용할 수 있지만, 최종 운영 화면은 과한 라운딩을 피한다.
- 그룹화가 목적이면 그림자보다 여백과 구분선을 우선한다.
- 그림자는 흰색 작업 표면과 배경의 계층이 실제로 필요할 때만 사용한다.
- 입력·버튼·필터·테이블의 테두리 색은 동일한 토큰을 사용한다.

### 3.5 상태와 접근성

모든 공통 컴포넌트는 다음 상태를 정의한다.

- 기본
- hover
- active
- focus-visible
- disabled
- loading
- error
- empty

운영 화면 필수 상태:

- 데이터 로딩
- 검색 결과 없음
- 전체 데이터 없음
- 네트워크 오류
- 서버 오류
- 세션 만료
- 권한 없음
- 동기화 중
- 동기화 실패

## 4. 기술 스택

### 고정 또는 기본 채택

- 언어: JavaScript, JSX, HTML/CSS
- UI: React 19
- 빌드: Vite
- 패키지 매니저: pnpm
- 스타일: Tailwind CSS
- UI 프리미티브: shadcn/ui + Radix 기반 컴포넌트
- 서버 상태: TanStack Query
- 클라이언트 UI 상태: Zustand
- 라우팅: React Router DOM v7 Data Mode
- 테이블: TanStack Table
- 폼: React Hook Form + Zod
- 차트: Recharts
- 아이콘: `reicon-react`만 사용
- E2E: Playwright
- 단위 테스트: Vitest
- 공통 UI 문서: Storybook + React Vite
- 네트워크 모킹: MSW 추가 검토 후 채택
- 오류 추적: `@sentry/react`를 초기 앱 셸 단계에서 최소 설정

### HTTP 클라이언트 결정

백엔드는 별도 폴더에서 관리하고 별도 배포하며, Spring Security 세션 방식으로 로그인한다. 이 구조에서는 브라우저 세션 쿠키, 별도 origin, CORS, CSRF를 함께 처리해야 한다.

초기 세팅부터 **Axios 하나로 통일**한다.

- Axios 인스턴스는 `shared/api`에서만 생성한다.
- 도메인 API는 `requestJson` 어댑터를 통해 호출한다.
- 세션 쿠키, CSRF 헤더, timeout, 오류 변환은 Axios 인스턴스와 어댑터에서 중앙화한다.
- 재시도와 캐시는 TanStack Query가 담당한다.

HTTP 클라이언트와 FSD 경계는 `2026-08-07-003-http-client-and-fsd-boundaries.md`에 기록한다.

## 5. 별도 배포·세션 인증 통신 설계

### 5.1 출처와 환경

```text
개발 프론트: http://localhost:5173
개발 API:    http://localhost:8080
운영 프론트: VITE_APP_ORIGIN
운영 API:    VITE_API_BASE_URL
```

- 프론트와 API는 서로 다른 origin으로 동작하는 것을 기본으로 한다.
- `VITE_API_BASE_URL`로 API 주소를 주입한다.
- 개발에서는 Vite proxy를 선택적으로 사용해 로컬 CORS를 줄일 수 있다.
- 운영 배포가 별도 도메인이면 백엔드 CORS allowlist에 프론트 origin을 명시한다.
- `Access-Control-Allow-Origin: *`와 credentials 조합은 사용하지 않는다.

### 5.2 세션 쿠키

- 세션 ID를 `localStorage`, `sessionStorage`, Zustand에 저장하지 않는다.
- 브라우저 쿠키가 세션을 관리한다.
- Axios 인스턴스에 `withCredentials: true`를 적용한다.
- 백엔드는 credentials를 허용한 명시적 origin을 설정한다.
- 쿠키의 `Secure`, `HttpOnly`, `SameSite`, `Domain`은 배포 도메인 관계에 맞춰 확정한다.
- 서로 다른 사이트 간 쿠키가 필요하면 `SameSite=None; Secure` 여부를 백엔드와 확정한다.

### 5.3 CSRF

- 세션 인증을 사용하므로 상태 변경 요청에 CSRF 방어를 유지한다.
- 로그인, 로그아웃, 동기화, 전략 저장, 전략 공유, 실행 승인 요청을 CSRF 대상에 포함한다.
- Spring Security가 발급하는 CSRF 토큰의 쿠키 이름과 헤더 이름을 백엔드 계약으로 확정한다.
- Axios 요청 인터셉터는 GET 계열을 제외한 요청에 CSRF 헤더를 추가한다.
- CSRF 토큰을 인증 토큰처럼 localStorage에 저장하지 않는다.

### 5.4 인증·권한 응답

- `401`: 세션 만료 또는 로그인 필요. 로그인 경로로 이동하거나 세션 만료 안내를 표시한다.
- `403`: 로그인은 되었지만 해당 기능 또는 데이터 범위 권한이 없음. 권한 없음 상태를 표시한다.
- 세션 사용자 정보는 `/api/v1/me` 계열 API로 확인하고 UI 권한만 파생한다.
- 프론트에서 권한을 보안 경계로 사용하지 않는다. 실제 인가는 Spring Security가 담당한다.

## 6. API 계층과 계약

### 6.1 계층 규칙

```text
shared/api adapter (Axios)
  ↓
도메인별 API 함수
  ↓
TanStack Query queryFn/mutationFn
  ↓
페이지·위젯·기능 컴포넌트
```

- 컴포넌트와 페이지에서 Axios를 직접 호출하지 않는다.
- API 함수는 요청 파라미터와 응답 변환만 담당한다.
- TanStack Query는 캐시, 로딩, 오류, 재조회, 재시도를 담당한다.
- API 응답의 서버 필드명과 UI 도메인 필드명을 adapter에서 분리한다.

### 6.2 제안 API 경로

백엔드 팀과 확정하기 전까지의 프론트 계약 초안이다.

```text
GET  /api/v1/me
GET  /api/v1/inventories
GET  /api/v1/inventories/{inventoryId}
GET  /api/v1/inventories/{inventoryId}/lots
GET  /api/v1/inventories/{inventoryId}/risk-analysis
POST /api/v1/inventories/sync
GET  /api/v1/inventories/{inventoryId}/strategies
```

### 6.3 목록 조회 규칙

- UI 페이지 번호는 1부터 시작한다.
- Spring Data 요청으로 변환할 때 adapter에서 API page 번호 정책을 처리한다.
- 기본 page size는 50, 선택값은 25·50·100으로 한다.
- 필터·정렬·페이지는 URL search params와 동기화한다.
- 서버에서 전체 재고를 한 번에 내려받지 않는다.
- 목록 응답은 `content`, `page`, `size`, `totalElements`, `totalPages`를 프론트 표준 페이지 응답으로 정규화한다.

### 6.4 재고 목록 조회 파라미터

```text
page
size
sort
keyword
scope
centerIds
storeIds
salesChannelIds
categoryIds
riskGrades
expiryRemainingDaysFrom
expiryRemainingDaysTo
inventoryDaysFrom
inventoryDaysTo
```

ZONE과 KAN은 요청 파라미터, 응답 adapter, 화면 필터에 포함하지 않는다.

### 6.5 프론트 표준 오류

API 서버의 오류 형식이 확정되기 전까지 다음 형태로 adapter가 정규화한다.

```js
{
  status,
  code,
  message,
  traceId,
  fieldErrors,
  raw
}
```

- 사용자에게 보여줄 `message`와 개발자용 `raw`를 분리한다.
- trace ID는 오류 화면과 운영 문의에 사용할 수 있게 보존한다.
- 재고·판매·원가 데이터와 세션 쿠키는 콘솔·Sentry에 원문으로 기록하지 않는다.

## 7. FSD-lite 폴더 구조

```text
src/
  app/
    providers/
      AppProviders.jsx
      AppProviders.jsx
      SentryBoundary.jsx
    router/
      router.jsx
    styles/
      tokens.css
      globals.css
  pages/
    dashboard/
    inventory/
    ai-strategy/
    execution/
    statistics/
  widgets/
      sidebar/
    top-header/
    inventory-summary/
    inventory-table/
    inventory-detail-drawer/
  features/
    inventory-filter/
    inventory-sync/
    inventory-open-detail/
    strategy-create/
    strategy-save/
  entities/
    inventory/
      api/
        inventoryApi.js
        inventoryKeys.js
      model/
        inventorySchema.js
        inventoryMappers.js
      lib/
        inventoryFormatters.js
      ui/
        RiskBadge.jsx
        InventoryIdentity.jsx
  shared/
    api/
      apiClient.js
      apiError.js
      csrf.js
    config/
      env.js
    lib/
      queryString.js
      date.js
      number.js
    ui/
      Button/
      Input/
      Select/
      Tabs/
      Tooltip/
      Sheet/
      Table/
      Pagination/
      Badge/
      EmptyState/
      LoadingState/
      ErrorState/
    icons/
      Reicon.jsx
```

### FSD 규칙

- `app`: 앱 조립, provider, 라우터, 전역 스타일만 둔다.
- `pages`: URL 단위 화면을 조립한다. 비즈니스 로직을 직접 소유하지 않는다.
- `widgets`: 테이블·사이드바·요약 스트립처럼 여러 기능을 묶는 화면 블록이다.
- `features`: 사용자의 행동을 소유한다. 필터 적용, 동기화, 상세 열기, 전략 저장 등이 해당한다.
- `entities`: 재고·전략·판매채널의 도메인 모델, API adapter, 포맷터를 소유한다.
- `shared`: 도메인 이름을 모르는 UI·API·유틸리티만 둔다.
- 같은 코드가 한 페이지에서만 사용되면 페이지 내부에 둔다. 두 번째 재사용 시 올린다.
- 상위 계층이 하위 계층을 호출하며, 하위 계층이 상위 계층을 import하지 않는다.
- 4명 모두 풀스택으로 참여하므로 레이어별 담당보다 도메인 수직 슬라이스 담당을 우선한다.

## 8. 재사용 컴포넌트 계획

### 공통 UI

- Button: primary, secondary, ghost, danger, loading
- IconButton: 툴팁, accessible label, focus 상태
- Input: 검색, 오류, disabled, clear
- Select: 단일·다중 선택 확장 가능 구조
- Tabs: URL 또는 화면 상태와 연결
- Tooltip: 위험등급 판단 기준 설명
- Table: 헤더, 정렬, 선택, 스크롤, 빈 상태 슬롯
- Pagination: 서버 페이지·page size·disabled 상태
- Sheet/Drawer: 상세 빠른 확인
- Badge/RiskBadge: 텍스트와 Reicon 조합
- Skeleton/EmptyState/ErrorState/PermissionDenied

### 재고 기능

- `InventorySummary`: 현재고·판매 가능·부족·과잉
- `InventoryFilterForm`: React Hook Form + Zod + URL search params
- `InventoryTable`: TanStack Table column definition과 서버 pagination
- `InventoryDetailDrawer`: 빠른 확인 전용
- `InventoryDetailPage`: LOT, 위험분석, 전략 이력
- `InventorySyncButton`: 동기화 상태와 재조회

### 아이콘 규칙

- `reicon-react`만 사용한다.
- 아이콘 이름을 화면 코드에 직접 흩뿌리지 않고 `shared/icons/Reicon.jsx` 또는 의미별 export로 감싼다.
- 기본 weight는 Outline, 선택·강조 상태만 Filled를 검토한다.
- 모든 아이콘 버튼에는 accessible name과 툴팁을 제공한다.
- 직접 SVG path를 작성하지 않는다.

## 9. 상태 관리와 데이터 흐름

### 서버 상태: TanStack Query

- 재고 목록·상세·LOT·위험분석·전략 이력은 TanStack Query로 관리한다.
- query key는 도메인별 factory로 관리한다.
- URL 필터가 query key의 일부가 된다.
- 목록은 stale time과 refetch 정책을 업무 동기화 요구에 맞춰 설정한다.
- 조회 오류는 화면 상태로 렌더링하고, 무분별한 자동 재시도를 하지 않는다.

재시도 기본값:

- `408`, `429`, `5xx`: 제한된 지수 백오프
- `400`, `401`, `403`, `404`, `422`: 자동 재시도 금지
- 동기화·전략 저장·공유 같은 mutation: 기본 자동 재시도 금지
- 멱등성이 확실한 mutation만 별도 승인 후 재시도

### 클라이언트 상태: Zustand

Zustand에는 다음 UI 상태만 저장한다.

- 사이드바 접힘 여부
- 상세 Drawer 열림 여부
- 테이블 밀도와 사용자 보기 설정
- 임시 UI 알림

다음은 Zustand에 저장하지 않는다.

- 세션 쿠키
- 인증 토큰
- 재고 목록 서버 데이터
- URL로 복원할 수 있는 필터 값

### URL 상태

- 페이지, page size, 검색어, 필터, 정렬은 URL search params가 기준이다.
- 새로고침·뒤로 가기·링크 공유에서 동일 상태를 복원한다.
- Drawer의 주소 노출 여부는 상세 페이지 이동과 충돌하지 않도록 결정한다. 기본은 Drawer는 로컬 상태, 전체 상세는 URL 이동이다.

## 10. 초기 구현 순서

### 0단계: 기준 확정

- Mesh Forecast + Dashboard Filter Foundations 컬러 방향 확정
- 백엔드와 세션 쿠키·CSRF·CORS 계약 확정
- API base URL과 환경 변수 이름 확정
- 이 문서를 기준으로 팀 작업 방식 공유

### 1단계: 앱 기반

- 실제 라이브러리 설치 및 버전 고정
- React Hook Form, `@hookform/resolvers`, Zod는 설치만 유지하고 실제 입력 폼이 생길 때 기능 단위로 적용
- Vitest는 `src/**/*.test.{js,jsx}`만 단위 테스트로 수집하고 Playwright 파일과 분리
- 공통 컴포넌트와 토큰 기준은 `README.md`와 `src/_template/README.md`에 둔다
- Vite 환경 변수 로더와 개발 proxy 설정
- React Router 기본 route 구성
- QueryClientProvider, RouterProvider, Error Boundary 구성
- Sentry 환경별 초기화와 민감정보 scrubber 구성
- Tailwind와 디자인 토큰 파일 분리

### 2단계: 공통 디자인 시스템

- Button, IconButton, Input, Select, Tooltip, Tabs, Sheet, Table, Pagination 구현
- Reicon wrapper 구현
- 기본·hover·focus·disabled·loading 상태 검증
- 최종 선택 초안의 색상·폰트·간격·모서리·그림자 토큰 적용
- Mesh Forecast와 Dashboard Filter Foundations를 전역 기본 토큰으로 유지

### 3단계: API와 세션

- Axios instance와 credentials 설정
- CORS와 CSRF 계약에 따른 request/response interceptor 구성
- `ApiError` 정규화
- `/api/v1/me`로 세션·권한 확인
- 401·403·네트워크·서버 오류 상태 연결
- MSW로 목록·상세·오류·세션 만료 응답 구성

### 4단계: 통합 재고 관제

- Inventory entity schema와 API mapper 구현
- URL 기반 필터 폼 구현
- TanStack Table 서버 페이지네이션 구현
- 현재고·가용수량·소비기한·재고일수·위험등급 컬럼 구현
- 행 클릭 상세 이동과 빠른 확인 Drawer 구현
- loading·empty·error·permission denied 상태 구현

### 5단계: 재고 상세

- `/inventory/:inventoryId` route 구현
- LOT 재고 탭
- 수요예측·위험분석 탭
- Recharts 기반 그래프
- 전략 이력 탭
- AI 전략 수립 진입 액션

### 6단계: 품질과 운영

- Vitest로 mapper·formatter·query string·위험등급 표시 규칙 테스트
- Playwright로 로그인 상태·목록·필터·페이지네이션·Drawer·상세 이동 테스트
- 1440px·1280px·1024px·모바일 축소 상태 확인
- 키보드 탐색과 focus-visible 확인
- Sentry 이벤트에서 세션·재고 민감정보가 제거되는지 확인
- API 오류의 trace ID가 사용자 지원 흐름에 노출되는지 확인

## 11. 테스트와 완료 기준

### 단위 테스트

- 재고 응답을 `InventoryRecord`로 변환
- 현재고와 가용수량 표시 포맷
- 소비기한 잔여일과 재고일수 분리
- 위험등급별 아이콘·텍스트 매핑
- URL 필터 변환과 기본값
- API 오류 정규화

### E2E 테스트

- 세션 로그인 성공
- 세션 만료 시 로그인 안내
- 권한 없음 화면
- 전체·온라인·오프라인 전환
- 상품명·단품코드·SKU·LOT 검색
- 센터·점포·판매채널·위험등급 필터
- 서버 페이지 이동과 page size 변경
- 행 클릭 상세 이동
- Drawer 열기·닫기
- 동기화 중·성공·실패
- 재고 상세 탭 전환

### 완료 기준

- 컴포넌트에서 Axios를 직접 호출하지 않는다.
- URL 새로고침 후 필터와 페이지 상태가 복원된다.
- 서버 페이지네이션으로 전체 재고를 한 번에 받지 않는다.
- ZONE과 KAN이 화면·URL·프론트 모델에 없다.
- 위험등급은 색상·아이콘·텍스트를 함께 사용한다.
- 401·403·빈 상태·로딩·오류 상태가 모두 화면에 있다.
- 키보드 focus와 WCAG 대비 기준을 통과한다.
- `pnpm build`, Vitest, Playwright가 통과한다.
- Sentry에 인증·재고·판매·원가 데이터가 원문으로 전송되지 않는다.

## 12. 팀 작업 방식

4명이 모두 풀스택으로 참여하므로 다음 수직 슬라이스를 추천한다.

- 담당 A: 재고 목록·필터·Spring Boot inventory API
- 담당 B: 재고 상세·LOT·위험분석·Recharts
- 담당 C: AI 전략 수립·전략 이력·저장/공유
- 담당 D: 실행 전략·성과 관제·통계·권한 연동

공통 디자인 토큰·`shared/ui`·`shared/api`는 변경 전에 짧은 팀 리뷰를 거친다. 각 담당자는 백엔드 API 계약, 프론트 entities/features, E2E 시나리오를 함께 소유한다.

## 13. 백엔드 팀과 추가 확정이 필요한 항목

아래 항목은 프론트 코드만으로 확정할 수 없으므로 Spring Boot 팀과 먼저 합의한다.

- 개발·운영 프론트 origin
- API base URL과 버전 prefix
- 세션 쿠키 이름·Domain·Secure·SameSite
- CORS 허용 origin과 credentials 정책
- CSRF 토큰 쿠키 이름과 요청 헤더 이름
- 로그인·로그아웃·현재 사용자 API 경로
- 401·403 응답 JSON 형식
- Spring Boot 표준 오류 응답 필드
- 페이지 번호가 0부터인지 1부터인지
- 정렬 파라미터 형식
- 센터·점포·판매채널·카테고리 마스터 API
- 동기화 API의 멱등성·진행 상태·실패 응답
- 재고 상세에서 사용할 위험분석·전략 이력 API

이 항목이 확정되면 `shared/api`, `entities/inventory/api`, `app/providers`를 구현하고 나머지 화면을 수직 슬라이스로 진행한다.
