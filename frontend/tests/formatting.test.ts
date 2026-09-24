import { formatRainfall, formatPercent, formatLatLon, getRainfallColor } from "@/lib/formatting";

describe("Formatting and Color Scale Utilities", () => {
  it("formats rainfall in millimeters", () => {
    expect(formatRainfall(12.34)).toBe("12.3 mm");
    expect(formatRainfall(0)).toBe("0.0 mm");
    expect(formatRainfall(null)).toBe("0.0 mm");
  });

  it("formats percentages correctly", () => {
    expect(formatPercent(0.456)).toBe("46%");
    expect(formatPercent(0)).toBe("0%");
  });

  it("formats latitude and longitude", () => {
    expect(formatLatLon(20.5, 78.9)).toBe("20.50°N, 78.90°E");
  });

  it("returns correct IMD color categories", () => {
    expect(getRainfallColor(0.5)).toBe("#E8EEF5"); // trace/dry
    expect(getRainfallColor(80)).toBe("#1D64B5"); // heavy
    expect(getRainfallColor(150)).toBe("#F2A93B"); // very heavy
    expect(getRainfallColor(250)).toBe("#E05252"); // extremely heavy
  });
});
