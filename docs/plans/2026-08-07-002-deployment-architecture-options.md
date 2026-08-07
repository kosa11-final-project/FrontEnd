# 프론트엔드·백엔드 배포 아키텍처 선택지

상태: 결정 전
작성일: 2026-08-07
관련 계획: `docs/plans/2026-08-07-001-frontend-initial-setup-plan.md`

## 1. 전제

- Spring Boot 백엔드는 프론트엔드와 다른 폴더에서 관리한다.
- 백엔드와 프론트엔드는 별도로 배포한다.
- 프론트엔드는 Vite로 빌드되는 React SPA다.
- 백엔드는 Docker 이미지로 배포한다.
- 로그인은 Spring Security 세션 방식이다.
- S3는 정적 파일, 이미지, 리포트 export 같은 객체 저장소 후보이며 세션·재고 원장 DB로 사용하지 않는다.
- 프론트엔드 호스팅은 아직 Vercel, S3 + CloudFront, 기타 AWS 서비스를 비교 중이다.

## 2. 핵심 판단

별도 배포와 별도 저장소는 **배포 단위가 분리된다는 의미**이지, 브라우저에서 반드시 서로 다른 공개 origin을 사용해야 한다는 뜻은 아니다.

세션 인증을 가장 단순하게 유지하려면 다음 구조를 우선 검토한다.

```text
사용자 브라우저
      │
      ▼
https://app.example.com
      │ CloudFront path behavior
      ├── /*      → private S3 origin (React static assets)
      └── /api/* → ALB → ECS/Fargate (Spring Boot Docker)
```

이 구조에서는 프론트엔드와 백엔드가 각각 별도 배포되지만, 브라우저가 보는 API 경로는 `/api/*`로 통일할 수 있다. 결과적으로 세션 쿠키·CORS·CSRF의 복잡도를 줄일 수 있다.

