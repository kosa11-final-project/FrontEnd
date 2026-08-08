# 디자인 방향 확정: Mesh Forecast + Dashboard Filter Foundations

## 결정

통합 재고 관제 플랫폼의 기본 디자인 방향을 다음 조합으로 확정한다.

- 스타일: `Mesh Forecast`
- 컬러 기준: `Dashboard Filter Foundations`
- 폰트: 기존 로컬 `Pretendard` 유지
- 기본 진입 상태: `/inventory` 앱 셸에서 위 조합을 전역 토큰으로 사용

## 컬러 토큰

```text
main:              #27B06E
sub-mint:          #11C6AB
sub-cyan:          #00B0D7
sub-orange:        #FDA643
sub-mint-soft:     #DAF7E9
sub-cyan-soft:     #CFF4FC
sub-orange-soft:   #FFEC2C
danger:            #D92D20 (semantic extension)
danger-soft:       #FEE4E2 (semantic extension)
gray-900:          #282828
gray-700:          #747474
gray-500:          #8E8E8E
gray-300:          #C1C1C1
gray-200:          #DADADA
gray-50:           #F4F4F4
```

코드에서는 원시 색상은 `src/styles.css`의 `--color-*` 토큰으로 관리하고, 컴포넌트는 `--primary`, `--text-heading`, `--border`, `--good` 같은 semantic 토큰만 사용한다.

## 적용 원칙

- 그라디언트 메시는 배경과 요약 표면에 제한적으로 사용한다.
- 데이터 테이블은 불투명한 표면과 충분한 대비를 유지한다.
- `main`은 주요 행동·선택·포커스와 양호 상태에 사용한다.
- `sub-mint`와 `sub-cyan`은 보조 강조와 정보 상태에 사용한다.
- `sub-orange`와 `sub-orange-soft`는 주의 상태에 사용한다.
- `danger`와 `danger-soft`는 위험·오류 상태의 semantic 확장 토큰으로 사용한다.
- 회색 스케일은 제목·본문·placeholder·border·배경 계층에 사용한다.
- 필터 label/value는 Pretendard `0.8125rem / 1.125rem`, medium을 기본으로 한다.
- 필드 간격은 `8px`, 필터 바 그룹 간격은 `12px`, field radius는 `6px`, bar radius는 `8px`를 기준으로 한다.
- 위험등급은 색상만으로 전달하지 않고 텍스트와 아이콘을 함께 사용한다.
- ZONE과 KAN은 계속 화면에 표시하지 않는다.

## 운영 화면 적합성

Mesh Forecast는 수요 예측과 재고 흐름을 시각적으로 강조하기 좋다. Dashboard Filter Foundations 컬러는 민트·시안·오렌지의 역할이 분명해 필터와 상태를 빠르게 비교할 수 있다. 관제 테이블에서는 색면보다 숫자 비교가 우선이므로 색상은 선택·상태·정보 계층에 제한하고, 행·열 구분선과 focus 상태를 선명하게 유지한다.

## 후속 작업

1. `src/styles.css`의 원시 팔레트와 semantic token을 이 기준으로 유지한다.
2. 사이드바 기준 기본 라우트와 앱 셸을 팀 공통 구조로 유지한다.
3. 세션 쿠키·CSRF·401·403 처리의 프론트엔드 경계를 문서화한다.
4. Sentry 초기화와 환경변수 구조를 유지한다.
5. 실제 기능이 시작될 때 `entities/inventory`와 `features/inventory-filter`를 첫 FSD slice로 만든다.

## 비교용 스킨

비교용 스킨과 10개 디자인 갤러리는 운영 코드에 포함하지 않는다. Mesh Forecast와 Dashboard Filter Foundations만 공통 토큰과 앱 셸의 기본값으로 유지한다.
