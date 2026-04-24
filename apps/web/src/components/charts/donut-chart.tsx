"use client";

import type { EChartsOption, PieSeriesOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo, useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/dashboard/formatters";

export type DonutChartDatum = {
  id: string;
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  data: DonutChartDatum[];
  locale?: "es-ES" | "en-US";
  privacyModeEnabled?: boolean;
};

type ActiveSegment = {
  id: string;
  label: string;
  percent: number;
  value: number;
};

export function DonutChart({
  data,
  locale = "es-ES",
  privacyModeEnabled = false
}: DonutChartProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const totalValue = useMemo(
    () => data.reduce((sum, item) => sum + Math.max(item.value, 0), 0),
    [data],
  );

  const activeSegment = useMemo<ActiveSegment | null>(() => {
    if (!data.length || !activeSegmentId) {
      return null;
    }

    const selected = data.find((item) => item.id === activeSegmentId);

    if (!selected) {
      return null;
    }

    return {
      id: selected.id,
      label: selected.label,
      percent: totalValue > 0 ? selected.value / totalValue : 0,
      value: selected.value,
    };
  }, [activeSegmentId, data, totalValue]);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 520,
      animationDurationUpdate: 280,
      color: data.map((item) => item.color),
      graphic: activeSegment
        ? [
            {
              left: "center",
              silent: true,
              style: {
                fill: "#8ea0ad",
                font: "600 12px Inter, system-ui, sans-serif",
                text: "Distribución",
                textAlign: "center",
              },
              top: "35%",
              type: "text",
              z: 10,
            },
            {
              left: "center",
              silent: true,
              style: {
                fill: "#eef4f8",
                font: "700 24px Inter, system-ui, sans-serif",
                text: activeSegment.label,
                textAlign: "center",
              },
              top: "44%",
              type: "text",
              z: 10,
            },
            {
              left: "center",
              silent: true,
              style: {
                fill: "#c7d4dd",
                font: "700 13px Inter, system-ui, sans-serif",
                text: privacyModeEnabled ? "Privado" : formatPercent(activeSegment.percent, locale),
                textAlign: "center",
              },
              top: "54%",
              type: "text",
              z: 10,
            },
            {
              left: "center",
              silent: true,
              style: {
                fill: "#dce5eb",
                font: "700 15px Inter, system-ui, sans-serif",
                text: privacyModeEnabled ? "" : formatCurrency(activeSegment.value, locale),
                textAlign: "center",
              },
              top: "61%",
              type: "text",
              z: 10,
            },
          ]
        : undefined,
      series: [
        {
          avoidLabelOverlap: true,
          center: ["50%", "50%"],
          clockwise: true,
          data: data.map((item) => ({
            itemStyle: {
              borderColor: "#0b0f14",
              borderRadius: 10,
              borderWidth: 6,
              color: item.color,
              shadowBlur: 30,
              shadowColor: "rgba(3, 7, 12, 0.28)",
              shadowOffsetY: 12,
            },
            name: item.label,
            value: item.value,
          })),
          emphasis: {
            disabled: false,
            itemStyle: {
              borderColor: "#111820",
              borderWidth: 8,
              shadowBlur: 32,
              shadowColor: "rgba(8, 13, 20, 0.36)",
              shadowOffsetY: 14,
            },
            label: {
              show: false,
            },
            scale: true,
            scaleSize: 12,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          radius: ["52%", "86%"],
          selectedMode: false,
          silent: false,
          startAngle: 92,
          type: "pie",
        },
      ] satisfies PieSeriesOption[],
      tooltip: {
        show: false,
      },
    }),
    [activeSegment, data, locale, privacyModeEnabled],
  );

  return (
    <div className="donut-chart-surface" aria-hidden="true">
      <ReactECharts
        notMerge
        onEvents={{
          mouseout: () => setActiveSegmentId(null),
          mouseover: (params: { dataIndex?: number }) => {
            const next =
              typeof params.dataIndex === "number"
                ? data[params.dataIndex]
                : null;
            setActiveSegmentId(next?.id ?? null);
          },
        }}
        option={option}
        opts={{ renderer: "svg" }}
        role="img"
        style={{ height: 448, width: "100%" }}
      />
    </div>
  );
}
