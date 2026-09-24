import dynamic from "next/dynamic";
import React from "react";

// Radar loading skeleton matching the exact map dimensions to eliminate layout shifts
const MapLoadingSkeleton: React.FC = () => (
  <div className="relative flex flex-col items-center justify-center w-full h-[620px] rounded-3xl bg-[#0a0e17] border border-white/10 shadow-2xl overflow-hidden select-none">
    <div className="relative flex items-center justify-center">
      <div className="w-28 h-28 rounded-full border border-cyan-500/20 animate-ping absolute" />
      <div className="w-16 h-16 rounded-full border border-cyan-400/40 animate-pulse absolute" />
      <div className="w-10 h-10 rounded-full bg-cyan-500/20 backdrop-blur-md flex items-center justify-center border border-cyan-400 shadow-lg shadow-cyan-500/30">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
      </div>
    </div>
    <div className="mt-5 text-xs font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
      Initializing High-Resolution Radar...
    </div>
  </div>
);

// Dynamically import DeckGL map with ssr: false and instant skeleton fallback
const DeckMap = dynamic(() => import("./deck-map"), {
  ssr: false,
  loading: () => <MapLoadingSkeleton />,
});

export const IndiaMap: React.FC = () => {
  return <DeckMap />;
};

export default IndiaMap;
