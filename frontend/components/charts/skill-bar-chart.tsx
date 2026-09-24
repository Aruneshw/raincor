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
        backgroundColor: "#0F172A",
        titleColor: "#F8FAFC",
        bodyColor: "#F8FAFC",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#94A3B8" },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#94A3B8" },
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

export default SkillBarChart;