AWS는 CloudFront에서 S3 정적 origin과 동적 API origin을 같은 배포에 연결하는 SPA 다중 origin 구성을 안내하고 있다. API 경로는 캐시하지 않고 API origin으로 전달하는 방식이다. [AWS SPA 다중 origin 가이드](https://docs.aws.amazon.com/solutions/improved-single-page-application-performance-using-amazon-cloudfront/)

## 3. 선택지 A: S3 + CloudFront + ECS/Fargate

### 구성

```text
React build
  → private S3 bucket
  → CloudFront distribution
  → ACM certificate + Route 53/custom DNS

Spring Boot Docker
  → ECR image
  → ECS Fargate service
  → Application Load Balancer
```

ECS Fargate 서비스는 ALB와 함께 사용할 수 있고, ALB는 HTTP/HTTPS path-based routing을 지원하므로 Docker 기반 Spring Boot 서비스의 초기 운영 구성으로 적합하다. [AWS ECS 서비스 로드밸런싱](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html)

### 장점

- 프론트·백엔드를 AWS 중심으로 운영할 수 있다.
- S3는 정적 파일에 적합하고 CloudFront가 캐시·HTTPS·도메인을 담당한다.
- S3 bucket을 공개하지 않고 CloudFront OAC로만 접근시킬 수 있다. [CloudFront OAC](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- CloudFront에서 `/*`와 `/api/*`를 분리해 같은 공개 도메인으로 제공할 수 있다.
- 세션 쿠키를 same-origin 요청으로 운영하기 쉬워진다.
- AWS WAF, CloudWatch, Route 53, ACM 등 운영 확장 경로가 명확하다.
- 백엔드는 Docker 이미지와 ECS 서비스로 별도 배포할 수 있다.

### 단점

- CloudFront, S3, ACM, DNS, ALB, ECS 설정이 필요하다.
- SPA fallback과 cache invalidation을 CI/CD에서 직접 관리해야 한다.
- CloudFront API behavior에서 캐시 금지, 쿠키·CSRF 헤더·OPTIONS·POST·PUT·PATCH·DELETE 전달을 정확히 설정해야 한다.
- AWS 초기 운영 경험이 부족하면 Vercel보다 첫 배포 시간이 길다.

### 세션 인증 주의사항

- `/api/*` behavior는 캐시하지 않는다.
- 세션 쿠키, CSRF 쿠키, CSRF 헤더를 API origin까지 전달한다.
- API 요청은 HTTPS를 기본으로 한다.
- HTTP를 HTTPS로 단순 redirect하는 동적 behavior는 비-GET 요청에서 403이 발생할 수 있으므로, API 클라이언트가 처음부터 HTTPS를 사용하도록 한다. [CloudFront HTTPS 설정 주의사항](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-procedures.html)
- CloudFront custom domain은 ACM의 유효한 인증서가 필요하다. CloudFront용 인증서는 AWS 문서 기준으로 us-east-1 리전에 준비해야 한다. [CloudFront alternate domain과 HTTPS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html)

## 4. 선택지 B: Vercel 프론트 + AWS 백엔드

### 구성

```text
React build
  → Vercel
  → custom domain: app.example.com

Spring Boot Docker
  → ECR
  → ECS/Fargate + ALB
  → api.example.com
```

Vercel은 Git 연동, CLI, preview deployment, custom domain 연결을 제공한다. [Vercel 배포 개요](https://vercel.com/docs/deployments/overview)

### 장점

- 프론트엔드 preview deployment가 빠르다.
- Git push 기반으로 팀원이 결과를 확인하기 쉽다.
- 정적 Vite SPA 배포 과정이 단순하다.
- 백엔드는 AWS에서 Docker로 독립 운영할 수 있다.
- 초기 프론트엔드 개발 속도가 빠르다.

### 단점

- 프론트와 백엔드 운영 관측이 AWS와 Vercel로 나뉜다.
- `app.example.com`과 `api.example.com`은 cross-origin이므로 CORS·credentials·CSRF를 정확히 맞춰야 한다.
- 세션 쿠키의 `Domain`, `SameSite`, `Secure` 설정이 배포 도메인 관계에 영향을 받는다.
- Vercel을 정적 SPA 호스팅만 사용하는 경우 AWS CloudFront 대비 운영 스택이 분리된다.
- Vercel rewrites로 외부 API를 같은 브라우저 URL 아래 프록시할 수 있지만, 세션 쿠키·CSRF·응답 헤더 전달을 실제 staging에서 검증해야 한다. [Vercel 외부 origin rewrite](https://vercel.com/docs/routing/rewrites)

### Vercel을 선택할 때의 권장 방식

- 가능하면 `app.example.com/api/*`를 Vercel rewrite로 API origin에 연결해 브라우저 API URL을 same-origin처럼 유지한다.
- rewrite를 사용하지 않으면 Axios의 `withCredentials: true`, 백엔드 CORS credentials, 쿠키 정책, CSRF 헤더를 함께 설정한다.
- preview deployment는 운영 세션을 사용하지 않는다.
- preview별 API 환경과 허용 origin을 분리한다.

## 5. 선택지 C: AWS Amplify Hosting

Amplify Hosting은 Git 기반 정적 프론트 배포와 AWS 연동 사이의 중간 선택지로 검토할 수 있다.

### 장점

- S3·CloudFront를 직접 조작하는 것보다 초기 설정이 단순할 수 있다.
- AWS 계정·도메인·환경변수와 연결하기 쉽다.
- 정적 React/Vite 배포와 preview branch 운영을 지원한다.

### 단점

- CloudFront behavior를 세밀하게 직접 설계할 때보다 제어 범위가 줄어들 수 있다.
- `/api/*`를 같은 도메인으로 프록시하는 구조는 별도 확인이 필요하다.
- 최종적으로 AWS 세부 운영 정책을 직접 통제해야 한다면 S3 + CloudFront로 이동할 수 있다.

초기 선택지에는 포함하되, 현재 기본안은 아니다.

## 6. S3 사용 범위

### 사용 후보

- React build 결과물
- 상품 이미지 또는 운영 이미지
- AI 전략 export 파일
- 통계 리포트 다운로드 파일
- 사용자 업로드가 필요한 첨부 파일

### 사용하지 않는 것

- Spring Security 세션 저장
- 재고·LOT 원장 데이터
- 실시간 운영 상태
- 권한 정보의 단일 진실 공급원

S3는 객체 저장소이며, 재고 조회·정렬·페이지네이션을 담당하는 데이터베이스가 아니다.

객체 업로드가 추가되면 다음 정책을 별도로 정한다.

- private bucket 기본값
- 서버가 발급하는 presigned URL
- content type과 최대 파일 크기 검증
- 파일명·경로의 사용자 입력 정규화
- lifecycle rule과 보존 기간
- CloudFront public asset과 private download 분리

## 7. Docker와 AWS 배포 기준

### 백엔드 기본안

```text
Spring Boot
  → Docker multi-stage build
  → ECR
  → ECS Fargate
  → ALB
  → private subnets + security group
```

- 초기 규모에서는 EKS보다 ECS/Fargate를 우선 검토한다.
- ALB health check와 Spring Boot actuator health endpoint를 연결한다.
- 세션을 여러 task에서 공유해야 하는 시점에는 세션 저장소 전략을 별도로 확정한다.
- 세션을 task 메모리에만 두고 scale-out하지 않는다.
- DB·Redis·S3의 실제 선택은 백엔드 설계 문서에서 확정한다.

### 프론트 Docker 선택

- S3 + CloudFront를 사용하면 프론트엔드는 Docker로 배포할 필요가 없다.
- 팀 정책상 Docker로 통일해야 하면 Vite build 결과물을 Nginx 정적 이미지에 포함하고, CloudFront 또는 ALB 뒤에 둔다.
- 정적 SPA에 Node 개발 서버를 production 서버로 사용하지 않는다.

## 8. CI/CD 초안

### AWS 정적 배포

```text
push to main
  → pnpm install --frozen-lockfile
  → pnpm build
  → S3 sync dist/
  → CloudFront invalidation 또는 hashed asset 정책
  → smoke test
```

### Vercel 정적 배포

```text
push / pull request
  → Vercel build
  → preview deployment
  → staging API 연결
  → production promote
```

### 백엔드 배포

```text
push backend image tag
  → Docker build
  → vulnerability scan
  → ECR push
  → ECS task definition update
  → rolling deployment
  → ALB health check
```

프론트 빌드에 주입되는 `VITE_*` 값은 공개 가능한 환경 설정만 포함한다. AWS secret, DB password, session secret, private API key는 프론트 빌드에 넣지 않는다.

## 9. 임시 권장안

아직 최종 배포 플랫폼을 정하지 않았으므로 다음을 **결정 전 기본안**으로 둔다.

```text
프론트 빌드: Vite static build
정적 호스팅 후보: S3 + CloudFront 우선, Vercel preview 병행 검토
백엔드: Spring Boot Docker → ECR → ECS/Fargate + ALB
공개 도메인 후보: app.example.com
API 경로 후보: app.example.com/api/*
세션: Spring Security cookie
API 클라이언트: Axios withCredentials
```

AWS를 최종 운영 플랫폼으로 선택한다면 `S3 + CloudFront + `/api/*` ALB origin`을 1순위로 한다. 프론트엔드 preview와 팀 개발 속도를 최우선으로 할 때는 Vercel을 선택하고, API rewrite 또는 명시적 cross-origin 세션 구성을 staging에서 검증한다.

## 10. 배포 선택 전 검증 시나리오

- 별도 프론트 도메인에서 로그인 후 세션 쿠키가 유지되는지 확인
- 새로고침 후 `/api/v1/me`가 정상 응답하는지 확인
- `401`과 `403`이 구분되는지 확인
- CSRF 없는 POST·PUT·DELETE가 차단되는지 확인
- CSRF 토큰을 포함한 동기화 요청이 성공하는지 확인
- CloudFront 또는 Vercel rewrite가 쿠키·CSRF·trace ID를 보존하는지 확인
- API 요청이 CloudFront에서 캐시되지 않는지 확인
- SPA deep link `/inventory/123` 새로고침이 `index.html`로 복구되는지 확인
- 정적 asset 캐시 갱신 후 오래된 JS chunk 오류가 없는지 확인
- CORS allowlist가 production·staging·local에서 각각 올바른지 확인
- Sentry와 CloudWatch/Vercel 로그에 세션·재고 민감정보가 남지 않는지 확인

## 11. 최종 결정에 필요한 항목

- 운영 프론트 도메인
- 운영 API 도메인 또는 `/api/*` path routing 사용 여부
- Vercel을 preview 전용으로 사용할지 production에도 사용할지
- AWS 계정·리전·Route 53·ACM 사용 여부
- ECS/Fargate와 다른 Docker 실행 환경 여부
- 정적 파일 private bucket + CloudFront OAC 여부
- S3에 저장할 파일 종류와 보존 정책
- 세션 쿠키 Domain·SameSite·Secure 정책
- CloudFront/Vercel이 API 요청을 프록시할지 여부

이 항목들이 확정되기 전까지 프론트 코드에는 `VITE_API_BASE_URL`, `VITE_APP_ORIGIN`, `VITE_ENV`만 추상화해 두고 특정 호스팅 서비스의 SDK나 서버리스 기능에 종속하지 않는다.
