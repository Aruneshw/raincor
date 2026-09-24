import React from "react";
import { render, screen } from "@testing-library/react";
import { KpiCard } from "@/components/cards/kpi-card";

describe("KpiCard", () => {
  it("renders title, value, and unit correctly", () => {
    render(
      <KpiCard
        title="Total Rainfall (24h)"
        value="124.6"
        unit="mm"
        change={{ value: "+18.2%", isPositive: true, label: "vs Normal" }}
      />
    );

    expect(screen.getByText("Total Rainfall (24h)")).toBeInTheDocument();
    expect(screen.getByText("124.6")).toBeInTheDocument();
    expect(screen.getByText("mm")).toBeInTheDocument();
    expect(screen.getByText("+18.2%")).toBeInTheDocument();
    expect(screen.getByText("vs Normal")).toBeInTheDocument();
  });

  it("renders negative change badge correctly", () => {
    render(
      <KpiCard
        title="Heavy Rain Grids"
        value="1,238"
        change={{ value: "-4.5%", isPositive: false }}
      />
    );

    expect(screen.getByText("-4.5%")).toBeInTheDocument();
  });
});
