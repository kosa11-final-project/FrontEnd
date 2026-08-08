import { ArrowRight, CheckCircle, Layers } from 'reicon-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Icon } from '@/shared/ui';

// DESIGN / PAGE: 모든 초기 route가 공유하는 페이지 골격입니다. 실제 업무 위젯은 각 page에서 교체합니다.
export default function OperationsPlaceholderPage({ title, description }) {
  return (
    <main className="page-shell" aria-labelledby="page-title">
      <section className="page-heading">
        <div>
          <h1 id="page-title">{title}</h1>
          <p>{description}</p>
        </div>
        <Badge variant="neutral">초기 구조 준비됨</Badge>
      </section>

      <section className="mesh-hero" aria-label="페이지 준비 상태">
        <div>
          <h2>공통 화면 기준으로 기능을 연결합니다.</h2>
          <p>
            공통 색상 토큰과 상태 규칙을 기준으로 사용합니다. 실제 데이터와 업무 기능은 도메인 기능 개발 단계에서
            추가합니다.
          </p>
        </div>
        <div className="mesh-hero-mark">
          <Icon icon={Layers} size={34} />
        </div>
      </section>

      <section className="setup-grid" aria-label="초기 세팅 항목">
        <article className="setup-card">
          <div className="setup-card-icon">
            <Icon icon={CheckCircle} size={18} />
          </div>
          <div>
            <h2>라우터 연결</h2>
            <p>사이드바 메뉴와 URL 경로가 기본 연결되어 있습니다.</p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link to="/inventory">
              통합 재고 조회 <Icon icon={ArrowRight} size={15} />
            </Link>
          </Button>
        </article>
        <article className="setup-card">
          <div className="setup-card-icon">
            <Icon icon={Layers} size={18} />
          </div>
          <div>
            <h2>컴포넌트 기반</h2>
            <p>공통 UI를 재사용하고 화면은 페이지에서 조합합니다.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
