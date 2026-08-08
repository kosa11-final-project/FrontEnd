# 현대그린푸드 재고 운영 플랫폼 프론트엔드

현대그린푸드 다중 판매채널 재고 운영 플랫폼의 공통 프론트엔드 기반입니다. 현재 단계에서는 실제 API나 업무 기능을 연결하지 않고, 팀이 같은 구조로 개발할 수 있도록 앱 셸·라우터·통신 경계·디자인 토큰·재사용 UI를 준비합니다.

## 실행

```bash
pnpm install
pnpm dev
```

공통 UI 컴포넌트는 Storybook에서 독립적으로 확인합니다.

```bash
pnpm storybook
```

Storybook은 `src/shared/ui/stories`의 재사용 컴포넌트만 대상으로 하며, 실제 페이지·API·도메인 상태는 포함하지 않습니다. 디자인 토큰과 Pretendard는 앱과 같은 `src/styles.css`를 사용합니다.

Pretendard 타입 스케일과 Dashboard Filter Foundations 팔레트는 Storybook의 [`Foundations/Design tokens`](http://127.0.0.1:6006/?path=/docs/foundations-design-tokens--docs)에서 확인합니다. `Typography` story는 22px/20px/16px/14px/14px/12px/12px rem scale을 보여주고, `Interactive Theme` story는 Controls로 main·info·warning 색상을 바꿔 공통 컴포넌트 변화를 확인합니다.

기본 메뉴 경로:

- `/dashboard`: 대시보드
- `/inventory`: 통합 재고 관제
- `/ai-strategy`: AI 전략 수립
- `/execution`: AI 실행 전략 & 성과 관제
- `/statistics`: 통계

루트(`/`)는 `/inventory`로 이동합니다. 각 페이지는 초기 라우팅과 공통 화면 구조를 확인하는 준비 화면이며, 실제 데이터와 업무 기능은 이후 도메인 기능 단계에서 연결합니다.

## 확정 디자인 방향

- 스타일: **Mesh Forecast**
- 컬러 시스템: **Dashboard Filter Foundations**
- main `#27B06E`, sub-mint `#11C6AB`, sub-cyan `#00B0D7`, sub-orange `#FDA643`
- soft 컬러: sub-mint-soft `#DAF7E9`, sub-cyan-soft `#CFF4FC`, sub-orange-soft `#FFEC2C`
- gray scale: gray-900 `#282828`, gray-700 `#747474`, gray-500 `#8E8E8E`, gray-300 `#C1C1C1`, gray-200 `#DADADA`, gray-50 `#F4F4F4`
- 위험·주의·양호 상태는 sub-orange·sub-cyan·main 계열의 의미 기반 색상을 사용합니다.
- ZONE과 KAN은 UI 모델·필터·URL 파라미터에 포함하지 않습니다.
- 아이콘은 `reicon-react`만 사용합니다.

공통 색상·폰트·간격·모서리 토큰은 [`src/styles.css`](./src/styles.css)에 정의되어 있습니다. Mesh 스타일은 요약 표면과 배경에만 제한적으로 사용하고, 실제 데이터 표면은 불투명하게 유지합니다.

UI8 dashboard 레퍼런스와 팀용 AI 디자인 프롬프트는 [`docs/design-references/ui8-dashboard-style-reference.md`](./docs/design-references/ui8-dashboard-style-reference.md)에 정리되어 있습니다. 원본 이미지는 참고용 링크로만 유지하고, 제품 UI를 그대로 복제하지 않습니다.

Pretendard는 외부 CDN 요청 없이 사용할 수 있도록 공식 v1.3.9 가변 WOFF2 파일을 [`public/fonts/PretendardVariable.woff2`](./public/fonts/PretendardVariable.woff2)에 포함했습니다. `100–900` 굵기를 하나의 파일에서 제공하며, 출처와 라이선스는 [`public/fonts/README.md`](./public/fonts/README.md)에 기록합니다.

## 기술 기준

- React 19 + JavaScript + Vite
- Tailwind CSS + shadcn/ui 소스 소유 방식
- React Router DOM v7 Data Mode
- TanStack Query Provider
- Zustand
- TanStack Table
- React Hook Form + Zod
- Recharts
- Axios는 `src/shared/api`에서만 생성
- 세션 쿠키·CSRF 유틸리티와 DSN 기반 Sentry Error Boundary
- Playwright + Vitest

페이지·컴포넌트에서 Axios를 직접 import하지 않고, `requestJson` 또는 도메인 API 함수 경계를 사용합니다. 세션 ID는 저장소에 저장하지 않고 브라우저 쿠키가 관리합니다.

## 폴더 구조

```text
src/
├─ app/                 # Provider, Router, AppLayout
├─ pages/               # URL에 대응하는 화면 조합
├─ widgets/             # 여러 기능을 조합한 업무 블록 (앱 셸 widget 포함)
├─ features/            # 사용자 행동 (예시 scaffold 포함)
├─ entities/            # 도메인 데이터와 표현 규칙 (예시 scaffold 포함)
├─ shared/              # UI, HTTP, config, lib
└─ _template/           # 팀원이 참고하는 FSD 예시
```

FSD 예시와 승격 기준은 [`src/_template/README.md`](./src/_template/README.md)에서 확인합니다. 한 화면에서만 쓰는 코드는 먼저 해당 페이지에 두고, 두 화면에서 의미와 상태 규칙이 같을 때 상위 레이어로 올립니다.

사이드바와 헤더는 `app/layouts`에 직접 구현하지 않습니다. 라우터를 모르는 shadcn 스타일 primitive는 `src/shared/ui/sidebar`, 메뉴와 사용자 정보처럼 앱 셸에 결합된 조합은 `src/widgets/app-shell`에 둡니다. `AppLayout`은 이 shell widget을 배치하는 역할만 맡습니다.

## 공통 UI

`src/shared/ui`는 도메인을 모르는 컴포넌트를 보관합니다.

- Button, IconButton
- Card compound primitive, MetricCard, DetailLayout
- Avatar, StatusDot
- Input, Select
- Badge, Tooltip, Tabs
- Table shell, reusable TanStack `DataTable`, Drawer
- Icon

재고 위험등급, LOT, 소비기한처럼 도메인 의미가 필요한 컴포넌트는 실제 재고 기능을 시작할 때 `entities/inventory`에 둡니다.

재고 범위 카드, 4단계 상태 badge, LOT 재고 행은 [`src/entities/inventory/ui`](./src/entities/inventory/ui)에 도메인 컴포넌트로 준비되어 있습니다. 공통 껍데기는 `shared/ui/Card`, 수치 요약은 `shared/ui/MetricCard`, 좌측 정보·우측 본문 구조는 `shared/ui/DetailLayout`을 조합합니다.

공통 UI의 시각적 계약과 상태 예시는 [`src/shared/ui/stories`](./src/shared/ui/stories)에 둡니다. 새 공통 컴포넌트를 추가할 때는 기본·variant·disabled·오류·긴 텍스트처럼 실제로 팀원이 확인해야 하는 상태만 story로 추가합니다.

## 스타일 조합 규칙

- `cn()`은 조건부 className 조합과 Tailwind 클래스 충돌 정리에 사용합니다.
- `cva()`는 Button, Badge, Input, Select, Tabs, Drawer처럼 의미 있는 variant가 있는 공통 컴포넌트에 사용합니다.
- 색상과 글꼴을 컴포넌트에 직접 하드코딩하지 않고 `src/styles.css`의 semantic token을 사용합니다.
- 전역 UI 폰트는 Pretendard 하나로 통일합니다.
- 페이지 전용 레이아웃에는 variant를 만들지 않고 일반 className을 사용합니다.
- 타이포그래피 크기는 `rem`, 줄 높이는 unitless token으로 관리합니다.

현재 공통 UI의 variant 함수는 각 컴포넌트에서 export되어 있어, 나중에 조합 컴포넌트가 같은 스타일 계약을 재사용할 수 있습니다.

## 초기 세팅 범위

현재 포함:

- 앱 셸과 사이드바 기반 라우팅
- 전역 Dashboard Filter Foundations 디자인 토큰
- Pretendard typography scale과 Storybook 토큰 미리보기
- Mesh Forecast 표면 규칙
- Axios 공통 통신 경계
- 세션 쿠키·CSRF 처리 유틸리티
- DSN이 있을 때만 활성화되는 Sentry 초기화와 Error Boundary
- 공통 UI 프리미티브
- TanStack Table 기반 재사용 `DataTable`과 전략·성과·재고 표 예시
- Storybook 기반 공통 UI 상태 문서
- 팀용 폴더 구조 예시

현재 제외:

- Spring Boot API 연결
- 실제 재고 조회와 페이지네이션
- 도메인 API에 연결된 TanStack Table 컬럼·query hook
- 로그인 화면과 서버 세션 연결
- 배포 설정
- 린트·포맷 자동화
