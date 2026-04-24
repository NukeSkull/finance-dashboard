"use client";

type SkeletonBoxProps = {
  className?: string;
};

export function SkeletonBox(input: SkeletonBoxProps) {
  return <div aria-hidden="true" className={`loading-skeleton${input.className ? ` ${input.className}` : ""}`} />;
}

export function DashboardPageSkeleton() {
  return (
    <div className="page-skeleton-stack" aria-hidden="true">
      <section className="hero-net-worth-card page-skeleton-card">
        <div className="hero-net-worth-header">
          <div className="hero-net-worth-primary">
            <SkeletonBox className="skeleton-line skeleton-eyebrow" />
            <SkeletonBox className="skeleton-line skeleton-hero-title" />
          </div>
          <div className="hero-net-worth-breakdown">
            <SkeletonMetricCard />
            <SkeletonMetricCard />
            <article className="hero-breakdown-item hero-breakdown-composition">
              <SkeletonBox className="skeleton-line skeleton-label" />
              <SkeletonBox className="skeleton-bar" />
              <div className="hero-composition-values">
                <SkeletonBox className="skeleton-line skeleton-inline-value" />
                <SkeletonBox className="skeleton-line skeleton-inline-value" />
              </div>
            </article>
          </div>
        </div>
        <div className="hero-net-worth-body">
          <SkeletonBox className="skeleton-donut" />
          <div className="hero-side-panel">
            <div className="hero-chart-legend">
              {Array.from({ length: 4 }, (_, index) => (
                <article className="hero-legend-item" key={index}>
                  <SkeletonBox className="skeleton-line skeleton-label" />
                  <SkeletonBox className="skeleton-line skeleton-value" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-month-grid">
        <section className="detail-card compact-signal-card priority-card page-skeleton-card">
          <SkeletonBox className="skeleton-line skeleton-title" />
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBox className="skeleton-pill" key={index} />
          ))}
        </section>
        <section className="dashboard-month-state page-skeleton-card">
          <div className="dashboard-summary-header">
            <div>
              <SkeletonBox className="skeleton-line skeleton-eyebrow" />
              <SkeletonBox className="skeleton-line skeleton-title" />
            </div>
          </div>
          <div className="dashboard-kpi-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonKpiCard key={index} />
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

export function IncomeExpensesPageSkeleton() {
  return (
    <div className="page-skeleton-stack" aria-hidden="true">
      <section className="dashboard-kpi-grid income-expenses-kpi-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonDashboardMetricCard key={index} />
        ))}
      </section>

      <section className="income-expenses-context-grid">
        <section className="detail-card income-expenses-annual-card page-skeleton-card">
          <SkeletonBox className="skeleton-line skeleton-title" />
          <div className="income-expenses-annual-metrics">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonMetricCard key={index} />
            ))}
          </div>
          <div className="income-expenses-insight-list">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBox className="skeleton-pill" key={index} />
            ))}
          </div>
        </section>
        <section className="detail-card income-expenses-chart-card page-skeleton-card">
          <SkeletonBox className="skeleton-line skeleton-title" />
          <SkeletonBox className="skeleton-chart" />
        </section>
      </section>

      <section className="detail-card income-expenses-detail-card page-skeleton-card">
        <div className="detail-card-header detail-card-header-tight">
          <SkeletonBox className="skeleton-line skeleton-title" />
          <SkeletonBox className="skeleton-line skeleton-control" />
        </div>
        <div className="detail-sections income-expenses-detail-sections">
          {Array.from({ length: 3 }, (_, index) => (
            <section className="detail-card income-expenses-section-card page-skeleton-card" key={index}>
              <SkeletonBox className="skeleton-line skeleton-title" />
              {Array.from({ length: 4 }, (_, rowIndex) => (
                <div className="detail-row income-expenses-detail-row" key={rowIndex}>
                  <SkeletonBox className="skeleton-line skeleton-label" />
                  <SkeletonBox className="skeleton-line skeleton-value" />
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AssetOperationsPageSkeleton() {
  return (
    <div className="page-skeleton-stack" aria-hidden="true">
      <section className="asset-operations-kpi-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonKpiCard key={index} />
        ))}
      </section>

      <section className="detail-card asset-history-card page-skeleton-card">
        <div className="asset-history-header">
          <div>
            <SkeletonBox className="skeleton-line skeleton-eyebrow" />
            <SkeletonBox className="skeleton-line skeleton-title" />
            <SkeletonBox className="skeleton-line skeleton-helper" />
          </div>
        </div>
        <div className="asset-history-toolbar">
          <div className="asset-segmented-control">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBox className="skeleton-tab" key={index} />
            ))}
          </div>
          <div className="asset-history-filters">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonBox className="skeleton-control" key={index} />
            ))}
          </div>
        </div>
        <div className="asset-operations-table">
          <div className="asset-operations-row asset-operations-head asset-operations-history-head">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonBox className="skeleton-line skeleton-header-cell" key={index} />
            ))}
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div className="asset-operations-row asset-operations-history-row purchase" key={index}>
              {Array.from({ length: 7 }, (_, cellIndex) => (
                <SkeletonBox className="skeleton-line skeleton-table-cell" key={cellIndex} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function VtMarketsPageSkeleton() {
  return (
    <div className="page-skeleton-stack" aria-hidden="true">
      <section className="dashboard-toolbar page-skeleton-card">
        <div>
          <SkeletonBox className="skeleton-line skeleton-eyebrow" />
          <SkeletonBox className="skeleton-line skeleton-title" />
          <SkeletonBox className="skeleton-line skeleton-helper" />
        </div>
        <div className="page-tabs">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBox className="skeleton-tab" key={index} />
          ))}
        </div>
      </section>
      <section className="kpi-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <SkeletonKpiCard key={index} />
        ))}
      </section>
      <section className="detail-card page-skeleton-card">
        <SkeletonBox className="skeleton-line skeleton-title" />
        <div className="vt-results-grid">
          {Array.from({ length: 2 }, (_, index) => (
            <section className="detail-card page-skeleton-card" key={index}>
              <SkeletonBox className="skeleton-line skeleton-title" />
              {Array.from({ length: 4 }, (_, rowIndex) => (
                <div className="vt-block-row" key={rowIndex}>
                  {Array.from({ length: 4 }, (_, cellIndex) => (
                    <SkeletonBox className="skeleton-line skeleton-table-cell" key={cellIndex} />
                  ))}
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ZenPageSkeleton() {
  return (
    <div className="page-skeleton-stack" aria-hidden="true">
      <section className="zen-overview-grid">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <section className="detail-card zen-progress-overview-card page-skeleton-card">
          <div className="zen-progress-overview-head">
            <SkeletonBox className="skeleton-line skeleton-eyebrow" />
            <SkeletonBox className="skeleton-line skeleton-value" />
          </div>
          <div className="zen-progress-overview-metrics">
            {Array.from({ length: 3 }, (_, index) => (
              <article key={index}>
                <SkeletonBox className="skeleton-line skeleton-label" />
                <SkeletonBox className="skeleton-line skeleton-value" />
              </article>
            ))}
          </div>
          <SkeletonBox className="skeleton-bar" />
        </section>
      </section>

      <section className="detail-card zen-goals-card page-skeleton-card">
        <SkeletonBox className="skeleton-line skeleton-title" />
        <div className="zen-table">
          <div className="zen-row zen-row-head">
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBox className="skeleton-line skeleton-header-cell" key={index} />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, index) => (
            <div className="zen-row is-pending" key={index}>
              {Array.from({ length: 5 }, (_, cellIndex) => (
                <SkeletonBox className="skeleton-line skeleton-table-cell" key={cellIndex} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SkeletonKpiCard() {
  return (
    <article className="kpi-card page-skeleton-card">
      <SkeletonBox className="skeleton-line skeleton-label" />
      <SkeletonBox className="skeleton-line skeleton-value" />
      <SkeletonBox className="skeleton-line skeleton-helper" />
    </article>
  );
}

function SkeletonDashboardMetricCard() {
  return (
    <article className="dashboard-metric-card page-skeleton-card">
      <SkeletonBox className="skeleton-line skeleton-label" />
      <SkeletonBox className="skeleton-line skeleton-value" />
      <SkeletonBox className="skeleton-line skeleton-inline-value" />
    </article>
  );
}

function SkeletonMetricCard() {
  return (
    <article className="kpi-card page-skeleton-card">
      <SkeletonBox className="skeleton-line skeleton-label" />
      <SkeletonBox className="skeleton-line skeleton-value" />
    </article>
  );
}
