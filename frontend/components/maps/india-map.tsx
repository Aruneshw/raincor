import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import the DeckGL map to prevent WebGL SSR hydration errors
const DeckMap = dynamic(() => import('./deck-map'), { ssr: false });

export const IndiaMap: React.FC = () => {
  return <DeckMap />;
};
