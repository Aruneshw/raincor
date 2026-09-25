import { arjunaApi } from "@/services/api/client";
import { getIndiaGrids, findGridById } from "@/lib/grid-generator";

describe("Mock Meteorological Services", () => {
  it("generates realistic India grid dataset with required attributes", () => {
    const grids = getIndiaGrids();
    expect(grids.length).toBeGreaterThan(50);

    const firstGrid = grids[0];
    expect(firstGrid).toHaveProperty("id");
    expect(firstGrid).toHaveProperty("lat");
    expect(firstGrid).toHaveProperty("lon");
    expect(firstGrid).toHaveProperty("state");
    expect(firstGrid).toHaveProperty("district");
    expect(firstGrid).toHaveProperty("regime");
    expect(firstGrid).toHaveProperty("correctedRainfallMm");
    expect(firstGrid).toHaveProperty("p10Mm");
    expect(firstGrid).toHaveProperty("p90Mm");
  });

  it("finds grid by ID correctly", () => {
    const grids = getIndiaGrids();
    const target = grids[0];
    const found = findGridById(target.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(target.id);
  });

  it("fetches forecast data with lead-time modulation", async () => {
    const forecastT24 = await arjunaApi.getForecast("T+24h", "bias_corrected");
    const forecastT72 = await arjunaApi.getForecast("T+72h", "bias_corrected");

    expect(forecastT24.leadTime).toBe("T+24h");
    expect(forecastT72.leadTime).toBe("T+72h");
    expect(forecastT72.averageRainfallMm).toBeGreaterThan(forecastT24.averageRainfallMm);
  });

  it("fetches regime distribution with all 7 categories", async () => {
    const regimeData = await arjunaApi.getRegimeDistribution();
    expect(regimeData.distribution.length).toBe(7);
    const sumPct = regimeData.distribution.reduce((acc, d) => acc + d.percentage, 0);
    expect(Math.round(sumPct)).toBeCloseTo(100, 0);
  });

  it("fetches verification skill metrics with ARJUNA outperforming NWP", async () => {
    const verif = await arjunaApi.getVerification();
    const arjuna = verif.models.find((m) => m.modelName.includes("ARJUNA"));
    const nwp = verif.models.find((m) => m.modelName.includes("Raw NWP"));

    expect(arjuna).toBeDefined();
    expect(nwp).toBeDefined();
    expect(arjuna!.csi).toBeGreaterThan(nwp!.csi);
    expect(arjuna!.rmse).toBeLessThan(nwp!.rmse);
  });
});
