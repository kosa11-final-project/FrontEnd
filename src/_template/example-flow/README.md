# FSD 전체 흐름 예시

이 폴더는 앱에서 import하지 않는 복사용 예시입니다. 실제 기능을 시작할 때 필요한 계층만 `src/entities`, `src/features`, `src/widgets`, `src/pages` 아래로 옮기고 `example`을 실제 도메인 이름으로 변경합니다.

## 흐름

```text
pages/example/ExamplePage.jsx
  → URL search params
  → widgets/example-list/ExampleList.jsx
    → features/example-filter/ExampleFilterBar.jsx
    → entities/example/exampleListQueryOptions
      → getExamples
        → requestJson
          → axiosClient
      → mapExampleListResponse
    → shared/ui + shared/lib/format
```

## 복사 후 반드시 바꿀 부분

1. `example` slice와 파일 이름을 실제 도메인 이름으로 바꿉니다.
2. `v1/examples` endpoint를 실제 Spring Boot 계약에 맞춥니다.
3. `exampleMapper.js`의 DTO 필드를 실제 response에 맞춥니다.
4. URL에 남겨야 하는 필터만 search params에 포함합니다.
5. loading, empty, error와 background fetching 상태를 실제 화면에 맞춥니다.
6. mapper와 상태 규칙의 테스트를 실제 요구사항으로 교체합니다.
7. 실제 route를 `src/app/router/router.jsx`에 등록합니다.

이 예시는 구조를 설명하기 위한 최소 코드이며, 실제 응답 계약이나 디자인 완성본이 아닙니다.
