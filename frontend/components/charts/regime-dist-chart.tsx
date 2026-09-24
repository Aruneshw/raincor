"use client";

import React from "react";
import "@/components/charts/chart-setup";
import { Doughnut } from "react-chartjs-2";
import { RegimeDistributionItem } from "@/types/regime";

interface RegimeDistChartProps {
  distribution: RegimeDistributionItem[];
  height?: number;
}

export const RegimeDistChart: React.FC<RegimeDistChartProps> = ({
  distribution,
  height = 200,
}) => {
  const data = {
    labels: distribution.map((d) => d.regime),
    datasets: [
      {
        data: distribution.map((d) => d.gridCount),
        backgroundColor: distribution.map((d) => d.color),
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.2)",
        hoverOffset: 4,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true,
          font: { size: 11, weight: "500" },
          padding: 8,
          color: "#94A3B8",
        },
      },
      tooltip: {
        backgroundColor: "#0F172A",
        titleColor: "#F8FAFC",
        bodyColor: "#F8FAFC",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const item = distribution[context.dataIndex];
            return ` ${item.regime}: ${item.gridCount} grids (${item.percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }} className="relative flex items-center justify-center">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default RegimeDistChart;
