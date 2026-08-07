# 디자인 스타일 초안 방향과 Open Design 사용 계획 (보관 문서)

> 보관 문서입니다. 스타일 탐색은 종료되었고 운영 기본값은 Mesh Forecast + Olive Green 하나로 확정했습니다. 과거 초안과 팔레트는 운영 라우트와 CSS에서 제거했습니다.

## 1. 기준

이 문서는 `통합 재고 관제`의 정보 구조를 고정한 상태에서 시각 스타일만 비교하기 위한 초안 기준이다.

- 고정 구조: 좌측 메뉴, 사용자 헤더, 재고 위치 요약, 검색·복합 필터, 서버 페이지네이션 테이블, 상세 Drawer
- 고정 데이터 규칙: 현재고와 판매 가능을 분리하고, 소비기한·재고일수·위험등급을 별도 지표로 취급한다.
- 화면에 표시하지 않는 항목: ZONE, KAN
- 아이콘: `reicon-react`만 사용
- 색상: 현대그린푸드 Heritage Green을 기본으로 하되, 스타일과 별도로 교체 가능

## 2. 구현된 초안 스킨

`/reference-drafts`에서는 동일한 구조와 데이터를 유지한 채 팀 리뷰용 shortlist만 전환할 수 있다.

- 스타일: `Glass Control`, `Soft Console`, `Mesh Forecast`
- 색상: `Carbon Ink`, `Olive Green`, `Ink Wash`

이전 탐색 후보는 아래 표에 기록으로 남겨두지만 현재 선택 UI에서는 노출하지 않는다.

| 스타일 | 적용 의도 | 운영 화면 적합도 |
| --- | --- | --- |
| Organic Pending | 부드러운 그린 표면과 운영 상태 그룹 | 보통 |
| Agency Clean | 화이트 표면, 얇은 선, 문서형 위계 | 높음 |
| Solar Ledger | 회색 캔버스와 강한 노란 신호 | 위험 재고 강조에 높음 |
| Performance Signal | 크림 표면과 큰 숫자 | 요약 대시보드에 보통 |
| Glass Control | 투명 레이어와 동기화 상태의 겹침 | 보통, 표는 투명도를 낮게 유지 |
| Soft Console | 뉴모피즘 표면과 선택 상태의 안팎 그림자 | 낮음~보통, 조작 영역에 한정 권장 |
| Minimal Ledger | 장식과 그림자를 줄인 원장형 | **가장 높음** |
| Bento Ops | 위치 요약을 블록 단위로 재배열 | 요약 영역에 높음 |
| Immersive Watch | 어두운 배경과 큰 위험 신호 | 관제 모니터링에 보통 |
| Mesh Forecast | 부드러운 색면과 예측 강조 | AI 전략·예측 화면에 보통 |
| Editorial Brief | 세리프 제목과 보고서형 규칙선 | 리포트·통계 화면에 높음 |
| Retro Terminal | 모노스페이스 메타데이터와 점선 규칙 | 실험용, 기본 운영 화면에는 낮음 |

## 3. 링크에서 추가로 고려할 방향

