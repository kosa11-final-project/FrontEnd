# 프론트엔드 구조 예시

이 폴더는 실제 기능 코드가 아니라 팀원이 구조를 빠르게 이해하기 위한 예시입니다.
현재 `entities`, `features`, `widgets`, `pages`에 작은 placeholder를 만들어 흐름만 보여주고 있습니다. placeholder 안에는 실제 API·서버 상태·페이지네이션 로직을 넣지 않습니다.

API, Query, mapper, URL 필터, widget과 page까지 이어지는 전체 복사 예시는 [`example-flow/README.md`](./example-flow/README.md)를 확인합니다.

## 레이어 기준

```text
app       앱 전체 수명주기: Provider, Router, Layout
pages     URL에 대응하는 화면 조합
widgets   여러 기능을 묶은 업무 블록
features  사용자의 한 가지 행동
entities  도메인 데이터와 표현 규칙
shared    도메인을 모르는 공통 UI, API, 설정, 유틸리티
```

앱 전체에 고정되는 사이드바와 헤더도 `app/layouts`에 모든 JSX를 넣지 않습니다.
라우터를 모르는 재사용 primitive는 `shared/ui/sidebar`에 두고, 실제 메뉴·사용자 정보·현재 경로 연결을 조합하는 앱 셸 widget은 `widgets/app-shell`에 둡니다. `app/layouts/AppLayout.jsx`는 이 widget과 `Outlet`만 배치합니다.

```text
app/layouts/AppLayout.jsx
  → widgets/app-shell/ui/AppSidebar.jsx
      → shared/ui/sidebar/Sidebar.jsx
      → widgets/app-shell/model/navigation.js
  → widgets/app-shell/ui/AppHeader.jsx
      → shared/ui/IconButton.jsx
```

이렇게 나누면 메뉴 항목 변경은 `widgets/app-shell/model/navigation.js`, 공통 사이드바 모양과 variant 변경은 `shared/ui/sidebar`, 실제 업무 셸 조합 변경은 `widgets/app-shell`에서 처리할 수 있습니다. `shared/ui`는 React Router나 특정 업무 도메인을 import하지 않습니다.

## 디자인 컴포넌트 사용 순서

1. 먼저 `shared/ui`에 이미 있는 `Button`, `IconButton`, `Avatar`, `StatusDot`, `Input`, `Select`, `Badge`, `Table`, `Tabs`, `Drawer`, `Tooltip`, `Sidebar`를 확인합니다.
2. 기존 컴포넌트로 표현할 수 있으면 `variant`, `size`, `tone`, `className` 조합만 사용합니다. 화면마다 같은 버튼 HTML과 CSS를 다시 만들지 않습니다.
3. 공통성이 확인된 새 primitive만 `shared/ui`에 추가합니다. 특정 재고·전략 의미가 들어가면 `entities`, 사용자 행동이 들어가면 `features`, 여러 조각을 조합하면 `widgets`에 둡니다.
4. 한 페이지에서만 필요한 배치는 `pages`에 두고, 전역 토큰과 reset은 `src/styles.css`의 `GLOBAL` 영역, 앱 셸은 `APP SHELL`, 페이지 골격은 `PAGE`, 업무 블록은 `WIDGET` 영역에 추가합니다.

렌더링 최적화는 무조건 `memo`를 붙이는 방식으로 하지 않습니다. `AppSidebar`처럼 props가 없고 라우터 context가 필요한 큰 조합 경계에만 memo를 사용하고, `NavLink`·입력·상태 컴포넌트는 실제 상태 변화가 있을 때만 갱신되도록 구성합니다. 상태와 데이터가 바뀌는 단위를 작게 유지하는 것이 우선입니다.

## 새 기능을 시작할 때

```text
src/
├─ entities/inventory/          # 재고 데이터와 표시 규칙
├─ features/inventory-filter/   # 재고 필터라는 사용자 행동
├─ widgets/inventory-table/     # 필터와 표를 조합한 업무 블록
└─ pages/inventory/             # /inventory 화면 조합
```

현재 만들어 둔 예시 흐름은 다음과 같습니다.

```text
pages/inventory/InventoryPage.jsx
  → widgets/inventory-table/InventoryTable.jsx
  → features/inventory-filter/InventoryFilterBar.jsx
  → entities/inventory/InventoryRiskBadge.jsx
  → shared/ui/Badge.jsx
```

재고 상세 Drawer와 동기화 행동, AI 전략·성과 widget도 같은 방식으로 빈 예시를 준비해두었습니다.

한 화면에서만 쓰는 코드는 먼저 해당 페이지에 둡니다. 두 화면에서 의미와 상태 규칙이 같을 때만 `entities`, `features`, `widgets`, `shared`로 승격합니다.

## 금지 규칙

- 페이지나 컴포넌트에서 Axios를 직접 import하지 않습니다.
- `shared/ui`가 특정 도메인이나 페이지를 알게 하지 않습니다.
- 세션 ID를 localStorage나 Zustand에 저장하지 않습니다.
- ZONE과 KAN을 새 UI 모델이나 URL 파라미터에 추가하지 않습니다.
