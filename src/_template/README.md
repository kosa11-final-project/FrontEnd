# 프론트엔드 구조 예시

이 폴더는 실제 기능 코드가 아니라 팀원이 구조를 빠르게 이해하기 위한 예시입니다.
현재 `entities`, `features`, `widgets`, `pages`에 작은 placeholder를 만들어 흐름만 보여주고 있습니다. placeholder 안에는 실제 API·서버 상태·페이지네이션 로직을 넣지 않습니다.

## 레이어 기준

```text
app       앱 전체 수명주기: Provider, Router, Layout
pages     URL에 대응하는 화면 조합
widgets   여러 기능을 묶은 업무 블록
features  사용자의 한 가지 행동
entities  도메인 데이터와 표현 규칙
shared    도메인을 모르는 공통 UI, API, 설정, 유틸리티
```

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
