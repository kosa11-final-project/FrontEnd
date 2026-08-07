# Axios HTTP 클라이언트와 FSD-lite 경계

## 1. 이번 단계의 범위

이번 단계는 실제 재고 API, 인증 화면, 서버 연동을 개발하는 단계가 아닙니다. 다음 기반만 준비합니다.

- Axios 의존성과 중앙 인스턴스
- TanStack Query Provider
- 세션 쿠키와 CSRF를 고려한 공통 요청 정책
- FSD-lite 폴더 경계와 import 규칙
- 나중에 도메인 API가 연결될 수 있는 작은 HTTP 어댑터

재고 조회, 재고 상세, AI 전략 수립 같은 업무 기능은 백엔드 계약이 확정된 뒤 `features`와 `entities`에 추가합니다.

## 2. Axios 사용 규칙

이 프로젝트의 HTTP 클라이언트는 Axios 하나로 통일합니다. 페이지나 컴포넌트가 Axios를 직접 import하지 않고, `shared/api`의 `requestJson` 경계를 통해 호출합니다.

| 구분 | 결정 |
| --- | --- |
| 기반 | Axios 브라우저 요청 계층 |
| 중앙 정책 | request/response interceptor |
| 세션 | `withCredentials: true` |
| CSRF | request interceptor에서 변경 요청 헤더 추가 |
| Query 취소 | `AbortSignal` 전달 |
| 기본 재시도 | TanStack Query가 담당 |
| 사용 위치 | `shared/api` 내부와 도메인 API adapter |

허용:

```js
import { requestJson } from '@/shared/api';

const data = await requestJson({
  path: 'v1/inventories',
  method: 'get',
  params: { page: 0, size: 20 },
  signal,
});
```

금지:

```js
import axios from 'axios';
```

이 규칙을 지키면 CSRF, timeout, credentials, 오류 변환 정책을 한 곳에서 유지할 수 있습니다.

## 3. 세션 로그인과 CSRF 전제

Spring Security 세션 방식에서는 브라우저가 세션 쿠키를 보낼 수 있어야 하므로 Axios 인스턴스에 `withCredentials: true`를 적용합니다. API가 다른 origin에 있을 때에는 Spring의 CORS `allowCredentials`와 허용 origin이 함께 맞아야 합니다.

상태 변경 요청은 서버가 발급한 CSRF 쿠키를 읽어 `X-XSRF-TOKEN` 헤더로 보냅니다. 실제 쿠키 이름과 헤더 이름이 백엔드 설정과 다르면 환경변수로 맞춥니다.

```text
VITE_API_BASE_URL=/api/
VITE_CSRF_COOKIE_NAME=XSRF-TOKEN
VITE_CSRF_HEADER_NAME=X-XSRF-TOKEN
VITE_API_TIMEOUT_MS=10000
```

`VITE_` 값은 브라우저 번들에 노출되므로 secret, DB 비밀번호, AWS 키를 넣지 않습니다.

## 4. API 계층

```text
shared/api (Axios)
  ↓
도메인별 API 함수
  ↓
TanStack Query queryFn/mutationFn
  ↓
페이지·위젯·기능 컴포넌트
```

- 컴포넌트와 페이지에서 Axios를 직접 호출하지 않습니다.
- API 함수는 요청 파라미터와 응답 변환만 담당합니다.
- TanStack Query는 캐시, 로딩, 오류, 재조회, 재시도를 담당합니다.
- API 응답의 서버 필드명과 UI 도메인 필드명은 adapter에서 분리합니다.
- Axios와 TanStack Query에서 재시도를 동시에 설정하지 않습니다.

## 5. FSD-lite 구조

```text
src/
├─ app/                 # Provider, Router, AppLayout
├─ pages/               # URL 단위 화면 조합
├─ widgets/             # 여러 기능을 조합한 업무 블록
├─ features/            # 사용자의 한 가지 행동
├─ entities/            # 도메인 데이터와 표현 규칙
└─ shared/              # 도메인과 무관한 UI·api·config·lib
```

의존성 방향은 다음과 같습니다.

```text
app → pages → widgets → features → entities → shared
```

한 화면에서만 쓰이는 코드는 먼저 해당 페이지에 둡니다. 서로 다른 두 화면에서 같은 의미와 상태 규칙으로 재사용될 때만 상위 레이어로 승격합니다.

### 계층별 예시

| 계층 | 재고 서비스 예시 |
| --- | --- |
| `shared` | Button, Table shell, Axios adapter, date formatter |
| `entities` | 재고 위험등급 라벨, LOT 표시 규칙 |
| `features` | 재고 필터, 동기화, 상세 열기 |
| `widgets` | 재고 요약, 재고 테이블, 상세 Drawer |
| `pages` | 통합 재고 관제, 재고 상세 화면 |

자세한 팀 사용 규칙은 [`src/_template/README.md`](../../src/_template/README.md)에 기록합니다.
