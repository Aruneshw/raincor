"use client";

import React from "react";
import "@/components/charts/chart-setup";
import { Line } from "react-chartjs-2";
import { ReliabilityBin } from "@/types/verification";

interface ReliabilityPlotProps {
  bins: ReliabilityBin[];
  height?: number;
}

export const ReliabilityPlot: React.FC<ReliabilityPlotProps> = ({ bins, height = 240 }) => {
  const labels = bins.map((b) => (b.forecastProbability * 100).toFixed(0) + "%");

  const data = {
    labels,
    datasets: [
      {
        label: "Perfect Calibration (1:1)",
        data: bins.map((b) => b.forecastProbability),
        borderColor: "#94A3B8",
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
      {
        label: "RAINCOR (Calibrated)",
        data: bins.map((b) => b.observedFrequencyRaincor),
        borderColor: "#2F80D9",
        backgroundColor: "#2F80D9",
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.1,
      },
      {
        label: "Raw NWP (Overconfident)",
        data: bins.map((b) => b.observedFrequencyNwp),
        borderColor: "#E05252",
        backgroundColor: "#E05252",
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.1,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 }, color: "#94A3B8" },
      },
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
        title: { display: true, text: "Forecast Probability", color: "#94A3B8", font: { size: 11 } },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#94A3B8" },
      },
      y: {
        title: { display: true, text: "Observed Relative Frequency", color: "#94A3B8", font: { size: 11 } },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        ticks: { font: { size: 11 }, color: "#94A3B8" },
        min: 0,
        max: 1.0,
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default ReliabilityPlot;
