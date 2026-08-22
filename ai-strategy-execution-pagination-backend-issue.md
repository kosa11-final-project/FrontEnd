# [Feature] AI 전략 실행 목록 조회 API 페이지네이션 및 검색 조건 적용

## 브랜치 정보

- 브랜치 타입: `feature`
- 브랜치명: `strategy-execution-pagination`

## 작업 목적

AI 전략 실행 데이터 증가에 대응하고 관제 화면에서 효율적인 목록 조회가 가능하도록 목록 조회 API에 서버 페이지네이션과 검색·필터 조건을 적용한다.

## 대상 API

`GET /api/v1/strategy-executions`

## 요청 파라미터

| 파라미터 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `page` | number | `0` | 조회 페이지, 0부터 시작 |
| `size` | number | `10` | 페이지당 조회 건수 |
| `query` | string | 없음 | 전략 번호 또는 상품명 검색 |
| `status` | string | 없음 | 전략 실행 상태 필터 |
| `actionType` | string | 없음 | 포함된 액션 유형 필터 |
| `sort` | string | `establishedAt,desc` | 정렬 조건 |

### 요청 예시

```http
GET /api/v1/strategy-executions?page=0&size=10&query=두부&status=EXECUTING&actionType=PRICE_DISCOUNT
```

## 응답 형식

```json
{
  "data": {
    "content": [],
    "page": 0,
    "size": 10,
    "totalElements": 125,
    "totalPages": 13,
    "first": true,
    "last": false
  },
  "timestamp": "2026-08-23T12:00:00Z"
}
```

## 작업 범위

- 전략 실행 목록 조회 쿼리에 페이지네이션 적용
- 전략 번호 또는 상품명 검색 조건 적용
- 전략 실행 상태 필터 적용
- 액션 유형 필터 적용
- 기본 정렬을 전략 수립일 최신순으로 적용
- 검색어 앞뒤 공백 제거 및 빈 문자열 미적용
- 여러 검색 조건을 전달하면 AND 조건으로 조회
- 페이지 크기 기본값 및 최대 허용값 설정
- 잘못된 요청 파라미터에 대한 검증과 오류 응답 처리
- 목록 조회 시 발생할 수 있는 N+1 쿼리 점검
- Repository 및 Service 테스트 추가
- Swagger/OpenAPI 문서 업데이트

## 완료 조건

- [ ] `page`, `size`에 따라 정확한 목록이 반환된다.
- [ ] `totalElements`, `totalPages`, `first`, `last` 정보가 정확하다.
- [ ] 전략 번호와 상품명으로 검색할 수 있다.
- [ ] 전략 상태와 액션 유형으로 필터링할 수 있다.
- [ ] 검색 및 필터 조건을 조합해 조회할 수 있다.
- [ ] 기본 정렬이 전략 수립일 내림차순으로 적용된다.
- [ ] 동일 수립일 데이터의 순서가 바뀌지 않도록 보조 정렬 기준이 적용된다.
- [ ] 페이지 크기 최대값을 초과하면 검증 오류 또는 최대값 보정이 적용된다.
- [ ] 페이지네이션 및 검색 조건 테스트가 통과한다.
- [ ] Swagger/OpenAPI 명세에 요청 및 응답 형식이 반영된다.

## 권장 정책

- `page`: 0부터 시작
- `size`: 기본 10, 최대 100
- 기본 정렬: `establishedAt DESC, id DESC`
- `query`: 전략 번호와 상품명 부분 일치
- 복수 조건: AND 검색

## 프론트엔드 연동 참고

프론트엔드는 응답의 `content`, `page`, `size`, `totalElements`, `totalPages`를 사용해 페이지네이션 UI를 구성한다. 검색어나 필터가 변경되면 `page=0`으로 다시 요청한다.

