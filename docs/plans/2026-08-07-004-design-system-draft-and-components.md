# 디자인 초안과 운영 UI 디자인 시스템 (보관 문서)

> 보관 문서입니다. Mesh Forecast + Olive Green 확정 후 `/design-drafts`, `/design-system`, `/reference-drafts`와 과거 테마는 운영 코드에서 제거했습니다. 현재 기준은 `README.md`, `src/styles.css`, `src/_template/README.md`, `docs/plans/2026-08-07-006-design-direction-decision.md`입니다.

## 목적

이 문서는 최종 디자인을 바로 확정하기 전에 10개 운영 화면 초안을 같은 기능 기준으로 비교하고, 선택된 초안을 제품 디자인 시스템으로 승격하기 위한 기준이다.

- Storybook은 사용하지 않는다.
- `/design-system` 라우트에서 공통 컴포넌트 상태를 확인한다.
- `/`와 `/design-drafts`에서 10개 화면 방향을 비교한다.
- `/reference-drafts`에서 마지막 레퍼런스의 정보 구조를 유지한 4개 스킨을 비교한다.
- 실제 Spring Boot API나 재고 mutation은 이 단계에 포함하지 않는다.

## 현재 초안 비교 기준

모든 초안은 다음 기능 구조를 공유한다.

- 고정 사이드바
- 운영 관제 헤더
- 전체·온라인·오프라인 범위 탭
- 현재고·판매 가능·부족·과잉 지표
- 검색과 센터·점포·위험등급 필터
- 서버 페이지네이션을 가정한 재고 테이블
- 행 클릭 상세 Drawer
- 위험·주의·양호 배지와 기준 툴팁

초안마다 바뀌는 것은 색상, 표면, 타이포그래피, 정보 밀도, 모서리, 선, 그림자, 강조 방식이다. 기능과 데이터는 바꾸지 않아 시각 방향만 비교한다.

## 레퍼런스 스킨

`reference-drafts`는 마지막 첨부 화면의 구성 순서를 공통으로 유지한다.

```text
아이콘 레일
→ 상단 채널·사용자 헤더
→ 재고 네트워크 제목 영역
→ 전체·물류센터·오프라인 매장 요약
→ 다중 필터
→ 판매 채널·재고 위치별 운영재고 테이블
```

첫 네 개 레퍼런스의 분위기는 semantic token과 skin class만 교체한다.

```text
reference-organic
reference-agency
reference-solar
reference-performance
```

행 데이터, 필터, 상세 Drawer, 위험등급 툴팁은 네 스킨에서 동일하게 유지해 팀이 스타일만 비교할 수 있게 한다.

## 디자인 토큰

공통 컴포넌트는 테마의 구체적인 색상값이 아니라 semantic token을 사용한다.

```text
--background
--foreground
--card
--surface-subtle
--primary
--primary-strong
--primary-soft
--primary-foreground
--muted-foreground
--border
--border-strong
--input
--ring
--ring-soft
--good
--good-soft
--warning
--warning-soft
--danger
--danger-soft
--tooltip-bg
--tooltip-fg
```

### 간격

```text
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
```

### 모서리

```text
--radius-control: 6px
--radius-panel: 8px
--radius-pill: 999px
```

업무용 화면에서는 패널을 과도하게 둥글게 만들지 않는다. 초안 중 일부는 비교를 위해 변형하지만, 최종 선택 후에는 운영 밀도와 클릭 영역을 기준으로 다시 확정한다.

### 상태

모든 interactive component는 다음 상태를 검토한다.

```text
default
hover
active
focus-visible
disabled
loading
error
selected
readonly
```

## 공통 UI와 도메인 UI 경계

### `shared/ui`

도메인 이름을 모르는 컴포넌트다.

```text
Button
IconButton
Input
Select
Badge
Tooltip
Tabs
Table
Drawer
Pagination
```

### `entities/inventory/ui`

재고의 의미와 규칙을 소유한다.

```text
InventoryRiskBadge
InventoryQuantity
InventoryLotLabel
InventoryExpiryLabel
```

예를 들어 `shared/ui/Badge`는 색상과 상태 표시만 제공하고, 소비기한과 재고일수를 근거로 위험등급을 판단하는 규칙은 `entities/inventory`에 둔다.

### `features`

사용자의 한 가지 행동을 소유한다.

```text
inventory-filter
inventory-sync
inventory-detail
strategy-create
strategy-approve
```

검색·필터·페이지 번호처럼 URL에 남아야 하는 상태는 feature model에서 관리하고, 서버 데이터는 TanStack Query에 위임한다.

## shadcn/ui 운영 규칙

- `components.json`을 프로젝트 기준 파일로 사용한다.
- shadcn 컴포넌트는 소스 소유 방식으로 `src/shared/ui`에 둔다.
- Radix의 키보드·ARIA 동작을 삭제하지 않는다.
- 아이콘은 프로젝트 규칙에 따라 `reicon-react`만 사용한다.
- 공통 class 조합은 `cn()`에서 `clsx`와 `tailwind-merge`로 처리한다.
- 디자인 초안별 차이는 semantic token으로 처리하고 컴포넌트마다 테마 조건문을 넣지 않는다.

## 초안 선택 체크리스트

팀 리뷰에서는 취향보다 다음 기준으로 평가한다.

1. 1440px에서 테이블 비교가 가장 빠른가?
2. 현재고와 가용수량이 즉시 구분되는가?
3. 위험등급을 색상 없이도 텍스트와 아이콘으로 이해할 수 있는가?
4. 검색·필터·페이지 이동의 우선순위가 분명한가?
5. 장시간 관제해도 대비와 밀도가 피로하지 않은가?
6. 1280px과 모바일 축소에서 제목·수치·버튼이 잘리지 않는가?
7. 선택 후 Button, Table, Drawer API를 과도하게 바꾸지 않아도 되는가?

## 완료 기준

- `/design-drafts`에서 10개 초안을 전환할 수 있다.
- `/design-system`에서 공통 프리미티브와 상태를 확인할 수 있다.
- 위험등급에 텍스트·아이콘·툴팁이 함께 있다.
- Drawer는 Escape와 닫기 버튼으로 닫힌다.
- 1440px과 모바일 캡처에서 레이아웃이 겹치지 않는다.
- 선택된 초안의 token map을 `src/styles.css`의 semantic token으로 확정한다.
- 최종 확정 후에만 도메인 컴포넌트와 실제 업무 페이지를 만든다.
