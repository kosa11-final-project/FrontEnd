# 현대그린푸드 재고 운영 플랫폼 프론트엔드

현대그린푸드 다중 판매채널 재고 운영 플랫폼의 공통 프론트엔드 기반입니다. 현재 단계에서는 실제 API나 업무 기능을 연결하지 않고, 팀이 같은 구조로 개발할 수 있도록 앱 셸·라우터·통신 경계·디자인 토큰·재사용 UI를 준비합니다.

## 실행

```bash
pnpm install
pnpm dev
```

기본 메뉴 경로:

- `/dashboard`: 대시보드
- `/inventory`: 통합 재고 관제
- `/ai-strategy`: AI 전략 수립
- `/execution`: AI 실행 전략 & 성과 관제
- `/statistics`: 통계

루트(`/`)는 `/inventory`로 이동합니다. 각 페이지는 초기 라우팅과 공통 화면 구조를 확인하는 준비 화면이며, 실제 데이터와 업무 기능은 이후 도메인 기능 단계에서 연결합니다.

## 확정 디자인 방향

- 스타일: **Mesh Forecast**
- 메인 컬러: **Olive Green**
- 위험·주의·양호 상태는 올리브 색상과 분리된 의미 기반 색상을 사용합니다.
- ZONE과 KAN은 UI 모델·필터·URL 파라미터에 포함하지 않습니다.
- 아이콘은 `reicon-react`만 사용합니다.

공통 색상·폰트·간격·모서리 토큰은 [`src/styles.css`](./src/styles.css)에 정의되어 있습니다. Mesh 스타일은 요약 표면과 배경에만 제한적으로 사용하고, 실제 데이터 표면은 불투명하게 유지합니다.

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
├─ widgets/             # 여러 기능을 조합한 업무 블록 (예시 scaffold 포함)
├─ features/            # 사용자 행동 (예시 scaffold 포함)
├─ entities/            # 도메인 데이터와 표현 규칙 (예시 scaffold 포함)
├─ shared/              # UI, HTTP, config, lib
└─ _template/           # 팀원이 참고하는 FSD 예시
```

FSD 예시와 승격 기준은 [`src/_template/README.md`](./src/_template/README.md)에서 확인합니다. 한 화면에서만 쓰는 코드는 먼저 해당 페이지에 두고, 두 화면에서 의미와 상태 규칙이 같을 때 상위 레이어로 올립니다.

## 공통 UI

`src/shared/ui`는 도메인을 모르는 컴포넌트를 보관합니다.

- Button, IconButton
- Input, Select
- Badge, Tooltip, Tabs
- Table shell, Drawer
- Icon

재고 위험등급, LOT, 소비기한처럼 도메인 의미가 필요한 컴포넌트는 실제 재고 기능을 시작할 때 `entities/inventory`에 둡니다.

## 초기 세팅 범위

현재 포함:

- 앱 셸과 사이드바 기반 라우팅
- 전역 Olive Green 디자인 토큰
- Mesh Forecast 표면 규칙
- Axios 공통 통신 경계
- 세션 쿠키·CSRF 처리 유틸리티
- DSN이 있을 때만 활성화되는 Sentry 초기화와 Error Boundary
- 공통 UI 프리미티브
- 팀용 폴더 구조 예시

현재 제외:

- Spring Boot API 연결
- 실제 재고 조회와 페이지네이션
- TanStack Table 컬럼·query hook
- 로그인 화면과 서버 세션 연결
- 배포 설정
- 린트·포맷 자동화
