# 신규 팀원 프론트엔드 필수 온보딩

> 대상: 프론트엔드가 처음이거나 이 저장소를 처음 받는 팀원
> 목표: 개발 서버를 실행하고, 코드를 수정하고, 검증 후 PR을 올릴 수 있는 상태 만들기
> 기준일: 2026-08-08

이 문서의 순서대로 한 번만 진행하면 됩니다. Codex 플러그인, 개인용 IDE 확장처럼 없어도 개발 가능한 항목은 포함하지 않았습니다. 구조와 라이브러리 사용법을 팀원에게 설명할 때는 [`team-frontend-handbook.md`](./team-frontend-handbook.md)를 함께 읽습니다.

## 1. 반드시 설치할 것

| 도구 | 필수 버전 | 확인 명령 | 사용하는 이유 |
| --- | --- | --- | --- |
| Git | 최신 안정 버전 | `git --version` | clone, branch, commit, push |
| Node.js | 24 LTS | `node --version` | Vite, 테스트, 빌드 실행 |
| pnpm | 11.18.0 | `pnpm --version` | 패키지와 lockfile 관리 |

Node.js 23은 지원이 종료된 버전이므로 사용하지 않습니다. 저장소의 `.nvmrc`와 GitHub Actions도 Node.js 24를 사용합니다.

Node.js를 설치한 뒤 pnpm을 활성화합니다.

```bash
corepack enable
pnpm --version
```

출력이 `11.18.0`이 아니면 저장소 루트에서 다음 명령을 실행합니다.

```bash
corepack prepare pnpm@11.18.0 --activate
pnpm --version
```

## 2. 저장소를 처음 받았을 때

```bash
git clone https://github.com/kosa11-final-project/FrontEnd.git
cd FrontEnd
pnpm install --frozen-lockfile
```

`pnpm-lock.yaml`은 팀 전체가 같은 패키지 버전을 설치하기 위한 파일입니다. 삭제하거나 npm·yarn lockfile을 추가하지 않습니다.

로컬 환경 파일을 만듭니다.

```bash
# macOS / Linux
cp .env.example .env.local

# Windows PowerShell
Copy-Item .env.example .env.local
```

현재 값들은 로컬 실행 기본값이 있으므로 처음에는 수정하지 않아도 됩니다. 로컬 Spring Boot 서버를 연결할 때만 `VITE_API_PROXY_TARGET`을 팀에서 정한 주소로 설정합니다.

Playwright의 Chromium을 한 번 설치합니다.

```bash
pnpm exec playwright install chromium
```

## 3. 최초 실행 확인

먼저 공통 검증을 실행합니다.

```bash
pnpm run audit:prod
pnpm run check
pnpm run test:e2e
pnpm run build-storybook
```

각 명령은 다음을 확인합니다.

| 명령 | 확인 내용 |
| --- | --- |
| `pnpm run audit:prod` | high 이상 운영 의존성 취약점 |
| `pnpm run check` | ESLint, Prettier, Vitest, production build |
| `pnpm run test:e2e` | Chromium에서 실제 라우팅과 사용자 흐름 |
| `pnpm run build-storybook` | 공통 UI와 디자인 토큰 문서의 정적 빌드 |

모두 통과하면 앱을 실행합니다.

```bash
pnpm dev
```

브라우저에서 `http://localhost:5173`을 열고 `/inventory` 화면과 왼쪽 메뉴 이동을 확인합니다.

공통 UI를 확인할 때에는 별도 터미널에서 Storybook을 실행합니다.

```bash
pnpm storybook
```

Storybook 주소는 `http://localhost:6006`입니다.

## 4. 환경변수와 비밀정보 규칙

- 로컬 값은 `.env.local`에만 작성합니다.
- `.env`, `.env.development`, `.env.production`은 Git에 올리지 않습니다.
- 브라우저에 전달되는 `VITE_*` 변수에는 비밀번호, 세션 ID, DB 비밀번호, AWS 키, 인증 토큰을 넣지 않습니다.
- 토큰을 실수로 commit했다면 파일만 삭제하지 말고 즉시 담당자에게 알린 뒤 토큰을 폐기·재발급합니다.

`.env.example`에는 변수 이름과 공개 가능한 기본값만 작성합니다. 실제 계정값은 넣지 않습니다.

## 5. 작업을 시작하는 방법

`main`에서 직접 개발하거나 commit하지 않습니다.

```bash
git switch main
git pull --ff-only
git switch -c feat/작업이름
```

예시:

```bash
git switch -c feat/inventory-list
git switch -c fix/sidebar-overflow
```

`pnpm-lock.yaml`이 변경된 내용을 받은 경우 다시 설치합니다.

```bash
pnpm install --frozen-lockfile
```

