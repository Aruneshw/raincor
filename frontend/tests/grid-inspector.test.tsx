import React from "react";
import { render, screen } from "@testing-library/react";
import { GridInspector } from "@/components/grid-inspector/grid-inspector";
import { useMapStore } from "@/store/map-store";

describe("GridInspector", () => {
  it("renders selected grid details correctly when inspector is open", () => {
    // Set active grid in zustand store
    useMapStore.setState({
      selectedGridId: "G10025",
      isInspectorOpen: true,
    });

    render(<GridInspector />);

    expect(screen.getByText("G10025")).toBeInTheDocument();
    expect(screen.getByText(/0.25° Grid/i)).toBeInTheDocument();
    expect(screen.getByText(/24h Rainfall Post-Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/View 72h Time Series/i)).toBeInTheDocument();
  });

  it("does not render when isInspectorOpen is false", () => {
    useMapStore.setState({
      selectedGridId: "G10025",
      isInspectorOpen: false,
    });

    const { container } = render(<GridInspector />);
    expect(container).toBeEmptyDOMElement();
  });
});
