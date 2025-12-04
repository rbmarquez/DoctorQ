export type Coordinates = {
  lat: number;
  lng: number;
};

const CITY_COORDINATES: Record<string, Coordinates> = {
  "são paulo": { lat: -23.55052, lng: -46.633308 },
  "sao paulo": { lat: -23.55052, lng: -46.633308 },
  "rio de janeiro": { lat: -22.906847, lng: -43.172897 },
  brasília: { lat: -15.7975, lng: -47.8919 },
  brasilia: { lat: -15.7975, lng: -47.8919 },
  salvador: { lat: -12.977749, lng: -38.501629 },
  recife: { lat: -8.047562, lng: -34.876964 },
  curitiba: { lat: -25.428954, lng: -49.267137 },
  fortaleza: { lat: -3.731862, lng: -38.526669 },
  manaus: { lat: -3.119028, lng: -60.021732 },
  belém: { lat: -1.455833, lng: -48.503887 },
  belem: { lat: -1.455833, lng: -48.503887 },
  goiânia: { lat: -16.686891, lng: -49.264794 },
  goiania: { lat: -16.686891, lng: -49.264794 },
  campinas: { lat: -22.907104, lng: -47.06324 },
  "são bernardo do campo": { lat: -23.693889, lng: -46.565 },
  "santo andré": { lat: -23.663889, lng: -46.538333 },
  "santo andre": { lat: -23.663889, lng: -46.538333 },
  "são josé dos campos": { lat: -23.189547, lng: -45.884101 },
  "sao jose dos campos": { lat: -23.189547, lng: -45.884101 },
};

const DEFAULT_COORDINATES: Coordinates = {
  lat: -23.55052,
  lng: -46.633308,
};

function extractCity(rawLocation?: string | null): string | null {
  if (!rawLocation) return null;
  const lower = rawLocation.toLowerCase();

  const separators = [",", "-", "|", "•", "·"];
  let candidate = lower;

  for (const separator of separators) {
    if (candidate.includes(separator)) {
      const parts = candidate.split(separator).map((part) => part.trim());
      if (parts.length > 0) {
        candidate = parts[parts.length - 1];
      }
    }
  }

  candidate = candidate.replace(/\d+/g, "").trim();
  if (!candidate) return null;

  if (CITY_COORDINATES[candidate]) {
    return candidate;
  }

  const words = candidate.split(" ").filter(Boolean);
  if (words.length >= 2) {
    const twoWordKey = `${words[0]} ${words[1]}`;
    if (CITY_COORDINATES[twoWordKey]) {
      return twoWordKey;
    }
  }

  if (CITY_COORDINATES[words[0]]) {
    return words[0];
  }

  return null;
}

export function getCoordinatesForLocation(rawLocation?: string | null): Coordinates {
  const cityKey = extractCity(rawLocation);
  if (cityKey && CITY_COORDINATES[cityKey]) {
    return CITY_COORDINATES[cityKey];
  }
  return DEFAULT_COORDINATES;
}

export function getMapBounds(points: Coordinates[]): [Coordinates, Coordinates] {
  if (points.length === 0) return [DEFAULT_COORDINATES, DEFAULT_COORDINATES];

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLng = Math.min(minLng, point.lng);
    maxLng = Math.max(maxLng, point.lng);
  }

  if (minLat === maxLat && minLng === maxLng) {
    const pad = 0.05;
    return [
      { lat: minLat - pad, lng: minLng - pad },
      { lat: maxLat + pad, lng: maxLng + pad },
    ];
  }

  return [
    { lat: minLat, lng: minLng },
    { lat: maxLat, lng: maxLng },
  ];
}

export function jitterCoordinates(base: Coordinates, index: number): Coordinates {
  if (index === 0) {
    return base;
  }

  const goldenAngle = 137.508;
  const angle = (((index + 1) * goldenAngle) % 360) * (Math.PI / 180);
  const radius = 0.01 + ((index - 1) % 5) * 0.004;

  return {
    lat: base.lat + Math.sin(angle) * radius,
    lng: base.lng + Math.cos(angle) * radius,
  };
}
