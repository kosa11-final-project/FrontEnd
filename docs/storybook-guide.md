# Storybook 카탈로그 운영 가이드

Storybook 사이드바는 UI의 책임 범위가 넓어지는 순서로 정렬합니다.

```text
Introduction
Foundations
Shared UI
Entities
Features
Widgets
Pages
Prototypes
```

## 제목 규칙

- `Foundations`: 디자인 토큰, 공통 시각 기준
- `Shared UI`: 여러 도메인에서 재사용하는 기본 컴포넌트
- `Entities`: 한 도메인에 속한 표시·상태 컴포넌트
- `Features`: 사용자 작업을 완성하는 기능 단위
- `Widgets`: 여러 컴포넌트를 조합한 업무 화면 블록
- `Pages`: 라우트 단위의 실제 업무 화면
- `Prototypes`: 아직 운영 UI로 확정되지 않은 실험 화면

새 스토리는 파일 위치와 관계없이 `title`을 이 분류에 맞춰 지정합니다. 카테고리 안에서는 실제 컴포넌트 또는 화면 이름을 사용하고, 같은 이름의 스토리가 여러 개면 도메인을 한 단계 더 추가합니다.

```jsx
const meta = {
  title: 'Widgets/Inventory/Detail Drawer',
  tags: ['autodocs'],
};
```

모든 카테고리는 `.storybook/preview.jsx`의 `storySort` 순서를 따릅니다. 제목을 추가하거나 바꿀 때는 이 문서의 분류와 함께 확인해 사이드바가 다시 섞이지 않도록 합니다.
