# UI8 Dashboard Style Reference

이 문서는 UI8 preview 이미지를 그대로 복사하기 위한 문서가 아니라, 팀원이 AI로 현재 재고 운영 화면을 설계·구현할 때 참고할 시각 언어와 구현 규칙을 고정하기 위한 문서입니다.

## Reference Images

원본 이미지는 UI8 CDN에서 확인합니다. CDN hotlink 정책 때문에 이미지를 프로젝트 asset으로 복사하지 않고, 원본 링크만 보존합니다.

1. [UI8 Preview 1](https://images.ui8.net/uploads/ui8-preview-1_1753831801232.jpg)
2. [UI8 Preview 2](https://images.ui8.net/uploads/ui8-preview-2_1753831788335.jpg)
3. [UI8 Preview 3](https://images.ui8.net/uploads/ui8-preview-3_1753831780138.jpg)
4. [UI8 Preview 4](https://images.ui8.net/uploads/ui8-preview-4_1753831772390.jpg)
5. [UI8 Preview 5](https://images.ui8.net/uploads/ui8-preview-5_1753831762439.jpg)
6. [UI8 Preview 6](https://images.ui8.net/uploads/ui8-preview-6_1753831752377.jpg)

## Design Read

현대그린푸드 재고 운영 플랫폼을 위한 **premium operational dashboard**로 해석합니다. 시각적으로는 흰색 고정 rail, 밝고 넓은 작업 캔버스, 얇은 구분선, 모듈형 정보 블록, 명확한 숫자 계층을 사용하는 UI8 대시보드 언어를 참고합니다. 현재 메뉴는 main 초록으로 명확하게 활성화하고, 마케팅 랜딩이나 장식용 카드 갤러리가 아니라 반복 업무를 빠르게 처리하는 B2B 관제 화면이어야 합니다.

## Layout Language

- 데스크톱 1440px을 기준으로 고정 사이드바와 상단 utility header를 유지합니다.
- 사이드바는 브랜드, workspace 메뉴, 현재 위치, 사용자 계정을 한 rail 안에 정리합니다.
- 본문은 밝은 중성 배경 위에 흰색 작업 표면을 배치합니다.
- 페이지 제목과 설명은 상단에서 한 번만 보여주고, 주요 데이터는 표·필터·요약 블록으로 바로 이어집니다.
- 반복 정보는 동일한 높이와 열 구조를 유지해 빠른 비교를 돕습니다.
- 카드 수를 늘리기보다 한 화면 안에서 제목·필터·표·상태를 명확히 그룹화합니다.
- 8px bar/panel radius와 6px control radius를 기본으로 사용합니다.
- 그림자는 약하게 사용하고, 1px border와 여백으로 계층을 우선 표현합니다.

## Color Roles

코드의 원시 팔레트는 [`src/styles.css`](../../src/styles.css)의 `--color-*` 토큰을 사용합니다. 화면에서는 원시 hex를 직접 사용하지 않고 semantic token으로 조합합니다.

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Main | `--color-main` | `#27B06E` | primary action, selected, focus, good |
| Sub mint | `--color-sub-mint` | `#11C6AB` | secondary emphasis |
| Sub cyan | `--color-sub-cyan` | `#00B0D7` | info, sync, online |
| Sub orange | `--color-sub-orange` | `#FDA643` | warning, risk |
| Soft mint | `--color-sub-mint-soft` | `#DAF7E9` | selected surface, good background |
| Soft cyan | `--color-sub-cyan-soft` | `#CFF4FC` | info background |
| Soft orange | `--color-sub-orange-soft` | `#FFEC2C` | warning background |
| Gray 900 | `--color-gray-900` | `#282828` | heading, tooltip, high-emphasis text |
| Gray 700 | `--color-gray-700` | `#747474` | body text |
| Gray 500 | `--color-gray-500` | `#8E8E8E` | muted text, placeholder |
| Gray 300 | `--color-gray-300` | `#C1C1C1` | input border, strong divider |
| Gray 200 | `--color-gray-200` | `#DADADA` | default border |
| Gray 50 | `--color-gray-50` | `#F4F4F4` | page and subtle surface |

## Typography and Spacing

- 폰트는 프로젝트에 포함된 `Pretendard`만 사용합니다.
- 타입 기준은 프로젝트 토큰의 `rem` scale로 관리합니다.

| Role | Token | rem | px reference |
| --- | --- | --- | --- |
| Headline1 | `--font-size-headline1` | `1.375rem` | 22px |
| Headline2 | `--font-size-headline2` | `1.25rem` | 20px |
| Subtitle1 | `--font-size-subtitle1` | `1rem` | 16px |
| Subtitle2 | `--font-size-subtitle2` | `0.875rem` | 14px |
| Body1 | `--font-size-body1` | `0.875rem` | 14px |
| Body2 | `--font-size-body2` | `0.75rem` | 12px |
| Description | `--font-size-description` | `0.75rem` | 12px |

- 페이지 제목은 `--font-size-page-title`, 본문은 `--font-size-body`, meta는 `--font-size-meta` semantic alias를 사용합니다.
- field gap은 `8px`, filter bar group gap은 `12px`입니다.
- padding과 gap은 가능한 한 `shared/ui` variant 또는 semantic token으로 표현합니다.
- 별도 페이지에서 임의로 색상·폰트·radius를 선언하지 않습니다.

## Component Rules

- Button, Input, Select, Badge, Tabs, Drawer, Tooltip, Avatar, StatusDot, Sidebar는 `shared/ui`에서 가져옵니다.
- `cva()`는 시각적으로 의미 있는 `variant`, `size`, `tone`을 정의할 때만 사용합니다.
- `cn()`은 조건부 className과 Tailwind 충돌 정리에 사용합니다.
- Sidebar와 Header의 실제 메뉴·breadcrumb·사용자 정보는 `widgets/app-shell`에서 조합합니다.
- 필터와 검색은 `features`, 재고 위험등급과 상품 표현은 `entities`, 표·요약·상세 Drawer 조합은 `widgets`에 둡니다.
- 이미 존재하는 primitive로 표현할 수 있는 UI에 새로운 HTML/CSS를 만들지 않습니다.
- 화면에 고유한 구조가 필요할 때만 해당 FSD slice에 작은 wrapper를 추가합니다.

## AI Design Prompt

팀원이 AI에게 화면을 요청할 때 아래 문장을 기본 프롬프트로 사용합니다.

```text
현대그린푸드 다중 판매채널 재고 운영 플랫폼의 B2B 업무용 대시보드를 설계한다.
UI8 dashboard preview의 premium operational dashboard 언어를 참고하되 원본을 복사하지 않는다.
1440px 데스크톱 우선, 흰색 고정 사이드바와 밝은 작업 캔버스, 현재 메뉴는 main 초록으로 활성화하고, 얇은 gray border, 8px panel radius,
6px control radius, 균일한 정보 블록, 높은 숫자 가독성을 사용한다.
컬러는 Dashboard Filter Foundations 토큰만 사용한다: main #27B06E, sub-mint #11C6AB,
sub-cyan #00B0D7, sub-orange #FDA643, soft mint #DAF7E9, soft cyan #CFF4FC,
soft orange #FFEC2C, gray-900 #282828, gray-700 #747474, gray-500 #8E8E8E,
gray-300 #C1C1C1, gray-200 #DADADA, gray-50 #F4F4F4.
폰트는 Pretendard를 유지한다. shadcn/ui source-owned 컴포넌트와 기존 shared/ui를 우선 재사용하고,
없는 부분만 최소한의 HTML/CSS wrapper로 추가한다. React FSD 구조를 지키며
shared/ui는 도메인과 라우터를 모르고, widgets는 여러 feature/entity를 조합한다.
ZONE과 KAN은 표시하지 않는다.
```

## Do Not Copy

- UI8 preview의 로고, 이미지, 제품명, 문구, 상표, 특정 레이아웃을 그대로 복제하지 않습니다.
- 참고하는 것은 rail/canvas 비율, 카드 밀도, border·radius·spacing, typography hierarchy, 상태색 역할입니다.
- 재고 관제에서는 장식보다 현재고·가용수량·위험등급·필터·페이지 이동을 우선합니다.
