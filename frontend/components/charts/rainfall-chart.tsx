"use client";

import React from "react";
import "@/components/charts/chart-setup";
import { Line } from "react-chartjs-2";
import { TimeSeriesPoint } from "@/types/forecast";

interface RainfallChartProps {
  series: TimeSeriesPoint[];
  title?: string;
  height?: number;
}

export const RainfallChart: React.FC<RainfallChartProps> = ({
  series,
  title = "72h Lead-Time Precipitation Trajectory",
  height = 240,
}) => {
  const labels = series.map((s) => s.time);

  const data = {
    labels,
    datasets: [
      {
        label: "Observed (IMD AWS)",
        data: series.map((s) => s.observedMm ?? null),
        borderColor: "#0284C7",
        backgroundColor: "#0284C7",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.25,
      },
      {
        label: "RAINCOR (Bias-Corrected)",
        data: series.map((s) => s.correctedMm),
        borderColor: "#2F80D9",
        backgroundColor: "rgba(47, 128, 217, 0.12)",
        fill: false,
        borderWidth: 2.5,
        pointRadius: 3,
        tension: 0.3,
      },
      {
        label: "Raw NWP (NCUM / GFS)",
        data: series.map((s) => s.nwpMm),
        borderColor: "#94A3B8",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
        tension: 0.3,
      },
      {
        label: "P90 Upper Bound",
        data: series.map((s) => s.p90Mm),
        borderColor: "rgba(47, 128, 217, 0.2)",
        backgroundColor: "rgba(47, 128, 217, 0.08)",
        fill: "+1",
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "P10 Lower Bound",
        data: series.map((s) => s.p10Mm),
        borderColor: "rgba(47, 128, 217, 0.2)",
        backgroundColor: "rgba(47, 128, 217, 0.08)",
        fill: false,
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          font: { size: 11, weight: "500" },
          color: "#94A3B8",
          filter: (item: any) => !item.text.includes("Bound"),
        },
      },
      tooltip: {
        backgroundColor: "#0F172A",
        titleColor: "#F8FAFC",
        bodyColor: "#F8FAFC",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        titleFont: { size: 12, weight: "600" },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${context.raw} mm`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#94A3B8" },
      },
      y: {
        title: { display: true, text: "Rainfall (mm)", color: "#94A3B8", font: { size: 11 } },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#94A3B8" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height }} className="w-full">
      <Line data={data} options={options} />
    </div>
  );
};

export default RainfallChart;