개발 중에는 `pnpm dev`를 켜 두고 작업합니다.

## 6. 처음 코드를 넣을 위치

의존성은 다음 방향으로만 흐릅니다.

```text
app → pages → widgets → features → entities → shared
```

| 만들려는 것 | 시작 위치 |
| --- | --- |
| URL 하나에 대응하는 최종 화면 | `src/pages` |
| 여러 기능을 조합한 화면 블록 | `src/widgets` |
| 필터, 동기화, 상세 열기 같은 사용자 행동 | `src/features` |
| 재고, 상품, 전략의 API·데이터·표현 규칙 | `src/entities` |
| 도메인을 모르는 공통 UI·통신·유틸리티 | `src/shared` |

처음부터 모든 코드를 `shared`로 올리지 않습니다. 한 화면에서만 쓰면 해당 page에서 시작하고, 실제로 두 곳 이상에서 같은 의미로 재사용될 때 이동합니다.

새 기능을 시작하기 전에 다음 문서를 확인합니다.

1. 구조와 명명: [`development-conventions.md`](./development-conventions.md)
2. 전체 예시: [`../src/_template/example-flow/README.md`](../src/_template/example-flow/README.md)
3. 완료 조건: [`checklists/frontend-feature-checklist.md`](./checklists/frontend-feature-checklist.md)
4. 공통 UI: Storybook의 `Shared UI`와 `Foundations`

## 7. PR을 올리기 전 필수 확인

```bash
pnpm run audit:prod
pnpm run check
pnpm run test:e2e
pnpm run build-storybook
git diff --check
```

그다음 현재 branch와 작업 파일을 확인합니다.

```bash
git status
git diff --stat
```

변경한 파일만 골라 commit하고 원격 branch에 올립니다. `.env.local`은 추가하지 않습니다.

```bash
git add <변경한 파일 또는 폴더>
git diff --cached
git commit -m "feat: 변경 내용을 한 줄로 설명"
git push -u origin HEAD
```

commit된 전체 변경을 확인합니다.

```bash
git diff --stat main...HEAD
```

GitHub의 현재 branch 화면에서 `Compare & pull request`를 선택하고 `.github/pull_request_template.md`의 항목을 작성합니다. base branch가 `main`인지, 변경 파일에 `.env*`나 관련 없는 파일이 섞이지 않았는지 다시 확인한 뒤 PR을 생성합니다.

PR에는 다음 세 가지를 반드시 적습니다.

1. 무엇을 왜 바꿨는지
2. 어떤 명령과 화면으로 확인했는지
3. UI 변경이면 데스크톱과 좁은 화면 캡처

GitHub Actions가 같은 dependency audit, lint, format, test, build, Storybook, E2E 검사를 다시 실행합니다. 실패한 상태에서는 merge하지 않습니다.

저장소 관리자는 `Frontend CI / verify`가 처음 성공한 뒤 `main` ruleset 또는 branch protection에서 PR과 해당 status check를 필수로 지정합니다. 이 설정은 팀원별 설정이 아니라 저장소에서 한 번만 진행합니다.

## 8. 자주 막히는 문제

### `pnpm` 명령이 없음

```bash
corepack enable
corepack prepare pnpm@11.18.0 --activate
```

### Node 버전 경고가 나옴

`node --version`이 `v24.x`인지 확인합니다. 버전 관리 도구를 사용한다면 저장소 루트의 `.nvmrc`에 맞춰 Node.js 24로 전환합니다.

### Playwright가 브라우저를 찾지 못함

```bash
pnpm exec playwright install chromium
```

### API 요청이 실패함

1. Spring Boot 서버가 실행 중인지 확인합니다.
2. `.env.local`의 `VITE_API_PROXY_TARGET`이 팀에서 정한 로컬 API 주소인지 확인합니다.
3. 환경변수를 바꿨다면 Vite 개발 서버를 다시 시작합니다.
4. 인증·CORS·CSRF 문제라면 임의로 프론트에서 우회하지 말고 백엔드 계약을 함께 확인합니다.

## 완료 기준

다음 항목이 모두 되면 개인 초기 세팅이 끝난 것입니다.

- [ ] Node.js `v24.x`, pnpm `11.18.0`이 확인됩니다.
- [ ] `pnpm install --frozen-lockfile`이 성공합니다.
- [ ] `.env.local`이 있고 Git 추적 대상이 아닙니다.
- [ ] `pnpm run audit:prod`가 통과합니다.
- [ ] `pnpm run check`가 통과합니다.
- [ ] `pnpm run test:e2e`가 통과합니다.
- [ ] `pnpm run build-storybook`이 통과합니다.
- [ ] `pnpm dev`에서 `/inventory`와 메뉴 이동이 동작합니다.
- [ ] 개인 feature branch에서 작업하고 있습니다.
