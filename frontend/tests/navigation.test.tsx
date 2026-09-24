import React from "react";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

// Mock next/navigation usePathname
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Sidebar Navigation", () => {
  it("renders RAINCOR brand and all operational navigation links", () => {
    render(<Sidebar />);

    expect(screen.getByText("RAINCOR")).toBeInTheDocument();
    expect(screen.getByText("Monsoon Intelligence for India")).toBeInTheDocument();

    // Check main navigation items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Rainfall Forecast")).toBeInTheDocument();
    expect(screen.getByText("Regime Analysis")).toBeInTheDocument();
    expect(screen.getByText("Transition Monitor")).toBeInTheDocument();
    expect(screen.getByText("Uncertainty")).toBeInTheDocument();
    expect(screen.getByText("Verification")).toBeInTheDocument();
    expect(screen.getByText("Climatology")).toBeInTheDocument();
    expect(screen.getByText("Data Monitor")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });
});
