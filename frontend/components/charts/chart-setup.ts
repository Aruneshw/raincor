import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Safe singleton Chart.js registration
if (typeof window !== "undefined") {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
  );

  // Global default styling matching claymorphic / technical palette
  ChartJS.defaults.font.family = "inherit";
  ChartJS.defaults.color = "#4F6E8C";
}
