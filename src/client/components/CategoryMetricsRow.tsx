import { categoryLabels, statusLabels } from "../domain/display";
import type { QaMetric, TestCategory } from "../types";
import { Sparkline } from "./charts/Sparkline";

export const categoryColors: Record<TestCategory, string> = {
  unit: "#0e5a62",
  api: "#c69a43",
  ui: "#b1482f",
};

export type CategoryCardData = {
  category: TestCategory;
  metrics: QaMetric[];
  sparkline: number[];
};

export function CategoryMetricsRow({ cards }: { cards: CategoryCardData[] }) {
  return (
    <section className="metrics-grid" aria-label="QA metrics by category">
      {cards.map(({ category, metrics, sparkline }) => {
        const passingMetric = metrics.find((metric) => metric.kind === "tests-passing");
        const coverageMetric = metrics.find((metric) => metric.kind === "test-coverage");
        const passingStatus = passingMetric?.status ?? "unavailable";

        const total = passingMetric?.totalTests;
        const passed = passingMetric?.passedTests;
        const failed = passingMetric?.failedTests;
        const hasCounts = typeof total === "number" && typeof passed === "number";
        const skipped = hasCounts ? Math.max(0, total - passed - (failed ?? 0)) : 0;

        return (
          <article className={`metric-card ${category}`} key={category}>
            <div className="metric-card-header">
              <h3>{categoryLabels[category]} tests</h3>
              <span className={`status ${passingStatus}`}>
                {passingStatus === "unavailable" ? statusLabels.unavailable : `● ${statusLabels[passingStatus]}`}
              </span>
            </div>
            <div className="metric-figure-row">
              <div>
                <div className="metric-figure mono">
                  {hasCounts ? (
                    <>
                      {passed}
                      <span>/{total}</span>
                    </>
                  ) : (
                    "–"
                  )}
                </div>
                <div className="metric-figure-label">Tests passing</div>
              </div>
              <div>
                <div className="metric-figure mono">
                  {typeof coverageMetric?.value === "number" ? `${coverageMetric.value}%` : "–"}
                </div>
                <div className="metric-figure-label">Test coverage</div>
              </div>
              {sparkline.length > 0 ? (
                <Sparkline data={sparkline} width={120} height={40} color={categoryColors[category]} />
              ) : null}
            </div>
            {hasCounts ? (
              <p className="metric-breakdown mono">
                {passed} passed · {failed ?? 0} failed
                {skipped > 0 ? ` · ${skipped} skipped` : ""}
              </p>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}
