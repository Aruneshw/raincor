/**
 * Simplified geographic definitions for India national boundaries and coastline.
 * Coordinates are [longitude, latitude].
 */
export const INDIA_COASTLINE_BOUNDS = [
  // Northwest / Gujarat / Rann of Kutch
  [68.5, 23.5], [69.2, 22.8], [70.1, 22.3], [70.0, 20.9], [72.2, 21.0], [72.8, 20.5],
  // West Coast (Maharashtra, Goa, Karnataka, Kerala)
  [72.8, 19.0], [73.2, 17.0], [73.8, 15.5], [74.8, 13.5], [75.8, 11.5], [76.3, 9.8], [77.5, 8.1],
  // Cape Comorin / South Tip
  [77.6, 8.1], [78.2, 8.8],
  // East Coast (Tamil Nadu, Andhra Pradesh, Odisha, West Bengal)
  [79.8, 10.8], [80.3, 13.1], [82.2, 16.5], [83.3, 17.7], [85.0, 19.4], [86.8, 20.8], [87.5, 21.6], [88.5, 21.8], [89.0, 22.0],
  // Northeast Border (Bangladesh border cut, Assam, Meghalaya, Tripura, Mizoram, Nagaland, Arunachal Pradesh)
  [92.0, 24.0], [93.2, 23.0], [93.5, 25.0], [95.0, 27.0], [97.0, 28.0], [95.5, 29.0], [93.0, 28.0], [89.5, 27.5],
  // Northern Himalayan Arc (Sikkim, Uttarakhand, HP, Ladakh, J&K)
  [88.5, 27.8], [88.0, 27.5], [80.5, 30.5], [78.5, 31.5], [77.5, 33.0], [76.0, 35.5], [74.5, 35.0], [74.0, 33.5],
  // Western Border (Punjab, Rajasthan, Gujarat)
  [74.5, 31.5], [73.5, 29.5], [71.0, 27.5], [70.0, 25.0], [68.5, 23.5]
];

export const INDIA_ISLAND_COORDINATES = {
  andaman: [
    [92.7, 11.7], [92.9, 12.5], [93.0, 13.0], [92.6, 12.2]
  ],
  nicobar: [
    [93.8, 7.0], [93.9, 7.5], [93.7, 8.0]
  ],
  lakshadweep: [
    [72.6, 10.6], [72.2, 10.0], [73.0, 11.2]
  ]
};

export interface MapRegionCenter {
  name: string;
  center: [number, number]; // [lon, lat]
  zoom: number;
}

export const REGION_CENTERS: Record<string, MapRegionCenter> = {
  "All India": { name: "All India", center: [79.2, 22.5], zoom: 4.3 },
  "Northwest India": { name: "Northwest India", center: [75.0, 29.5], zoom: 5.5 },
  "Central India": { name: "Central India", center: [79.0, 22.0], zoom: 5.4 },
  "South Peninsula": { name: "South Peninsula", center: [77.5, 12.8], zoom: 5.5 },
  "East & Northeast India": { name: "East & Northeast India", center: [90.5, 24.5], zoom: 5.3 },
};
