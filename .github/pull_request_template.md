## 변경 내용

- 무엇을 왜 변경했는지 적어주세요.

## 영향 범위

- 관련 route, layer, slice 또는 공통 컴포넌트를 적어주세요.

## 확인 방법

```text
실행한 명령 또는 수동 확인 경로
```

## 화면

UI 변경이 있으면 데스크톱과 적용 가능한 좁은 화면의 캡처를 첨부해주세요. UI 변경이 없으면 `해당 없음`으로 표시합니다.

## 체크리스트

- [ ] 기존 `shared/ui`와 Storybook을 먼저 확인했습니다.
- [ ] FSD-lite 계층과 공개 API 경계를 지켰습니다.
- [ ] 페이지·UI에서 Axios를 직접 사용하지 않았습니다.
- [ ] 적용 가능한 loading, empty, error, forbidden 상태를 확인했습니다.
- [ ] ZONE과 KAN을 UI 모델이나 URL에 추가하지 않았습니다.
- [ ] 새 공통 UI 또는 variant를 Storybook에 반영했습니다.
- [ ] 접근성 이름, 키보드 포커스, 색상 대비를 확인했습니다.
- [ ] `pnpm run audit:prod`를 통과했습니다.
- [ ] `pnpm run check`를 통과했습니다.
- [ ] `pnpm run test:e2e`, `pnpm run build-storybook`을 통과했습니다.
- [ ] 실행한 검증 결과를 위에 기록했습니다.
- [ ] 관련 문서와 `.env.example`을 필요한 경우 갱신했습니다.

전체 기준: `docs/checklists/frontend-feature-checklist.md`
