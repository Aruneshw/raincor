"use client";

import React from "react";
import "@/components/charts/chart-setup";
import { Bar } from "react-chartjs-2";
import { ModelMetricSet } from "@/types/verification";

interface SkillBarChartProps {
  models: ModelMetricSet[];
  metric?: keyof Pick<ModelMetricSet, "csi" | "ets" | "pod" | "far" | "rmse" | "fss">;
  height?: number;
}

export const SkillBarChart: React.FC<SkillBarChartProps> = ({
  models,
  metric = "csi",
  height = 240,
}) => {
  const metricLabels: Record<string, string> = {
    csi: "Critical Success Index (CSI)",
    ets: "Equitable Threat Score (ETS)",
    pod: "Probability of Detection (POD)",
    far: "False Alarm Ratio (FAR)",
    rmse: "Root Mean Square Error (RMSE mm)",
    fss: "Fractions Skill Score (FSS)",
  };

  const colors = ["#2F80D9", "#7566D8", "#0284C7", "#94A3B8"];

  const data = {
    labels: models.map((m) => m.modelName),
    datasets: [
      {
        label: metricLabels[metric],
        data: models.map((m) => m[metric]),
        backgroundColor: colors,
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0B2A4A",
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#0B2A4A" },
      },
      y: {
        grid: { color: "#F1F5F9" },
        ticks: { font: { size: 11 }, color: "#64748B" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
};
