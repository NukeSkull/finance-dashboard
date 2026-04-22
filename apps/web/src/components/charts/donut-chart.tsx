"use client";

import { Pie } from "@nivo/pie";

export type DonutChartDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutChartDatum[];
};

export function DonutChart({ data }: DonutChartProps) {
  return (
    <div className="donut-chart-surface" aria-hidden="true">
      <Pie
        animate={false}
        arcLabelsSkipAngle={360}
        arcLinkLabelsSkipAngle={360}
        colors={data.map((item) => item.color)}
        cornerRadius={4}
        data={data}
        enableArcLabels={false}
        enableArcLinkLabels={false}
        innerRadius={0.72}
        isInteractive
        legends={[]}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        padAngle={1}
        role="img"
        sortByValue
        tooltip={({ datum }) => (
          <div className="chart-tooltip">
            <strong>{String(datum.label)}</strong>
            <span>{datum.formattedValue}</span>
          </div>
        )}
        valueFormat={(value) => `${value}`}
        width={280}
        height={280}
      />
    </div>
  );
}