[Design -isms](https://lidge-jun.github.io/design-isms/)는 여러 디자인 ism과 효과·색상·타이포그래피·레이아웃·모션 카탈로그를 제공하고, [Color Systems](https://lidge-jun.github.io/design-isms/color.html)는 역할 기반 팔레트와 대비 검토를 위한 참고점으로 사용한다. [Threads 참고 글](https://www.threads.com/@_0.beomi_/post/DbceZkdiVR_?hl=ko)은 글래스모피즘, 브루탈리즘, 벤토 그리드, Y2K 등 스타일을 정확한 이름으로 비교하는 접근을 제안한다.

추가 후보는 다음 순서로 검토한다.

1. **Swiss / International**: 12컬럼 그리드, 명확한 타이포 위계, 표 중심 운영 화면의 기본 후보
2. **Brutalism**: 위험·오류·권한 없음 상태의 강한 대비 후보. 전체 화면보다 상태 컴포넌트에 적용
3. **Soft UI**: 위치 선택 카드와 필터 토글에만 제한 적용. dense table에는 적용하지 않음
4. **Y2K / Neo-brutalism**: 팀 취향 확인용 실험 초안. 장기 운영 기본 테마로 확정하지 않음
5. **Terminal / Dark Monitor**: 야간 관제나 대형 모니터용 보조 테마. 일반 업무 화면은 밝은 테마 우선

## 4. 1차 선택 권장안

- 현재 스타일 shortlist: `Glass Control`, `Soft Console`, `Mesh Forecast`
- 현재 색상 shortlist: `Carbon Ink`, `Olive Green`, `Ink Wash`

글래스모피즘, 뉴모피즘, 레트로는 전체 관제 기본값으로 확정하기보다 팀 리뷰용 초안과 보조 상태에 두는 편이 안전하다. 재고 담당자는 행 간 비교와 숫자 스캔을 반복하므로 표의 대비와 고정된 열 위계가 장식보다 우선이다.

## 5. Open Design 사용 상태

Open Design 스킬 지침에 따라 로컬 `open-design` MCP 등록 여부를 확인했으나, 현재 세션에는 등록되어 있지 않다. 따라서 현재 `/reference-drafts`의 active 3개 스킨은 레포 코드로 만든 비교용 초안이며, Open Design Cloud에서 생성한 결과물로 간주하지 않는다.

Open Design을 실제로 사용하려면 다음 순서가 필요하다.

1. 사용자의 확인 후 공식 다운로드 페이지를 연다: <https://open-design.ai/download/>
2. Open Design 설치 및 Codex MCP 등록을 완료한다.
3. 새 작업에서 한국어 brief를 한 번 수집하고, 8개 스타일을 각각 별도 생성하거나 하나의 비교 보드로 생성한다.
4. 생성 결과를 현재 공통 정보 구조와 대조해 표 가독성, 포커스, 권한 없음·오류·빈 상태를 검증한다.

현재는 설치 페이지를 임의로 열거나 플러그인을 가장해 결과를 생성하지 않는다.

## 6. 컬러 조합 초안

컬러 카탈로그의 역할 기반 구조를 참고해 `/reference-drafts`에는 현재 3개 팔레트만 노출한다. 숫자와 상태가 중심인 화면이므로 `primary`와 `accent`를 분리하고, 위험·주의·양호는 항상 텍스트와 아이콘을 함께 사용한다.

| 팔레트 | 배경 / 표면 | 주 행동 | 양호 | 주의 | 위험 | 추천 용도 |
| --- | --- | --- | --- | --- | --- | --- |
| Heritage Green | `#EEF4EF` / `#FFFFFF` | `#0D5B48` | `#1E8765` | `#B6761C` | `#E24457` | 브랜드 기본 |
| Coastal Blue | `#EEF3F2` / `#FFFFFF` | `#2E596B` | `#1E8765` | `#B6761C` | `#E24457` | 차분한 정보형 |
| Solar Yellow | `#EFF1EF` / `#FFFFFF` | `#B48400` | `#198038` | `#A16207` | `#DA1E28` | 위험 신호 강조 |
| Carbon Ink | `#ECEFED` / `#FFFFFF` | `#171B19` | `#198038` | `#B45309` | `#DA1E28` | 고대비 관제 |
| SaaS Trust Blue | `#F8FAFC` / `#FFFFFF` | `#2563EB` | `#15803D` | `#B45309` | `#DC2626` | B2B 기본 후보 |
| Healthcare Calm | `#F0FDFA` / `#FFFFFF` | `#0F766E` | `#15803D` | `#C2410C` | `#B91C1C` | 민트 안정형 |
| Carbon Enterprise | `#FFFFFF` / `#F4F4F4` | `#0F62FE` | `#198038` | `#B45309` | `#DA1E28` | 고밀도 기업형 |
| Fintech Assurance | `#F8FAFC` / `#FFFFFF` | `#0043CE` | `#198038` | `#B45309` | `#DA1E28` | 수치·거래형 |
| Commerce Amber | `#FFF7ED` / `#FFFFFF` | `#C2410C` | `#0F766E` | `#A16207` | `#B91C1C` | 따뜻한 경고형 |
| Primer Utility | `#FFFFFF` / `#FFFFFF` | `#0969DA` | `#1F883D` | `#9A6700` | `#CF222E` | 개발 도구형 |
| Olive Green | `#F4F6EB` / `#FFFFFF` | `#636B2F` | `#4F8524` | `#A16207` | `#B43A3A` | 자연·식품 운영형 |
| Mossy Hollow | `#F3F5EB` / `#FFFFFF` | `#636B2F` | `#4F8524` | `#A16207` | `#B43A3A` | 이끼 낀 골짜기, 저채도 그린 |
| Blue Eclipse | `#F3F3FA` / `#FFFFFF` | `#272757` | `#287B58` | `#A16207` | `#C23B4A` | 미드나잇 블루, 야간 관제 |
| Ink Wash | `#F3F3F3` / `#FFFFFF` | `#252525` | `#2E7D32` | `#A16207` | `#B91C1C` | 수묵 모노크롬, 고대비 |

1차 결정 후보는 `Heritage Green`, `SaaS Trust Blue`, `Carbon Enterprise` 세 가지다. 이 세 조합을 `Minimal Ledger`, `Agency Clean`, `Bento Ops`와 각각 교차 비교하면 브랜드성·가독성·업무 밀도를 동시에 판단하기 쉽다.

Figma의 원색 조합은 [Olive Green](https://www.figma.com/colors/olive-green/), [Mossy Hollow](https://www.figma.com/color-palettes/mossy-hollow/), [Blue Eclipse](https://www.figma.com/color-palettes/blue-eclipse/), [Ink Wash](https://www.figma.com/color-palettes/ink-wash/)의 값을 기준으로 삼았다. 원본 팔레트는 4개의 색상으로 제시되므로, 제품 UI에서는 이를 배경·표면·주요 행동·상태 역할로 재배치했다.
