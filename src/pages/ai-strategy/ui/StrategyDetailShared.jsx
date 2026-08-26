import { ArrowLeft } from 'reicon-react';
import { Link } from 'react-router-dom';
import {
  StrategyProductImage,
  resolveStrategyGenerationStatus,
  strategyGenerationStatusMeta,
} from '@/entities/strategy';
import { formatDateTime } from '@/shared/lib/format';
import { Badge, Button, Card, Icon } from '@/shared/ui';

export function StrategyDetailHeader({ strategyCase, backTo, backState, backLabel = '목록으로', actions }) {
  const status = resolveStrategyGenerationStatus(strategyCase.caseStatus);
  const statusMeta = strategyGenerationStatusMeta[status];

  return (
    <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="min-w-0">
        <Button asChild variant="ghost" size="sm" className="mb-3 -ml-3">
          <Link to={backTo} state={backState}>
            <Icon icon={ArrowLeft} size={16} /> {backLabel}
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1
            id="page-title"
            className="text-2xl font-bold tracking-tight text-[color:var(--text-heading)] sm:text-3xl"
          >
            {strategyCase.caseName}
          </h1>
          <Badge variant={statusMeta.variant}>AI {statusMeta.label}</Badge>
        </div>
        <p className="mt-2 text-[length:var(--font-size-body-sm)] text-[color:var(--text-muted)]">
          {strategyCase.caseCode} · {strategyCase.sku.skuName} · {strategyCase.sku.skuCode}
        </p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function StrategyCaseSummary({ strategyCase }) {
  const product = strategyCase.sku;
  return (
    <Card padding="lg" className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 items-center gap-4">
        <StrategyProductImage
          src={product.imageUrl}
          alt={`${product.skuName} 상품 이미지`}
          loading="eager"
          className="size-20 rounded-[var(--radius-panel)]"
        />
        <div className="min-w-0">
          <Badge variant="neutral">{product.category?.categoryName ?? '미분류'}</Badge>
          <h2 className="mt-2 truncate text-lg font-bold text-[color:var(--text-heading)]">{product.skuName}</h2>
          <p className="mt-1 font-mono text-xs text-[color:var(--text-muted)]">{product.skuCode}</p>
        </div>
      </div>
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[color:var(--text-muted)]">요청자</dt>
          <dd className="mt-1 font-semibold text-[color:var(--text-heading)]">
            {strategyCase.requestedBy?.userName ?? '요청자 정보 없음'}
          </dd>
        </div>
        <div>
          <dt className="text-[color:var(--text-muted)]">생성 요청</dt>
          <dd className="mt-1 font-semibold tabular-nums text-[color:var(--text-heading)]">
            {formatDateTime(strategyCase.requestedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-[color:var(--text-muted)]">결과 만료</dt>
          <dd className="mt-1 font-semibold tabular-nums text-[color:var(--warning)]">
            {formatDateTime(strategyCase.resultExpiresAt)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
